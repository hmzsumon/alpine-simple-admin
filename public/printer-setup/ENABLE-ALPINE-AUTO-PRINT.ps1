param([string]$PrinterName,[ValidateSet('Production','Local')][string]$Mode='Production')
$ErrorActionPreference='Stop'
# One-time, per-user setup. No global default-printer, browser, or execution-policy changes.
$chrome=@("$env:ProgramFiles\Google\Chrome\Application\chrome.exe","${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe","$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")|Where-Object {Test-Path -LiteralPath $_}|Select-Object -First 1
if(-not $chrome){throw 'Install Google Chrome, then run this setup again.'}
$printers=@(Get-Printer)
if(-not $PrinterName){
 $receipts=@($printers|Where-Object {$_.DriverName -eq '80Normal' -or $_.Name -match 'RONGTA|Receipt|POS-?80'})
 if($receipts.Count -eq 1){$PrinterName=$receipts[0].Name}
 else{$printers|Select-Object Name,DriverName|Format-Table -AutoSize;$PrinterName=Read-Host 'Enter the exact receipt printer name'}
}
if(-not ($printers|Where-Object {$_.Name -eq $PrinterName})){throw 'The selected printer is not installed.'}
if($PrinterName -match 'Microsoft Print to PDF|OneNote|XPS Document'){throw 'Select the physical receipt printer, not a PDF or virtual printer.'}
$profile=Join-Path $env:LOCALAPPDATA ('Alpine\AutoPrintChrome-'+$Mode)
$inUse=@(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue|Where-Object {$_.CommandLine -and $_.CommandLine.Contains($profile)})
if($inUse.Count){throw 'Close the Alpine Auto Print window before changing its printer setup. Other Chrome windows may stay open.'}
$folder=Join-Path $profile 'Default';New-Item -ItemType Directory -Path $folder -Force|Out-Null
$preferences=Join-Path $folder 'Preferences'
$prefs=if(Test-Path -LiteralPath $preferences){Copy-Item -LiteralPath $preferences -Destination ($preferences+'.backup-'+(Get-Date -Format 'yyyyMMdd-HHmmss'));Get-Content -LiteralPath $preferences -Raw|ConvertFrom-Json}else{[PSCustomObject]@{}}
$state=@{version=2;recentDestinations=@(@{id=$PrinterName;origin='local';account=''});selectedDestinationId=$PrinterName;scaling='100';marginsType=1;isHeaderFooterEnabled=$false;isCssBackgroundEnabled=$false;isLandscapeEnabled=$false}|ConvertTo-Json -Depth 6 -Compress
$prefs|Add-Member -NotePropertyName printing -NotePropertyValue @{print_preview_sticky_settings=@{appState=$state}} -Force
$json=$prefs|ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText($preferences,$json,([System.Text.UTF8Encoding]::new($false)))
$url=if($Mode -eq 'Local'){'http://localhost:3300/cash?autoPrint=1'}else{'https://alpine-simple-admin.vercel.app/cash?autoPrint=1'}
$shell=New-Object -ComObject WScript.Shell
$name=if($Mode -eq 'Local'){'Alpine Cashier - Auto Print Local.lnk'}else{'Alpine Cashier - Auto Print.lnk'}
$link=$shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) $name))
$link.TargetPath=$chrome
$link.Arguments='--app="'+$url+'" --kiosk-printing --no-first-run --no-default-browser-check --user-data-dir="'+$profile+'"'
$link.Description='Alpine: print each confirmed order once without print-dialog clicks'
$link.Save()
Write-Host ('Ready: '+$name) -ForegroundColor Green
Write-Host ('Printer: '+$PrinterName)
Write-Host 'Open this desktop shortcut, sign in as the active counter cashier and keep the window open.'
Write-Host 'Orders print once automatically. Parcel orders also print their separate token. Payment does not print another copy.'
Write-Host 'Set 80mm paper and Full cut / Cut after document in the receipt printer driver. Other browser profiles are unchanged.'
Read-Host 'Press Enter to close'
