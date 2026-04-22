// ============================================================
// AGÊNCIA — Pipeline Comercial e Máquina de Estados (F4)
// ============================================================
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.pipeline = (function() {

  // Estados permitidos e transições válidas
  const ESTADOS = {
    'novo':            ['qualificando', 'perdido'],
    'qualificando':    ['cotando', 'perdido'],
    'cotando':         ['cotacao_enviada', 'perdido'],
    'cotacao_enviada': ['objecao', 'ganho', 'perdido'],
    'objecao':         ['followup', 'ganho', 'perdido'],
    'followup':        ['ganho', 'perdido'],
    'ganho':           ['pos_venda'],
    'perdido':         [],
    'pos_venda':       []
  };

  function moverLead(lead, novoStatus) {
    if (!ESTADOS[lead.status].includes(novoStatus)) {
      console.warn(`Transição inválida: ${lead.status} -> ${novoStatus}`);
      return false;
    }
    lead.status = novoStatus;
    return true;
  }

  function getLead(id) {
    const s = window.AGENCIA.getState();
    if (!s) return null;
    return s.pipeline.find(l => l.id === id);
  }

  // Ação 1: Qualificar (1 PA)
  // Revela ticket potencial e urgência real
  function qualificar(id) {
    const s = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    const lead = getLead(id);
    if (!lead || lead.status !== 'qualificando') return false;

    if (!window.AGENCIA.loop.usarPA(1, `Qualificar lead ${lead.nome}`)) {
      return false;
    }

    const seg = BAL.segmentos[s.agencia.segmento];
    
    // Revelar ticket (baseado no segmento, mais ruído)
    const min = seg.ticketMin;
    const max = seg.ticketMax;
    lead.ticketPotencial = min + Math.random() * (max - min);

    // Revelar urgência real (às vezes o cliente mente)
    if (Math.random() > 0.8) {
      // 20% de chance da urgência ser diferente
      const ops = ['urgente', 'normal', 'frio'].filter(x => x !== lead.urgencia);
      lead.urgenciaReal = ops[Math.floor(Math.random() * ops.length)];
    } else {
      lead.urgenciaReal = lead.urgencia;
    }

    lead.qualificado = true;
    moverLead(lead, 'cotando');
    window.AGENCIA.loop.logEvento(s, 'acao', `🔍 Lead ${lead.nome} qualificado. Ticket potencial: R$ ${Math.round(lead.ticketPotencial).toLocaleString('pt-BR')}.`);
    return true;
  }

  // Ação 2: Enviar Cotação (1 PA)
  function enviarCotacao(id, cotacaoArgs) {
    const s = window.AGENCIA.getState();
    const lead = getLead(id);
    if (!lead || lead.status !== 'cotando') return false;

    if (!window.AGENCIA.loop.usarPA(1, `Enviar cotação para ${lead.nome}`)) {
      return false;
    }

    // Calcula margem baseada na cotação:
    // cotacaoArgs: { valorTotal, fee, custoLiquido, prazoValidadeDias }
    const receita = (cotacaoArgs.valorTotal - cotacaoArgs.custoLiquido) + cotacaoArgs.fee;
    const margem = receita / cotacaoArgs.valorTotal;

    lead.cotacao = {
      valorTotal: cotacaoArgs.valorTotal,
      fee: cotacaoArgs.fee,
      custoLiquido: cotacaoArgs.custoLiquido,
      margem: margem,
      prazoValidade: cotacaoArgs.prazoValidadeDias, // em dias no jogo
      diaEnvio: s.tempo.dia,
      expiraNoDia: s.tempo.dia + cotacaoArgs.prazoValidadeDias
    };

    moverLead(lead, 'cotacao_enviada');
    window.AGENCIA.loop.logEvento(s, 'acao', `📄 Cotação de R$ ${cotacaoArgs.valorTotal.toLocaleString('pt-BR')} enviada para ${lead.nome}. Aguardando resposta.`);
    
    return true;
  }



  // Utilitário para Perda
  function descartar(id, motivo) {
    const s = window.AGENCIA.getState();
    const lead = getLead(id);
    if (!lead) return;
    moverLead(lead, 'perdido');
    _registrarPerda(s, lead, motivo);
    window.AGENCIA.ui.renderizarPainelAtivo();
  }

  function _registrarPerda(s, lead, motivo) {
    // Remove do pipeline
    s.pipeline = s.pipeline.filter(l => l.id !== lead.id);
    s.perdas.push({ ...lead, motivoPerda: motivo, diaPerda: s.tempo.dia });
    s.kpis.totalLeadsPerdidos++;
    window.AGENCIA.loop.logEvento(s, 'info', `❌ Negócio com ${lead.nome} perdido (${motivo}).`);
  }

  function _registrarGanho(s, lead) {
    s.pipeline = s.pipeline.filter(l => l.id !== lead.id);
    s.vendas.push({ ...lead, diaVenda: s.tempo.dia });
    s.kpis.totalVendas++;
    
    if (!s.kpis.primeiraVendaDia) {
      s.kpis.primeiraVendaDia = s.tempo.dia;
      window.AGENCIA.loop.logEvento(s, 'acao', `🎉 PRIMEIRA VENDA REALIZADA NO DIA ${s.tempo.dia}!`);
    }

    // F6 será a engine econômica completa (economia.js). Em F4 simulamos a entrada de caixa simples.
    if (window.AGENCIA.economy && window.AGENCIA.economy.processarVenda) {
      window.AGENCIA.economy.processarVenda(lead.cotacao);
    } else {
      const receita = (lead.cotacao.valorTotal - lead.cotacao.custoLiquido) + lead.cotacao.fee;
      window.AGENCIA.registrarEntrada(`Venda - ${lead.nome}`, receita, 'venda');
    }

    window.AGENCIA.loop.logEvento(s, 'acao', `🏆 Venda fechada com ${lead.nome}!`);
  }

  // Verifica cotações expiradas a cada dia
  function verificarExpiracoesDiarias() {
    const s = window.AGENCIA.getState();
    if (!s || !s.pipeline) return;

    let expirados = 0;
    s.pipeline = s.pipeline.filter(lead => {
      if (lead.cotacao && lead.cotacao.expiraNoDia <= s.tempo.dia) {
        if (lead.status === 'cotacao_enviada' || lead.status === 'objecao') {
           // Expira e vira perdido
           expirados++;
           s.perdas.push({ ...lead, status: 'perdido', motivoPerda: 'Cotação expirada', diaPerda: s.tempo.dia });
           s.kpis.totalLeadsPerdidos++;
           return false;
        }
      }
      // Se está em qualificando ou cotando há muitos dias, também some
      if ((lead.status === 'qualificando' || lead.status === 'cotando') && (s.tempo.dia - lead.diaCriacao > 5)) {
        expirados++;
        s.perdas.push({ ...lead, status: 'perdido', motivoPerda: 'Esfriou (muito tempo no funil)', diaPerda: s.tempo.dia });
        s.kpis.totalLeadsPerdidos++;
        return false;
      }
      return true;
    });

    if (expirados > 0) {
      window.AGENCIA.loop.logEvento(s, 'aviso', `⏳ ${expirados} negócio(s) no pipeline expirou/esfriou.`);
    }
  }

  return {
    qualificar,
    enviarCotacao,
    descartar,
    verificarExpiracoesDiarias
  };

})();
