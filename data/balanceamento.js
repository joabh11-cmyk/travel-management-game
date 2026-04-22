// ============================================================
// AGÊNCIA — Arquivo de Balanceamento
// TODOS os números do jogo vivem aqui. Não coloque valores
// numéricos críticos em outros arquivos. Ajuste aqui.
// ============================================================
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.BAL = {

  // ----------------------------------------------------------
  // ESTADO INICIAL
  // ----------------------------------------------------------
  estadoInicial: {
    caixa:            1000,
    reputacao:        5,
    autoridade:       0,
    eficienciaOp:     10,
    segurancaJur:     0,
    maturidadeCom:    5,
    fadiga:           0,
    fase:             'sobrevivencia',
  },

  // ----------------------------------------------------------
  // PONTOS DE AÇÃO (PA)
  // ----------------------------------------------------------
  pa: {
    porDia:           8,
    fadigaReducao1:   80,   // fadiga > 80 → 6 PA
    fadigaReducao2:   95,   // fadiga > 95 → 4 PA
    paFadiga1:        6,
    paFadiga2:        4,

    custos: {
      networking:             1,
      responderLeadSimples:   1,
      cotacaoNacionalSimples: 1,
      cotacaoIntlComplexa:    2,
      resolverCrise:          3,
      followUpEstruturado:    1,
      treinarColaborador:     1,
      reuniaoCorporativa:     2,
      qualificarLead:         1,
      criarCotacao:           1,
    },
  },

  // ----------------------------------------------------------
  // MODOS FINANCEIROS
  // ----------------------------------------------------------
  modos: {
    realista: {
      label: 'Realista Jogável',
      comissaoAereo:    { min: 0.03, max: 0.05 },
      comissaoHotel:    { min: 0.12, max: 0.20 },
      comissaoPasseio:  { min: 0.10, max: 0.16 },
      comissaoSeguro:   { min: 0.18, max: 0.30 },
      margemPacote:     { min: 0.12, max: 0.30 },
      multiplicadorConversao: 1.0,
      multiplicadorLeads:     1.0,
      multiplicadorEvento:    0.85,
    },
    brasil_real: {
      label: 'Brasil Real',
      comissaoAereo:    { min: 0.00, max: 0.02 },
      comissaoHotel:    { min: 0.10, max: 0.16 },
      comissaoPasseio:  { min: 0.10, max: 0.13 },
      comissaoSeguro:   { min: 0.15, max: 0.25 },
      margemPacote:     { min: 0.10, max: 0.22 },
      multiplicadorConversao: 0.80,
      multiplicadorLeads:     0.85,
      multiplicadorEvento:    1.20,
    },
  },

  // ----------------------------------------------------------
  // DIFICULDADES
  // ----------------------------------------------------------
  dificuldades: {
    facil: {
      label: 'Fácil',
      multiplicadorLeads:      1.30,
      multiplicadorConversao:  1.10,
      multiplicadorEvento:     0.60,
      multiplicadorPunicao:    0.50,
    },
    medio: {
      label: 'Médio',
      multiplicadorLeads:      1.00,
      multiplicadorConversao:  1.00,
      multiplicadorEvento:     1.00,
      multiplicadorPunicao:    1.00,
    },
    dificil: {
      label: 'Difícil',
      multiplicadorLeads:      0.80,
      multiplicadorConversao:  0.85,
      multiplicadorEvento:     1.30,
      multiplicadorPunicao:    1.50,
    },
  },

  // ----------------------------------------------------------
  // SEGMENTOS DE AGÊNCIA
  // ----------------------------------------------------------
  segmentos: {
    lazer_nacional: {
      label:          'Lazer Nacional',
      emoji:          '🗺️',
      desc:           'Pacotes domésticos, boa porta de entrada.',
      ticketMin:      400,
      ticketMax:      2500,
      margemBase:     0.18,
      conversaoBase:  0.22,
      exigencia:      0.50,
      chanceObjecao:  0.45,
      tempoDecisao:   3,    // dias
    },
    lazer_internacional: {
      label:          'Lazer Internacional',
      emoji:          '✈️',
      desc:           'Destinos internacionais, margens melhores.',
      ticketMin:      2000,
      ticketMax:      8000,
      margemBase:     0.20,
      conversaoBase:  0.18,
      exigencia:      0.70,
      chanceObjecao:  0.55,
      tempoDecisao:   5,
    },
    corporativo: {
      label:          'Corporativo',
      emoji:          '💼',
      desc:           'Contas empresariais recorrentes.',
      ticketMin:      1500,
      ticketMax:      5000,
      margemBase:     0.12,
      conversaoBase:  0.12,
      exigencia:      0.80,
      chanceObjecao:  0.40,
      tempoDecisao:   10,
    },
    luxo: {
      label:          'Luxo',
      emoji:          '💎',
      desc:           'Alto padrão, ticket elevado, pós-venda crítico.',
      ticketMin:      8000,
      ticketMax:      30000,
      margemBase:     0.25,
      conversaoBase:  0.10,
      exigencia:      0.95,
      chanceObjecao:  0.35,
      tempoDecisao:   7,
    },
    economico: {
      label:          'Econômico',
      emoji:          '💸',
      desc:           'Volume alto, guerra de preço, margem mínima.',
      ticketMin:      200,
      ticketMax:      800,
      margemBase:     0.09,
      conversaoBase:  0.30,
      exigencia:      0.60,
      chanceObjecao:  0.60,
      tempoDecisao:   2,
    },
  },

  // ----------------------------------------------------------
  // CANAIS DE CAPTAÇÃO
  // ----------------------------------------------------------
  canais: {
    familiares_amigos: {
      label:          'Família e Amigos',
      emoji:          '👨‍👩‍👧',
      tipo:           'organico',
      custoPorIntensidade: { desligado: 0, baixo: 0, medio: 0, alto: 0 },
      faixasLeads: {
        desligado: { min: 0, max: 0 },
        baixo:     { min: 0.1, max: 0.3 },
        medio:     { min: 0.4, max: 0.8 },
        alto:      { min: 0.6, max: 1.2 }
      },
      confianca:      { min: 55, max: 80 },
      maturacao:      1,    // dias
      disponivelDia1: true,
    },
    boca_a_boca: {
      label:          'Boca a Boca',
      emoji:          '🗣️',
      tipo:           'organico',
      custoPorIntensidade: { desligado: 0, baixo: 0, medio: 0, alto: 0 },
      faixasLeads: {
        desligado: { min: 0, max: 0 },
        baixo:     { min: 0.1, max: 0.4 },
        medio:     { min: 0.3, max: 0.9 },
        alto:      { min: 0.5, max: 1.5 }
      },
      confianca:      { min: 40, max: 75 },
      maturacao:      3,
      disponivelDia1: true,
    },
    campanhas_internas: {
      label:          'Campanhas Internas',
      emoji:          '📣',
      tipo:           'organico',
      custoPorIntensidade: { desligado: 0, baixo: 2, medio: 5, alto: 15 },
      faixasLeads: {
        desligado: { min: 0, max: 0 },
        baixo:     { min: 0.2, max: 0.5 },
        medio:     { min: 0.5, max: 1.2 },
        alto:      { min: 1.0, max: 2.5 }
      },
      confianca:      { min: 25, max: 55 },
      maturacao:      2,
      disponivelDia1: true,
    },
    influenciadores: {
      label:          'Influenciadores',
      emoji:          '📱',
      tipo:           'pago',
      custoPorIntensidade: { desligado: 0, baixo: 50, medio: 120, alto: 250 },
      faixasLeads: {
        desligado: { min: 0, max: 0 },
        baixo:     { min: 0.8, max: 1.5 },
        medio:     { min: 1.5, max: 3.0 },
        alto:      { min: 3.0, max: 5.0 }
      },
      confianca:      { min: 35, max: 45 },
      maturacao:      5,
      disponivelDia1: false,
    },
    participacao_eventos: {
      label:          'Eventos e Feiras',
      emoji:          '🎪',
      tipo:           'semi',
      custoPorIntensidade: { desligado: 0, baixo: 80, medio: 200, alto: 400 },
      faixasLeads: {
        desligado: { min: 0, max: 0 },
        baixo:     { min: 0.5, max: 1.2 },
        medio:     { min: 1.2, max: 2.5 },
        alto:      { min: 2.5, max: 4.5 }
      },
      confianca:      { min: 55, max: 65 },
      maturacao:      1,
      disponivelDia1: false,
    },
    representantes: {
      label:          'Representantes',
      emoji:          '💼',
      tipo:           'semi',
      custoPorIntensidade: { desligado: 0, baixo: 30, medio: 70, alto: 130 },
      faixasLeads: {
        desligado: { min: 0, max: 0 },
        baixo:     { min: 0.4, max: 0.9 },
        medio:     { min: 0.9, max: 1.8 },
        alto:      { min: 1.8, max: 3.0 }
      },
      confianca:      { min: 50, max: 60 },
      maturacao:      7,
      disponivelDia1: false,
    },
    patrocinio: {
      label:          'Patrocínio',
      emoji:          '🏆',
      tipo:           'pago',
      custoPorIntensidade: { desligado: 0, baixo: 150, medio: 350, alto: 700 },
      faixasLeads: {
        desligado: { min: 0, max: 0 },
        baixo:     { min: 0.3, max: 0.8 },
        medio:     { min: 0.8, max: 2.0 },
        alto:      { min: 2.0, max: 4.0 }
      },
      confianca:      { min: 45, max: 55 },
      maturacao:      14,
      disponivelDia1: false,
    },
    venda_corporativa: {
      label:          'Venda Corporativa',
      emoji:          '🤝',
      tipo:           'semi',
      custoPorIntensidade: { desligado: 0, baixo: 40, medio: 100, alto: 180 },
      faixasLeads: {
        desligado: { min: 0, max: 0 },
        baixo:     { min: 0.2, max: 0.5 },
        medio:     { min: 0.5, max: 1.0 },
        alto:      { min: 1.0, max: 2.0 }
      },
      confianca:      { min: 60, max: 75 },
      maturacao:      14,
      disponivelDia1: false,
    },
    trafego_pago: {
      label:          'Tráfego Pago',
      emoji:          '📊',
      tipo:           'pago',
      custoPorIntensidade: { desligado: 0, baixo: 100, medio: 250, alto: 500 },
      faixasLeads: {
        desligado: { min: 0, max: 0 },
        baixo:     { min: 1.0, max: 2.0 },
        medio:     { min: 2.0, max: 4.0 },
        alto:      { min: 4.0, max: 7.0 }
      },
      confianca:      { min: 25, max: 35 },
      maturacao:      3,
      disponivelDia1: false,
    },
  },

  // ----------------------------------------------------------
  // PERFIS DE CLIENTES
  // ----------------------------------------------------------
  perfis: {
    cacador_preco: {
      label: 'Caçador de Preço',
      emoji: '🤑',
      chance: 0.30,
      modificadores: { pesoPreco: 2.0, exigencia: -0.2 }
    },
    inseguro: {
      label: 'Inseguro',
      emoji: '😰',
      chance: 0.22,
      modificadores: { pesoConfianca: 1.5, chanceObjecao: 0.2 }
    },
    apressado: {
      label: 'Apressado',
      emoji: '⏱️',
      chance: 0.18,
      modificadores: { pesoVelocidade: 2.0, pesoAdequacao: -0.5 }
    },
    detalhista: {
      label: 'Detalhista',
      emoji: '🧐',
      chance: 0.18,
      modificadores: { pesoAdequacao: 1.5, exigencia: 0.3 }
    },
    indicacao: {
      label: 'Indicação',
      emoji: '🤝',
      chance: 0.12,
      modificadores: { pesoConfianca: 2.0, pesoReputacao: 1.5 }
    }
  },

  // ----------------------------------------------------------
  // SCORE DE FECHAMENTO
  // ----------------------------------------------------------
  scoreFechamento: {
    pesos: {
      preco:      0.30,
      confianca:  0.20,
      velocidade: 0.15,
      adequacao:  0.20,
      reputacao:  0.10,
      objecoes:   -0.15,
    },
    thresholds: {
      fechar:   65,
      objecao:  45,
      // abaixo de 45 = perder
    },
  },

  // ----------------------------------------------------------
  // PROTEÇÃO JURÍDICA (F8)
  // ----------------------------------------------------------
  protecaoJuridica: {
    planos: {
      basico: {
        id: 'basico',
        nome: 'Proteção Básica',
        valorMensal: 250,
        usosPorSemana: 1,
        cobertura: [
          'reclamacao_pos_venda',
          'desconto_agressivo_cliente'
        ],
        descricao: 'Cobre 1 acionamento jurídico por semana. Indicado para operação inicial.'
      },
      completo: {
        id: 'completo',
        nome: 'Proteção Completa',
        valorMensal: 350,
        usosPorSemana: 2,
        cobertura: [
          'reclamacao_pos_venda',
          'desconto_agressivo_cliente',
          'concorrente_mais_barato',
          'mudanca_tarifa_durante_negociacao'
        ],
        descricao: 'Cobre 2 acionamentos por semana. Recomendado para operações com maior volume.'
      }
    },
    semProtecao: {
      multaBase: { min: 300, max: 1500 },
      danoReputacaoBase: { min: 5, max: 20 }
    }
  },

  // ----------------------------------------------------------
  // PROBABILIDADES DE EVENTOS (base — modificadores aplicados em events.js)
  // ----------------------------------------------------------
  eventos: {
    objecaoPrecoFrio:     { min: 0.35, max: 0.60 },
    descontoAgressivo:    { min: 0.15, max: 0.35 },
    concorrenteMaisBarato:{ min: 0.20, max: 0.45 },
    mudancaTarifa:        { min: 0.10, max: 0.25 },
    cancelamentoViagem:   { min: 0.02, max: 0.08 },
    reclamacaoPosVenda:   { min: 0.03, max: 0.10 },
    chargeback:           { min: 0.005, max: 0.03 },
    contestacaoContratual:{ min: 0.01, max: 0.05 },
    falhaFornecedor:      { min: 0.01, max: 0.06 },
  },

  // ----------------------------------------------------------
  // CUSTOS FIXOS (mensais → divididos por 30 para custo diário)
  // ----------------------------------------------------------
  custosFixos: {
    internet:       120,
    crm:            50,
    ferramentas:    30,
    contabilidade:  0,    // desbloqueado depois
    juridico:       0,    // desbloqueado depois
  },

  // ----------------------------------------------------------
  // FEE PADRÃO
  // ----------------------------------------------------------
  fee: {
    minimo:   50,
    sugerido: 150,
    maximo:   500,
  },

  // ----------------------------------------------------------
  // FLUXO DE CAIXA
  // ----------------------------------------------------------
  fluxoCaixa: {
    recebimentoDias: 2,           // D+2 para o dinheiro entrar
    taxaCartao: 0.04,             // 4% da receita bruta como custo variável
    custoFixoExtraPorVenda: 20,   // Emissão, pequeno brinde, atendimento
    reservaMinimaSemanas: 2,      // Múltiplo do custo fixo semanal para alerta
    burnRateThreshold: 500,       // Queima semanal que dispara alerta de alto risco
  },

  // ----------------------------------------------------------
  // SAZONALIDADE (multiplicador de leads por mês, 1-indexed)
  // ----------------------------------------------------------
  sazonalidade: [
    null,   // índice 0 não usado
    1.20,   // Jan — verão/férias
    1.25,   // Fev — carnaval
    0.90,   // Mar
    0.95,   // Abr
    0.80,   // Mai
    0.85,   // Jun
    1.30,   // Jul — férias
    0.80,   // Ago
    0.75,   // Set
    0.85,   // Out
    0.95,   // Nov
    1.40,   // Dez — festas
  ],

  // ----------------------------------------------------------
  // GAME OVER
  // ----------------------------------------------------------
  gameOver: {
    diasCaixaNegativoParaGameOver: 3,
    reputacaoMinimaGameOver:       10,
    caixaMinimoAlerta:             200,
  },

  // ----------------------------------------------------------
  // BALANCEAMENTO: 1ª VENDA
  // Meta: possível antes do dia 7, sem ser garantida
  // ----------------------------------------------------------
  primeiraVenda: {
    bonusConfiancaDia1a3:   10,   // leads de rede pessoal têm +10 confiança
    boostVelocidadeDia1:    0.05, // cada hora rápida vale +5% no score
  },

  // ----------------------------------------------------------
  // CHAT SIMULATOR (MODO TREINO)
  // ----------------------------------------------------------
  chatSimulator: {
    maxTurnos: 5,
    minTurnos: 3,
    modeloGemini: 'gemini-2.0-flash-lite',   // gratuito e estável
    temperaturaGemini: 0.85,             // mais variado e humano
    maxTokensResposta: 150,              // respostas curtas
    penalizacaoRespostaLonga: -3,        // score se jogador mandar > 200 chars com apressado
    bonusDiferencialMencionado: +5,      // score ao mencionar diferencial claro
    bonusPerguntaAntesPreco: +8          // score ao perguntar necessidade antes de cotar
  }
};
