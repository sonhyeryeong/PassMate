[CmdletBinding()]
param(
    [string]$ConfigPath,
    [string]$SecretsPath,
    [switch]$CheckOnly,
    [switch]$Diagnose
)

$ErrorActionPreference = 'Stop'
if (-not $ConfigPath) {
    $ConfigPath = Join-Path $PSScriptRoot '../.local/supabase.json'
}
if (-not $SecretsPath) {
    $SecretsPath = Join-Path $PSScriptRoot '../.local/application-local.yml'
}
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
if (-not (Test-Path -LiteralPath $config.MavenPath -PathType Leaf)) {
    throw '로컬 설정의 MavenPath를 확인하세요.'
}
if (-not (Test-Path -LiteralPath (Join-Path $config.JavaHome 'bin/java.exe') -PathType Leaf)) {
    throw '로컬 설정의 JavaHome을 확인하세요.'
}

if (-not $Diagnose -and -not (Test-Path -LiteralPath $SecretsPath -PathType Leaf)) {
    throw '로컬 YAML 파일이 없습니다. backend/scripts/application-local.example.yml을 backend/.local/application-local.yml로 복사하고 값을 입력하세요.'
}
if ($CheckOnly) {
    Write-Host '로컬 YAML 파일 존재·Java·Maven 확인 완료. YAML 내용과 DB 인증은 아직 검증하지 않았습니다.'
    return
}

# 일반 실행은 Spring이 외부 YAML을 읽는다. 환경변수는 YAML보다 우선한다.
$variableNames = @('JAVA_HOME', 'SPRING_PROFILES_ACTIVE', 'PASSMATE_DB_URL',
    'PASSMATE_DB_USERNAME', 'PASSMATE_DB_PASSWORD', 'SPRING_CONFIG_ADDITIONAL_LOCATION')
$previous = @{}
foreach ($name in $variableNames) {
    $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}
$secret = $null
$secretPointer = [IntPtr]::Zero
try {
    $env:JAVA_HOME = $config.JavaHome
    $env:SPRING_PROFILES_ACTIVE = 'postgres'
    if ($Diagnose) {
        if ($config.Host -notmatch '^aws-[0-9]+-ap-northeast-2\.pooler\.supabase\.com$') {
            throw '서울 리전 Session pooler 주소를 확인하세요.'
        }
        if ($config.Username -notmatch '^postgres\.[a-z0-9]+$') {
            throw 'Supabase Session pooler 사용자 이름을 확인하세요.'
        }
        if (-not (Test-Path -LiteralPath $config.CertificatePath -PathType Leaf)) {
            throw 'Supabase CA 인증서 파일이 없습니다.'
        }
        $certificate = [Uri]::EscapeDataString((Resolve-Path -LiteralPath $config.CertificatePath).Path)
        $jdbcUrl = "jdbc:postgresql://$($config.Host):5432/postgres?sslmode=verify-full&sslrootcert=$certificate"
        # Spring 없이 실행하는 JDBC 진단만 비밀번호를 별도 입력받는다.
        $secret = Read-Host '진단용 Supabase DB 비밀번호 (화면에 표시되지 않습니다)' -AsSecureString
        if ($secret.Length -eq 0) { throw '비밀번호를 입력해야 합니다.' }
        $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
        $env:PASSMATE_DB_URL = $jdbcUrl
        $env:PASSMATE_DB_USERNAME = $config.Username
        $env:PASSMATE_DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
        if (-not (Test-Path -LiteralPath $config.JdbcDriverPath -PathType Leaf)) {
            throw '로컬 설정의 JdbcDriverPath를 확인하세요.'
        }
        & (Join-Path $config.JavaHome 'bin/java.exe') --class-path $config.JdbcDriverPath (Join-Path $PSScriptRoot 'CheckDatabase.java')
        if ($LASTEXITCODE -ne 0) { throw 'DB 단독 진단에 실패했습니다. 위 SQLSTATE를 확인하세요.' }
        return
    }
    $env:SPRING_CONFIG_ADDITIONAL_LOCATION = ([Uri](Resolve-Path -LiteralPath $SecretsPath).Path).AbsoluteUri
    Write-Host 'localhost:8080에서 실행합니다. 첫 실행은 새 passmate 스키마를 생성합니다. 종료: Ctrl+C'
    & $config.MavenPath -B -ntp -f (Join-Path $PSScriptRoot '../pom.xml') spring-boot:run
    if ($LASTEXITCODE -ne 0) { throw 'Spring 실행에 실패했습니다. 위 오류를 확인하세요.' }
} finally {
    foreach ($name in $variableNames) {
        [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process')
    }
    if ($secretPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
    }
    if ($null -ne $secret) { $secret.Dispose() }
}
