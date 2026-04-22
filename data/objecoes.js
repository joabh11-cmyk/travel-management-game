// data/objecoes.js
window.AGENCIA = window.AGENCIA || {};
window.AGENCIA.BAL = window.AGENCIA.BAL || {};

window.AGENCIA.BAL.objecoes = [
  {
    id: 'preco_alto',
    mensagem: "Achei o valor bem puxado... Tem como melhorar isso?",
    pesosPerfil: { cacador_preco: 0.8, inseguro: 0.3, apressado: 0.1, detalhista: 0.4, indicacao: 0.2 },
    respostas: [
      {
        id: 'ceder_margem',
        label: "Dar desconto (reduz margem)",
        modificadores: { preco: 25, confianca: -5 }
      },
      {
        id: 'justificar_valor',
        label: "Explicar o valor do serviço",
        modificadores: { adequacao: 15, confianca: 10, preco: -5 }
      },
      {
        id: 'oferecer_extra',
        label: "Oferecer um brinde/cortesia",
        modificadores: { adequacao: 20, confianca: 15, margem: -5 }
      }
    ]
  },
  {
    id: 'concorrente_mais_barato',
    mensagem: "Recebi uma cotação mais barata de outra agência para o mesmo pacote.",
    pesosPerfil: { cacador_preco: 0.9, inseguro: 0.5, apressado: 0.2, detalhista: 0.6, indicacao: 0.1 },
    respostas: [
      {
        id: 'ceder_margem',
        label: "Cobrir a oferta (corta margem)",
        modificadores: { preco: 30, confianca: -10 }
      },
      {
        id: 'justificar_valor',
        label: "Garantir nossa qualidade superior",
        modificadores: { adequacao: 10, confianca: 20, preco: -10 }
      },
      {
        id: 'oferecer_extra',
        label: "Adicionar serviço extra pelo mesmo preço",
        modificadores: { adequacao: 25, confianca: 10 }
      }
    ]
  },
  {
    id: 'inseguranca_suporte',
    mensagem: "E se der algum problema na viagem? Vocês garantem assistência?",
    pesosPerfil: { cacador_preco: 0.1, inseguro: 0.9, apressado: 0.2, detalhista: 0.7, indicacao: 0.4 },
    respostas: [
      {
        id: 'ceder_margem',
        label: "Dar desconto compensatório",
        modificadores: { preco: 10, confianca: -20, adequacao: -10 }
      },
      {
        id: 'justificar_valor',
        label: "Detalhar o suporte 24h",
        modificadores: { confianca: 35, adequacao: 20 }
      },
      {
        id: 'oferecer_extra',
        label: "Incluir seguro viagem melhorado",
        modificadores: { adequacao: 30, confianca: 30, preco: 5 }
      }
    ]
  },
  {
    id: 'prazo_curto',
    mensagem: "Preciso resolver isso pra ontem! Consegue agilizar a emissão?",
    pesosPerfil: { cacador_preco: 0.1, inseguro: 0.2, apressado: 0.9, detalhista: 0.1, indicacao: 0.3 },
    respostas: [
      {
        id: 'ceder_margem',
        label: "Dar desconto pra fechar na hora",
        modificadores: { preco: 15, velocidade: 10 }
      },
      {
        id: 'justificar_valor',
        label: "Garantir a emissão prioritária",
        modificadores: { velocidade: 40, confianca: 10 }
      },
      {
        id: 'oferecer_extra',
        label: "Oferecer transfer VIP",
        modificadores: { adequacao: 10, velocidade: 5 }
      }
    ]
  },
  {
    id: 'pouca_clareza',
    mensagem: "Não entendi bem as regras de cancelamento e o que está incluso.",
    pesosPerfil: { cacador_preco: 0.2, inseguro: 0.6, apressado: 0.1, detalhista: 0.9, indicacao: 0.2 },
    respostas: [
      {
        id: 'ceder_margem',
        label: "Dar desconto pra compensar",
        modificadores: { preco: 10, confianca: -25, adequacao: -15 }
      },
      {
        id: 'justificar_valor',
        label: "Reenviar com todos os detalhes claros",
        modificadores: { adequacao: 40, confianca: 20 }
      },
      {
        id: 'oferecer_extra',
        label: "Agendar uma call para explicar",
        modificadores: { adequacao: 25, confianca: 35 }
      }
    ]
  },
  {
    id: 'preciso_pensar',
    mensagem: "Gostei, mas vou pensar um pouco e falo com minha família.",
    pesosPerfil: { cacador_preco: 0.5, inseguro: 0.7, apressado: 0.1, detalhista: 0.6, indicacao: 0.5 },
    respostas: [
      {
        id: 'ceder_margem',
        label: "Oferecer desconto relâmpago hoje",
        modificadores: { preco: 30, velocidade: 20, confianca: -10 }
      },
      {
        id: 'justificar_valor',
        label: "Reforçar que as vagas acabam rápido",
        modificadores: { velocidade: 25, confianca: 5 }
      },
      {
        id: 'oferecer_extra',
        label: "Dar um brinde se fechar até amanhã",
        modificadores: { adequacao: 20, velocidade: 15 }
      }
    ]
  }
];
