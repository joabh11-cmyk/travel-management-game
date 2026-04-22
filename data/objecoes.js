// data/objecoes.js — stub F5
window.AGENCIA = window.AGENCIA || {};
window.AGENCIA.OBJECOES = {
  lista: [
    { id: 'preco_internet',   texto: 'Encontrei mais barato na internet.',           perfis: ['cacador_preco'], impactoScore: -15 },
    { id: 'taxa_servico',     texto: 'Outra agência não cobra taxa de serviço.',      perfis: ['cacador_preco', 'inseguro'], impactoScore: -12 },
    { id: 'desconto_agora',   texto: 'Consegue desconto se eu fechar agora?',         perfis: ['cacador_preco', 'apressado'], impactoScore: -8 },
    { id: 'parcelamento',     texto: 'Dá para parcelar sem juros?',                  perfis: ['cacador_preco', 'inseguro'], impactoScore: -6 },
    { id: 'suporte_problema', texto: 'Você garante suporte se der algum problema?',  perfis: ['inseguro', 'detalhista'], impactoScore: -10 },
    { id: 'pensar',           texto: 'Vou pensar e te aviso.',                       perfis: ['inseguro', 'detalhista'], impactoScore: -18 },
  ],
};
