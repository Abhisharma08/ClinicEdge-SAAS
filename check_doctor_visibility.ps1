$ErrorActionPreference = "Continue"

function Request($method, $url, $token) {
    try {
        return Invoke-RestMethod -Method $method -Uri $url -Headers @{ "Authorization" = "Bearer $token" }
    } catch {
        Write-Host "Error $method $url : $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "Body: $($reader.ReadToEnd())" -ForegroundColor Yellow
        }
        return $null
    }
}

Write-Host "Logging in as Doctor..."
try {
    $login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body '{"email":"dr.sharma@healthfirst.clinic","password":"Password@123"}'
    $token = $login.accessToken
    $userId = $login.user.id
    $clinicId = $login.user.clinicId
    Write-Host "Logged in. User ID: $userId"
    Write-Host "Clinic ID: $clinicId"
} catch {
    Write-Host "Doctor Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get patients via API
Write-Host "Fetching patients via API as Doctor..."
$patients = Request "Get" "http://localhost:3000/api/patients?limit=5&sortOrder=desc" $token

if ($patients -and $patients.items) {
    Write-Host "Found $($patients.items.Count) patients visible to Doctor:" -ForegroundColor Cyan
    foreach ($p in $patients.items) {
        Write-Host " - [$($p.id)] $($p.firstName) $($p.lastName) (Created: $($p.createdAt))"
    }
} else {
    Write-Host "No patients returned by API!" -ForegroundColor Red
    if ($patients) { Write-Host "Response breakdown: $($patients | ConvertTo-Json -Depth 2)" }
}
