$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files\nodejs;" + [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
$env:NODE_OPTIONS = "--use-system-ca"
$convex = Join-Path $env:APPDATA "npm\convex.cmd"

function Invoke-ConvexRun {
    param(
        [string]$FunctionName,
        [hashtable]$Args
    )

    $json = ($Args | ConvertTo-Json -Compress)
    return & $convex run $FunctionName $json
}

$userId = Invoke-ConvexRun "users:createUser" @{
    name         = "Test Founder"
    role         = "CEO"
    organization = "Test Co"
}
Write-Output "USER_ID=$userId"

$paste = "Founder and CEO at Test Co with 10 years in EdTech. Previously VP at TechCorp. Built and sold two startups. Speaker at industry conferences."

Invoke-ConvexRun "users:saveBackgroundInput" @{
    userId        = $userId
    linkedinPaste = $paste
} | Out-Null

$bg = Invoke-ConvexRun "onboardingActions:inferProfessionalBackground" @{
    userId        = $userId
    linkedinPaste = $paste
}
Write-Output "BG=$bg"

Invoke-ConvexRun "users:updateTopics" @{
    userId = $userId
    topics = @("Startup building", "EdTech", "Fundraising")
} | Out-Null

$samples = Invoke-ConvexRun "onboardingActions:generateStyleSamples" @{
    topic = "Startup building"
}
Write-Output "SAMPLES=$samples"

$profile = Invoke-ConvexRun "onboardingActions:synthesizeStyleProfile" @{
    userId               = $userId
    selectedStyles       = @("humble", "conversational")
    sampleWritingWeight  = 0
}
Write-Output "PROFILE=$profile"

$user = Invoke-ConvexRun "users:getUser" @{ userId = $userId }
Write-Output "USER=$user"

$style = Invoke-ConvexRun "users:getStyleProfile" @{ userId = $userId }
Write-Output "STYLE=$style"

$input = Invoke-ConvexRun "users:getBackgroundInput" @{ userId = $userId }
Write-Output "INPUT=$input"

Write-Output "SMOKE_TEST_OK"
