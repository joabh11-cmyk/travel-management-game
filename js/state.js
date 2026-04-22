// ============================================================
// AGÊNCIA — Estado Global (em memória, sem localStorage)
// ============================================================
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.state = null;

// ----------------------------------------------------------
// Inicializa o estado do jogo com as escolhas da tela inicial
// ----------------------------------------------------------
window.AGENCIA.iniciarJogo = function(config) {
  const BAL = window.AGENCIA.BAL;
  const ei  = BAL.estadoInicial;

  window.AGENCIA.state = {

    // --- Agência ---
    agencia: {
      nome:             config.nome || 'Minha Agência',
      segmento:         config.segmento || 'lazer_nacional',
      modo:             config.modo || 'realista',
      dificuldade:      config.dificuldade || 'dificil',
      caixa:            ei.caixa,
      reputacao:        ei.reputacao,
      autoridade:       ei.autoridade,
      eficienciaOp:     ei.eficienciaOp,
      segurancaJur:     ei.segurancaJur,
      maturidadeCom:    ei.maturidadeCom,
      fadiga:           ei.fadiga,
      fase:             ei.fase,
    },

    // --- Tempo ---
    tempo: {
      dia:      1,
      semana:   1,
      mes:      1,
      diaSemana: 1,   // 1=segunda … 7=domingo
      dataInicio: new Date().toISOString(),
    },

    // --- Pontos de Ação ---
    pa: {
      disponivel: BAL.pa.porDia,
      maximo:     BAL.pa.porDia,
      usados:     0,
    },

    // --- Canais ativos ---
    canaisAtivos: ['familiares_amigos', 'boca_a_boca', 'campanhas_internas'],
    canaisMarketing: {
      familiares_amigos: 'medio',
      boca_a_boca: 'medio',
      campanhas_internas: 'medio'
    },

    // --- Pipeline comercial ---
    leads:    [],   // leads recebidos ainda não no pipeline
    pipeline: [],   // leads em negociação ativa
    vendas:   [],   // vendas fechadas
    perdas:   [],   // leads perdidos (com motivo)

    // --- Financeiro ---
    caixa: {
      saldo:        ei.caixa,
      entradas:     [],
      saidas:       [],
      historicoSemanal: [],
      diasSaldoNegativo: 0,
    },

    // --- Eventos ---
    eventosHistorico: [],
    eventosAtivos:    [],   // eventos aguardando resolução

    // --- Tutorial ---
    tutorial: {
      ativo:  true,
      etapa:  0,   // 0=intro, 1=captar, 2=cotar, 3=negociar, -1=pulado
    },

    // --- KPIs acumulados ---
    kpis: {
      receitaBruta:        0,
      custoTotal:          0,
      margemAcumulada:     0,
      totalVendas:         0,
      totalLeadsRecebidos: 0,
      totalLeadsPerdidos:  0,
      melhorSemanaReceita: 0,
      primeiraVendaDia:    null,
    },
  };

  return window.AGENCIA.state;
};

// ----------------------------------------------------------
// Getters / Setters utilitários
// ----------------------------------------------------------
window.AGENCIA.getState = function() {
  return window.AGENCIA.state;
};

window.AGENCIA.getAgencia = function() {
  return window.AGENCIA.state?.agencia;
};

// Atualiza um campo aninhado: setState('agencia.caixa', 500)
window.AGENCIA.setState = function(caminho, valor) {
  const partes = caminho.split('.');
  let obj = window.AGENCIA.state;
  for (let i = 0; i < partes.length - 1; i++) {
    obj = obj[partes[i]];
    if (obj === undefined) { console.warn('setState: caminho inválido', caminho); return; }
  }
  obj[partes[partes.length - 1]] = valor;
};

// Adiciona entrada no caixa
window.AGENCIA.registrarEntrada = function(descricao, valor, origem) {
  const s = window.AGENCIA.state;
  s.caixa.entradas.push({ descricao, valor, origem, dia: s.tempo.dia });
  s.caixa.saldo += valor;
  s.kpis.receitaBruta += valor;
};

// Adiciona saída no caixa
window.AGENCIA.registrarSaida = function(descricao, valor, categoria) {
  const s = window.AGENCIA.state;
  s.caixa.saidas.push({ descricao, valor, categoria, dia: s.tempo.dia });
  s.caixa.saldo -= valor;
  s.kpis.custoTotal += valor;
  if (s.caixa.saldo < 0) {
    s.caixa.diasSaldoNegativo++;
  } else {
    s.caixa.diasSaldoNegativo = 0;
  }
};

// Consome PA — retorna false se não tiver suficiente
window.AGENCIA.consumirPA = function(quantidade) {
  const pa = window.AGENCIA.state.pa;
  if (pa.disponivel < quantidade) return false;
  pa.disponivel -= quantidade;
  pa.usados += quantidade;
  return true;
};

// Checa se o jogo acabou
window.AGENCIA.verificarGameOver = function() {
  const s   = window.AGENCIA.state;
  const BAL = window.AGENCIA.BAL;
  const go  = BAL.gameOver;

  if (
    s.caixa.diasSaldoNegativo >= go.diasCaixaNegativoParaGameOver &&
    s.agencia.reputacao < go.reputacaoMinimaGameOver
  ) {
    return {
      gameOver: true,
      motivo: 'Caixa negativo por ' + go.diasCaixaNegativoParaGameOver + ' dias consecutivos e reputação crítica.',
    };
  }
  return { gameOver: false };
};

// Reseta o jogo por completo
window.AGENCIA.resetar = function() {
  window.AGENCIA.state = null;
};
