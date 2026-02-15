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
            $content = $reader.ReadToEnd()
            Set-Content -Path "error.txt" -Value $content
            Write-Host "Response Body written to error.txt" -ForegroundColor Yellow
        } else {
             Write-Host $_.Exception.Message -ForegroundColor Red
        }
        return $null
    }
}

# 1. Login Admin
Write-Host "Logging in as Admin (admin@healthfirst.clinic)..." -ForegroundColor Cyan
try {
    $adminLogin = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/v1/auth/login" -Body (@{ email = "admin@healthfirst.clinic"; password = "Password@123" } | ConvertTo-Json) -ContentType "application/json"
    $adminToken = $adminLogin.accessToken
    $adminToken | Out-File -FilePath "token.txt" -NoNewline -Encoding ascii
    $clinicId = $adminLogin.user.clinicId
    Write-Host "Logged in as Admin. Clinic ID: $clinicId" -ForegroundColor Green
} catch {
    Write-Host "Login Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    }
    exit 1
}

# 2. Get Data (Doctor + Patient)
Write-Host "Fetching Doctor and Patient..." -ForegroundColor Cyan
$doctors = Request "Get" "http://localhost:3001/api/v1/doctors?clinicId=$clinicId" $adminToken
if (!$doctors -or !$doctors.items) { Write-Host "Failed to fetch doctors!" -ForegroundColor Red; exit 1 }
$doctorId = $doctors.items[0].id

$patients = Request "Get" "http://localhost:3001/api/v1/patients?limit=1" $adminToken
if (!$patients -or !$patients.items -or $patients.items.Count -eq 0) {
    Write-Host "No patients found. Creating one..." -ForegroundColor Yellow
    if (Test-Path "payload.json") {
        $json = Get-Content "payload.json" -Raw
        Write-Host "Using payload.json content..."
        $created = Request "Post" "http://localhost:3001/api/v1/patients" $adminToken ($json | ConvertFrom-Json)
    } else {
        Write-Host "payload.json not found!" -ForegroundColor Red
        exit 1
    }
    if (!$created) {
        Write-Host "Failed to create patient!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Created patient: $($created.id)" -ForegroundColor Green
    $patientId = $created.id
} else {
    $patientId = $patients.items[0].id
}

Write-Host "Doctor ID: $doctorId"
Write-Host "Patient ID: $patientId"

# 3. Admin Booking (Manual Time)
Write-Host "`nTesting Admin Booking (Manual Time)..." -ForegroundColor Cyan
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$adminPayload = @{
    clinicId = $clinicId
    patientId = $patientId
    doctorId = $doctorId
    appointmentDate = $tomorrow
    startTime = "10:00"
    endTime = "10:30"
    notes = "Admin booking test"
}
$adminBooking = Request "Post" "http://localhost:3001/api/v1/appointments" $adminToken $adminPayload
if ($adminBooking) { Write-Host "Admin Booking Success: $($adminBooking.id)" -ForegroundColor Green }

# 4. Login Doctor
$docEmail = "dr.sharma@healthfirst.clinic"
Write-Host "`nLogging in as Doctor ($docEmail)..." -ForegroundColor Cyan
try {
    $doctorLogin = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/v1/auth/login" -Body (@{ email = $docEmail; password = "Password@123" } | ConvertTo-Json) -ContentType "application/json"
    $doctorToken = $doctorLogin.accessToken
    $docUser = $doctorLogin.user
    Write-Host "Logged in as Doctor." -ForegroundColor Green
} catch {
    Write-Host "Doctor Login Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
       $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
       Write-Host "Body: $($reader.ReadToEnd())" -ForegroundColor Yellow
    }
    exit 1
}

# 5. Doctor Check Slots
Write-Host "Doctor Checking Slots for $tomorrow..." -ForegroundColor Cyan
try {
   $slots = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/v1/appointments/slots?clinicId=$clinicId&doctorId=$doctorId&date=$tomorrow" -Headers @{ "Authorization" = "Bearer $doctorToken" }
} catch {
   Write-Host "Failed to get slots!" -ForegroundColor Red
   Write-Host $_.Exception.Message
   exit 1
}

if (!$slots -or $slots.Count -eq 0) {
    Write-Host "No slots found for Doctor!" -ForegroundColor Yellow
} else {
    $firstSlot = $slots[0]
    Write-Host "Found $($slots.Count) slots. First: $($firstSlot.start) - $($firstSlot.end) Available: $($firstSlot.available)"
    
    # 6. Doctor Booking (Slot Based) - Try to book an *available* slot
    $availableSlot = $slots | Where-Object { $_.available -eq $true } | Select-Object -First 1
    if ($availableSlot) {
        Write-Host "Booking slot: $($availableSlot.start)..." -ForegroundColor Cyan
        $docPayload = @{
            clinicId = $clinicId
            patientId = $patientId
            doctorId = $doctorId
            appointmentDate = $tomorrow
            startTime = $availableSlot.start
            endTime = $availableSlot.end
            notes = "Doctor booking test"
        }
        $docBooking = Request "Post" "http://localhost:3001/api/v1/appointments" $doctorToken $docPayload
        if ($docBooking) { Write-Host "Doctor Booking Success: $($docBooking.id)" -ForegroundColor Green }
    } else {
        Write-Host "No available slots to book (Admin likely took 10:00)." -ForegroundColor Yellow
    }
}
