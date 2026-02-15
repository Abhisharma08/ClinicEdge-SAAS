$ErrorActionPreference = "Continue"

Write-Host "Logging in as Admin to list users..."
try {
    $login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@healthfirst.clinic","password":"Password@123"}'
    $token = $login.accessToken
    Write-Host "Logged in as Admin."
} catch {
    Write-Host "Admin Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

try {
    # We don't have a direct "list users" endpoint exposed easily, so we'll check the doctor list
    $doctors = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/doctors?clinicId=$($login.user.clinicId)" -Headers @{ "Authorization" = "Bearer $token" }
    
    Write-Host "Doctors Found:" -ForegroundColor Cyan
    foreach ($d in $doctors.items) {
        Write-Host " - Name: $($d.name)"
        Write-Host "   ID: $($d.id)"
        Write-Host "   Phone: $($d.phone)"
        # Note: The doctor endpoint might not return the email directly depending on DTO
    }

    # Checking specific known accounts by trying to login
    $accounts = @(
        @{ email="dr.sharma@healthfirst.clinic"; role="DOCTOR" },
        @{ email="dr.patel@healthfirst.clinic"; role="DOCTOR" },
        @{ email="admin@healthfirst.clinic"; role="CLINIC_ADMIN" }
    )

    foreach ($acc in $accounts) {
        try {
            $res = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body (@{ email = $acc.email; password = "Password@123" } | ConvertTo-Json)
            Write-Host "[SUCCESS] Login for $($acc.email) ($($acc.role)) - ID: $($res.user.id)" -ForegroundColor Green
        } catch {
            Write-Host "[FAILED] Login for $($acc.email) ($($acc.role))" -ForegroundColor Red
        }
    }

} catch {
    Write-Host "Error listing data: $($_.Exception.Message)"
}
