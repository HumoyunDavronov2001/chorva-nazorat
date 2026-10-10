# ============================================================
#  CHORVA KASSA — Android APK ni AVTOMATIK qurish
# ============================================================
#  Kompyuterda Java ham, Android Studio ham BO'LMASA ham ishlaydi:
#  kerakli hamma narsani o'zi yuklab oladi va MOBIL_APK\vosita\
#  papkasiga qo'yadi (tizimga hech narsa o'rnatmaydi, PATH ni
#  o'zgartirmaydi — o'chirmoqchi bo'lsangiz shu papkani o'chirasiz).
#
#  Ishlatish:  PowerShell da shu papkada
#      .\QUR_APK.ps1
#
#  Birinchi safar ~1.5 GB yuklab oladi va 10-20 daqiqa oladi.
#  Keyingi safar 1-2 daqiqa.
# ============================================================
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"   # yuklashni tezlashtiradi

$Ildiz   = $PSScriptRoot
$Vosita  = Join-Path $Ildiz "vosita"
$JdkDir  = Join-Path $Vosita "jdk"
$SdkDir  = Join-Path $Vosita "android-sdk"

function Bosqich($n) { Write-Host "`n=== $n ===" -ForegroundColor Cyan }
function Xato($n)    { Write-Host "XATO: $n" -ForegroundColor Red }
function Yaxshi($n)  { Write-Host "  $n" -ForegroundColor Green }

New-Item -ItemType Directory -Force -Path $Vosita | Out-Null

# ── 1) JDK 17 ────────────────────────────────────────────────
Bosqich "1/5  Java (JDK 17)"
$JavaExe = Join-Path $JdkDir "bin\java.exe"
if (Test-Path $JavaExe) {
    Yaxshi "allaqachon bor"
} else {
    $url = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
    $zip = Join-Path $Vosita "jdk.zip"
    Write-Host "  yuklanmoqda (~180 MB)…"
    Invoke-WebRequest -Uri $url -OutFile $zip
    Write-Host "  ochilmoqda…"
    $vaqt = Join-Path $Vosita "_jdk_tmp"
    Remove-Item -Recurse -Force $vaqt -ErrorAction SilentlyContinue
    Expand-Archive -Path $zip -DestinationPath $vaqt -Force
    # Arxiv ichida bitta papka bo'ladi (jdk-17.0.x+y) — uni jdk deb olamiz
    $ich = Get-ChildItem $vaqt | Where-Object { $_.PSIsContainer } | Select-Object -First 1
    Remove-Item -Recurse -Force $JdkDir -ErrorAction SilentlyContinue
    Move-Item $ich.FullName $JdkDir
    Remove-Item -Recurse -Force $vaqt, $zip -ErrorAction SilentlyContinue
    if (-not (Test-Path $JavaExe)) { Xato "JDK ochilmadi"; exit 1 }
    Yaxshi "tayyor"
}
$env:JAVA_HOME = $JdkDir
$env:PATH = "$JdkDir\bin;$env:PATH"

# ── 2) Android SDK buyruq qatori vositalari ──────────────────
Bosqich "2/5  Android SDK vositalari"
$SdkMgr = Join-Path $SdkDir "cmdline-tools\latest\bin\sdkmanager.bat"
if (Test-Path $SdkMgr) {
    Yaxshi "allaqachon bor"
} else {
    $url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $zip = Join-Path $Vosita "cmdline.zip"
    Write-Host "  yuklanmoqda (~130 MB)…"
    Invoke-WebRequest -Uri $url -OutFile $zip
    $vaqt = Join-Path $Vosita "_cmd_tmp"
    Remove-Item -Recurse -Force $vaqt -ErrorAction SilentlyContinue
    Expand-Archive -Path $zip -DestinationPath $vaqt -Force
    # sdkmanager "cmdline-tools\latest\" tuzilmasini talab qiladi
    New-Item -ItemType Directory -Force -Path (Join-Path $SdkDir "cmdline-tools") | Out-Null
    Move-Item (Join-Path $vaqt "cmdline-tools") (Join-Path $SdkDir "cmdline-tools\latest")
    Remove-Item -Recurse -Force $vaqt, $zip -ErrorAction SilentlyContinue
    if (-not (Test-Path $SdkMgr)) { Xato "SDK vositalari ochilmadi"; exit 1 }
    Yaxshi "tayyor"
}
$env:ANDROID_HOME = $SdkDir
$env:ANDROID_SDK_ROOT = $SdkDir

# ── 3) SDK qismlari ─────────────────────────────────────────
Bosqich "3/5  Android platformasi (SDK 34)"
if (Test-Path (Join-Path $SdkDir "platforms\android-34")) {
    Yaxshi "allaqachon bor"
} else {
    # Litsenziyalarni TO'G'RIDAN-TO'G'RI yozamiz. "sdkmanager --licenses"
    # ga "y" ni quvur orqali berish PowerShell da ishonchsiz (.bat stdin
    # ni to'liq o'qimaydi) — shu sababdan avval o'rnatish uzilgan edi.
    Write-Host "  litsenziyalar yozilmoqda…"
    $LicDir = Join-Path $SdkDir "licenses"
    New-Item -ItemType Directory -Force -Path $LicDir | Out-Null
    @(
        "8933bad161af4178b1185d1a37fbf41ea5269c55",
        "d56f5187479451eabf01fb78af6dfcb131a6481e",
        "24333f8a63b6825ea9c5514f83c2829b004d1fee"
    ) -join "`n" | Out-File -FilePath (Join-Path $LicDir "android-sdk-license") `
        -Encoding ascii -NoNewline
    "84831b9409646a918e30573bab4c9c91346d8abd" |
        Out-File -FilePath (Join-Path $LicDir "android-sdk-preview-license") `
        -Encoding ascii -NoNewline

    Write-Host "  yuklanmoqda (~700 MB), 5-15 daqiqa…"
    & $SdkMgr --sdk_root="$SdkDir" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
    if ($LASTEXITCODE -ne 0) { Xato "sdkmanager xatosi ($LASTEXITCODE)"; exit 1 }
    if (-not (Test-Path (Join-Path $SdkDir "platforms\android-34"))) {
        Xato "SDK qismlari o'rnatilmadi"; exit 1
    }
    Yaxshi "tayyor"
}
# Gradle SDK ni shu fayldan topadi
"sdk.dir=$($SdkDir -replace '\\','\\')" |
    Out-File -FilePath (Join-Path $Ildiz "local.properties") -Encoding ascii

# ── 4) Gradle ───────────────────────────────────────────────
Bosqich "4/5  Gradle"
$GradleDir = Join-Path $Vosita "gradle-8.7"
$GradleBat = Join-Path $GradleDir "bin\gradle.bat"
if (Test-Path $GradleBat) {
    Yaxshi "allaqachon bor"
} else {
    $url = "https://services.gradle.org/distributions/gradle-8.7-bin.zip"
    $zip = Join-Path $Vosita "gradle.zip"
    Write-Host "  yuklanmoqda (~130 MB)…"
    Invoke-WebRequest -Uri $url -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath $Vosita -Force
    Remove-Item -Force $zip -ErrorAction SilentlyContinue
    if (-not (Test-Path $GradleBat)) { Xato "Gradle ochilmadi"; exit 1 }
    Yaxshi "tayyor"
}

# ── 5) APK ni qurish ────────────────────────────────────────
Bosqich "5/5  APK qurilmoqda"
Push-Location $Ildiz
try {
    & $GradleBat --no-daemon assembleRelease
    if ($LASTEXITCODE -ne 0) { Xato "qurish muvaffaqiyatsiz"; exit 1 }
} finally { Pop-Location }

$Apk = Join-Path $Ildiz "app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $Apk)) {
    $Apk = Join-Path $Ildiz "app\build\outputs\apk\release\app-release-unsigned.apk"
}
if (-not (Test-Path $Apk)) { Xato "APK topilmadi"; exit 1 }

$Chiqish = Join-Path $Ildiz "ChorvaKassa.apk"
Copy-Item $Apk $Chiqish -Force
$hajm = [math]::Round((Get-Item $Chiqish).Length / 1MB, 2)

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " TAYYOR:  $Chiqish  ($hajm MB)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host @"

TELEFONGA O'RNATISH:
  1) ChorvaKassa.apk faylini telefonga ko'chiring
     (USB kabel, Telegram "Saqlangan xabarlar" yoki WiFi orqali)
  2) Telefonda faylni bosing -> "Noma'lum manbalardan o'rnatish" ga ruxsat
  3) Ilovani oching

ISHLATISH:
  1) Telefon va kompyuter BITTA WiFi da bo'lsin
  2) Ilovada "Tarmoqdan dasturni topish" -> manzil o'zi topiladi
  3) Kompyuterdagi dasturda Kassa -> "Mobil qurilma ulash" -> 5 xonali kod
  4) Kodni telefonga kiriting -> ULANISH
  5) Printerni tanlang (avval telefon sozlamalarida XP-P201A ni JUFTLANG)

"@ -ForegroundColor White
