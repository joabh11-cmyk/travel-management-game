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

    const totalLeadsProcessados = (s.kpis.totalVendas || 0) + (s.kpis.totalLeadsPerdidos || 0);
    const taxaConv = totalLeadsProcessados > 0 ? ((s.kpis.totalVendas / totalLeadsProcessados) * 100).toFixed(1) + '%' : '0.0%';

    // KPIs Comerciais
    html += `
      <div class="stats-row fade-in" style="margin-bottom: 20px;">
        <div class="stat-tile">
          <div class="stat-tile-label">Leads Pendentes</div>
          <div class="stat-tile-value ${s.leads.length > 0 ? 'a' : ''}">${s.leads.length}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">Canais Ativos</div>
          <div class="stat-tile-value b">${s.canaisAtivos ? s.canaisAtivos.length : 0}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">Taxa Conv. Média</div>
          <div class="stat-tile-value">${taxaConv}</div>
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

    // COLUNA 2: Pipeline
    html += `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Pipeline de Vendas (${s.pipeline ? s.pipeline.length : 0})</span>
        </div>
        <div class="pipeline-list">
    `;

    if (!s.pipeline || s.pipeline.length === 0) {
      html += `<div class="empty-list">Nenhum negócio em andamento. Atenda leads da caixa de entrada.</div>`;
    } else {
      s.pipeline.forEach(lead => {
        const pInfo = BAL.perfis[lead.perfil] || {};
        
        let statusLabel = lead.status.toUpperCase();
        let statusClass = 'b';
        if (lead.status === 'objecao') { statusLabel = 'OBJEÇÃO'; statusClass = 'a'; }
        if (lead.status === 'cotacao_enviada') { statusLabel = 'AGUARD. CLIENTE'; statusClass = 'g'; }

        html += `
          <div class="lead-item" style="border-left-color: var(--${statusClass === 'b' ? 'blue' : statusClass === 'a' ? 'amber' : 'green'})">
            <div class="lead-header">
              <span class="lead-nome">${lead.nome} ${pInfo.emoji || ''}</span>
              <span class="badge ${statusClass === 'a' ? 'badge-warn' : ''}">${statusLabel}</span>
            </div>
            <div class="lead-info" style="flex-direction: column; gap: 4px;">
              ${lead.qualificado ? `<div>Ticket: <strong>${(lead.ticketPotencial || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</strong></div>` : `<div>Ticket: <em>(Requer qualificação)</em></div>`}
              <div>Urgência Real: <strong>${(lead.urgenciaReal || lead.urgencia).toUpperCase()}</strong></div>
              <div>Confiança: <strong>${lead.confianca}</strong>/100</div>
              ${lead.cotacao ? `<div style="margin-top:4px; padding-top:4px; border-top:1px dashed var(--border)">
                Cotação: ${(lead.cotacao.valorTotal).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} (Fee: R$ ${lead.cotacao.fee})<br>
                Expira dia: ${lead.cotacao.expiraNoDia}
              </div>` : ''}
              ${lead.objecaoAtual ? `<div style="color:var(--amber); margin-top:4px;">💬 "${lead.objecaoAtual}"</div>` : ''}
            </div>
            <div class="lead-actions" id="actions-${lead.id}">
              <!-- Ações renderizadas dinamicamente via JS abaixo -->
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    </div>`; // fecha two-col-grid

    el.innerHTML = html;

    // Listeners para Caixa de Entrada
    el.querySelectorAll('.btn-atender').forEach(btn => {
      btn.addEventListener('click', (e) => { atenderLead(e.target.getAttribute('data-id')); });
    });
    el.querySelectorAll('.btn-descartar').forEach(btn => {
      btn.addEventListener('click', (e) => { descartarLead(e.target.getAttribute('data-id')); });
    });

    // Injeta ações específicas para o pipeline
    if (s.pipeline) {
      s.pipeline.forEach(lead => {
        const container = el.querySelector(`#actions-${lead.id}`);
        if (!container) return;
        
        let actsHTML = '';
        if (lead.status === 'qualificando') {
          actsHTML = `
            <button class="btn-sm btn-qualificar" data-id="${lead.id}" style="background:var(--blue); color:#fff; border-color:var(--blue)">Qualificar (1 PA)</button>
            <button class="btn-sm btn-descartar-pipe" data-id="${lead.id}">Descartar</button>
          `;
        } else if (lead.status === 'cotando') {
          actsHTML = `
            <button class="btn-sm btn-cotar" data-id="${lead.id}" style="background:var(--green); color:#fff; border-color:var(--green)">Criar Cotação (1 PA)</button>
            <button class="btn-sm btn-descartar-pipe" data-id="${lead.id}">Descartar</button>
          `;
        } else if (lead.status === 'cotacao_enviada') {
          actsHTML = `
            <button class="btn-sm btn-ver-resposta" data-id="${lead.id}" style="background:var(--blue); color:#fff; border-color:var(--blue)">Ver resposta do cliente</button>
            <button class="btn-sm btn-descartar-pipe" data-id="${lead.id}">Descartar</button>
          `;
        } else if (lead.status === 'objecao') {
          actsHTML = `
            <button class="btn-sm btn-followup" data-id="${lead.id}" style="background:var(--amber); color:#000; border-color:var(--amber)">Responder Objeção</button>
            <button class="btn-sm btn-descartar-pipe" data-id="${lead.id}">Descartar</button>
          `;
        }
        
        container.innerHTML = actsHTML;
      });

      // Listeners do pipeline
      el.querySelectorAll('.btn-qualificar').forEach(btn => {
        btn.addEventListener('click', (e) => { 
          window.AGENCIA.pipeline.qualificar(e.target.getAttribute('data-id'));
          render(el);
        });
      });
      el.querySelectorAll('.btn-descartar-pipe').forEach(btn => {
        btn.addEventListener('click', (e) => { 
          window.AGENCIA.pipeline.descartar(e.target.getAttribute('data-id'), 'Descartado manualmente');
          render(el);
        });
      });
      el.querySelectorAll('.btn-cotar').forEach(btn => {
        btn.addEventListener('click', (e) => { 
          const id = e.target.getAttribute('data-id');
          abrirModalCotacao(id, el);
        });
      });
      el.querySelectorAll('.btn-ver-resposta').forEach(btn => {
        btn.addEventListener('click', (e) => { 
          const id = e.target.getAttribute('data-id');
          const lead = s.pipeline.find(l => l.id === id);
          if(lead) {
            avaliarEProcessarDecisao(lead, el);
          }
        });
      });
      el.querySelectorAll('.btn-followup').forEach(btn => {
        btn.addEventListener('click', (e) => { 
          const id = e.target.getAttribute('data-id');
          const lead = s.pipeline.find(l => l.id === id);
          if (lead) {
            abrirModalObjecao(lead, lead.objecaoAtual, el);
          }
        });
      });
    }
  }

  function atenderLead(id) {
    const s = window.AGENCIA.getState();
    const idx = s.leads.findIndex(l => l.id === id);
    if (idx < 0) return;

    if (window.AGENCIA.loop.usarPA(1, `Atender lead ${s.leads[idx].nome}`)) {
      const lead = s.leads.splice(idx, 1)[0];
      if(!s.pipeline) s.pipeline = [];
      lead.status = 'qualificando';
      s.pipeline.push(lead);
      window.AGENCIA.loop.logEvento(s, 'acao', `✅ Lead ${lead.nome} atendido e movido para pipeline.`);
      window.AGENCIA.ui.renderizarPainelAtivo();
    }
  }

  function abrirModalCotacao(id, parentEl) {
    const s = window.AGENCIA.getState();
    const lead = s.pipeline.find(l => l.id === id);
    if(!lead) return;

    const BAL = window.AGENCIA.BAL;
    const seg = BAL.segmentos[s.agencia.segmento];
    const ticketSugerido = lead.ticketPotencial ? lead.ticketPotencial : (seg.ticketMin + seg.ticketMax)/2;

    const modalId = 'modal-cotacao';
    let old = document.getElementById(modalId);
    if(old) old.remove();

    const el = document.createElement('div');
    el.id = modalId;
    el.className = 'modal-overlay';
    el.innerHTML = `
      <div class="modal-box fade-in">
        <div class="modal-header">
          <div class="modal-tipo">CRIAR COTAÇÃO</div>
          <div class="modal-titulo">Para ${lead.nome}</div>
        </div>
        <div class="modal-body">
          <div style="font-size:12px; color:var(--text-2); margin-bottom:16px;">
            Dica: O ticket potencial mapeado é de aprox. R$ ${Math.round(ticketSugerido).toLocaleString('pt-BR')}.
          </div>
          
          <div class="field-group" style="margin-bottom:12px;">
            <label class="field-label">Valor Total do Pacote (R$)</label>
            <input type="number" id="c-valor" class="field-input" value="${Math.round(ticketSugerido)}">
          </div>
          <div class="field-group" style="margin-bottom:12px;">
            <label class="field-label">Custo Líquido para a Agência (R$)</label>
            <input type="number" id="c-custo" class="field-input" value="${Math.round(ticketSugerido * 0.85)}">
          </div>
          <div class="field-group" style="margin-bottom:12px;">
            <label class="field-label">Fee de Serviço (R$)</label>
            <input type="number" id="c-fee" class="field-input" value="150">
          </div>
          <div class="field-group" style="margin-bottom:12px;">
            <label class="field-label">Validade (Dias)</label>
            <input type="number" id="c-prazo" class="field-input" value="3" min="1" max="15">
          </div>
          
          <div id="c-calc" style="font-size:11px; color:var(--green); font-family:var(--font-mono); font-weight:700;"></div>
        </div>
        <div class="modal-footer" style="gap:8px;">
          <button class="btn-sm" id="btn-cancel-c">Cancelar</button>
          <button class="btn-start" id="btn-send-c" style="padding:8px 16px;">Enviar (1 PA)</button>
        </div>
      </div>
    `;

    document.body.appendChild(el);

    const calcEl = document.getElementById('c-calc');
    const fValor = document.getElementById('c-valor');
    const fCusto = document.getElementById('c-custo');
    const fFee = document.getElementById('c-fee');

    function updateCalc() {
      const v = Number(fValor.value);
      const c = Number(fCusto.value);
      const f = Number(fFee.value);
      const receita = (v - c) + f;
      const margem = v > 0 ? (receita / v) * 100 : 0;
      calcEl.textContent = `Receita Estimada: R$ ${receita.toLocaleString('pt-BR')} (Margem: ${margem.toFixed(1)}%)`;
    }

    fValor.addEventListener('input', updateCalc);
    fCusto.addEventListener('input', updateCalc);
    fFee.addEventListener('input', updateCalc);
    updateCalc();

    document.getElementById('btn-cancel-c').addEventListener('click', () => el.remove());
    document.getElementById('btn-send-c').addEventListener('click', () => {
      const args = {
        valorTotal: Number(fValor.value),
        custoLiquido: Number(fCusto.value),
        fee: Number(fFee.value),
        prazoValidadeDias: Number(document.getElementById('c-prazo').value)
      };
      
      if(args.valorTotal <= args.custoLiquido) {
        alert("O valor total não pode ser menor ou igual ao custo líquido!");
        return;
      }
      
      if (window.AGENCIA.pipeline.enviarCotacao(id, args)) {
        el.remove();
        render(parentEl);
      }
    });
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

  function avaliarEProcessarDecisao(lead, parentEl) {
    const s = window.AGENCIA.getState();
    const res = window.AGENCIA.clientAI.avaliarCotacao(lead, lead.cotacao, s.agencia, s);
    
    if (res.decisao === 'ganho') {
      window.AGENCIA.loop.logEvento(s, 'sucesso', `🎉 ${lead.nome} fechou o pacote! "${res.mensagemCliente}"`);
      s.kpis.totalVendas++;
      s.agencia.reputacao = Math.min(100, s.agencia.reputacao + 1);
      
      // Contabilidade usando engine F6
      if (window.AGENCIA.economy) {
        window.AGENCIA.economy.registrarVendaNoCaixa(lead, s.tempo.dia);
      }
      
      s.pipeline = s.pipeline.filter(l => l.id !== lead.id);
      window.AGENCIA.ui.renderizarPainelAtivo();
    } else if (res.decisao === 'perdido') {
      window.AGENCIA.loop.logEvento(s, 'erro', `❌ ${lead.nome} recusou a cotação: "${res.mensagemCliente}"`);
      s.perdas.push({ ...lead, motivoPerda: res.motivo, diaPerda: s.tempo.dia });
      s.kpis.totalLeadsPerdidos++;
      
      s.pipeline = s.pipeline.filter(l => l.id !== lead.id);
      window.AGENCIA.ui.renderizarPainelAtivo();
    } else if (res.decisao === 'objecao') {
      lead.status = 'objecao';
      lead.objecaoAtual = res.mensagemCliente;
      window.AGENCIA.loop.logEvento(s, 'aviso', `⚠️ ${lead.nome} fez uma objeção: "${res.mensagemCliente}"`);
      
      abrirModalObjecao(lead, res.mensagemCliente, parentEl);
    }
  }

  function abrirModalObjecao(lead, mensagemCliente, parentEl) {
    const s = window.AGENCIA.getState();
    const objId = lead.objecaoId;
    const objData = window.AGENCIA.BAL.objecoes.find(o => o.id === objId);
    
    if (!objData) return;

    const modalId = 'modal-objecao';
    let old = document.getElementById(modalId);
    if(old) old.remove();

    const el = document.createElement('div');
    el.id = modalId;
    el.className = 'modal-overlay';
    
    let respostasHtml = objData.respostas.map(r => `
      <button class="btn-start btn-resposta-obj" data-resp="${r.id}" style="margin-bottom:8px; width:100%; text-align:left; background:var(--bg-card); border-color:var(--border); color:var(--text); padding:10px;">
        ${r.label} <span style="color:var(--amber); font-weight:bold;">(1 PA)</span>
      </button>
    `).join('');

    el.innerHTML = `
      <div class="modal-box fade-in">
        <div class="modal-header" style="border-color:var(--amber);">
          <div class="modal-tipo" style="color:var(--amber);">NOVA OBJEÇÃO</div>
          <div class="modal-titulo">Cliente: ${lead.nome}</div>
        </div>
        <div class="modal-body">
          <div style="font-style:italic; padding:12px; background:var(--bg-body); border-left:4px solid var(--amber); margin-bottom:16px;">
            "${mensagemCliente}"
          </div>
          <p style="font-size:12px; color:var(--text-2); margin-bottom:12px;">Como você deseja responder?</p>
          ${respostasHtml}
        </div>
        <div class="modal-footer" style="gap:8px;">
          <button class="btn-sm" id="btn-cancel-obj">Decidir depois</button>
        </div>
      </div>
    `;

    document.body.appendChild(el);

    document.getElementById('btn-cancel-obj').addEventListener('click', () => {
      el.remove();
      render(parentEl);
    });

    el.querySelectorAll('.btn-resposta-obj').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const respBtn = e.target.closest('.btn-resposta-obj');
        if (!window.AGENCIA.loop.usarPA(1, `Responder objeção de ${lead.nome}`)) {
          return;
        }
        
        const respId = respBtn.getAttribute('data-resp');
        const novoRes = window.AGENCIA.clientAI.processarRespostaObjecao(lead, lead.cotacao, s.agencia, s, respId);
        
        el.remove();
        
        if (novoRes.decisao === 'ganho') {
          window.AGENCIA.loop.logEvento(s, 'sucesso', `🎉 Contornou objeção! ${lead.nome} fechou o pacote!`);
          s.kpis.totalVendas++;
          s.agencia.reputacao = Math.min(100, s.agencia.reputacao + 1);
          if (window.AGENCIA.economy) {
            window.AGENCIA.economy.registrarVendaNoCaixa(lead, s.tempo.dia);
          }
          s.pipeline = s.pipeline.filter(l => l.id !== lead.id);
        } else {
          window.AGENCIA.loop.logEvento(s, 'erro', `❌ Objeção não contornada. ${lead.nome} não quis fechar. "${novoRes.mensagemCliente}"`);
          s.perdas.push({ ...lead, motivoPerda: novoRes.motivo || 'Nao contornou objecao', diaPerda: s.tempo.dia });
          s.kpis.totalLeadsPerdidos++;
          s.pipeline = s.pipeline.filter(l => l.id !== lead.id);
        }
        
        window.AGENCIA.ui.renderizarPainelAtivo();
      });
    });
  }

  return { render };

})();
