// paineis/marketing.js — F8
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.painelMarketing = {

  mudarIntensidade: function(canalId, intensidade) {
    const s = window.AGENCIA.getState();
    if (!s || !s.canaisMarketing) return;
    s.canaisMarketing[canalId] = intensidade;
    window.AGENCIA.ui.renderizarPainelAtivo('marketing');
  },

  render: function(container) {
    const s   = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    if (!s) { container.innerHTML = '<div class="stub-msg">Estado não inicializado.</div>'; return; }

    const canaisMarketing = s.canaisMarketing || {};
    const todosLeads   = [...(s.leads || []), ...(s.pipeline || []), ...(s.vendas || []), ...(s.perdas || [])];
    const vendas       = s.vendas || [];

    // Estatísticas por canal
    const statsPorCanal = {};
    Object.keys(BAL.canais).forEach(cId => { 
      statsPorCanal[cId] = { 
        gerados: 0, 
        qualificados: 0, 
        convertidos: 0, 
        custoAcumulado: s.kpis.custoMarketingPorCanal ? (s.kpis.custoMarketingPorCanal[cId] || 0) : 0 
      }; 
    });

    todosLeads.forEach(l => {
      const cId = l.canal;
      if (!cId || !statsPorCanal[cId]) return;
      statsPorCanal[cId].gerados++;
      if (l.status === 'qualificado' || l.status === 'proposta' || l.status === 'ganho') statsPorCanal[cId].qualificados++;
      if (l.status === 'ganho') statsPorCanal[cId].convertidos++;
    });

    const totalLeads = todosLeads.length || 0;
    const totalVendas = vendas.length || 0;
    const convGeral = totalLeads > 0 ? ((totalVendas / totalLeads) * 100).toFixed(1) : '0.0';

    let custoDiarioTotal = 0;

    const renderCanal = (cId) => {
      const cfg = BAL.canais[cId];
      if (!cfg) return '';
      
      const desbloqueado = window.AGENCIA.leads.isCanalDesbloqueado(cId, s);
      const st = statsPorCanal[cId];
      const intensidade = canaisMarketing[cId] || 'desligado';
      const custoDiario = cfg.custoPorIntensidade ? (cfg.custoPorIntensidade[intensidade] || 0) : 0;
      
      if (!desbloqueado) {
        let condicao = (['influenciadores', 'participacao_eventos', 'trafego_pago'].includes(cId)) 
          ? 'Caixa > 3.000 ou Reputação > 30' 
          : 'Caixa > 8.000 ou Reputação > 55';
        
        return `
          <div class="card" style="margin-bottom:12px; opacity:0.6; background:var(--bg-2); border-style:dotted;">
            <div class="card-header" style="justify-content: space-between;">
              <div style="display:flex; gap:10px; align-items:center;">
                <div class="card-title" style="color:var(--text-3)">${cfg.emoji} ${cfg.label}</div>
                <span class="badge" style="background:var(--border); color:var(--text-3);">🔒 Bloqueado</span>
              </div>
            </div>
            <div style="padding:12px; text-align:center; font-size:12px; color:var(--text-3);">
              Desbloqueia em: <strong>${condicao}</strong>
            </div>
          </div>`;
      }

      custoDiarioTotal += custoDiario;
      const custoAcum = st.custoAcumulado;
      const cac = st.convertidos > 0 ? (custoAcum / st.convertidos) : null;
      const convRate = st.gerados > 0 ? ((st.convertidos / st.gerados) * 100).toFixed(1) : '0.0';
      const qualRate = st.gerados > 0 ? ((st.qualificados / st.gerados) * 100).toFixed(1) : '0.0';

      return `
        <div class="card" style="margin-bottom:12px;">
          <div class="card-header" style="justify-content: space-between;">
            <div style="display:flex; gap:10px; align-items:center;">
              <div class="card-title">${cfg.emoji} ${cfg.label}</div>
              <span class="badge" style="${cfg.tipo === 'organico' ? 'background:var(--green-soft);color:var(--green);' : cfg.tipo === 'pago' ? 'background:var(--red-soft);color:var(--red);' : 'background:var(--amber-soft);color:var(--amber);'}">${cfg.tipo}</span>
            </div>
            <div>
              <label style="font-size:11px; color:var(--text-2); margin-right:5px;">Intensidade:</label>
              <select class="input-form" style="width:125px; padding:3px 6px; font-size:11px; display:inline-block;" onchange="window.AGENCIA.painelMarketing.mudarIntensidade('${cId}', this.value)">
                <option value="desligado" ${intensidade==='desligado'?'selected':''}>Desligado (R$0)</option>
                <option value="baixo" ${intensidade==='baixo'?'selected':''}>Baixo (R$${cfg.custoPorIntensidade.baixo}/d)</option>
                <option value="medio" ${intensidade==='medio'?'selected':''}>Médio (R$${cfg.custoPorIntensidade.medio}/d)</option>
                <option value="alto" ${intensidade==='alto'?'selected':''}>Alto (R$${cfg.custoPorIntensidade.alto}/d)</option>
              </select>
            </div>
          </div>
          <div class="stats-row" style="margin-top:8px;">
            <div class="stat-tile">
              <div class="stat-tile-label">Leads</div>
              <div class="stat-tile-value b">${st.gerados}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Qualif.</div>
              <div class="stat-tile-value">${qualRate}%</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Conv.</div>
              <div class="stat-tile-value g">${convRate}%</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">CAC</div>
              <div class="stat-tile-value ${cac && cac > 500 ? 'r' : ''}">${cac ? 'R$ '+cac.toFixed(0) : '—'}</div>
            </div>
          </div>
          ${cfg.observacao ? `<div style="padding:6px 0 0; font-size:11px; color:var(--text-3); font-style:italic;">ℹ️ ${cfg.observacao}</div>` : ''}
        </div>`;
    };

    const grupos = [
      { t: '🌱 Canais Orgânicos', ids: ['familiares_amigos', 'boca_a_boca'] },
      { t: '🤝 Canais de Relacionamento / Semi', ids: ['campanhas_internas', 'participacao_eventos', 'representantes', 'venda_corporativa'] },
      { t: '🚀 Canais Pagos / Tráfego', ids: ['influenciadores', 'patrocinio', 'trafego_pago'] }
    ];

    const htmlGrupos = grupos.map(g => `
      <div class="grupo-marketing" style="margin-top:20px;">
        <div style="font-size:12px; font-weight:bold; color:var(--text-2); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px;">${g.t}</div>
        ${g.ids.map(id => renderCanal(id)).join('')}
      </div>
    `).join('');

    container.innerHTML = `
      <div class="fade-in">
        <div class="section-header">
          <div>
            <div class="section-title">📣 Marketing & Captação</div>
            <div class="section-subtitle">Gerencie o investimento e esforço por canal de aquisição</div>
          </div>
        </div>

        <div class="stats-row" style="margin-bottom:10px;">
          <div class="stat-tile">
            <div class="stat-tile-label">Leads Totais</div>
            <div class="stat-tile-value b">${totalLeads}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Vendas</div>
            <div class="stat-tile-value g">${totalVendas}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Conv. Geral</div>
            <div class="stat-tile-value">${convGeral}%</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Custo Diário</div>
            <div class="stat-tile-value r">R$ ${custoDiarioTotal.toFixed(0)}</div>
          </div>
        </div>

        ${htmlGrupos}

        <div class="card" style="border-style:dashed; margin-top:20px; background:var(--blue-soft);">
          <div style="font-size:12px; color:var(--text-2); line-height:1.6;">
            <strong style="color:var(--primary);">💡 Dica Estratégica:</strong>
            Canais pagos geram volume rápido, mas possuem confiança menor e CAC mais alto. 
            Venda Corporativa exige maturidade, mas traz tickets muito superiores.
          </div>
        </div>
      </div>
    `;
  }
};
