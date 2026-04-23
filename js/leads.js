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

  function isCanalDesbloqueado(cId, s) {
    const BAL = window.AGENCIA.BAL;
    const ag = s.agencia;
    const cfg = BAL.canais[cId];
    if (!cfg) return false;
    if (cfg.disponivelDia1) return true;

    // Fase TRAÇÃO (desbloquear quando: caixa > 3.000 ou reputação > 30)
    const faseTracao = ['influenciadores', 'participacao_eventos', 'trafego_pago'];
    if (faseTracao.includes(cId)) {
      return (s.caixa.saldo >= 3000 || ag.reputacao >= 30);
    }

    // Fase ORGANIZAÇÃO (caixa > 8.000 ou reputação > 55)
    const faseOrganizacao = ['representantes', 'patrocinio', 'venda_corporativa'];
    if (faseOrganizacao.includes(cId)) {
      return (s.caixa.saldo >= 8000 || ag.reputacao >= 55);
    }

    return true; // Fallback
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

    const todosCanais = Object.keys(BAL.canais);
    todosCanais.forEach(canalId => {
      // 1. Verifica se está desbloqueado
      if (!isCanalDesbloqueado(canalId, s)) return;

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
    
    const urgRandom = Math.random();
    let urgenciaText, diasValidade, janelaDias;
    if (urgRandom < 0.25) {
      urgenciaText = 'urgente';
      diasValidade = 1;
      janelaDias = Math.floor(2 + Math.random() * 5);
    } else if (urgRandom < 0.65) {
      urgenciaText = 'normal';
      diasValidade = 2;
      janelaDias = Math.floor(7 + Math.random() * 15);
    } else {
      urgenciaText = 'frio';
      diasValidade = 3;
      janelaDias = Math.floor(20 + Math.random() * 40);
    }

    const lead = {
      id: 'L' + Date.now().toString(36) + Math.floor(Math.random()*1000),
      nome: _gerarNome(),
      canal: canalId,
      perfil: perfilId,
      urgencia: urgenciaText,
      janelaDias: janelaDias,
      diasRestantes: diasValidade,
      confianca: Math.round(confiancaBase),
      diaCriacao: s.tempo.dia,
      status: 'novo',
      segmento: s.agencia.segmento // Salva o segmento no lead para referência
    };

    // Gera detalhes da viagem
    const segmento = s.agencia.segmento;
    lead.detalhesViagem = {
      origem: _sortearCidade(),
      destino: _sortearDestino(segmento),
      dataPartidaEmDias: lead.janelaDias,
      duracaoDias: segmento === 'lazernacional' ? Math.floor(5 + Math.random() * 6)
                 : segmento === 'laserinternacional' ? Math.floor(8 + Math.random() * 7)
                 : Math.floor(3 + Math.random() * 5),
      passageiros: 1 + Math.floor(Math.random() * 3),
      inclusoAereo:    Math.random() < (segmento === 'lazernacional' ? 0.90 : 0.95),
      inclusoHotel:    Math.random() < 0.85,
      inclusoSeguro:   Math.random() < 0.40,
      inclusoTransfer: Math.random() < 0.30,
      observacoes: []
    };

    // Lead corporativo
    if (canalId === 'venda_corporativa') {
      lead.isCorporativo = true;
      lead.multiplicadorTicket = 2.5 + Math.random() * 1.5;
      const corpPerfis = ['detalhista', 'apressado'];
      lead.perfil = corpPerfis[Math.floor(Math.random() * corpPerfis.length)];
    }

    s.leads.push(lead);
  }

  function _sortearCidade() {
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Fortaleza', 'Recife', 'Curitiba', 'Porto Alegre', 'Brasília', 'Manaus', 'Belém', 'Florianópolis'];
    return cidades[Math.floor(Math.random() * cidades.length)];
  }

  function _sortearDestino(segmento) {
    const destinos = {
      lazernacional: ['Florianópolis', 'Porto de Galinhas', 'Natal', 'Gramado', 'Foz do Iguaçu', 'Búzios', 'Maceió', 'Bonito', 'Bariloche BR', 'Chapada dos Veadeiros'],
      laserinternacional: ['Orlando', 'Lisboa', 'Paris', 'Cancún', 'Buenos Aires', 'Miami', 'Roma', 'Londres', 'Punta Cana', 'Nova York'],
      economico: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Fortaleza', 'Curitiba']
    };
    const lista = destinos[segmento] || destinos.economico;
    return lista[Math.floor(Math.random() * lista.length)];
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
    expirarLeadsDia,
    isCanalDesbloqueado
  };

})();
