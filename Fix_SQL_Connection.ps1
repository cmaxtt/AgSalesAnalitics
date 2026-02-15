# Enable TCP/IP for MSSQLSERVER (SQL Server 2022 default instance)
$path = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQLServer\SuperSocketNetLib\Tcp"

try {
    Set-ItemProperty -Path $path -Name Enabled -Value 1
    Write-Host "TCP/IP has been enabled in the registry." -ForegroundColor Green
} catch {
    Write-Error "Failed to enable TCP/IP. Please run this script as Administrator."
    Pause
    exit
}

# Restart SQL Service
Write-Host "Restarting SQL Server Service (MSSQLSERVER)..." -ForegroundColor Cyan
try {
    Restart-Service MSSQLSERVER -Force
    Write-Host "SQL Server restarted successfully!" -ForegroundColor Green
} catch {
    Write-Error "Failed to restart service. Please run as Administrator."
}

Write-Host "Connection fix complete. You may now retry connecting in the app." -ForegroundColor Yellow
Pause
