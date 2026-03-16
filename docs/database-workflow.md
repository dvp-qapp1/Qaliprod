# Flujo de Trabajo de Base de Datos (Supabase)

Este documento describe cómo manejar las migraciones de base de datos en Qalia de forma segura y automatizada.

## 1. Trabajo Local (Desarrollo)

Para trabajar localmente, asegúrate de tener Docker instalado y ejecutando.

### Iniciar base de datos local
```bash
supabase start
```

### Resetear base de datos local
Esto borrará los datos y aplicará todas las migraciones desde cero.
```bash
bun run db:reset
```

### Crear una nueva migración
Cuando hagas cambios en el esquema local, genera un nuevo archivo de migración:
```bash
bun run db:migration:new nombre_descriptivo
```
Esto creará un archivo en `supabase/migrations/<timestamp>_nombre_descriptivo.sql`.

---

## 2. Despliegue Manual (Ayuda)

Si necesitas subir cambios manualmente sin esperar al CI/CD:

### Producción
```bash
bun run db:push:prod   # Sube migraciones usando la DATABASE_URL configurada
```

### Desarrollo (Remoto)
```bash
bun run db:push:dev
```

---

## 3. Automatización (CI/CD)

Las migraciones se aplican **automáticamente** mediante GitHub Actions en cada despliegue.

### Configuración de GitHub Secrets
Para que esto funcione, el repositorio debe tener configurados los siguientes Secrets:

| Secret | Descripción |
| :--- | :--- |
| `DATABASE_URL_PROD` | URL del Connection Pooler de Producion (Puerto 6543) |
| `DATABASE_URL_DEV` | URL del Connection Pooler de Desarrollo (Puerto 6543) |

**Flujo:**
1. Haces push a `main`.
2. GitHub Actions detecta el cambio.
3. Ejecuta `supabase db push` antes de actualizar el código en Cloud Run.
4. Si la migración falla, el despliegue se cancela.

---

## 4. Resolución de Problemas

### Error: "Remote database is out of sync"
Si alguien más subió una migración a la base de datos remota pero tú no la tienes localmente:
```bash
supabase migration list --remote
```
Y ajusta tus archivos locales según sea necesario.
