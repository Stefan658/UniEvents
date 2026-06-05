# Asigură crearea folderului de rapoarte dacă nu există
if (!(Test-Path -Path "rapoarte")) { New-Item -ItemType Directory -Path "rapoarte" | Out-Null }

# 1. Extrage fișierele modificate la ultimul commit / recent
Write-Host "Se verifică modificările din Git..." -ForegroundColor Cyan
$modificari = git diff --name-only HEAD~1 2>$null

if ([string]::IsNullOrEmpty($modificari)) {
    # Dacă nu ai commit-uri anterioare în repository, luăm modificările nesalvate (staged/unstaged)
    $modificari = git diff --name-only
}

if ([string]::IsNullOrEmpty($modificari)) {
    Write-Host "Nu s-au găsit modificări recente în repository pentru a genera raportul." -ForegroundColor Yellow
    Exit
}

Write-Host "Fișiere detectate pentru analiză: $modificari" -ForegroundColor Gray

# 2. Formularea promptului pentru modul headless
$promptText = "Generează un rezumat concis, în limba română, al muncii de astăzi pe baza următoarelor fișiere modificate în proiect: $modificari. Structurează răspunsul sub formă de jurnal de activitate în format Markdown."

Write-Host "Se apelează Gemini CLI în mod headless..." -ForegroundColor Cyan

# 3. Rularea Gemini CLI cu aprobare automată (-y) și format JSON structurat
$rezultatRaw = gemini -p $promptText -y --output-format json | Out-String

# 4. Parsarea răspunsului JSON și salvarea textului generat
try {
    $rezultatJson = $rezultatRaw | ConvertFrom-Json
    $raspunsText = $rezultatJson.response
    
    $dataCurenta = Get-Date -Format "yyyy-MM-dd"
    $caleFisier = "rapoarte/$dataCurenta.md"
    
    $raspunsText | Out-File -FilePath $caleFisier -Encoding utf8
    
    Write-Host "`n[SUCCES] Raportul zilei a fost salvat în: $caleFisier" -ForegroundColor Green
} catch {
    Write-Host "A apărut o eroare la procesarea răspunsului de la Gemini." -ForegroundColor Red
    Write-Output $rezultatRaw
}