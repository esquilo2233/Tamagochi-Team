# Como resolver o erro de build

Se você está vendo o erro:
```
Type error: Property 'companionSession' does not exist on type 'PrismaClient'
```

## Solução:

1. **Regenerar o Prisma Client:**
   ```bash
   cd pet
   npx prisma generate
   ```

2. **Limpar o cache do Next.js:**
   ```bash
   rm -rf .next
   # ou no Windows PowerShell:
   Remove-Item -Recurse -Force .next
   ```

3. **Reiniciar o servidor TypeScript:**
   - Feche e reabra o VS Code/Cursor
   - Ou reinicie o servidor TypeScript: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

4. **Executar a migração do banco de dados:**
   ```bash
   npx prisma migrate dev --name add_companion_system
   ```

5. **Tentar build novamente:**
   ```bash
   npm run build
   ```

## Nota importante:

O schema foi atualizado com:
- Campo `code` (único) no modelo `Person`
- Novo modelo `CompanionSession`

Certifique-se de executar a migração antes de fazer deploy para produção!
