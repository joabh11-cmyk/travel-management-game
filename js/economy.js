// js/economy.js
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.economy = (function() {

  function calcularReceitaDaCotacao(cotacao, lead, agencia) {
    const BAL = window.AGENCIA.BAL;
    const fc = BAL.fluxoCaixa;
    
    const receitaBruta = cotacao.valorTotal; // O que o cliente paga ao fornecedor/agência
    const margemBruta = receitaBruta - cotacao.custoLiquido; // O que fica para a agência (Comissão + Fee)
    
    // O custo variável reflete taxas de cartão sobre a margem ou custos fixos de emissão
    // Vamos calcular 4% sobre a receita bruta (taxa de cartão assumida pela agência no fee) + taxa fixa
    const custoVariavel = (receitaBruta * fc.taxaCartao) + fc.custoFixoExtraPorVenda;
    
    const receitaLiquida = margemBruta - custoVariavel;
    
    return {
      receitaBruta,
      comissao: margemBruta,
      fee: cotacao.fee,
      custoVariavel,
      receitaLiquida,
      dataRecebimento: window.AGENCIA.getState().tempo.dia + fc.recebimentoDias
    };
  }

  function registrarVendaNoCaixa(lead, diaAtual) {
    const s = window.AGENCIA.getState();
    const econ = calcularReceitaDaCotacao(lead.cotacao, lead, s.agencia);
    
    // Desconta o custo variável imediatamente (no dia da venda)
    s.caixa.saldo -= econ.custoVariavel;
    s.caixa.despesas += econ.custoVariavel;
    window.AGENCIA.registrarSaida(`Custo variável (Venda ${lead.nome})`, econ.custoVariavel, 'variavel');
    window.AGENCIA.loop.logEvento(s, 'info', `💸 Custo var. de emissão debitado: R$ ${econ.custoVariavel.toLocaleString('pt-BR', {minimumFractionDigits:2})} (Venda ${lead.nome}).`);

    // Agenda a receita (Comissão + Fee) para D+X
    if (!s.caixa.receitasAgendadas) s.caixa.receitasAgendadas = [];
    s.caixa.receitasAgendadas.push({
      dia: econ.dataRecebimento,
      valor: econ.comissao,
      desc: `Comissão/Fee de ${lead.nome}`
    });

    window.AGENCIA.loop.logEvento(s, 'sucesso', `📅 Receita de R$ ${econ.comissao.toLocaleString('pt-BR', {minimumFractionDigits:2})} agendada para o Dia ${econ.dataRecebimento}.`);
    
    _checarAlertas(s);
  }

  function processarFluxoDeCaixaDiario(diaAtual) {
    const s = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;

    // 1. Custos Fixos Diários (Custo mensal / 30)
    let custoFixoDia = 0;
    for (let k in BAL.custosFixos) {
      custoFixoDia += (BAL.custosFixos[k] / 30);
    }
    
    // Dificuldade modifier
    const dif = BAL.dificuldades[s.agencia.dificuldade];
    if (dif && dif.multiplicadorPunicao) {
      custoFixoDia *= dif.multiplicadorPunicao;
    }
    
    s.caixa.saldo -= custoFixoDia;
    s.caixa.despesas += custoFixoDia;
    window.AGENCIA.registrarSaida('Custos fixos diários', custoFixoDia, 'fixo');

    // 1.1 Custo de Marketing / Captação (F8)
    let custoMktOrganico = 0;
    let custoMktSemi     = 0;
    let custoMktPago     = 0;

    if (s.agencia.canaisMarketing) {
      if (!s.kpis.custoMarketingPorCanal) s.kpis.custoMarketingPorCanal = {};
      for (let cId in s.agencia.canaisMarketing) {
        const int = s.agencia.canaisMarketing[cId];
        const cfg = BAL.canais[cId];
        if (cfg && cfg.custoPorIntensidade) {
          const c = cfg.custoPorIntensidade[int] || 0;
          if (c > 0) {
            if (cfg.tipo === 'organico') custoMktOrganico += c;
            else if (cfg.tipo === 'semi') custoMktSemi += c;
            else if (cfg.tipo === 'pago') custoMktPago += c;
            s.kpis.custoMarketingPorCanal[cId] = (s.kpis.custoMarketingPorCanal[cId] || 0) + c;
          }
        }
      }
    }
    if (custoMktOrganico > 0) {
      s.caixa.saldo -= custoMktOrganico; s.caixa.despesas += custoMktOrganico;
      window.AGENCIA.registrarSaida('Marketing Orgânico', custoMktOrganico, 'marketing');
    }
    if (custoMktSemi > 0) {
      s.caixa.saldo -= custoMktSemi; s.caixa.despesas += custoMktSemi;
      window.AGENCIA.registrarSaida('Marketing Semi-orgânico', custoMktSemi, 'marketing');
    }
    if (custoMktPago > 0) {
      s.caixa.saldo -= custoMktPago; s.caixa.despesas += custoMktPago;
      window.AGENCIA.registrarSaida('Marketing Pago', custoMktPago, 'marketing');
    }

    // 1.2 Proteção Jurídica (F8)
    const jur = s.agencia.protecaoJuridica;
    if (jur && jur.planoAtivo && jur.proximaCobranca === diaAtual) {
      const planoCfg = BAL.protecaoJuridica.planos[jur.planoAtivo];
      if (planoCfg) {
        if (s.caixa.saldo >= planoCfg.valorMensal) {
          s.caixa.saldo -= planoCfg.valorMensal;
          s.caixa.despesas += planoCfg.valorMensal;
          jur.proximaCobranca = diaAtual + 30;
          window.AGENCIA.registrarSaida(`Assinatura Jurídica: ${planoCfg.nome}`, planoCfg.valorMensal, 'fixo');
          window.AGENCIA.loop.logEvento(s, 'info', `🛡️ Proteção Jurídica renovada (R$ ${planoCfg.valorMensal}).`);
        } else {
          jur.planoAtivo = null;
          jur.usosSemanaMax = 0;
          window.AGENCIA.loop.logEvento(s, 'erro', `🚨 Proteção Jurídica cancelada por falta de saldo.`);
        }
      }
    }

    // 2. Processar Receitas Agendadas para o dia atual
    if (s.caixa.receitasAgendadas) {
      // Filtra as que são para hoje ou atrasadas
      const aReceber = s.caixa.receitasAgendadas.filter(r => r.dia <= diaAtual);
      
      aReceber.forEach(r => {
        s.caixa.saldo += r.valor;
        s.caixa.receitas += r.valor;
        window.AGENCIA.registrarEntrada(r.desc, r.valor, 'venda');
        window.AGENCIA.loop.logEvento(s, 'sucesso', `💰 Recebimento processado: R$ ${r.valor.toLocaleString('pt-BR', {minimumFractionDigits:2})} (${r.desc})`);
      });

      // Mantém apenas as futuras
      s.caixa.receitasAgendadas = s.caixa.receitasAgendadas.filter(r => r.dia > diaAtual);
    }

    // 3. Atualizar histórico semanal de gastos para Burn Rate
    if (!s.caixa.historicoDespesas) s.caixa.historicoDespesas = [];
    s.caixa.historicoDespesas.push(custoFixoDia); // Apenas fixos ou totais? Vamos colocar totais.
    // Mas o custo variavel foi descontado na hora.
    
    // Para simplificar, o burn rate pega a média das despesas dos últimos 7 dias.
    // Vamos guardar o total de despesas do dia
    // Precisaríamos zerar s.caixa.despesas todo dia se quisermos o exato do dia, 
    // mas s.caixa.despesas é acumulado. Vamos guardar a diferença.
    if (!s.caixa._ultimaDespesaAcumulada) s.caixa._ultimaDespesaAcumulada = 0;
    const despesaDoDia = s.caixa.despesas - s.caixa._ultimaDespesaAcumulada;
    s.caixa._ultimaDespesaAcumulada = s.caixa.despesas;

    if (s.caixa.historicoDespesas.length >= 7) s.caixa.historicoDespesas.shift();
    s.caixa.historicoDespesas.push(despesaDoDia);

    _checarAlertas(s);
  }

  function _checarAlertas(s) {
    const BAL = window.AGENCIA.BAL;
    if (!s.alertas) s.alertas = [];
    s.alertas = []; // limpa antigos

    // 1. Caixa Crítico
    if (s.caixa.saldo < BAL.gameOver.caixaMinimoAlerta && s.caixa.saldo >= 0) {
      s.alertas.push(`🔴 CAIXA CRÍTICO: R$ ${s.caixa.saldo.toLocaleString('pt-BR', {minimumFractionDigits:2})}.`);
      window.AGENCIA.loop.logEvento(s, 'aviso', `🔴 CAIXA CRÍTICO! Risco de Game Over se negativar por 3 dias.`);
    }

    // 2. Burn Rate alto
    const burnRate = calcularBurnRate(s);
    if (burnRate > BAL.fluxoCaixa.burnRateThreshold) {
      s.alertas.push(`🔥 BURN RATE ALTO: Gastando R$ ${burnRate.toLocaleString('pt-BR', {minimumFractionDigits:2})} por semana em média.`);
    }

    // 3. Reserva Mínima
    let custoFixoSemanal = 0;
    for (let k in BAL.custosFixos) custoFixoSemanal += (BAL.custosFixos[k] / 30) * 7;
    const reservaMinima = custoFixoSemanal * BAL.fluxoCaixa.reservaMinimaSemanas;

    if (s.caixa.saldo > 0 && s.caixa.saldo < reservaMinima) {
      s.alertas.push(`⚠️ CAIXA ABAIXO DA RESERVA: Mínimo recomendado é R$ ${reservaMinima.toLocaleString('pt-BR', {minimumFractionDigits:2})}.`);
    }

    // 4. Reputação
    if (s.agencia.reputacao <= 5) {
      s.alertas.push(`🔴 REPUTAÇÃO CRÍTICA: O mercado está perdendo a confiança em você. Corrija imediatamente!`);
    } else if (s.agencia.reputacao < 15) {
      s.alertas.push(`⚠️ REPUTAÇÃO BAIXA: Cuidado, sua marca está sofrendo no mercado.`);
    }

    // Atualiza Topbar alerts
    const topbarAlerts = document.getElementById('topbar-alerts');
    if (topbarAlerts) {
      if (s.alertas.length > 0) {
        topbarAlerts.innerHTML = s.alertas[0]; // Mostra o principal
        topbarAlerts.style.display = 'block';
      } else {
        topbarAlerts.style.display = 'none';
      }
    }
  }

  function calcularBurnRate(s) {
    if (!s.caixa.historicoDespesas || s.caixa.historicoDespesas.length === 0) return 0;
    const soma = s.caixa.historicoDespesas.reduce((a, b) => a + b, 0);
    const mediaDia = soma / s.caixa.historicoDespesas.length;
    return mediaDia * 7; // Burn rate semanal
  }

  function verificarGameOver(s) {
    const BAL = window.AGENCIA.BAL;
    
    // Lógica de Caixa Negativo
    if (s.caixa.saldo < 0) {
      s.caixa.diasNegativo = (s.caixa.diasNegativo || 0) + 1;
      window.AGENCIA.loop.logEvento(s, 'erro', `💀 CAIXA NEGATIVO (${s.caixa.diasNegativo}/${BAL.gameOver.diasCaixaNegativoParaGameOver} dias).`);
      
      if (s.caixa.diasNegativo >= BAL.gameOver.diasCaixaNegativoParaGameOver) {
        return { gameOver: true, motivo: "A agência ficou sem fluxo de caixa por dias consecutivos e não conseguiu honrar compromissos." };
      }
    } else {
      s.caixa.diasNegativo = 0;
    }

    // Lógica de Reputação
    if (s.agencia.reputacao <= 5) {
      s.agencia.diasReputacaoCritica = (s.agencia.diasReputacaoCritica || 0) + 1;
      window.AGENCIA.loop.logEvento(s, 'erro', `📉 REPUTAÇÃO CRÍTICA (${s.agencia.diasReputacaoCritica}/7 dias).`);

      if (s.agencia.diasReputacaoCritica >= 7) {
        return { gameOver: true, motivo: "Sua reputação permaneceu crítica por muito tempo. O mercado fechou as portas para sua agência." };
      }
    } else {
      s.agencia.diasReputacaoCritica = 0;
    }

    return { gameOver: false };
  }

  return {
    calcularReceitaDaCotacao,
    registrarVendaNoCaixa,
    processarFluxoDeCaixaDiario,
    calcularBurnRate,
    verificarGameOver
  };

})();
