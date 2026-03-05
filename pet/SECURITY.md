# 🔒 Segurança Implementada

## Proteções Adicionadas

### 1. **Registro de Usuários (`/api/register`)**
✅ **Sanitização de inputs**
- Remove caracteres especiais perigosos: `<>\"';%()&+$`
- Limite de 50 caracteres
- Apenas letras, números, espaços, hífens e underscores

✅ **Prevenção de auto-promoção**
- Role é **sempre** definida como `"user"` pelo backend
- Input do usuário para `role` é **ignorado**
- Impossível registrar-se como admin/gestor

### 2. **Sessão (`/api/session`)**
✅ **Cookies encriptados (AES-256-GCM)**
- Dados da sessão encriptados antes de guardar
- Formato: `salt:iv:authTag:encryptedData`
- Chave derivada com scrypt

✅ **Validação de código**
- Apenas caracteres alfanuméricos (A-Z, 0-9)
- Exatamente 6 caracteres
- Sanitização antes de consultar DB

✅ **Prevenção de timing attacks**
- Delay aleatório (100-300ms) quando código não existe
- Previne enumeração de códigos válidos

### 3. **Loja (`/api/shop`)**
✅ **Validação de parâmetros**
- IDs devem ser números positivos
- Verifica existência da pessoa antes de comprar
- Mensagens de erro genéricas (não expõem detalhes internos)

✅ **Proteção SQL Injection**
- Prisma ORM com parameterized queries
- Validação de tipos rigorosa

### 4. **Jogos (`/api/games`)**
✅ **Anti-cheat de scores** (SEM TIMERS)
- Limites máximos de score por jogo:
  - Click Rush: máx 100
  - Tic-Tac-Toe, Chess, Connect4: máx 1 (vitória/derrota)
- Scores negativos são rejeitados
- Validação de outcomes (win/lose/draw)
- **Sem rate limiting** - jogadores podem jogar à vontade

✅ **Validação de jogos permitidos**
- Apenas jogos na whitelist: `clickrush`, `tictactoe`, `chess`, `connect4`
- Jogos desconhecidos são rejeitados

✅ **Limite de ganho de moedas**
- Ganho máximo limitado ao maior prêmio configurado
- Previne exploração de bugs na lógica de premiação

### 5. **Base de Dados**
✅ **Prisma ORM**
- Parameterized queries por padrão
- Previne SQL injection

✅ **Validação de tipos**
- TypeScript com tipos estritos
- Validação de inputs em todas as APIs

### 6. **LocalStorage Encriptado**
✅ **Frontend (`lib/encryptedStorage.ts`)**
- XOR cipher com chave derivada
- Base64 encoding para segurança adicional
- Funções: `setEncryptedItem`, `getEncryptedItem`, `removeEncryptedItem`

✅ **PetStatus**
- Estado do pet guardado de forma encriptada
- Chave: `samurai_state`

### 7. **Cookies Encriptados**
✅ **Session API**
- AES-256-GCM encryption
- Salt + IV aleatórios por sessão
- Auth tag para integridade

## Boas Práticas

### Cookies
- `httpOnly: true` - Previne acesso via JavaScript
- `secure: true` (produção) - Apenas HTTPS
- `sameSite: lax` - Previne CSRF
- **Encriptados** com AES-256-GCM

### LocalStorage
- **Encriptado** com XOR cipher + Base64
- Ofuscação contra leitura casual
- Migração automática de dados não encriptados

### Erros
- Mensagens genéricas para usuários
- Logs detalhados apenas no servidor
- Não expõe estrutura interna do sistema

### Inputs
- Sanitização em todas as entradas
- Validação de tipos e formatos
- Limites de tamanho

## O Que Foi Corrigido

### Vulnerabilidades Previstas
1. ❌ **Auto-promoção para admin** → Agora impossível
2. ❌ **SQL injection** → Previnido com Prisma
3. ❌ **Spam de compras** → Validação rigorosa
4. ❌ **Cheating em jogos** → Validação de scores máximos
5. ❌ **Timing attacks** → Delay aleatório
6. ❌ **LocalStorage legível** → Agora encriptado
7. ❌ **Cookies legíveis** → Agora encriptados (AES-256-GCM)

## Comandos Úteis

### Ver logs de atividades suspeitas
```javascript
// No console do servidor, scores inválidos são logados:
"Score inválido detectado: {game} - score: {score} - personId: {personId}"
```

### Gerar nova chave de encriptação (produção)
```bash
# Gerar chave aleatória de 32 bytes
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Guardar como ENCRYPTION_KEY no .env
```

## Variáveis de Ambiente (Produção)

```env
# Chave de encriptação para cookies e sessões
# Gerar com: openssl rand -hex 32
ENCRYPTION_KEY=sua-chave-secreta-aqui

# HTTPS obrigatório em produção
NODE_ENV=production
```

## Notas Importantes

### Sem Timers nos Jogos
- ✅ **Jogos liberados** - sem rate limiting
- ✅ **Anti-cheat mantido** - validação de scores
- ✅ **Sem espera** - jogar à vontade

### Encriptação
- Cookies: **AES-256-GCM** (forte)
- LocalStorage: **XOR + Base64** (ofuscação)
- Chave: Guardar em `ENCRYPTION_KEY` no `.env`

### Para Produção
1. **Mudar ENCRYPTION_KEY** no `.env`
2. **HTTPS obrigatório**
3. **Monitorar logs** de scores inválidos
