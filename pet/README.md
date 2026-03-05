# Pet - Tamagotchi Team

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

### 🐛 Bug Reports

O sistema possui uma página para reportar bugs encontrados no sistema.

**Acessar:** `/bug-report`

**Funcionalidades:**
- Formulário para reportar bugs com título, descrição e severidade
- Upload de imagens e vídeos (até 10MB)
- Campos opcionais para nome e e-mail do reporter

**API:**
- `POST /api/bug-reports` - Criar um novo bug report
- `GET /api/bug-reports` - Listar todos os bugs reportados
- `PATCH /api/bug-reports/:id` - Atualizar status de um bug
- `DELETE /api/bug-reports/:id` - Deletar um bug report (elimina ficheiros associados)

**Admin:** `/bug-reports-admin` - Página para gerenciar bugs reportados
- **Protegido por senha:** `admin123`
- Visualizar lista de bugs com filtros por status e severidade
- Ver detalhes completos incluindo ficheiros anexados
- Alterar status dos bugs
- Eliminar bugs (com confirmação e eliminação de ficheiros associados)

### 🔐 Autenticação Admin

**Página de Login:** `/login`

A área administrativa é protegida por autenticação simples.
- **Senha padrão:** `admin123`
- A autenticação é guardada no localStorage
- Botão de logout disponível no painel admin

### 📋 System Logs

O sistema regista logs de eventos importantes no banco de dados.

**Acessar:** `/system-logs`

**API:**
- `POST /api/logs` - Criar um novo log
- `GET /api/logs` - Listar logs (suporta filtros por `level`, `source` e `limit`)

**Uso no código:**

```typescript
import { logger } from "@/lib/logger";

// Registrar logs
await logger.info("Usuário logado", { source: "auth", context: { userId: 123 } });
await logger.error("Erro ao processar pagamento", { source: "payment" });
await logger.warning("Tentativa de login falhou", { source: "auth" });
await logger.debug("Dados recebidos", { source: "api" });
```

## Database

### Migration

Para aplicar as migrations no banco de dados:

```bash
npx prisma migrate dev
```

### Gerar Prisma Client

```bash
npx prisma generate
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
