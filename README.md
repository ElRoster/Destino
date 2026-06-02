# Destino

Monorepo de la plataforma Destino. Incluye backend, frontend web, aplicacion movil y paquetes compartidos.

## Estructura

```text
apps/
  backend/   API NestJS con Prisma
  web/       Frontend React + Vite
  mobile/    App Expo + React Native
packages/
  shared-types/
  shared-utils/
  ui/
```

## Tecnologias

- Node.js 18 o superior.
- npm workspaces.
- NestJS 10 para el backend.
- Prisma 5 como ORM.
- PostgreSQL 15.
- Redis 7.
- React 18, Vite, Tailwind CSS y Zustand para web.
- Expo 50 y React Native para mobile.
- Socket.IO para comunicacion en tiempo real.
- JWT para autenticacion.
- Docker Compose para servicios locales.

> Nota: actualmente `.nvmrc` indica `v16.14.0`, pero el `package.json` raiz exige Node `>=18.0.0` y los Dockerfiles usan Node 18. Para evitar errores, usar Node 18 y actualizar `.nvmrc` cuando sea posible.

## Instalacion

Desde la raiz del proyecto:

```bash
npm install
```

## Variables de entorno

Hay un `.env.example` en la raiz y otro en `apps/backend/.env.example`.

Para desarrollo local:

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
```

Variables importantes:

```env
PORT=4020
NODE_ENV=development
API_URL="http://localhost:4020"
CLIENT_URL="http://localhost:5173"
VITE_API_BASE_URL="http://localhost:4020"

DATABASE_URL="postgresql://tarot_user:tarot_secure_password@localhost:5432/tarot_db?schema=public"

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET="change_me_access_secret"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_SECRET="change_me_refresh_secret"
JWT_REFRESH_EXPIRATION="7d"

THROTTLE_TTL=60
THROTTLE_LIMIT=100

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Destino <no-reply@destino.local>"
SMTP_HELO=localhost
```

No subir secretos reales al repositorio.

## Servicios locales

Levantar PostgreSQL y Redis:

```bash
npm run docker:up
```

Bajar servicios:

```bash
npm run docker:down
```

El `docker-compose.yml` expone:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Backend

Levantar backend en modo desarrollo:

```bash
npm run backend:dev
```

Build del backend:

```bash
npm run backend:build
```

Comandos equivalentes desde el workspace:

```bash
npm run start:dev -w @tarot-platform/backend
npm run build -w @tarot-platform/backend
```

La API usa por defecto el puerto `4020`.

## Migraciones Prisma

Las migraciones estan en:

```text
apps/backend/prisma/migrations
```

Generar cliente Prisma:

```bash
npm run prisma:generate -w @tarot-platform/backend
```

Ejecutar migraciones en desarrollo:

```bash
npm run prisma:migrate -w @tarot-platform/backend
```

Comando directo equivalente:

```bash
npx prisma migrate dev --schema apps/backend/prisma/schema.prisma
```

Aplicar migraciones en ambientes productivos o CI/CD:

```bash
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
```

Ver estado de migraciones:

```bash
npx prisma migrate status --schema apps/backend/prisma/schema.prisma
```

Abrir Prisma Studio:

```bash
npx prisma studio --schema apps/backend/prisma/schema.prisma
```

Ejecutar seed:

```bash
npx prisma db seed
```

> Importante: el script `prisma:seed` del backend tiene un typo (`prisma/,seed.ts`). Usar `npx prisma db seed` o corregirlo a `ts-node prisma/seed.ts`.

## Web

Levantar frontend web:

```bash
npm run web:dev
```

Build web:

```bash
npm run web:build
```

Preview del build:

```bash
npm run web:preview
```

La web corre por defecto en:

```text
http://localhost:5173
```

## Mobile

Levantar Expo:

```bash
npm run mobile:start
```

Android:

```bash
npm run android -w @tarot-platform/mobile
```

iOS:

```bash
npm run ios -w @tarot-platform/mobile
```

Web:

```bash
npm run web -w @tarot-platform/mobile
```

## Paquetes compartidos

Compilar todos los workspaces que tengan build:

```bash
npm run build
```

Compilar paquetes individuales:

```bash
npm run build -w @tarot-platform/shared-types
npm run build -w @tarot-platform/shared-utils
npm run build -w @tarot-platform/ui
```

## Flujo recomendado para arrancar local

1. Usar Node 18.
2. Instalar dependencias con `npm install`.
3. Copiar y configurar `.env` y `apps/backend/.env`.
4. Levantar servicios con `npm run docker:up`.
5. Generar Prisma Client con `npm run prisma:generate -w @tarot-platform/backend`.
6. Correr migraciones con `npm run prisma:migrate -w @tarot-platform/backend`.
7. Ejecutar seed si aplica con `npx prisma db seed`.
8. Levantar backend con `npm run backend:dev`.
9. Levantar web con `npm run web:dev`.

## Informacion importante

- El backend carga variables desde `apps/backend/.env` y luego desde `.env`.
- CORS permite `CLIENT_URL` y `http://localhost:3000`.
- El backend usa rate limiting global con `THROTTLE_TTL` y `THROTTLE_LIMIT`.
- `VITE_API_BASE_URL` debe apuntar al backend para que la web consuma la API correcta.
- Los nombres internos de paquetes aun usan `@tarot-platform/*`; si el producto ya se llama Destino, conviene renombrarlos en una tarea separada.
- Hay una dependencia sospechosa en el `package.json` raiz: `"18": "^0.0.0"`. Revisarla antes de limpiar dependencias.
