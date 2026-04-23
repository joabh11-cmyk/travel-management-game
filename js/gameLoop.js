// ============================================================
// AGÊNCIA — Game Loop (F2)
// Motor de tempo: dias, PA, custos fixos, fechamentos
// Regra de Ouro: 1ª venda possível antes do dia 7 sem ser garantida
// ============================================================
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.loop = (function() {

  // ----------------------------------------------------------
  // AVANÇAR DIA — orquestrador principal
  // ----------------------------------------------------------
  function avancarDia() {
    const s   = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    if (!s || s.gameOver) return;

    // 1. Incrementar tempo
    s.tempo.dia++;
    s.tempo.diaSemana = ((s.tempo.dia - 1) % 7) + 1; // 1=Seg … 7=Dom
    s.tempo.semana    = Math.ceil(s.tempo.dia / 7);
    s.tempo.mes       = Math.ceil(s.tempo.dia / 28);

    // 2. Inicializar log do dia
    _iniciarLogDia(s);

    // 3. Aplicar economia F6 (custos fixos, recebimentos agendados, alertas)
    if (window.AGENCIA.economy) {
      window.AGENCIA.economy.processarFluxoDeCaixaDiario(s.tempo.dia);
    }

    // 3.b Sorteio de Eventos (Fase 7)
    if (window.AGENCIA.events) {
      window.AGENCIA.events.sortearEventosDoDia(s.tempo.dia, s);
    }

    // 4. Atualizar fadiga do dono (1 ponto por dia de operação)
    _atualizarFadiga(s, BAL);

    // 5. Resetar PA com base na fadiga
    _resetarPA(s, BAL);

    // 5.b. Atualizar Leads (F3)
    if (window.AGENCIA.leads) {
      window.AGENCIA.leads.expirarLeadsDia();
      window.AGENCIA.leads.gerarLeadsDia();
    }

    // 5.c. Expirar leads no pipeline (F4)
    if (window.AGENCIA.pipeline) {
      window.AGENCIA.pipeline.verificarExpiracoesDiarias();
    }

    // 6. Fechamentos periódicos
    let resultado = null;
    if (s.tempo.dia % 7 === 0) {
      resultado = _fechamentoSemanal(s, BAL);
    }
    if (s.tempo.dia % 28 === 0) {
      resultado = _fechamentoMensal(s, BAL);
    }

    // 7. Verificar game over
    if (window.AGENCIA.economy && window.AGENCIA.economy.verificarGameOver) {
      const go = window.AGENCIA.economy.verificarGameOver(s);
      if (go && go.gameOver) {
        s.gameOver = true;
        s.gameOverMotivo = go.motivo;
        
        if (window.AGENCIA.save && window.AGENCIA.save.limparSaveLocal) {
          window.AGENCIA.save.limparSaveLocal();
        }

        if (window.AGENCIA.ui.mostrarGameOver) {
          window.AGENCIA.ui.mostrarGameOver(go.motivo);
        }
        return;
      }
    }

    // 8. Atualizar topbar
    window.AGENCIA.ui.atualizarTopbar();

    // 9. Mostrar modal de fechamento (após topbar atualizada)
    if (resultado) {
      window.AGENCIA.ui.mostrarModal(resultado);
    }

    // 10. Re-renderizar painel ativo
    window.AGENCIA.ui.renderizarPainelAtivo();

    // 11. Auto-save
    if (window.AGENCIA.save && window.AGENCIA.save.autoSave) {
      window.AGENCIA.save.autoSave();
    }
  }

  // ----------------------------------------------------------
  // CONSUMIR PA — retorna true se ação bem-sucedida
  // ----------------------------------------------------------
  function usarPA(custo, descricaoAcao) {
    const s = window.AGENCIA.getState();
    if (!s) return false;

    if (s.pa.disponivel < custo) {
      _logEvento(s, 'aviso', `⚡ PA insuficiente para "${descricaoAcao}" (custo: ${custo} PA, disponível: ${s.pa.disponivel})`);
      return false;
    }

    s.pa.disponivel -= custo;
    s.pa.usados     += custo;

    _logEvento(s, 'acao', `→ ${descricaoAcao} (−${custo} PA)`);
    window.AGENCIA.ui.atualizarTopbar();

    // Auto-save
    if (window.AGENCIA.save && window.AGENCIA.save.autoSave) {
      window.AGENCIA.save.autoSave();
    }

    return true;
  }

  // ----------------------------------------------------------
  // VERIFICAR SE TEM PA DISPONÍVEL
  // ----------------------------------------------------------
  function podeUsarPA(custo) {
    const s = window.AGENCIA.getState();
    return s && s.pa.disponivel >= custo;
  }



  // ----------------------------------------------------------
  // FADIGA E PA
  // ----------------------------------------------------------
  function _atualizarFadiga(s, BAL) {
    const ag = s.agencia;

    // +1 fadiga por dia normal; +0.5 se ficou PA sobrando (descansou um pouco)
    const paRestante = s.pa.disponivel;
    const incremento = paRestante >= 4 ? 0.5 : 1.0;
    ag.fadiga = Math.min(100, ag.fadiga + incremento);

    if (ag.fadiga >= 80) {
      _logEvento(s, 'aviso', `😓 Fadiga elevada (${Math.round(ag.fadiga)}/100) — produtividade comprometida`);
    }
  }

  function _resetarPA(s, BAL) {
    const fadiga   = s.agencia.fadiga;
    const paConfig = BAL.pa;
    let maximo     = paConfig.porDia;

    if (fadiga >= paConfig.fadigaReducao2) {
      maximo = paConfig.paFadiga2;
    } else if (fadiga >= paConfig.fadigaReducao1) {
      maximo = paConfig.paFadiga1;
    }

    // Brasil Real tem 1 PA a menos
    if (s.agencia.modo === 'brasil_real') maximo = Math.max(1, maximo - 1);

    s.pa.disponivel = maximo;
    s.pa.maximo     = maximo;
    s.pa.usados     = 0;

    _logEvento(s, 'info', `☀️ Dia ${s.tempo.dia} iniciado — ${maximo} PA disponíveis`);
  }

  // ----------------------------------------------------------
  // LOG DO DIA
  // ----------------------------------------------------------
  function _iniciarLogDia(s) {
    if (!s.logDias) s.logDias = [];
    s.logDiaAtual = { dia: s.tempo.dia, eventos: [] };
    s.logDias.push(s.logDiaAtual);
    // Manter apenas os últimos 14 dias em memória
    if (s.logDias.length > 14) s.logDias.shift();
  }

  function _logEvento(s, tipo, msg) {
    if (!s.logDiaAtual) {
      s.logDiaAtual = { dia: s.tempo.dia, eventos: [] };
      if (!s.logDias) s.logDias = [];
      s.logDias.push(s.logDiaAtual);
    }
    s.logDiaAtual.eventos.push({ tipo: tipo, msg: msg, ts: Date.now() });
  }

  // ----------------------------------------------------------
  // FECHAMENTO SEMANAL
  // ----------------------------------------------------------
  function _fechamentoSemanal(s, BAL) {
    const semana       = s.tempo.semana;
    const diaInicio    = (semana - 1) * 7 + 1;
    const diaFim       = semana * 7;

    const entradas = s.caixa.entradas
      .filter(e => e.dia >= diaInicio && e.dia <= diaFim);
    const saidas = s.caixa.saidas
      .filter(e => e.dia >= diaInicio && e.dia <= diaFim);

    const totalEntradas = entradas.reduce(function(a, e) { return a + e.valor; }, 0);
    const totalSaidas   = saidas.reduce(function(a, e) { return a + e.valor; }, 0);
    const resultado     = totalEntradas - totalSaidas;

    // Leads/vendas da semana
    const vendasSemana = (s.vendas || []).filter(v => v.diaFechamento >= diaInicio && v.diaFechamento <= diaFim).length;
    const perdasSemana = (s.perdas || []).filter(p => p.dia >= diaInicio && p.dia <= diaFim).length;
    const leadsGerados = (s.kpis.totalLeadsRecebidos || 0); // Acumulado (simplificado)

    // Ajuste de reputação
    const ajusteRep = resultado >= 0 ? 1 : -1;
    s.agencia.reputacao = Math.max(0, Math.min(100, s.agencia.reputacao + ajusteRep));

    // KPI
    if (totalEntradas > s.kpis.melhorSemanaReceita) {
      s.kpis.melhorSemanaReceita = totalEntradas;
    }

    // Margem da semana
    const margemPct = totalEntradas > 0 ? ((resultado / totalEntradas) * 100).toFixed(1) : '0.0';

    // Alerta e recomendação
    let alertaPrincipal = '';
    let recomendacao    = '';
    if (resultado < 0) {
      alertaPrincipal = '🔴 Semana com resultado negativo. Verifique custos fixos e margens das vendas.';
      recomendacao    = 'Priorize fechar pelo menos 1 venda de maior margem na próxima semana para estabilizar o caixa.';
    } else if (vendasSemana === 0) {
      alertaPrincipal = '⚠️ Semana sem conversão. Custo fixo continua consumindo o caixa.';
      recomendacao    = 'Revise o pipeline e identifique leads prontos para fechar. Considere follow-up ativo.';
    } else if (parseFloat(margemPct) < 10) {
      alertaPrincipal = '⚠️ Margem baixa — você está vendendo, mas quase no prejuízo.';
      recomendacao    = 'Evite ceder descontos e revise as cotações. Aumente o fee nos próximos pacotes.';
    } else {
      alertaPrincipal = '✅ Semana positiva. Saldo crescendo.';
      recomendacao    = resultado > 300 ? 'Excelente resultado! Continue qualificando leads e avance no pipeline.' : 'Bom resultado. Mantenha o ritmo e atente ao burn rate.';
    }

    // Salvar relatório
    if (!s.relatorios) s.relatorios = { semanal: [], mensal: [] };
    s.relatorios.semanal.push({
      semana, totalEntradas, totalSaidas, resultado,
      saldoFinal: s.caixa.saldo,
    });

    // Reset de proteção jurídica (F8)
    if (s.agencia.protecaoJuridica) {
      s.agencia.protecaoJuridica.usosSemanaAtual = 0;
    }

    return {
      tipo:             'semanal',
      titulo:           `Semana ${semana} — Fechamento`,
      receitas:         totalEntradas,
      despesas:         totalSaidas,
      resultado:        resultado,
      margemPct:        margemPct,
      saldo:            s.caixa.saldo,
      ajusteRep:        ajusteRep,
      reputacao:        s.agencia.reputacao,
      fadiga:           s.agencia.fadiga,
      vendasSemana:     vendasSemana,
      perdasSemana:     perdasSemana,
      alertaPrincipal:  alertaPrincipal,
      recomendacao:     recomendacao,
    };
  }

  // ----------------------------------------------------------
  // FECHAMENTO MENSAL
  // ----------------------------------------------------------
  function _fechamentoMensal(s, BAL) {
    const mes       = s.tempo.mes;
    const diaInicio = (mes - 1) * 28 + 1;
    const diaFim    = mes * 28;

    const totalEntradas = s.caixa.entradas
      .filter(e => e.dia >= diaInicio && e.dia <= diaFim)
      .reduce(function(a, e) { return a + e.valor; }, 0);
    const totalSaidas = s.caixa.saidas
      .filter(e => e.dia >= diaInicio && e.dia <= diaFim)
      .reduce(function(a, e) { return a + e.valor; }, 0);
    const resultado = totalEntradas - totalSaidas;

    // Descanso mensal: -5 fadiga se saldo positivo
    if (resultado >= 0) {
      s.agencia.fadiga = Math.max(0, s.agencia.fadiga - 5);
    }

    // Salvar relatório
    if (!s.relatorios) s.relatorios = { semanal: [], mensal: [] };
    s.relatorios.mensal.push({
      mes, totalEntradas, totalSaidas, resultado,
      saldoFinal: s.caixa.saldo,
      totalVendas: s.kpis.totalVendas,
    });

    return {
      tipo:       'mensal',
      titulo:     `Mês ${mes} — Balanço Mensal`,
      receitas:   totalEntradas,
      despesas:   totalSaidas,
      resultado:  resultado,
      saldo:      s.caixa.saldo,
      totalVendas: s.kpis.totalVendas,
      reputacao:  s.agencia.reputacao,
      fadiga:     s.agencia.fadiga,
    };
  }

  // ----------------------------------------------------------
  // HELPER: formatar número
  // ----------------------------------------------------------
  function _fmt(n) {
    return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ----------------------------------------------------------
  // API pública
  // ----------------------------------------------------------
  return {
    avancarDia:  avancarDia,
    usarPA:      usarPA,
    podeUsarPA:  podeUsarPA,
    logEvento:   _logEvento,   // exposto para F3+ usarem
  };

})();
