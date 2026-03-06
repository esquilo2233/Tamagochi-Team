/**
 * Traduções pt-pt para todo o site
 */

export const ptPT = {
  // Gerais
  common: {
    loading: "A carregar...",
    error: "Erro",
    success: "Sucesso",
    cancel: "Cancelar",
    confirm: "Confirmar",
    delete: "Eliminar",
    save: "Guardar",
    back: "Voltar",
    close: "Fechar",
    restart: "Reiniciar",
    playAgain: "Jogar Novamente",
  },

  // Homepage / PetStatus
  home: {
    title: "Samurai",
    subtitle: "Cuida do teu Samurai virtual",
    noSession: "Sem sessão",
    login: "Fazer login",
    logout: "Terminar sessão",
  },

  // Stats do Pet
  stats: {
    hunger: "Fome",
    energy: "Energia",
    happiness: "Felicidade",
    hygiene: "Higiene",
    life: "Vida",
    coins: "Moedas",
  },

  // Ações
  actions: {
    feed: "Alimentar",
    sleep: "Dormir",
    play: "Jogar",
    clean: "Limpar",
    work: "Trabalhar",
    companion: "Companhia",
    minigames: "Minijogos",
    shop: "Loja",
    inventory: "Inventário",
  },

  // Loja
  shop: {
    title: "Loja",
    buy: "Comprar",
    purchaseSuccess: "✅ Compra realizada!",
    purchaseError: "❌ Erro na compra",
    insufficientFunds: "Saldo insuficiente",
    yourBalance: "O teu saldo",
    loginToBuy: "Entre com o seu código para comprar",
  },

  // Inventário
  inventory: {
    title: "🎒 Inventário",
    empty: "📦 Inventário vazio.",
    noItemsWithFilters: "🔍 Nenhum item encontrado com estes filtros.",
    useOnSamurai: "Usar no Samurai",
    searchPlaceholder: "🔍 Pesquisar itens...",
    filters: {
      all: "Todos",
      food: "Comida",
      drink: "Bebida",
      medicine: "Remédio",
      hygiene: "Higiene",
      energy: "Energia",
      happiness: "Felicidade",
      special: "Especial",
    },
  },

  // Minijogos
  minigames: {
    title: "Minijogos",
    clickRush: "🎯 Click Rush",
    ticTacToe: "⭕ Jogo do Galo",
    chess: "♟️ Xadrez",
    connect4: "🟡 4 em Linha",
    checkers: "♟️ Damas",
    mahjong: "🀄 Mahjong Solitaire",
    inviteByLink: "🤝 Convidar por link (Team Building)",
    back: "← Voltar",
  },

  // Click Rush
  clickRush: {
    title: "Click Rush",
    timeLeft: "Tempo",
    clicks: "cliques",
    result: "Fizeste {clicks} cliques!",
    coinsEarned: "Ganhaste {coins} moedas!",
    playAgain: "Jogar Novamente",
  },

  // Jogo do Galo
  ticTacToe: {
    title: "Jogo do Galo — Tu vs Samurai",
    difficulty: "Dificuldade",
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    yourTurn: "A tua vez (X)",
    samuraiTurn: "Vez do Samurai...",
    draw: "Empate!",
    youWin: "Ganhaste!",
    samuraiWins: "Samurai venceu!",
  },

  // Xadrez
  chess: {
    title: "Xadrez — Tu vs Samurai",
    difficulty: "Dificuldade",
    yourTurn: "A tua vez",
    samuraiTurn: "Vez do Samurai...",
    check: "Check!",
    checkmate: "Checkmate!",
    draw: "Empate!",
    youWin: "Ganhaste!",
    samuraiWins: "Samurai venceu!",
    playAs: "Jogar como:",
    white: "Brancas",
    black: "Pretas",
  },

  // 4 em Linha
  connect4: {
    title: "🟡 4 em Linha — Tu vs Samurai",
    yourTurn: "A tua vez (vermelho)",
    samuraiTurn: "Vez do Samurai...",
    draw: "Empate!",
    youWin: "Ganhaste!",
    samuraiWins: "Samurai venceu.",
    newGame: "Novo jogo",
  },

  // Damas
  checkers: {
    title: "♟️ Damas — Tu vs Samurai",
    yourTurn: "A tua vez (vermelhas)",
    samuraiTurn: "Vez do Samurai...",
    draw: "Empate!",
    youWin: "🎉 Ganhaste!",
    samuraiWins: "Samurai venceu!",
    mandatoryCapture: "⚠️ Captura obrigatória!",
    rules: "📌 Capturas são obrigatórias • Capturas múltiplas também • Reis movem-se para trás",
    piecesLeft: "peças",
  },

  // Mahjong
  mahjong: {
    title: "🀄 Mahjong Solitaire",
    startGame: "🎮 Iniciar Jogo",
    timeLeft: "⏱️ Tempo",
    moves: "🎯 Jogadas",
    remaining: "🀄 Restantes",
    congratulations: "🎉 Parabéns! Completaste!",
    gameOver: "Fim de jogo!",
    instructions: "💡 Clica num tile livre (sem tiles à esquerda OU direita e sem tiles por cima)",
    startInstructions: "Combina pares de tiles idênticos para limpar o tabuleiro!",
  },

  // Companhia
  companion: {
    title: "Companhia",
    description: "O teu Samurai está a fazer companhia!",
    timeElapsed: "Tempo decorrido",
    coinsEarned: "Moedas ganhas",
    stop: "Parar",
    companionEnded: "🎉 Companhia terminada!",
    minutes: "minutos",
    coinsEarnedMessage: "💰 Moedas ganhas",
  },

  // Bug Report
  bugReport: {
    title: "🐛 Reportar Bug",
    subtitle: "Encontraste um problema? Ajuda-nos a melhorar!",
    success: "✅ Bug reportado com sucesso! Obrigado pela tua contribuição.",
    error: "✗ {error}",
    fields: {
      title: "Título *",
      titlePlaceholder: "Resumo breve do problema",
      description: "Descrição *",
      descriptionPlaceholder: "Descreve o problema em detalhes, incluindo passos para reproduzir...",
      severity: "Severidade",
      severityLow: "Baixa - Problema cosmético",
      severityMedium: "Média - Funcionalidade afetada",
      severityHigh: "Alta - Impacto significativo",
      severityCritical: "Crítica - Sistema indisponível",
      reporter: "Teu Nome",
      reporterPlaceholder: "Opcional",
      email: "E-mail",
      emailPlaceholder: "Opcional",
      attachments: "📎 Anexos (Imagens/Vídeos)",
      selectFiles: "Clique para selecionar ficheiros",
      fileTypes: "Imagens (JPEG, PNG, GIF, WebP) e Vídeos (MP4, WebM, MOV) - Máx 10MB",
      uploading: "📤 A fazer upload...",
      sending: "⏳ Enviando...",
      send: "🚀 Enviar Report",
    },
  },

  // Bug Reports Admin
  bugReportsAdmin: {
    title: "🐛 Bugs Reportados",
    found: "bug(s) encontrado(s)",
    refresh: "🔄 Atualizar",
    logout: "🚪 Sair",
    filters: {
      status: "Status",
      severity: "Severidade",
      all: "Todos",
      open: "Aberto",
      inProgress: "Em Progresso",
      resolved: "Resolvido",
      closed: "Fechado",
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      critical: "Crítica",
    },
    table: {
      title: "Título",
      severity: "Severidade",
      status: "Status",
      reporter: "Reporter",
      files: "Ficheiros",
      date: "Data",
      actions: "Ações",
      anonymous: "Anónimo",
      attachments: "📎 {count}",
    },
    details: {
      description: "Descrição",
      severity: "Severidade",
      status: "Status",
      reporter: "Reporter",
      email: "E-mail",
      url: "URL",
      filesAttached: "Ficheiros Anexados",
      createdAt: "Criado em",
      updatedAt: "Atualizado em",
      openFile: "Abrir →",
    },
    delete: {
      confirmTitle: "🗑️ Confirmar Eliminação",
      confirmMessage: "Tens a certeza que queres eliminar este bug report? Todos os ficheiros associados serão também eliminados.",
      cancel: "Cancelar",
      delete: "Eliminar",
      deleting: "Eliminando...",
    },
    reportBug: "🐛 Reportar Bug",
    back: "← Voltar",
  },

  // System Logs
  systemLogs: {
    title: "📋 Logs do Sistema",
    found: "log(s) registrado(s)",
    refresh: "🔄 Atualizar",
    filters: {
      level: "Nível",
      source: "Fonte",
      all: "Todos",
    },
    levels: {
      debug: "Debug",
      info: "Info",
      warning: "Warning",
      error: "Error",
    },
    viewContext: "Ver contexto ({count} campos)",
    noLogs: "Nenhum log encontrado.",
    loading: "A carregar logs...",
  },

  // Admin / Cenas
  admin: {
    title: "Cenas / Gestão",
    subtitle: "Menu rápido para mexer em pessoas, itens da loja e avatar do Samurai.",
    backToSamurai: "← Voltar ao Samurai",
    sections: {
      people: "👥 Pessoas",
      items: "🎒 Gestão de Itens",
      bugReports: "🐛 Gestão de Bugs",
      avatar: "🖼️ Avatar",
    },
    permissions: {
      denied: "Sem permissão para aceder ao painel Cenas. Apenas pessoas com role admin ou gestor podem entrar.",
    },
  },

  // People Management
  people: {
    title: "Gestão de Pessoas",
    add: "Adicionar Pessoa",
    edit: "Editar Pessoa",
    delete: "Eliminar",
    deleteConfirm: "Tens a certeza?",
    fields: {
      name: "Nome",
      role: "Função",
      code: "Código",
      coins: "Moedas",
      totalTime: "Tempo Total",
    },
    roles: {
      user: "Utilizador",
      admin: "Admin",
      gestor: "Gestor",
    },
    errors: {
      nameRequired: "Nome é obrigatório",
      nameEmpty: "Nome não pode ser vazio",
      nameExists: "Já existe uma pessoa com o nome \"{name}\". Escolhe outro nome.",
    },
    accessDenied: "⚠️ Acesso Negado. Sem permissão para aceder à página de pessoas. Apenas admin e gestor.",
    loginTip: "💡 Dica: Precisas de fazer login primeiro na página principal.",
    yourRole: "A tua role atual: {role}",
    backToAdmin: "← Voltar ao Admin",
    back: "← Voltar",
    home: "🏠 Página Principal",
    adminPanel: "🎛️ Painel Admin",
  },

  // Items Management
  items: {
    title: "Gestão de Itens",
    add: "Adicionar Item",
    edit: "Editar Item",
    delete: "Eliminar",
    save: "Guardar",
    cancel: "Cancelar",
    fields: {
      name: "Nome",
      type: "Tipo",
      price: "Preço (moedas)",
      effects: "Efeitos",
    },
    types: {
      food: "Comida",
      drink: "Bebida",
      medicine: "Remédio",
      hygiene: "Higiene",
      energy: "Energia",
      happiness: "Felicidade",
      special: "Especial",
    },
    effects: {
      hunger: "Fome",
      energy: "Energia",
      happiness: "Felicidade",
      hygiene: "Higiene",
      life: "Vida",
    },
    accessDenied: "Sem permissão para aceder à gestão de itens. Apenas admin e gestor.",
    loading: "A carregar itens...",
    errorLoading: "Erro ao carregar itens",
    saveSuccess: "Item guardado com sucesso!",
    saveError: "Erro ao guardar item",
    deleteSuccess: "Item eliminado!",
    deleteError: "Erro ao eliminar item",
  },

  // Team Play / Team Building
  teamPlay: {
    title: "Team Building • Multijogador",
    subtitle: "Cria uma sala, partilha o link e joga em tempo real com a tua equipa.",
    createRoom: "Criar Sala",
    joinRoom: "Entrar em Sala",
    openRooms: "🎮 Salas Abertas ({count})",
    gameInProgress: "Jogo em Curso",
    gameEnded: "Jogo Terminado",
    waitingPlayers: "A aguardar jogadores...",
    yourColor: "És {color}",
    waitingOpponent: "⏳ Aguarda o adversário",
    yourTurn: "🟢 É o teu turno!",
    viewGame: "Ver Jogo",
    viewResult: "Ver Resultado",
    copyLink: "Copiar link",
    copyCode: "Copiar código",
    inviteLink: "Link de Convite",
    inviteCode: "Código de Convite",
    players: "Jogadores",
    rematch: "Desforra",
    rematchRequested: "Pedido de desforra enviado",
    rematchAccepted: "Desforra aceite!",
    askRematch: "Queres jogar desforra?",
    opponentAskedRematch: "O outro jogador pediu desforra. Aceitas?",
    waitingOpponentRematch: "Pedido enviado. A aguardar o outro jogador aceitar.",
    startingRematch: "🔄 Desforra iniciada!",
    backToLobby: "Voltar ao lobby",
    gameEndedMessage: "🏁 Jogo terminado",
    draw: "Empate!",
    winner: "Vencedor: {winner}",
    waitingSecondPlayer: "A aguardar segundo jogador para permitir desforra.",
  },

  // Login / Session
  auth: {
    login: "Fazer Login",
    logout: "Terminar Sessão",
    enterCode: "Introduzir Código",
    codePlaceholder: "Código de 6 caracteres",
    codeInvalid: "Código inválido. Usa 6 caracteres alfanuméricos.",
    codeNotFound: "Código não encontrado.",
    welcome: "Bem-vindo, {name}!",
    yourCoins: "As tuas moedas: {coins}",
  },

  // Notifications / Messages
  notifications: {
    insufficientPermissions: "Sem permissão",
    accessDenied: "Acesso Negado",
    verifyingPermissions: "A verificar permissões...",
    error: "Erro interno no servidor",
    networkError: "Erro de rede — tenta novamente.",
    savedLocally: "Resultado guardado localmente.",
  },

  // Time
  time: {
    minutes: "{min} min",
    seconds: "{sec}s",
    hours: "{hr}h",
  },
};

export type Translations = typeof ptPT;

export default ptPT;
