$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$scriptPath = Join-Path $taskRoot 'assets/riddle-script.json'
$riddles = Get-Content -LiteralPath $scriptPath -Raw -Encoding UTF8 | ConvertFrom-Json
$sourceDir = Join-Path $taskRoot 'assets/generated/voice'
$outputDir = Join-Path $taskRoot 'public/audio'
New-Item -ItemType Directory -Path $sourceDir -Force | Out-Null
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
$speaker = New-Object -ComObject SAPI.SpVoice
$voice = $speaker.GetVoices() | Where-Object { $_.GetDescription() -match 'Irina.*Russian' } | Select-Object -First 1
if (-not $voice) { throw 'The Russian Microsoft Irina Desktop voice is required to regenerate these files.' }
$speaker.Voice = $voice
$speaker.Rate = -1
$speaker.Volume = 100
foreach ($riddle in $riddles) {
    $wavePath = Join-Path $sourceDir ($riddle.id + '.wav')
    $mp3Path = Join-Path $outputDir ('riddle-' + $riddle.id + '.mp3')
    $stream = New-Object -ComObject SAPI.SpFileStream
    try {
        $stream.Open($wavePath, 3, $false)
        $speaker.AudioOutputStream = $stream
        [void]$speaker.Speak($riddle.text, 0)
    } finally { $stream.Close() }
    & ffmpeg -hide_banner -loglevel error -y -i $wavePath -ac 1 -ar 24000 -codec:a libmp3lame -b:a 48k $mp3Path
    if ($LASTEXITCODE -ne 0) { throw ('Encoding failed: ' + $riddle.id) }
    Write-Output ('Recorded: ' + $riddle.id)
}
Write-Output ('Completed ' + $riddles.Count + ' Russian riddle recordings.')
