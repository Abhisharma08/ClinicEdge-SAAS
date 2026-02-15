$ErrorActionPreference = "Continue"

function Request($method, $url, $token, $body = $null) {
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    $params = @{ Method = $method; Uri = $url; Headers = $headers }
    if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 10) }
    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "Error $method $url" -ForegroundColor Red
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Host $reader.ReadToEnd() -ForegroundColor Yellow
        } else {
             Write-Host $_.Exception.Message -ForegroundColor Red
        }
        return $null
    }
}

Write-Host "Logging in as Admin..."
$login = Request "Post" "http://localhost:3001/api/v1/auth/login" $null (@{ email = "admin@healthfirst.clinic"; password = "Password@123" })
if (!$login) { exit }
$token = $login.accessToken
Write-Host "Logged in. Token acquired."

Write-Host "Creating patient..."
$payload = @{
    firstName = "Debug"
    lastName = "User"
    phone = "+919876543299"
    dob = "1990-01-01"
    gender = "MALE"
    addressLine1 = "Test Address"
    city = "Mumbai"
    state = "MH"
    postalCode = "400001"
    emergencyName = "Test Contact"
    emergencyRelationship = "Friend"
    emergencyPhone = "+919876543298"
    whatsappConsent = $true
    dpdpConsent = $true
}

$res = Request "Post" "http://localhost:3001/api/v1/patients" $token $payload
if ($res) {
    Write-Host "SUCCESS: Patient Created/Linked: $($res.id)" -ForegroundColor Green
} else {
    Write-Host "FAILED to create patient" -ForegroundColor Red
}
