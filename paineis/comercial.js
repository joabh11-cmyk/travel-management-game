// paineis/comercial.js — F3: Leads Inbox e Funil Base
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.painelComercial = (function() {

  function render(el) {
    const s = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    if (!s) return;

    // Garante que array de leads exista
    if (!s.leads) s.leads = [];

    // Header do painel
    let html = `
      <div class="section-header fade-in">
        <div>
          <h2 class="section-title">Comercial</h2>
          <p class="section-subtitle">Gestão de Leads e Pipeline de Vendas</p>
        </div>
        <div class="header-actions">
          <!-- Placeholder para ações comerciais genéricas (F4+) -->
        </div>
      </div>
    `;

    // KPIs Comerciais
    html += `
      <div class="stats-row fade-in" style="margin-bottom: 20px;">
        <div class="stat-tile">
          <div class="stat-tile-label">Leads Pendentes</div>
          <div class="stat-tile-value ${s.leads.length > 0 ? 'a' : ''}">${s.leads.length}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">Canais Ativos</div>
          <div class="stat-tile-value b">${s.canaisAtivos.length}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">Taxa Conv. Média</div>
          <div class="stat-tile-value">—</div>
        </div>
      </div>
    `;

    // GRID: Inbox de Leads e Pipeline
    html += `<div class="two-col-grid fade-in">`;

    // COLUNA 1: Inbox de Leads
    html += `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Caixa de Entrada (Leads Novos)</span>
        </div>
        <div class="leads-inbox">
    `;

    if (s.leads.length === 0) {
      html += `<div class="empty-list">Nenhum lead novo. Aguarde captação no próximo dia.</div>`;
    } else {
      s.leads.forEach(lead => {
        const pInfo = BAL.perfis[lead.perfil] || {};
        const cInfo = BAL.canais[lead.canal] || {};
        
        let validadeClass = '';
        if (lead.diasRestantes === 1) validadeClass = 'r';
        else if (lead.diasRestantes === 2) validadeClass = 'a';
        else validadeClass = 'g';

        html += `
          <div class="lead-item">
            <div class="lead-header">
              <span class="lead-nome">${lead.nome} ${pInfo.emoji || ''}</span>
              <span class="lead-canal" title="${cInfo.label}">${cInfo.emoji || '🌐'}</span>
            </div>
            <div class="lead-info">
              <div>Urgência: <span class="${validadeClass}">${lead.urgencia.toUpperCase()}</span> (${lead.diasRestantes}d)</div>
              <div>Confiança: <strong>${lead.confianca}</strong>/100</div>
            </div>
            <div class="lead-actions">
              <button class="btn-sm btn-atender" data-id="${lead.id}">Atender (1 PA)</button>
              <button class="btn-sm btn-descartar" data-id="${lead.id}">Descartar</button>
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    // COLUNA 2: Pipeline (Stub F4)
    html += `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Pipeline de Vendas</span>
        </div>
        <div class="pipeline-stub">
          <p class="empty-list">O pipeline completo e máquina de estados serão ativados em F4.</p>
        </div>
      </div>
    </div>`; // fecha two-col-grid

    el.innerHTML = html;

    // Listeners
    el.querySelectorAll('.btn-atender').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = e.target.getAttribute('data-id');
        atenderLead(leadId);
      });
    });

    el.querySelectorAll('.btn-descartar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = e.target.getAttribute('data-id');
        descartarLead(leadId);
      });
    });
  }

  function atenderLead(id) {
    const s = window.AGENCIA.getState();
    const idx = s.leads.findIndex(l => l.id === id);
    if (idx < 0) return;

    if (window.AGENCIA.loop.usarPA(1, `Atender lead ${s.leads[idx].nome}`)) {
      const lead = s.leads.splice(idx, 1)[0];
      // Em F4, isso irá para s.pipeline
      // Por enquanto, apenas contamos como recebido e damos log
      window.AGENCIA.loop.logEvento(s, 'acao', `✅ Lead ${lead.nome} atendido e movido para pipeline.`);
      
      // Criar placeholder s.pipeline se n existir (preparação F4)
      if(!s.pipeline) s.pipeline = [];
      lead.status = 'qualificando';
      s.pipeline.push(lead);

      window.AGENCIA.ui.renderizarPainelAtivo();
    }
  }

  function descartarLead(id) {
    const s = window.AGENCIA.getState();
    const idx = s.leads.findIndex(l => l.id === id);
    if (idx < 0) return;

    const lead = s.leads.splice(idx, 1)[0];
    s.perdas.push({ ...lead, motivoPerda: 'Descartado manualmente', diaPerda: s.tempo.dia });
    s.kpis.totalLeadsPerdidos++;
    
    window.AGENCIA.loop.logEvento(s, 'info', `🗑️ Lead ${lead.nome} descartado.`);
    window.AGENCIA.ui.renderizarPainelAtivo();
  }

  return { render };

})();
