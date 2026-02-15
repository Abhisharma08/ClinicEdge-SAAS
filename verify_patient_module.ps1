$ErrorActionPreference = "Continue"

function Request($method, $url, $token, $body=$null) {
    try {
        $params = @{ Method = $method; Uri = $url; Headers = @{ "Authorization" = "Bearer $token" }; ContentType = "application/json" }
        if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 10) }
        return Invoke-RestMethod @params
    } catch {
        Write-Host "Error $method $url : $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "Body: $($reader.ReadToEnd())" -ForegroundColor Yellow
        }
        return $null
    }
}

# 1. Login as Clinic Admin
Write-Host "1. Admin Login..." -ForegroundColor Cyan
$admin = Request "Post" "http://localhost:3000/api/auth/login" $null @{email="admin@healthfirst.clinic";password="Password@123"}
if (!$admin) { exit }
$adminToken = $admin.accessToken
Write-Host "   Success."

# 2. Get Target Patient (ProxyTest User)
Write-Host "`n2. Finding Target Patient (ProxyTest User)..." -ForegroundColor Cyan
$patients = Request "Get" "http://localhost:3000/api/patients?search=ProxyTest" $adminToken
if (!$patients.items -or $patients.items.Count -eq 0) { 
    Write-Host "   Patient not found. Creating one..."
    $newP = Request "Post" "http://localhost:3000/api/patients" $adminToken @{
        firstName="Verification"; lastName="Test"; phone="+919999988888"; 
        dob="1990-01-01"; gender="MALE"; 
        addressLine1="Test St"; city="TestCity"; state="TS"; postalCode="123456"; 
        emergencyName="Em"; emergencyRelationship="Rel"; emergencyPhone="+919999977777";
        dpdpConsent=$true
    }
    $targetId = $newP.id
} else {
    $targetId = $patients.items[0].id
}
Write-Host "   Target ID: $targetId"

# 3. Admin Update Patient
Write-Host "`n3. Admin: Updating Patient..." -ForegroundColor Cyan
$updateRes = Request "Put" "http://localhost:3000/api/patients/$targetId" $adminToken @{
    firstName="UpdatedBy"; lastName="Admin"; city="AdminCity"
}
if ($updateRes.firstName -eq "UpdatedBy") { Write-Host "   Success: Name updated to 'UpdatedBy Admin'" -ForegroundColor Green }
else { Write-Host "   Failed." -ForegroundColor Red }

# 4. Login as Doctor (dr.patel)
Write-Host "`n4. Doctor Login (dr.patel)..." -ForegroundColor Cyan
$doctor = Request "Post" "http://localhost:3000/api/auth/login" $null @{email="dr.patel@healthfirst.clinic";password="Password@123"}
if (!$doctor) { 
    Write-Host "   Doctor login failed. Skipping doctor tests." -ForegroundColor Red
} else {
    $docToken = $doctor.accessToken
    Write-Host "   Success."

    # 5. Doctor View Details
    Write-Host "`n5. Doctor: View Patient Details..." -ForegroundColor Cyan
    $docView = Request "Get" "http://localhost:3000/api/patients/$targetId" $docToken
    if ($docView.firstName -eq "UpdatedBy") { Write-Host "   Success: Doctor sees updated name." -ForegroundColor Green }
    else { Write-Host "   Failed: Doctor sees '$($docView.firstName)'" -ForegroundColor Red }

    # 6. Doctor View Visits
    Write-Host "`n6. Doctor: View Visits..." -ForegroundColor Cyan
    $visits = Request "Get" "http://localhost:3000/api/patients/$targetId/visits" $docToken
    if ($visits) { Write-Host "   Success (Items: $($visits.items.Count))" -ForegroundColor Green }

    # 7. Doctor Delete
    Write-Host "`n7. Doctor: Delete Patient..." -ForegroundColor Cyan
    $del = Request "Delete" "http://localhost:3000/api/patients/$targetId" $docToken
    # Note: Delete returns the deleted object usually
    if ($del.id -eq $targetId) { Write-Host "   Success: Patient deleted." -ForegroundColor Green }
    else { Write-Host "   Failed." -ForegroundColor Red }
}

# 8. Verify Deletion (Admin shouldn't see it or it should be inactive)
Write-Host "`n8. Admin: Verify Deletion..." -ForegroundColor Cyan
$finalCheck = Request "Get" "http://localhost:3000/api/patients/$targetId" $adminToken
# Depending on implementation, findById might return 404 or the inactive record.
# Assuming standard REST, get by ID might still work for admin or return 404.
if ($finalCheck) { 
    Write-Host "   Patient still retrieved (Soft Delete check needed)." 
} else {
    Write-Host "   Patient not found (404) - Hard deleted or filtered." -ForegroundColor Green 
}
