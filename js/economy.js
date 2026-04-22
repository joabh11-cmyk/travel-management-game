// js/economy.js — stub F6
window.AGENCIA = window.AGENCIA || {};
window.AGENCIA.economy = {
  calcularCustoFixoDiario: function() {
    const BAL = window.AGENCIA.BAL;
    const total = Object.values(BAL.custosFixos).reduce((a, b) => a + b, 0);
    return Math.round(total / 30);
  },
  calcularReceita: function(cotacao, segmento, modo) { return cotacao?.fee || 0; },
};
