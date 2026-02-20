# Configuração do Vercel Blob Storage

Este projeto usa **Vercel Blob Storage** para armazenar as imagens dos avatares dos pets, já que o sistema de arquivos do Vercel é somente leitura.

## Passos para configurar:

### 1. Instalar dependências

```bash
npm install
# ou
yarn install
```

### 2. Configurar no Vercel

1. Acesse o dashboard do Vercel: https://vercel.com/dashboard
2. Vá para o seu projeto
3. Vá em **Settings** → **Storage**
4. Clique em **Create Database** e selecione **Blob**
5. Isso criará automaticamente a variável de ambiente `BLOB_READ_WRITE_TOKEN`

### 3. Variável de ambiente

O Vercel Blob Storage requer a variável de ambiente `BLOB_READ_WRITE_TOKEN` que é configurada automaticamente quando você cria o Blob Storage no dashboard do Vercel.

**Para desenvolvimento local**, você pode:

1. Criar um Blob Storage no Vercel (mesmo que não esteja deployado ainda)
2. Copiar o token do dashboard
3. Criar um arquivo `.env.local` na raiz do projeto `pet/`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

### 4. Como funciona

- Quando um usuário faz upload de uma imagem em `/pet/cenas`, ela é enviada para o Vercel Blob Storage
- A URL completa da imagem (ex: `https://xxx.public.blob.vercel-storage.com/avatars/avatar-1234567890.png`) é salva no campo `appearance` do pet no banco de dados
- A imagem é servida diretamente do Vercel Blob Storage, que é otimizado e rápido

### 5. Fallback para desenvolvimento local

Se você quiser testar localmente sem configurar o Blob Storage, pode modificar temporariamente o código para salvar em `public/avatars/`, mas isso não funcionará no Vercel em produção.

## Notas importantes:

- ✅ As imagens são públicas e acessíveis via URL
- ✅ O Vercel Blob Storage tem um plano gratuito generoso
- ✅ As imagens são otimizadas automaticamente pelo Vercel
- ✅ Não há necessidade de configurar CORS ou outras configurações complexas
