$ErrorActionPreference = "Continue"

Write-Host "Logging in as Clinic Admin..."
try {
    $login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@healthfirst.clinic","password":"Password@123"}'
    $token = $login.accessToken
    $clinicId = $login.user.clinicId
    Write-Host "Logged in. Clinic ID: $clinicId"
} catch {
    Write-Host "Clinic Admin Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Fetching latest 10 patients..."
try {
    # Sort by createdAt desc to see newest first
    $patients = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/patients?limit=10&page=1&sortOrder=desc" -Headers @{ "Authorization" = "Bearer $token" }
    
    if ($patients.items) {
        Write-Host "Total Patients: $($patients.meta.total)" -ForegroundColor Cyan
        foreach ($p in $patients.items) {
            Write-Host " - [$($p.id)] $($p.firstName) $($p.lastName) ($($p.phone)) - Created: $($p.createdAt)"
        }
    } else {
        Write-Host "No patients found." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error fetching patients: $($_.Exception.Message)"
}
