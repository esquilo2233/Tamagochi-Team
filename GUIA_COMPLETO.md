# 🐾 Tamagochi Team - Guia Completo da Plataforma

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Página Inicial](#-página-inicial)
3. [O Nosso Pet](#-o-nosso-pet)
4. [Sistema de Companhia](#-sistema-de-companhia)
5. [Team Building (Multijogador)](#-team-building-multijogador)
6. [Loja](#-loja)
7. [Inventário](#-inventário)
8. [Pessoas e Classificação](#-pessoas-e-classificação)
9. [Configurações](#-configurações)
10. [Avisos Importantes](#-avisos-importantes)
11. [Resolução de Problemas](#-resolução-de-problemas)

---

## 🌐 Visão Geral

A plataforma **Tamagochi Team** é um sistema interativo que combina:
- 🐾 **Pet Virtual** - Um tamagochi que evolui com a equipa
- 👥 **Sistema de Equipa** - Regista membros e acompanha contribuições
- 🎮 **Jogos Multijogador** - Compete em tempo real com a equipa
- 🏆 **Classificação e Recompensas** - Ganha moedas e sobe na liderança

### 🔑 Conceitos Principais

| Conceito | Descrição |
|----------|-----------|
| **Pet** | Tamagochi virtual da equipa com estatísticas (fome, energia, felicidade, etc.) |
| **Pessoas** | Membros da equipa registados com código único |
| **Moedas** | Moeda virtual para comprar itens na loja |
| **Sessão** | Período de atividade de uma pessoa (companhia ou trabalho) |
| **Team Play** | Sala de jogos multijogador em tempo real |

---

## 🏠 Página Inicial (`/`)

### O Que Encontras
- **Top Time** - Classificação das pessoas que passaram mais tempo com o pet
- **Top Pessoas** - Classificação geral de contribuições
- **Acesso Rápido** - Links para todas as secções

### Como Usar
1. Acede a `/`
2. Vê as classificações atuais
3. Navega para outras secções pelo menu

---

## 🐾 O Nosso Pet (`/pet/cenas`)

### Estatísticas do Pet
O pet tem 5 estatísticas principais:

| Estatística | Descrição | Como Melhorar |
|-------------|-----------|---------------|
| **Fome** | Nível de saciedade | Alimentar o pet |
| **Energia** | Nível de energia | Deixar descansar |
| **Felicidade** | Nível de felicidade | Brincar, jogar |
| **Higiene** | Nível de limpeza | Limpar o pet |
| **Vida** | Saúde geral | Manter estatísticas equilibradas |

### Ações Disponíveis

#### 🍖 Alimentar
- Usa comida do inventário
- Reduz fome, aumenta vida
- Cada item tem efeito diferente

#### 🧹 Limpar
- Remove sujidade acumulada
- Aumenta higiene
- Necessário periodicamente

#### 🎮 Brincar
- Aumenta felicidade
- Pode gastar energia
- Interação rápida

#### 😴 Dormir
- Recupera energia
- Pet fica indisponível durante o sono
- Necessário após uso intenso

### Configurações do Pet

#### Decay (Decaimento)
- Define quanto tempo cada estatística demora a cair
- Configurável por admin/gestor
- Padrão: cai gradualmente ao longo do tempo

#### Recompensas
- Configura moedas ganhas por:
  - Vitórias em jogos
  - Sessões de companhia
  - Sessões de trabalho

#### Reset de Estatísticas
- Admins podem resetar as estatísticas do pet
- Útil para recomeçar ou corrigir problemas

---

## 👥 Sistema de Companhia

### O Que É
Um sistema que permite aos membros da equipa "acompanhar" o pet e ganhar moedas pelo tempo passado.

### Como Funciona

#### 1. Registar Pessoa
- Na homepage no campo superior direito
- Clica em **"Registar"**
- Indica nome
- **Guarda o código gerado** (ex: `ABC123`)

#### 2. Iniciar Sessão
- A pessoa insere o seu código em no campo abaixo dos status
- Clica no botão de iniciar sessão

#### 3. Ganhar Moedas
- Moedas são atribuídas automaticamente
- Baseado no tempo de sessão

#### 4. Terminar Companhia
- Clica em **"Terminar Companhia"**
- Moedas são creditadas
- Tempo total é atualizado

### Vantagens
- ✅ Ganha moedas passivamente
- ✅ Contribui para a classificação
- ✅ Ajuda o pet a manter estatísticas

---

## 🎮 Team Building (Multijogador) (`/team-play`)

### Visão Geral
Sistema de jogos multijogador em tempo real para a equipa competir.

### Jogos Disponíveis

#### ⭕ Jogo do Galo
- Tabuleiro 3x3
- Objetivo: 3 em linha
- X começa primeiro

#### ♞ Xadrez
- Tabuleiro 8x8 completo
- Movimentos válidos destacados
- Deteta xeque automaticamente

#### 🔴 4 em Linha
- Tabuleiro 7x6
- Objetivo: 4 em linha
- Clica na coluna para jogar

### Como Jogar

#### Criar Sala
1. Indica o teu nome (ou usa o automático)
2. Escolhe o jogo
3. Clica em **"Criar sala e gerar link"**
4. Copia e partilha o link/código

#### Entrar numa Sala
1. **Opção A:** Cola o código no campo
2. **Opção B:** Clica no link direto
3. **Opção C:** Clica em "Entrar" na lista de salas abertas
4. Clica em **"Entrar por código"**

#### Durante o Jogo
- **Teu turno:** Faz a jogada
- **Turno do adversário:** Aguarda
- **Fim de jogo:** Pede desforra ou volta ao lobby

### Funcionalidades

#### 🔄 Sincronização em Tempo Real
- Usa **SSE (Server-Sent Events)**
- Atualização em milissegundos
- Não precisa de refresh (na maioria dos casos)

#### 🏠 Banner de Jogo em Curso
- Aparece se já estás num jogo
- Mostra estado do jogo
- Botão "Ver Jogo" para acesso rápido

#### 📋 Lista de Salas Abertas
- Visível sempre
- Atualiza a cada 3 segundos
- Botão "Entrar" para join rápido
- Botão "✕" para fechar (apenas host/admin/gestor)

#### 🎯 Desforra (Rematch)
- Após jogo terminar, pede desforra
- Ambos devem aceitar
- Cores alternadas para fairness

#### 💾 Persistência
- Salas guardadas na base de dados
- Sessão local restaurada ao recarregar
- Vinculado ao utilizador (se autenticado)

### ⚠️ Aviso de Sincronização

**IMPORTANTE:** A sincronização automática pode falhar ocasionalmente.

**Sintomas:**
- Jogada do adversário não aparece
- Jogo parece "congelado"
- Desforra não inicia

**Solução:**
```
🔃 Dá F5 (recarrega a página)
```

✅ **A sessão é restaurada automaticamente!**

---

## 🛍️ Loja (`/shop`)

### O Que Comprar

#### Comida
- **Ração Básica** - Barata, efeito pequeno
- **Petiscos** - Preço médio, efeito médio
- **Comida Premium** - Cara, efeito grande

#### Itens Especiais
- **Medicamentos** - Recuperam vida
- **Vitaminas** - Boost temporário de estatísticas

### Como Comprar
1. Vai a `/shop`
2. Escolhe o item
3. Vê o preço em moedas
4. Clica em **"Comprar"**
5. Item vai para o inventário

### Dicas
- 🎯 Foca em itens com melhor custo-benefício
- 📦 Verifica inventário antes de comprar mais

---

## 🎒 Inventário

### O Que Encontras
- **Comida** - Para alimentar o pet
- **Itens de Uso** - Medicamentos, vitaminas
- **Cosméticos** - Acessórios (ainda não disponivel)

### Como Usar

#### Alimentar Pet
1. Clica em **"Alimentar"**
2. Escolhe item do inventário
3. Confirma uso

#### Gerir Inventário
- Ver quantidade de cada item
- Ver efeitos de cada item
- (Admin) Criar/editar/remover itens

### Para Admins/Gestores

#### Criar Item
1. Vai a `/items`
2. Preenche:
   - Nome
   - Tipo (comida, item, cosmético)
   - Preço
   - Efeito (JSON)
3. Clica em **"Guardar"**

#### Editar Item
1. Clica no item
2. Altera campos
3. Guarda alterações

#### Remover Item
1. Clica em **"Eliminar"**
2. Confirma remoção

---

## 👥 Pessoas e Classificação (`/people`)

### Classificação de Pessoas
- **Top Time** - Mais tempo em sessões de companhia
- **Top Coins** - Mais moedas acumuladas
- **Top Jogos** - Mais vitórias em jogos(ainda não implementado)

### Gerir Pessoas (Admin/Gestor)

#### Ver Lista
- Todas as pessoas registadas
- Código, nome, função
- Moedas e tempo total

#### Criar Pessoa
1. Clica em **"Registar Pessoa"**
2. Indica nome
3. Função (opcional)
4. Código gerado automaticamente

#### Editar Pessoa
1. Clica na pessoa
2. Altera nome/função
3. Guarda

#### Remover Pessoa
1. Clica em **"Eliminar"**
2. Confirma
3. ⚠️ **Ação irreversível!**

### Códigos de Pessoa
- **6 caracteres** alfanuméricos
- **Únicos** por pessoa
- **Usa para login** em `/companion`

---

## ⚙️ Configurações (`/pet/cenas`)

### Decay (Decaimento)

Configura quanto tempo cada estatística demora a cair:

| Estatística | Slider | Efeito |
|-------------|--------|--------|
| Fome | 0-100% | Velocidade de cair fome |
| Energia | 0-100% | Velocidade de cansar |
| Felicidade | 0-100% | Velocidade de ficar triste |
| Higiene | 0-100% | Velocidade de sujar |
| Vida | 0-100% | Velocidade de perder vida |

### Recompensas

Configura moedas ganhas:

| Ação | Campo | Valor |
|------|-------|-------|
| Vitória Jogo do Galo | `tictactoeWinCoins` | Ex: 50 |
| Derrota Jogo do Galo | `tictactoeLoseCoins` | Ex: 10 |
| Vitória Xadrez | `chessWinCoins` | Ex: 100 |
| Derrota Xadrez | `chessLoseCoins` | Ex: 20 |
| Vitória 4 em Linha | `connect4WinCoins` | Ex: 75 |
| Derrota 4 em Linha | `connect4LoseCoins` | Ex: 15 |
| Sessão Companhia (min) | `companionCoinsPerMinute` | Ex: 1 |
| Sessão Trabalho (min) | `workCoinsPerMinute` | Ex: 2 |

### Reset de Estatísticas
- **Botão:** "Resetar Estatísticas do Pet"
- **Efeito:** Todas as estatísticas voltam a 100
- **Permissão:** Apenas Admin/Gestor
- **⚠️ Cuidado:** Ação irreversível!

---

## ⚠️ Avisos Importantes

### 🔄 Sincronização (Team Play)

O sistema usa **SSE (Server-Sent Events)** para sincronização em tempo real.

**Pode falhar quando:**
- Conexão de rede instável
- Navegador em segundo plano por muito tempo
- Servidor sobrecarregado

**Sintomas:**
- Jogada não aparece
- Jogo congelado
- Desforra não inicia

**Solução:**
```
🔃 Dá F5 (recarrega a página)
```

✅ **A sessão é restaurada automaticamente!**

### 💾 Dados e Persistência

| Dado | Onde é Guardado | Duração |
|------|-----------------|---------|
| Sessão Pessoa | Cookie `person_session` | 7 dias |
| Sessão Team Play | LocalStorage | Indefinido |
| Salas | Base de Dados | Indefinido |
| Estatísticas Pet | Base de Dados | Indefinido |
| Inventário | Base de Dados | Indefinido |

### 🔐 Permissões

| Ação | Utilizador | Admin/Gestor |
|------|------------|--------------|
| Jogar | ✅ | ✅ |
| Criar Sala | ✅ | ✅ |
| Fechar Sala (sua) | ✅ | ✅ |
| Fechar Sala (outra) | ❌ | ✅ |
| Gerir Pessoas | ❌ | ✅ |
| Gerir Itens | ❌ | ✅ |
| Configurações | ❌ | ✅ |
| Reset Estatísticas | ❌ | ✅ |

---

## 🛠️ Resolução de Problemas

### Problemas Comuns

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| **"Sala não encontrada"** | Código errado ou expirado | Verifica código (6 caracteres, maiúsculas) |
| **"Sala cheia"** | Já há 2 jogadores | Cria nova sala ou espera vaga |
| **"Não é a tua vez"** | Turno do adversário | Aguarda, não é erro |
| **Jogo não atualiza** | SSE desligado | **Dá F5** |
| **Nome não aparece** | Sem sessão ativa | Indica nome manualmente |
| **Não consigo entrar** | Já estás noutro jogo | Sai do jogo atual primeiro |
| **Moedas não atualizam** | Cache do navegador | F5 ou limpa cache |
| **Pet não responde** | Servidor ocupado | Aguarda alguns segundos |

### Passos de Debug

1. **Verifica conexão** - Tens internet?
2. **Abre consola** (F12) - Vês erros?
3. **Tenta F5** - Resolve 90% dos problemas
4. **Limpa cache** - Ctrl+Shift+Delete
5. **Reporta** - Equipa de desenvolvimento

---

## 📱 Dicas de Utilização

### Para Todos
1. ✅ **Regista-te** - Usa código de pessoa para ganhar moedas
2. ✅ **Mantém o pet feliz** - Estatísticas equilibradas = pet saudável
3. ✅ **Joga regularmente** - Ganha moedas e sobe na classificação
4. ✅ **Partilha salas** - Mais diversão com a equipa
5. ✅ **Guarda códigos** - Podes precisar para voltar

### Para Admins/Gestores
1. 📊 **Monitoriza estatísticas** - Ajusta decay se necessário
2. 💰 **Balanceia recompensas** - Nem muito alto, nem muito baixo
3. 🎮 **Cria torneios** - Usa team play para eventos
4. 📝 **Mantém itens atualizados** - Adiciona variedade
5. 🔧 **Testa mudanças** - Verifica impacto antes de commit

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 + React |
| Backend | Next.js API Routes |
| Base de Dados | PostgreSQL |
| ORM | Prisma |
| Sincronização | SSE (Server-Sent Events) |
| Cache | LocalStorage + Memory Cache |
| Sessão | Cookies HTTP + LocalStorage |

### Estrutura da Base de Dados

```
Pets
├── Estatísticas (fome, energia, felicidade, higiene, vida)
├── Inventário
└── Sessões de Trabalho

Pessoas
├── Código (único)
├── Nome
├── Função
├── Moedas
└── Sessões de Companhia

TeamPlayRooms
├── ID da Sala
├── Jogo
├── Jogadores
├── Estado
└── Host (personId)

Itens
├── Nome
├── Tipo
├── Preço
└── Efeito
```

---

## 📞 Suporte e Contribuição

### Reportar Erros
1. Descreve o problema
2. Inclui passos para reproduzir
3. Adiciona captura de ecrã (se possível)
4. Envia à equipa de desenvolvimento

### Sugestões
1. Descreve a funcionalidade
2. Explica o benefício
3. Partilha com a equipa

### Desenvolvimento
- Código em: `C:\Users\andre\OneDrive\Documentos\GitHub\Tamagochi-Team`
- Branch principal: `main`
- Commits descritivos
- Testa antes de push

---

## 📄 Licença e Créditos

**Projeto:** Pet Samurai 
**Equipa:** [Samurai Team]  
**Ano:** 2026  

---
