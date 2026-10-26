$content = Get-Content -Path ".\data\database.json" -Raw | ConvertFrom-Json
$seedIds = @("JIT-ORD-1018", "JIT-ORD-1021", "JIT-ORD-1023", "JIT-ORD-1024")
$content.orders = @($content.orders | Where-Object { $seedIds -contains $_.orderId })
$content | ConvertTo-Json -Depth 10 | Set-Content -Path ".\data\database.json" -Encoding utf8
Write-Output "Pruned database.json orders: $($content.orders.Count) seed orders remaining."
