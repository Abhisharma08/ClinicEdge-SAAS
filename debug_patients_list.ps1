$ErrorActionPreference = "Continue"

Write-Host "Logging in as Super Admin..."
try {
    $login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@cliniccrm.com","password":"Password@123"}'
    $token = $login.accessToken
    Write-Host "Logged in as Super Admin."
} catch {
    Write-Host "Super Admin Login Failed. Trying Clinic Admin..."
    $login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@healthfirst.clinic","password":"Password@123"}'
    $token = $login.accessToken
}

# Fetch ALL patients (if super admin endpoint exists, or just valid clinic patients)
# Since we debugging "missing" patients, let's try to query by the recent createdAt
Write-Host "Fetching latest 10 patients..."
try {
    $patients = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/patients?limit=10&sortOrder=desc" -Headers @{ "Authorization" = "Bearer $token" }
    
    if ($patients.items) {
        Write-Host "Total Patients Found: $($patients.meta.total)" -ForegroundColor Cyan
        foreach ($p in $patients.items) {
            Write-Host " - ID: $($p.id)"
            Write-Host "   Name: $($p.name)"
            Write-Host "   Phone: $($p.phone)"
            Write-Host "   Created: $($p.createdAt)"
            Write-Host "   Clinic Linked: $($p.clinicId)" # if available
            Write-Host "-------------------"
        }
    }
} catch {
    Write-Host "Error fetching patients: $($_.Exception.Message)"
}
