$port = 5500
$prefix = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "JIT Smart Campus Full-Stack server running at $prefix"
} catch {
    $port = 5501
    $prefix = "http://localhost:$port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($prefix)
    $listener.Start()
    Write-Host "JIT Smart Campus Full-Stack server running at $prefix"
}

$baseDir = $PSScriptRoot
$dbPath = Join-Path $baseDir "data\database.json"

function Get-Database {
    if (Test-Path $dbPath) {
        $raw = [System.IO.File]::ReadAllText($dbPath, [System.Text.Encoding]::UTF8)
        return ($raw | ConvertFrom-Json)
    }
    return $null
}

function Save-Database($dbObj) {
    $json = $dbObj | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($dbPath, $json, [System.Text.Encoding]::UTF8)
}

function Send-JsonResponse($response, $statusCode, $obj) {
    $response.StatusCode = $statusCode
    $response.ContentType = "application/json; charset=utf-8"
    $json = $obj | ConvertTo-Json -Depth 10 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.Close()
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS Headers for testing
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "index.html"
        }

        # Handle Test Reporting Endpoint
        if ($request.HttpMethod -eq "POST" -and $urlPath -eq "report-test-results") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            [System.IO.File]::WriteAllText((Join-Path $baseDir "test_results.log"), $body, [System.Text.Encoding]::UTF8)
            $response.StatusCode = 200
            $okBytes = [System.Text.Encoding]::UTF8.GetBytes("OK")
            $response.ContentLength64 = $okBytes.Length
            $response.OutputStream.Write($okBytes, 0, $okBytes.Length)
            $response.Close()
            continue
        }

        # -------------------------------------------------------------
        # REST API ROUTING (/api/...)
        # -------------------------------------------------------------
        if ($urlPath.StartsWith("api/")) {
            $apiRoute = $urlPath.Substring(4) # strip 'api/'
            $db = Get-Database

            # 1. Health Check
            if ($request.HttpMethod -eq "GET" -and $apiRoute -eq "health") {
                Send-JsonResponse $response 200 @{
                    status = "ok"
                    mode = "POWERSHELL_LIVE_BACKEND"
                    serverTime = (Get-Date).ToString("o")
                    merchantUPI = "iammithresh@oksbi"
                }
                continue
            }

            # 2. Student Authentication
            if ($request.HttpMethod -eq "POST" -and $apiRoute -eq "auth/login") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $reqBody = $reader.ReadToEnd() | ConvertFrom-Json
                $regNo = "$($reqBody.regNo)".Trim().ToUpper()
                $dob = "$($reqBody.dob)".Trim()

                $matched = $db.students | Where-Object { $_.regNo -eq $regNo }
                if ($matched) {
                    # Compare dates
                    $matchedDob = $matched.dob
                    if ($matchedDob -eq $dob -or $matchedDob -replace '-', '' -eq $dob -replace '-', '') {
                        Send-JsonResponse $response 200 @{
                            success = $true
                            session = @{
                                regNo = $matched.regNo
                                name = $matched.name
                                department = $matched.department
                                year = $matched.year
                                phone = $matched.phone
                                avatar = if ($matched.avatar) { $matched.avatar } else { [char]::ConvertFromUtf32(0x1F393) }
                                role = "STUDENT"
                                token = "JIT-AUTH-$([System.Guid]::NewGuid().ToString().Substring(0,8).ToUpper())"
                            }
                        }
                        continue
                    }
                }
                Send-JsonResponse $response 401 @{ error = "Invalid Registration Number or Date of Birth." }
                continue
            }

            # 3. Worker Authentication
            if ($request.HttpMethod -eq "POST" -and $apiRoute -eq "auth/worker-login") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $reqBody = $reader.ReadToEnd() | ConvertFrom-Json
                $empId = "$($reqBody.empId)".Trim().ToUpper()
                $pin = "$($reqBody.pin)".Trim()

                $worker = $db.workers | Where-Object { $_.empId -eq $empId }
                if ($worker -and $worker.pin -eq $pin) {
                    Send-JsonResponse $response 200 @{
                        success = $true
                        session = @{
                            empId = $worker.empId
                            name = $worker.name
                            role = "WORKER"
                            assignedShop = $worker.assignedShop
                            canCollectPayment = [bool]$worker.canCollectPayment
                            token = "JIT-WRK-$([System.Guid]::NewGuid().ToString().Substring(0,8).ToUpper())"
                        }
                    }
                    continue
                }
                Send-JsonResponse $response 401 @{ error = "Invalid Employee ID or Security PIN." }
                continue
            }

            # 4. Owner Authentication
            if ($request.HttpMethod -eq "POST" -and $apiRoute -eq "auth/owner-login") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $reqBody = $reader.ReadToEnd() | ConvertFrom-Json
                $ownerId = "$($reqBody.ownerId)".Trim().ToUpper()
                $pin = "$($reqBody.pin)".Trim()

                $owner = $db.owners | Where-Object { $_.ownerId -eq $ownerId }
                if ($owner -and $owner.pin -eq $pin) {
                    Send-JsonResponse $response 200 @{
                        success = $true
                        session = @{
                            ownerId = $owner.ownerId
                            name = $owner.name
                            role = "SHOP_OWNER"
                            assignedShops = $owner.assignedShops
                            token = "JIT-OWN-$([System.Guid]::NewGuid().ToString().Substring(0,8).ToUpper())"
                        }
                    }
                    continue
                }
                Send-JsonResponse $response 401 @{ error = "Invalid Owner ID or Password." }
                continue
            }

            # 5. Orders: GET all orders
            if ($request.HttpMethod -eq "GET" -and $apiRoute -eq "orders") {
                Send-JsonResponse $response 200 @{ orders = $db.orders }
                continue
            }

            # 6. Orders: POST create order
            if ($request.HttpMethod -eq "POST" -and $apiRoute -eq "orders") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $reqBody = $reader.ReadToEnd() | ConvertFrom-Json
                
                $shop = "$($reqBody.shop)"
                $isPod = ($reqBody.paymentDetails.method -eq "Pay on Delivery" -or $reqBody.paymentDetails.method -eq "POD")
                
                # Token counter
                $prefix = "C"
                if ($shop -eq "stationery") { $prefix = "S" }
                elseif ($shop -eq "printing") { $prefix = "P" }

                $nextNum = 1
                if ($db.tokenCounters.$shop) {
                    $nextNum = [int]$db.tokenCounters.$shop + 1
                }
                $db.tokenCounters.$shop = $nextNum
                $token = "$prefix-$($nextNum.ToString('D3'))"

                $newOrderId = "JIT-ORD-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds().ToString().Substring(7))"
                $newOrder = @{
                    orderId = $newOrderId
                    shop = $shop
                    token = $token
                    studentRegNo = "$($reqBody.studentRegNo)"
                    studentName = "$($reqBody.studentName)"
                    items = $reqBody.items
                    totalAmount = [int]$reqBody.totalAmount
                    status = if ($isPod) { "PLACED" } else { "Confirmed" }
                    createdAt = (Get-Date).ToString("o")
                    payment = @{
                        method = if ($isPod) { "Pay on Delivery" } else { "$($reqBody.paymentDetails.method)" }
                        status = if ($isPod) { "NOT PAID" } else { "PAID" }
                        txnId = if ($isPod) { "COD-$((Get-Random -Minimum 100000 -Maximum 999999))" } else { "TXN-$((Get-Random -Minimum 100000 -Maximum 999999))" }
                    }
                }

                $orderList = [System.Collections.ArrayList]@($db.orders)
                $orderList.Insert(0, $newOrder)
                $db.orders = $orderList
                Save-Database $db

                Send-JsonResponse $response 201 @{ success = $true; order = $newOrder }
                continue
            }

            # 7. Collect POD Physical Payment
            if ($request.HttpMethod -eq "POST" -and $apiRoute -match "^orders/([^/]+)/collect-payment$") {
                $targetOrderId = $matches[1]
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $reqBody = $reader.ReadToEnd() | ConvertFrom-Json

                $targetOrder = $db.orders | Where-Object { $_.orderId -eq $targetOrderId }
                if (-not $targetOrder) {
                    Send-JsonResponse $response 404 @{ error = "Order not found" }
                    continue
                }

                if ($targetOrder.payment.status -eq "PAID") {
                    Send-JsonResponse $response 400 @{ error = "Payment has already been collected." }
                    continue
                }

                $staffId = "$($reqBody.staffId)"
                $staffName = "$($reqBody.staffName)"

                $targetOrder.payment.status = "PAID"
                $targetOrder.payment.collectedBy = $staffId
                $targetOrder.payment.collectedByName = $staffName
                $targetOrder.payment.collectedAt = (Get-Date).ToString("o")
                $targetOrder.payment.collectedAmount = $targetOrder.totalAmount

                # Add collection record
                $newRec = @{
                    collectionId = "COL-$((Get-Random -Minimum 1000 -Maximum 9999))"
                    orderId = $targetOrder.orderId
                    token = $targetOrder.token
                    shop = $targetOrder.shop
                    amount = $targetOrder.totalAmount
                    staffId = $staffId
                    staffName = $staffName
                    timestamp = (Get-Date).ToString("o")
                }
                $recList = [System.Collections.ArrayList]@($db.collectionRecords)
                $recList.Insert(0, $newRec)
                $db.collectionRecords = $recList
                Save-Database $db

                Send-JsonResponse $response 200 @{
                    success = $true
                    message = "Payment Received Successfully"
                    order = $targetOrder
                }
                continue
            }

            # 7B. Update Order Status (Fulfillment & Rejection)
            if ($request.HttpMethod -eq "POST" -and $apiRoute -match "^orders/([^/]+)/status$") {
                $targetOrderId = $matches[1]
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $reqBody = $reader.ReadToEnd() | ConvertFrom-Json

                $targetOrder = $db.orders | Where-Object { $_.orderId -eq $targetOrderId }
                if (-not $targetOrder) {
                    Send-JsonResponse $response 404 @{ error = "Order not found" }
                    continue
                }

                $nextStatus = "$($reqBody.status)".Trim()
                $workerId = "$($reqBody.workerId)".Trim()
                $workerName = "$($reqBody.workerName)".Trim()
                $workerRole = "$($reqBody.workerRole)".Trim()
                $workerAssignedShop = "$($reqBody.workerAssignedShop)".Trim()
                $rejectionReason = "$($reqBody.rejectionReason)".Trim()

                # Mandatory rejection reason check
                if ($nextStatus -eq "Rejected" -and [string]::IsNullOrWhiteSpace($rejectionReason)) {
                    Send-JsonResponse $response 400 @{ error = "A mandatory rejection reason is required to reject an order." }
                    continue
                }

                # Shop isolation authorization check for workers
                if ($workerRole -eq "WORKER" -and -not [string]::IsNullOrWhiteSpace($workerAssignedShop)) {
                    if ($workerAssignedShop -ne $targetOrder.shop) {
                        Send-JsonResponse $response 403 @{ error = "Unauthorized: Worker assigned to $workerAssignedShop cannot update $($targetOrder.shop) orders." }
                        continue
                    }
                }

                if ($targetOrder.status -eq $nextStatus) {
                    Send-JsonResponse $response 400 @{ error = "Order $targetOrderId is already in $nextStatus state." }
                    continue
                }

                $nowIso = (Get-Date).ToString("o")
                $oldStatus = $targetOrder.status
                $targetOrder.status = $nextStatus
                $targetOrder.updatedAt = $nowIso
                $targetOrder.responsibleWorkerId = $workerId
                $targetOrder.responsibleWorkerName = $workerName

                if ($nextStatus -eq "Rejected") {
                    $targetOrder.rejectionReason = $rejectionReason
                }

                # Append to statusHistory
                $historyEntry = @{
                    status = $nextStatus
                    updatedBy = $workerId
                    updatedByName = $workerName
                    timestamp = $nowIso
                    reason = $rejectionReason
                }
                $existingHist = @($targetOrder.statusHistory)
                $histList = [System.Collections.ArrayList]@($existingHist)
                $histList.Add($historyEntry)
                $targetOrder.statusHistory = $histList

                # Record Audit Log
                $auditEntry = @{
                    logId = "AUD-$((Get-Random -Minimum 1000 -Maximum 9999))"
                    action = "ORDER_STATUS_UPDATE"
                    actorId = $workerId
                    actorRole = $workerRole
                    details = "Order $($targetOrder.orderId) status changed from '$oldStatus' to '$nextStatus' by $workerName ($workerId)"
                    timestamp = $nowIso
                }
                $auditList = [System.Collections.ArrayList]@($db.auditLogs)
                $auditList.Insert(0, $auditEntry)
                $db.auditLogs = $auditList

                Save-Database $db

                Send-JsonResponse $response 200 @{
                    success = $true
                    message = "Order status updated to $nextStatus"
                    order = $targetOrder
                }
                continue
            }

            # 8. Audit Logs
            if ($request.HttpMethod -eq "GET" -and $apiRoute -eq "audit-logs") {
                Send-JsonResponse $response 200 @{ logs = $db.auditLogs }
                continue
            }

            # 9. Collection Records
            if ($request.HttpMethod -eq "GET" -and $apiRoute -eq "collection-records") {
                Send-JsonResponse $response 200 @{ records = $db.collectionRecords }
                continue
            }
        }

        # -------------------------------------------------------------
        # STATIC ASSETS SERVING
        # -------------------------------------------------------------
        $filePath = Join-Path $baseDir $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "text/plain"
            switch ($ext) {
                ".html" { $contentType = "text/html; charset=utf-8" }
                ".js"   { $contentType = "application/javascript; charset=utf-8" }
                ".mjs"  { $contentType = "application/javascript; charset=utf-8" }
                ".css"  { $contentType = "text/css; charset=utf-8" }
                ".json" { $contentType = "application/json; charset=utf-8" }
                ".svg"  { $contentType = "image/svg+xml" }
                ".png"  { $contentType = "image/png" }
                ".jpg"  { $contentType = "image/jpeg" }
                ".jpeg" { $contentType = "image/jpeg" }
                ".pdf"  { $contentType = "application/pdf" }
                default { $contentType = "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFoundMsg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $response.ContentLength64 = $notFoundMsg.Length
            $response.OutputStream.Write($notFoundMsg, 0, $notFoundMsg.Length)
        }

        $response.Close()
    } catch {
        try { if ($response) { $response.Close() } } catch {}
    }
}
