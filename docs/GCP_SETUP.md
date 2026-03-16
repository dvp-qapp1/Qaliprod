# GCP Setup Commands for Qalia

Este archivo documenta la configuración de GCP para el deploy de Qalia.

---

## ✅ Configuración Completada

### APIs Habilitadas
- ✅ Cloud Run API (`run.googleapis.com`)
- ✅ Artifact Registry API (`artifactregistry.googleapis.com`)
- ✅ Cloud Build API (`cloudbuild.googleapis.com`)
- ✅ Container Registry API (`containerregistry.googleapis.com`)

### Service Accounts Creados
- ✅ `github-actions-dev@qalia-dev.iam.gserviceaccount.com`
- ✅ `github-actions-prod@qalia-prod.iam.gserviceaccount.com`

### Workload Identity Federation Configurado
Se usa WIF en lugar de claves JSON (más seguro):
- ✅ Pool: `github-pool`
- ✅ Provider: `github-provider`
- ✅ Repositorio autorizado: `qalia-app/qalia-nextjs-app`

---

## GitHub Secrets a Configurar

Como usamos **Workload Identity Federation**, **NO necesitas secrets de GCP** (no hay claves JSON).

Solo necesitas configurar los secrets de tus servicios:

### Secrets de Supabase (Development)

| Secret Name | Descripción |
|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL_DEV` | URL de tu proyecto Supabase DEV |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV` | Anon key de Supabase DEV |
| `DATABASE_URL_DEV` | Connection string de PostgreSQL DEV |
| `SUPABASE_SERVICE_ROLE_KEY_DEV` | Service role key de Supabase DEV |

### Secrets de Supabase (Production)

| Secret Name | Descripción |
|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL_PROD` | URL de tu proyecto Supabase PROD |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD` | Anon key de Supabase PROD |
| `DATABASE_URL_PROD` | Connection string de PostgreSQL PROD |
| `SUPABASE_SERVICE_ROLE_KEY_PROD` | Service role key de Supabase PROD |

### Secrets Compartidos

| Secret Name | Descripción |
|-------------|-------------|
| `GEMINI_API_KEY` | Tu API key de Gemini |
| `POLAR_ACCESS_TOKEN` | Tu token de Polar.sh |
| `UPSTASH_REDIS_REST_URL` | URL de tu Redis en Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Token de Upstash |
| `SENTRY_DSN` | DSN de Sentry |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN público de Sentry |

---

## Subir Código a GitHub

### Paso 1: Crear repositorio en GitHub

1. Ve a https://github.com/organizations/qalia-app/repositories/new
2. Nombre: `qalia-nextjs-app`
3. Privado o Público según prefieras
4. NO inicializar con README (ya tienes código)

### Paso 2: Subir código

```bash
cd /Users/milumon/Documents/Github/qalia-nextjs-app

# Inicializar git si no existe
git init

# Agregar remote
git remote add origin https://github.com/qalia-app/qalia-nextjs-app.git

# Agregar todos los archivos
git add .

# Crear commit inicial
git commit -m "feat: Initial Next.js app with Cloud Run deployment"

# Push a main
git push -u origin main

# Crear branch develop
git checkout -b develop
git push -u origin develop

# Volver a main
git checkout main
```

### Paso 3: Configurar Secrets en GitHub

1. Ve a: https://github.com/qalia-app/qalia-nextjs-app/settings/secrets/actions
2. Click "New repository secret"
3. Agrega cada secret de la lista anterior

---

## Verificar Deployment

### Primera vez (manual test)

Después de configurar los secrets y hacer push:

1. Ve a GitHub → Actions
2. Verás el workflow ejecutándose
3. Una vez completado, obtendrás las URLs:
   - **Development**: `https://qalia-dev-XXXXX.run.app` (push a `develop`)
   - **Production**: `https://qalia-XXXXX.run.app` (push a `main`)

### Probar PWA en móvil

1. Abre la URL de Development en tu teléfono
2. En Chrome (Android): Aparecerá banner "Agregar a inicio"
3. En Safari (iOS): Compartir → "Agregar a pantalla de inicio"
4. ¡Listo! Tienes una PWA instalada

---

## Arquitectura Final

```
┌─────────────────┐     push to develop     ┌─────────────────┐
│   Developer     │ ───────────────────────▶│  GitHub Actions │
│   (local)       │                         │  (deploy-dev)   │
└─────────────────┘                         └────────┬────────┘
                                                     │
                                                     ▼ WIF Auth
                                            ┌─────────────────┐
                                            │  Cloud Run      │
                                            │  (qalia-dev)    │
                                            └─────────────────┘

┌─────────────────┐     push to main        ┌─────────────────┐
│   Developer     │ ───────────────────────▶│  GitHub Actions │
│   (local)       │                         │  (deploy-prod)  │
└─────────────────┘                         └────────┬────────┘
                                                     │
                                                     ▼ WIF Auth
                                            ┌─────────────────┐
                                            │  Cloud Run      │
                                            │  (qalia-prod)   │
                                            └─────────────────┘
```

---

## Troubleshooting

### Error: Permission denied
Verifica que el repositorio GitHub sea exactamente `qalia-app/qalia-nextjs-app`

### Error: Workload Identity Pool not found
Espera 5 minutos después de crear el pool (puede tardar en propagarse)

### Error: Docker build failed
Revisa los logs del workflow en GitHub Actions → click en el step fallido
