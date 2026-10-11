$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:5505/")
$listener.Start()

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$url = "http://localhost:5500/test_verification.html"

$proc = Start-Process -FilePath $edgePath -ArgumentList "--headless=new", "--disable-gpu", $url -PassThru

$asyncResult = $listener.BeginGetContext($null, $null)
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$timedOut = $false

while (-not $asyncResult.IsCompleted) {
    Start-Sleep -Milliseconds 200
    if ($sw.ElapsedMilliseconds -gt 15000) {
        $timedOut = $true
        break
    }
}

if ($timedOut) {
    Write-Output "TIMEOUT waiting for test results"
} else {
    $context = $listener.EndGetContext($asyncResult)
    $reader = New-Object System.IO.StreamReader($context.Request.InputStream)
    $output = $reader.ReadToEnd()
    Write-Output $output
    $context.Response.StatusCode = 200
    $context.Response.Close()
}

$listener.Stop()
try {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
} catch {}
