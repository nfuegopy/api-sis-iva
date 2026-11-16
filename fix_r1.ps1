$files = @("SISTEMA_IVA_GUIA.md", "API_ENDPOINTS.md", "GOOGLE_OAUTH_SETUP.md")
foreach ($f in $files) {
    $c = (Get-Content $f -Raw -Encoding UTF8) -split "`n"
    for ($i = 0; $i -lt $c.Length; $i++) {
        if ($c[$i] -match '<contraseña-segura>') {
            if ($c[$i] -notmatch '(?i)"?(password|contrase|nueva_password|password_actual)"?\s*[:=]') {
                if ($f -eq "SISTEMA_IVA_GUIA.md") {
                    $c[$i] = $c[$i] -replace '<contraseña-segura>78', '12345678'
                    $c[$i] = $c[$i] -replace '80<contraseña-segura>', '80123456'
                    $c[$i] = $c[$i] -replace '<contraseña-segura>7', '1234567'
                    $c[$i] = $c[$i] -replace '- Password: <contraseña-segura> \(nunca se usa para login por contraseña\)', '- Password: aleatorio (nunca se usa para login por contraseña)'
                }
                if ($f -eq "API_ENDPOINTS.md") {
                    $c[$i] = $c[$i] -replace '<contraseña-segura>78', '12345678'
                    $c[$i] = $c[$i] -replace '80<contraseña-segura>', '80123456'
                    $c[$i] = $c[$i] -replace '098<contraseña-segura>7', '0981234567'
                    $c[$i] = $c[$i] -replace '097<contraseña-segura>7', '0971234567'
                    $c[$i] = $c[$i] -replace '5<contraseña-segura>', '5123456'
                }
                if ($f -eq "GOOGLE_OAUTH_SETUP.md") {
                    $c[$i] = $c[$i] -replace '<contraseña-segura>7890-abc123.apps.googleusercontent.com', '<client-id>.apps.googleusercontent.com'
                    $c[$i] = $c[$i] -replace 'GOCSPX-abcdef<contraseña-segura>', 'GOCSPX-<client-secret>'
                }
            }
        }
    }
    $text = $c -join "`n"
    [IO.File]::WriteAllText((Resolve-Path $f).Path, $text, [Text.UTF8Encoding]::new($false))
}
Write-Host "R1 fixed"