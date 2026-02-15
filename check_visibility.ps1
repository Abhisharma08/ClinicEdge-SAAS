$ErrorActionPreference = "Continue"

function Request($method, $url, $token) {
    try {
        return Invoke-RestMethod -Method $method -Uri $url -Headers @{ "Authorization" = "Bearer $token" }
    } catch {
        Write-Host "Error $method $url : $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host $reader.ReadToEnd() -ForegroundColor Yellow
        }
        return $null
    }
}

Write-Host "Logging in..."
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@healthfirst.clinic","password":"Password@123"}'
$token = $login.accessToken
$clinicId = $login.user.clinicId
Write-Host "Logged in. Clinic ID: $clinicId"

# Get recent patients via API (which uses the linkage)
Write-Host "Fetching patients via API..."
$patients = Request "Get" "http://localhost:3000/api/patients?limit=5&sortOrder=desc" $token

if ($patients -and $patients.items) {
    Write-Host "Found $($patients.items.Count) patients visible to this user:" -ForegroundColor Cyan
    foreach ($p in $patients.items) {
        Write-Host " - [$($p.id)] $($p.firstName) $($p.lastName) (Created: $($p.createdAt))"
    }
} else {
    Write-Host "No patients returned by API!" -ForegroundColor Red
}

# Now let's try to get the patient specifically by ID if we know it from previous steps (e77fb9f1...)
# But easier is to check if the specific patient ID from recent creation is in this list.
