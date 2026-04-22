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

    const canaisAtivos = s.canaisAtivos || [];
    const canaisMarketing = s.canaisMarketing || {};
    const todosLeads   = [...(s.leads || []), ...(s.pipeline || []), ...(s.vendas || []), ...(s.perdas || [])];
    const vendas       = s.vendas || [];

    // Estatísticas por canal
    const statsPorCanal = {};
    canaisAtivos.forEach(cId => { statsPorCanal[cId] = { gerados: 0, qualificados: 0, convertidos: 0, custoAcumulado: s.kpis.custoMarketingPorCanal ? (s.kpis.custoMarketingPorCanal[cId] || 0) : 0 }; });

    todosLeads.forEach(l => {
      const cId = l.canal;
      if (!cId) return;
      if (!statsPorCanal[cId]) statsPorCanal[cId] = { gerados: 0, qualificados: 0, convertidos: 0, custoAcumulado: 0 };
      statsPorCanal[cId].gerados++;
      if (l.status === 'qualificado' || l.status === 'proposta' || l.status === 'ganho') statsPorCanal[cId].qualificados++;
      if (l.status === 'ganho') statsPorCanal[cId].convertidos++;
    });

    const totalLeads = todosLeads.length || 0;
    const totalVendas = vendas.length || 0;
    const convGeral = totalLeads > 0 ? ((totalVendas / totalLeads) * 100).toFixed(1) : '0.0';

    let custoDiarioTotal = 0;

    const canalRows = canaisAtivos.map(cId => {
      const cfg = BAL.canais[cId];
      if (!cfg) return '';
      const st = statsPorCanal[cId] || { gerados: 0, qualificados: 0, convertidos: 0, custoAcumulado: 0 };
      
      const intensidade = canaisMarketing[cId] || 'medio';
      const custoDiario = cfg.custoPorIntensidade ? (cfg.custoPorIntensidade[intensidade] || 0) : 0;
      custoDiarioTotal += custoDiario;
      
      const custoAcum = st.custoAcumulado;
      const cac = st.convertidos > 0 ? (custoAcum / st.convertidos) : null;
      const convRate = st.gerados > 0 ? ((st.convertidos / st.gerados) * 100).toFixed(1) : '0.0';
      const qualRate = st.gerados > 0 ? ((st.qualificados / st.gerados) * 100).toFixed(1) : '0.0';

      let eficiencia = '';
      if (cId === 'familiares_amigos') eficiencia = 'Alta conversão, baixo volume';
      else if (cId === 'boca_a_boca')  eficiencia = 'Melhora com reputação';
      else if (cId === 'campanhas_internas') eficiencia = 'Volume maior, confiança menor';

      return `
        <div class="card" style="margin-bottom:12px;">
          <div class="card-header" style="justify-content: space-between;">
            <div style="display:flex; gap:10px; align-items:center;">
              <div class="card-title">${cfg.emoji} ${cfg.label}</div>
              <span class="badge" style="${cfg.tipo === 'organico' ? 'background:rgba(34,197,94,.15);color:#22c55e;' : 'background:rgba(251,146,60,.15);color:#fb923c;'}">${cfg.tipo}</span>
            </div>
            <div>
              <label style="font-size:12px; color:var(--text-2); margin-right:5px;">Intensidade:</label>
              <select class="input-form" style="width:120px; padding:4px 8px; font-size:12px; display:inline-block;" onchange="window.AGENCIA.painelMarketing.mudarIntensidade('${cId}', this.value)">
                <option value="desligado" ${intensidade==='desligado'?'selected':''}>Desligado (R$0)</option>
                <option value="baixo" ${intensidade==='baixo'?'selected':''}>Baixo (R$${cfg.custoPorIntensidade?.baixo||0}/d)</option>
                <option value="medio" ${intensidade==='medio'?'selected':''}>Médio (R$${cfg.custoPorIntensidade?.medio||0}/d)</option>
                <option value="alto" ${intensidade==='alto'?'selected':''}>Alto (R$${cfg.custoPorIntensidade?.alto||0}/d)</option>
              </select>
            </div>
          </div>
          <div class="stats-row" style="margin-top:8px;">
            <div class="stat-tile">
              <div class="stat-tile-label">Leads Gerados</div>
              <div class="stat-tile-value b">${st.gerados}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Qualificados</div>
              <div class="stat-tile-value" style="color:var(--text)">${st.qualificados} <small style="font-size:11px;color:var(--text-2)">(${qualRate}%)</small></div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Convertidos</div>
              <div class="stat-tile-value g">${st.convertidos} <small style="font-size:11px;color:var(--text-2)">(${convRate}%)</small></div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">CAC Estimado</div>
              <div class="stat-tile-value ${cac === null ? '' : 'r'}">${cac === null ? (custoAcum > 0 ? 'Sem conv.' : '—') : 'R$ ' + cac.toFixed(0)}</div>
            </div>
          </div>
          <div style="padding:8px 0 2px; font-size:12px; color:var(--text-2); border-top:1px solid var(--border); margin-top:10px;">
            💡 ${eficiencia}
            ${custoAcum > 0 ? ` · Custo acumulado: R$ ${custoAcum.toFixed(0)}` : ' · Sem custos até o momento'}
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="fade-in">
        <div class="section-header">
          <div>
            <div class="section-title">📣 Marketing & Captação</div>
            <div class="section-subtitle">Gerencie o investimento e esforço por canal</div>
          </div>
        </div>

        <!-- Visão Geral -->
        <div class="stats-row" style="margin-bottom:20px;">
          <div class="stat-tile">
            <div class="stat-tile-label">Total Leads</div>
            <div class="stat-tile-value b">${totalLeads}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Convertidos</div>
            <div class="stat-tile-value g">${totalVendas}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Conversão Geral</div>
            <div class="stat-tile-value ${parseFloat(convGeral) >= 20 ? 'g' : parseFloat(convGeral) >= 10 ? '' : 'r'}">${convGeral}%</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Custo Diário Total</div>
            <div class="stat-tile-value r">R$ ${custoDiarioTotal}</div>
          </div>
        </div>

        <!-- Cards por Canal -->
        ${canalRows || '<div class="empty-list">Nenhum canal ativo.</div>'}

        <!-- Dica estratégica -->
        <div class="card" style="border-style:dashed; margin-top:4px;">
          <div style="font-size:13px; color:var(--text-2); line-height:1.7; padding:4px 0;">
            <strong style="color:var(--text);">📌 Controle de Fluxo:</strong>
            Aumentar a intensidade gera mais leads, mas custa mais caro. 
            Se os leads começarem a expirar por falta de tempo de atendimento, reduza a intensidade para "Baixo" ou "Desligado".
          </div>
        </div>
      </div>
    `;
  }
};
