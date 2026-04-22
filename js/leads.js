// ============================================================
// AGÊNCIA — Gerenciador de Leads (F3)
// ============================================================
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.leads = (function() {

  // Nomes gerados aleatoriamente para dar sabor
  const nomes = ['Ana', 'Carlos', 'Beatriz', 'Daniel', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Juliana', 'Lucas', 'Mariana', 'Nicolas', 'Olivia', 'Paulo', 'Raquel', 'Samuel', 'Tatiana', 'Vinicius', 'Yasmin'];
  const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Alves', 'Ribeiro', 'Carvalho', 'Lopes'];

  // Gera um nome aleatório
  function _gerarNome() {
    const n = nomes[Math.floor(Math.random() * nomes.length)];
    const s = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    return n + ' ' + s;
  }

  // Escolhe perfil baseado na chance (roleta viciada)
  function _sortearPerfil(BAL) {
    const perfis = BAL.perfis;
    const chaves = Object.keys(perfis);
    let random = Math.random();
    for (let c of chaves) {
      if (random < perfis[c].chance) return c;
      random -= perfis[c].chance;
    }
    return chaves[0]; // fallback
  }

  // Gera leads do dia com base nos canais ativos, sazonalidade, dificuldade, modo
  function gerarLeadsDia() {
    const s = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    if (!s) return;

    const ag = s.agencia;
    const dif = BAL.dificuldades[ag.dificuldade];
    const mod = BAL.modos[ag.modo];
    const mesIdx = ((s.tempo.mes - 1) % 12) + 1;
    const sazonalidade = BAL.sazonalidade[mesIdx] || 1.0;

    let leadsGeradosHoje = 0;

    s.canaisAtivos.forEach(canalId => {
      const canal = BAL.canais[canalId];
      if (!canal) return;

      // Sorteia valor base do canal com base na intensidade (F8)
      const intensidade = s.agencia.canaisMarketing ? (s.agencia.canaisMarketing[canalId] || 'medio') : 'medio';
      const faixa = canal.faixasLeads ? (canal.faixasLeads[intensidade] || canal.leadsDia) : canal.leadsDia;
      
      const baseChance = faixa.min + Math.random() * (faixa.max - faixa.min);
      
      // Aplica multiplicadores
      let chanceFinal = baseChance * dif.multiplicadorLeads * mod.multiplicadorLeads * sazonalidade;

      // Bônus de reputação no boca a boca
      if (canalId === 'boca_a_boca') {
        const repBonus = (ag.reputacao - 50) / 100; // Se rep > 50, bônus. Se < 50, penalidade.
        chanceFinal *= (1 + repBonus * 0.5); // Max +25% ou -25%
        chanceFinal = Math.max(0, chanceFinal);
      }

      let novosLeads = Math.floor(chanceFinal);
      const fracao = chanceFinal - novosLeads;
      if (Math.random() < fracao) novosLeads++;

      for (let i = 0; i < novosLeads; i++) {
        _criarNovoLead(canalId, canal, s, BAL);
        leadsGeradosHoje++;
      }
    });

    s.kpis.totalLeadsRecebidos += leadsGeradosHoje;

    if (leadsGeradosHoje > 0) {
      window.AGENCIA.loop.logEvento(s, 'info', `🎯 ${leadsGeradosHoje} novo(s) lead(s) captado(s) hoje.`);
    }
  }

  function _criarNovoLead(canalId, canalConfig, s, BAL) {
    // Confiança do canal
    const confiancaBase = canalConfig.confianca.min + Math.random() * (canalConfig.confianca.max - canalConfig.confianca.min);
    
    // Perfil
    const perfilId = _sortearPerfil(BAL);
    
    // Urgência: 1 (urgente), 2 (normal), 3 (frio)
    const urgRandom = Math.random();
    let urgenciaText, diasValidade;
    if (urgRandom < 0.25) {
      urgenciaText = 'urgente';
      diasValidade = 1;
    } else if (urgRandom < 0.65) {
      urgenciaText = 'normal';
      diasValidade = 2;
    } else {
      urgenciaText = 'frio';
      diasValidade = 3;
    }

    const lead = {
      id: 'L' + Date.now().toString(36) + Math.floor(Math.random()*1000),
      nome: _gerarNome(),
      canal: canalId,
      perfil: perfilId,
      urgencia: urgenciaText,
      diasRestantes: diasValidade,
      confianca: Math.round(confiancaBase),
      diaCriacao: s.tempo.dia,
      status: 'novo'
    };

    s.leads.push(lead);
  }

  // Reduz validade e expira leads não atendidos
  function expirarLeadsDia() {
    const s = window.AGENCIA.getState();
    if (!s) return;

    let expirados = 0;
    
    // Filtra leads que ainda não foram pro pipeline (status 'novo')
    s.leads = s.leads.filter(lead => {
      lead.diasRestantes--;
      if (lead.diasRestantes <= 0) {
        expirados++;
        s.perdas.push({ ...lead, motivoPerda: 'Tempo expirado (não atendido)', diaPerda: s.tempo.dia });
        s.kpis.totalLeadsPerdidos++;
        return false;
      }
      return true;
    });

    if (expirados > 0) {
      window.AGENCIA.loop.logEvento(s, 'aviso', `⏳ ${expirados} lead(s) expirou/expiraram por falta de atendimento.`);
    }
  }

  return {
    gerarLeadsDia,
    expirarLeadsDia
  };

})();
