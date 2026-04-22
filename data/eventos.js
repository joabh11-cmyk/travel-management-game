// data/eventos.js
window.AGENCIA = window.AGENCIA || {};
window.AGENCIA.data = window.AGENCIA.data || {};

window.AGENCIA.data.eventos = [
  {
    id: 'desconto_agressivo_cliente',
    tipo: 'negociacao', // Afeta um lead específico no pipeline
    probBase: 0.10, // 10% por lead no pipeline ativo
    modificadores: {
      reputacaoAlta: -0.05,
      reputacaoBaixa: +0.05,
      segurancaJurAlta: 0
    },
    perfisMaisProvaveis: ['cacador_preco', 'pechincheiro'],
    gerarTitulo: () => `Desconto Agressivo Exigido`,
    gerarMensagem: (contexto) => `O cliente **${contexto.lead.nome}** (cotando pacote de R$ ${contexto.lead.cotacao.valorTotal.toLocaleString('pt-BR')}) disse que o orçamento está fora da realidade dele e só fecha se você der um super desconto, cortando sua margem quase a zero.`,
    opcoes: [
      {
        id: 'ceder_desconto',
        label: 'Ceder e garantir a venda',
        impactos: {
          deltaMargem: -0.8, // perde 80% da margem
          deltaReputacao: -1, // mercado sabe que você abaixa as calças
          deltaConfiancaDoCliente: +20,
          riscoPerdaVenda: 0
        }
      },
      {
        id: 'negociar_valor',
        label: 'Manter preço e reforçar o valor agregado',
        impactos: {
          deltaMargem: 0,
          deltaReputacao: +1,
          deltaConfiancaDoCliente: -10,
          riscoPerdaVenda: 0.5 // 50% de chance do cliente ir embora
        }
      },
      {
        id: 'recusar',
        label: 'Recusar desconto e ser firme',
        impactos: {
          deltaMargem: 0,
          deltaReputacao: +2,
          deltaConfiancaDoCliente: -30,
          riscoPerdaVenda: 0.8 // 80% de chance de perder a venda
        }
      }
    ]
  },
  {
    id: 'concorrente_mais_barato',
    tipo: 'negociacao',
    probBase: 0.12,
    modificadores: {
      reputacaoAlta: -0.05,
      reputacaoBaixa: +0.08,
      segurancaJurAlta: 0
    },
    perfisMaisProvaveis: ['cacador_preco', 'analitico'],
    gerarTitulo: () => `Concorrente Mais Barato`,
    gerarMensagem: (contexto) => `O cliente **${contexto.lead.nome}** enviou um print de uma OTAs (Agência Online) com o mesmo roteiro R$ 300 mais barato. Ele diz: "Consegue cobrir esse preço ou fecho por lá mesmo?"`,
    opcoes: [
      {
        id: 'cobrir_preco',
        label: 'Cobrir o preço da OTA (Absorver prejuízo)',
        impactos: {
          deltaMargem: -0.5,
          deltaReputacao: 0,
          deltaConfiancaDoCliente: +10,
          riscoPerdaVenda: 0.1
        }
      },
      {
        id: 'manter_preco',
        label: 'Explicar que nosso serviço inclui suporte 24h e não cobrir',
        impactos: {
          deltaMargem: 0,
          deltaReputacao: +1,
          deltaConfiancaDoCliente: 0,
          riscoPerdaVenda: 0.6
        }
      },
      {
        id: 'desistir',
        label: 'Deixar ir (Desejar boa viagem)',
        impactos: {
          deltaMargem: 0,
          deltaReputacao: +2,
          deltaConfiancaDoCliente: -10,
          riscoPerdaVenda: 1.0 // Perde 100%
        }
      }
    ]
  },
  {
    id: 'mudanca_tarifa_durante_negociacao',
    tipo: 'negociacao',
    probBase: 0.08,
    modificadores: {
      reputacaoAlta: 0,
      reputacaoBaixa: +0.02,
      segurancaJurAlta: 0
    },
    perfisMaisProvaveis: [], // Todos estão sujeitos
    gerarTitulo: () => `Tarifa do Fornecedor Expirou`,
    gerarMensagem: (contexto) => `Enquanto você esperava a resposta de **${contexto.lead.nome}**, o voo/hotel subiu de preço no sistema. O custo líquido aumentou consideravelmente, comendo a sua margem.`,
    opcoes: [
      {
        id: 'repassar_aumento',
        label: 'Avisar o cliente e repassar o aumento',
        impactos: {
          deltaMargem: 0,
          deltaReputacao: -2,
          deltaConfiancaDoCliente: -40,
          riscoPerdaVenda: 0.7
        }
      },
      {
        id: 'absorver_aumento',
        label: 'Absorver o prejuízo para não perder a venda',
        impactos: {
          deltaMargem: -1.0, // Fica com margem zero, ou até negativa dependendo do caso (tratado na engine)
          deltaReputacao: +1,
          deltaConfiancaDoCliente: +10,
          riscoPerdaVenda: 0
        }
      },
      {
        id: 'cancelar_proposta',
        label: 'Cancelar a negociação e pedir desculpas',
        impactos: {
          deltaMargem: 0,
          deltaReputacao: -1,
          deltaConfiancaDoCliente: -50,
          riscoPerdaVenda: 1.0
        }
      }
    ]
  },
  {
    id: 'reclamacao_pos_venda',
    tipo: 'operacional', // Não afeta uma negociação atual, é um evento genérico que atinge a agência
    probBase: 0.05,
    modificadores: {
      reputacaoAlta: -0.02,
      reputacaoBaixa: +0.05,
      segurancaJurAlta: -0.03
    },
    perfisMaisProvaveis: [],
    gerarTitulo: () => `Passageiro com Problemas na Viagem`,
    gerarMensagem: (contexto) => `Um cliente que viajou semana passada ligou furioso no meio da madrugada. O hotel reservado estava com overbooking e ele foi realocado para um inferior.`,
    opcoes: [
      {
        id: 'assumir_custo',
        label: 'Pagar R$ 500 do seu bolso por um upgrade emergencial',
        impactos: {
          deltaCaixa: -500,
          deltaReputacao: +3,
          mensagemResultado: 'O cliente ficou impressionado com a sua agilidade. Perdeu dinheiro, mas ganhou um cliente fiel.'
        }
      },
      {
        id: 'tentar_fornecedor',
        label: 'Brigar com o fornecedor pelo telefone (Custa 2 PA)',
        impactos: {
          custoPA: 2,
          deltaReputacao: +1, // Neutro/positivo, dependendo se resolveu (a engine pode aplicar aleatoriedade se quiser, aqui vamos assumir que resolve)
          mensagemResultado: 'Você gastou bastante energia, mas o fornecedor cedeu. Cliente satisfeito e bolso salvo.'
        }
      },
      {
        id: 'empurrar_responsabilidade',
        label: 'Dizer que a culpa é do hotel e lavar as mãos',
        impactos: {
          deltaCaixa: 0,
          deltaReputacao: -10,
          mensagemResultado: 'O cliente fez um escândalo nas redes sociais. A reputação da agência sofreu um golpe duro.'
        }
      }
    ]
  }
];
