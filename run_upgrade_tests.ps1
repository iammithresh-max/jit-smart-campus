$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:5505/")
$listener.Start()

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
$url = "http://localhost:5500/test_end_to_end_upgrade.html"

$proc = Start-Process -FilePath $edgePath -ArgumentList "--headless=new", "--disable-gpu", $url -PassThru

$asyncResult = $listener.BeginGetContext($null, $null)
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$timedOut = $false

while (-not $asyncResult.IsCompleted) {
    Start-Sleep -Milliseconds 200
    if ($sw.ElapsedMilliseconds -gt 20000) {
        $timedOut = $true
        break
    }
}

if ($timedOut) {
    Write-Output "TIMEOUT waiting for test results"
    $listener.Stop()
    try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
    exit 1
} else {
    $context = $listener.EndGetContext($asyncResult)
    $reader = New-Object System.IO.StreamReader($context.Request.InputStream)
    $output = $reader.ReadToEnd()
    Write-Output $output
    $context.Response.StatusCode = 200
    $context.Response.Headers.Add("Access-Control-Allow-Origin", "*")
    $context.Response.Close()
    $output | Out-File -FilePath "test_upgrade_results.log" -Encoding utf8
}

$listener.Stop()
try {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
} catch {}
