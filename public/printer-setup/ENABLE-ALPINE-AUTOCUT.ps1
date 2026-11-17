#Requires -RunAsAdministrator
param([string]$PrinterName)
$ErrorActionPreference='Stop'
# Run on the cashier's Windows PC. Changes only the selected Rongta driver preferences.
if(-not $PrinterName){
 $printers=@(Get-Printer | Where-Object {$_.DriverName -eq '80Normal' -or $_.Name -match 'RONGTA'})
 if($printers.Count -eq 1){$PrinterName=$printers[0].Name}
 else{Get-Printer | Select-Object Name,DriverName | Format-Table -AutoSize;$PrinterName=Read-Host 'Enter the exact receipt printer name'}
}
$printer=Get-Printer -Name $PrinterName
$cut=Get-PrinterProperty -PrinterName $PrinterName -PropertyName 'Config:PaperCut'
if($cut.Value -notin @('NoCut','FullCut','PartialCut','PageFullCut','PagePartialCut')){throw 'This driver does not expose the supported Rongta cut setting. Use its own Printing preferences > Paper cut / Auto cut.'}
$feed=$null
if($printer.DriverName -eq '80Normal'){$feed=Get-PrinterProperty -PrinterName $PrinterName -PropertyName 'Config:FeedPaper' -ErrorAction SilentlyContinue}
$folder=Join-Path $env:LOCALAPPDATA 'Alpine\PrinterSetup'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$backup=Join-Path $folder ('printer-before-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.json')
@{PrinterName=$PrinterName;PaperCut=$cut.Value;FeedPaper=$feed.Value}|ConvertTo-Json|Set-Content -LiteralPath $backup -Encoding UTF8
try{
 Set-PrinterProperty -PrinterName $PrinterName -PropertyName 'Config:PaperCut' -Value 'FullCut'
 # Option1 disables the extra page feed; the FullCut command retains the necessary cutter feed.
 if($feed -and $feed.Value -in @('Option1','Option2','Option3','Option4')){Set-PrinterProperty -PrinterName $PrinterName -PropertyName 'Config:FeedPaper' -Value 'Option1'}
 if((Get-PrinterProperty -PrinterName $PrinterName -PropertyName 'Config:PaperCut').Value -ne 'FullCut'){throw 'The driver did not retain FullCut.'}
 Write-Host ('Auto-cut after each document enabled: '+$PrinterName) -ForegroundColor Green
 Write-Host 'Alpine prints the bill and customer token as separate documents. Choose 80mm paper, 100% scale, no margins and no browser headers/footers.'
 Write-Host ('Original preferences saved: '+$backup)
 Write-Host 'If the printer beeps, flashes or reports a cutter error, stop printing and have the cutter checked. This setting cannot repair a jammed or faulty cutter.'
}catch{
 Set-PrinterProperty -PrinterName $PrinterName -PropertyName 'Config:PaperCut' -Value $cut.Value -ErrorAction SilentlyContinue
 if($feed){Set-PrinterProperty -PrinterName $PrinterName -PropertyName 'Config:FeedPaper' -Value $feed.Value -ErrorAction SilentlyContinue}
 throw
}
Read-Host 'Press Enter to close'
