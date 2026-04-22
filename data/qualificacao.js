// data/qualificacao.js
window.AGENCIA = window.AGENCIA || {};
window.AGENCIA.BAL = window.AGENCIA.BAL || {};

window.AGENCIA.BAL.qualificacao = {
  rotas: {
    rota_direta: {
      label: 'Perguntas Diretas',
      descricao: 'Vai direto ao ponto: orçamento, data, destino.',
      efeito_base: { confianca: 0, chanceObjecao: 0 },
      rodadas: ['rodada_orcamento', 'rodada_urgencia', 'rodada_fechamento_qualificacao']
    },
    rota_escuta: {
      label: 'Escuta Ativa',
      descricao: 'Deixa o cliente falar. Constrói confiança antes de cotar.',
      efeito_base: { confianca: 10, chanceObjecao: 0 },
      rodadas: ['rodada_experiencia_anterior', 'rodada_orcamento', 'rodada_urgencia', 'rodada_decisor', 'rodada_fechamento_qualificacao']
    },
    rota_consultiva: {
      label: 'Abordagem Consultiva',
      descricao: 'Posiciona o agente como especialista, não como vendedor.',
      efeito_base: { confianca: 5, adequacao: 10, chanceObjecao: -5 },
      rodadas: ['rodada_experiencia_anterior', 'rodada_urgencia', 'rodada_orcamento', 'rodada_fechamento_qualificacao']
    }
  },

  rodadas: {
    rodada_orcamento: {
      contexto: 'O cliente menciona que está pesquisando preços. Como você reage?',
      dicaEducativa: '💡 Ancoragem de preço reduz resistência sem revelar seu limite.',
      opcoes: [
        {
          label: 'Pergunto diretamente qual é o orçamento disponível',
          dica: 'Eficiente, mas pode intimidar clientes mais reservados',
          impactos: { revealTicket: true, deltaConfianca: { padrao: 0, inseguro: -5, apressado: 0 }, deltaChanceObjecao: 0 }
        },
        {
          label: 'Pergunto o que eles já viram e o que acharam',
          dica: 'Abre espaço para o cliente se sentir ouvido',
          impactos: { revealTicket: false, deltaConfianca: { padrao: 8 }, deltaChanceObjecao: -5 }
        },
        {
          label: 'Apresento 3 faixas de pacote e peço para escolher',
          dica: 'Ancora o preço e revela preferência sem confronto',
          impactos: { revealTicket: true, deltaConfianca: { padrao: 5 }, deltaChanceObjecao: -3 }
        }
      ]
    },
    rodada_urgencia: {
      contexto: 'Você precisa entender se o cliente está pronto para decidir ou só pesquisando.',
      dicaEducativa: '💡 Saber a urgência ajuda a priorizar leads no funil.',
      opcoes: [
        {
          label: 'Pergunto se já têm data definida',
          dica: 'Direta e revela urgência real',
          impactos: { revealUrgencia: true, deltaConfianca: { padrao: 0 }, deltaChanceObjecao: 0 }
        },
        {
          label: 'Pergunto o que faria eles decidirem hoje',
          dica: 'Técnica consultiva — revela objeção oculta',
          impactos: { revealUrgencia: true, deltaConfianca: { padrao: 5 }, deltaChanceObjecao: -8 }
        },
        {
          label: 'Deixo o cliente no ritmo dele sem pressionar',
          dica: 'Confortável, mas pode deixar lead esfriar',
          impactos: { revealUrgencia: false, deltaConfianca: { padrao: 3 }, deltaUrgencia: -5, deltaChanceObjecao: 0 }
        }
      ]
    },
    rodada_decisor: {
      contexto: 'O cliente parece empolgado, mas hesitante. Você suspeita que não decide sozinho.',
      dicaEducativa: '💡 Identificar o decisor real evita surpresas no fechamento.',
      opcoes: [
        {
          label: 'Pergunto se mais alguém vai na viagem ou precisa aprovar',
          dica: 'Identifica o decisor real — evita surpresa no fechamento',
          impactos: { revealDecisor: true, deltaConfianca: { padrao: 3 }, deltaChanceObjecao: 0 }
        },
        {
          label: 'Ignoro e sigo apresentando o pacote',
          dica: 'Rápido, mas arriscado se houver um decisor oculto',
          impactos: { revealDecisor: false, deltaConfianca: { padrao: 0 }, deltaChanceObjecao: 10 }
        },
        {
          label: 'Ofereço enviar um resumo por escrito para ele compartilhar',
          dica: 'Facilita o processo de decisão em grupo',
          impactos: { revealDecisor: false, deltaConfianca: { padrao: 8 }, deltaChanceObjecao: -5 }
        }
      ]
    },
    rodada_experiencia_anterior: {
      contexto: 'O cliente menciona que já viajou antes. Você tem a chance de entender a experiência passada dele.',
      dicaEducativa: '💡 Experiências passadas ditam as expectativas futuras.',
      opcoes: [
        {
          label: 'Pergunto como foi a última viagem e o que poderia ser melhor',
          dica: 'Ouro puro — revela expectativa real e cria rapport',
          impactos: { revealPerfil: true, deltaConfianca: { padrao: 12 }, deltaChanceObjecao: 0 }
        },
        {
          label: 'Pergunto se já usou agência ou foi por conta própria',
          dica: 'Identifica se o cliente tem resistência a pagar fee',
          impactos: { revealPerfil: true, deltaConfianca: { padrao: 0 }, deltaChanceObjecao: -5 }
        },
        {
          label: 'Não pergunto — foco no que posso oferecer agora',
          dica: 'Neutro, mas perde informação valiosa',
          impactos: { revealPerfil: false, deltaConfianca: { padrao: 0 }, deltaChanceObjecao: 0 }
        }
      ]
    },
    rodada_fechamento_qualificacao: {
      contexto: 'Você coletou informações suficientes. Como encerra a qualificação?',
      dicaEducativa: '💡 O fechamento da qualificação dita o tom da proposta.',
      opcoes: [
        {
          label: 'Faço um resumo do que entendi e peço confirmação',
          dica: 'Profissional e cria sensação de atenção ao cliente',
          impactos: { revealPerfil: false, deltaConfianca: { padrao: 10 }, deltaChanceObjecao: -5 }
        },
        {
          label: 'Digo que vou montar uma proposta e retorno em breve',
          dica: 'Objetivo, funciona bem com apressados',
          impactos: { revealPerfil: false, deltaConfianca: { padrao: 3 }, deltaChanceObjecao: 0 }
        },
        {
          label: 'Pergunto se posso já apresentar uma opção inicial agora',
          dica: 'Acelera o funil, mas pode pressionar clientes inseguros',
          impactos: { revealPerfil: false, deltaConfianca: { padrao: 0, inseguro: -3 }, deltaUrgencia: 5, deltaChanceObjecao: 0 }
        }
      ]
    }
  }
};
