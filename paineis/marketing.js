// paineis/marketing.js — F8
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.painelMarketing = {

  render: function(container) {
    const s   = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    if (!s) { container.innerHTML = '<div class="stub-msg">Estado não inicializado.</div>'; return; }

    const canaisAtivos = s.canaisAtivos || [];
    const todosLeads   = [...(s.leads || []), ...(s.pipeline || []), ...(s.vendas || []), ...(s.perdas || [])];
    const vendas       = s.vendas || [];

    // Estatísticas por canal
    const statsPorCanal = {};
    canaisAtivos.forEach(cId => { statsPorCanal[cId] = { gerados: 0, qualificados: 0, convertidos: 0 }; });

    todosLeads.forEach(l => {
      const cId = l.canal;
      if (!cId) return;
      if (!statsPorCanal[cId]) statsPorCanal[cId] = { gerados: 0, qualificados: 0, convertidos: 0 };
      statsPorCanal[cId].gerados++;
      if (l.status === 'qualificado' || l.status === 'proposta' || l.status === 'ganho') statsPorCanal[cId].qualificados++;
      if (l.status === 'ganho') statsPorCanal[cId].convertidos++;
    });

    // Custo acumulado por canal (custo mensal × (dias/30))
    const diasDecorridos = Math.max(1, s.tempo.dia);
    const fracao = diasDecorridos / 30;

    const totalLeads = todosLeads.length || 0;
    const totalVendas = vendas.length || 0;
    const convGeral = totalLeads > 0 ? ((totalVendas / totalLeads) * 100).toFixed(1) : '0.0';

    const canalRows = canaisAtivos.map(cId => {
      const cfg = BAL.canais[cId];
      if (!cfg) return '';
      const st = statsPorCanal[cId] || { gerados: 0, qualificados: 0, convertidos: 0 };
      const custoAcum = (cfg.custoMensal || 0) * fracao;
      const cac = st.convertidos > 0 ? (custoAcum / st.convertidos) : null;
      const convRate = st.gerados > 0 ? ((st.convertidos / st.gerados) * 100).toFixed(1) : '0.0';
      const qualRate = st.gerados > 0 ? ((st.qualificados / st.gerados) * 100).toFixed(1) : '0.0';

      let eficiencia = '';
      if (cId === 'familiares_amigos') eficiencia = 'Alta conversão, baixo volume';
      else if (cId === 'boca_a_boca')  eficiencia = 'Melhora com reputação';
      else if (cId === 'campanhas_internas') eficiencia = 'Volume maior, confiança menor';
      else if (cId === 'influenciadores') eficiencia = 'Alto volume, baixo qualificado';
      else if (cId === 'trafego_pago')  eficiencia = 'Escala rápida, custo alto';
      else if (cId === 'venda_corporativa') eficiencia = 'Ciclo longo, ticket maior';

      return `
        <div class="card" style="margin-bottom:12px;">
          <div class="card-header">
            <div class="card-title">${cfg.emoji} ${cfg.label}</div>
            <span class="badge" style="${cfg.tipo === 'organico' ? 'background:rgba(34,197,94,.15);color:#22c55e;' : 'background:rgba(251,146,60,.15);color:#fb923c;'}">${cfg.tipo}</span>
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
              <div class="stat-tile-value ${cac === null ? '' : 'g'}">${cac === null ? (custoAcum > 0 ? 'Sem conv.' : '—') : 'R$ ' + cac.toFixed(0)}</div>
            </div>
          </div>
          <div style="padding:8px 0 2px; font-size:12px; color:var(--text-2); border-top:1px solid var(--border); margin-top:10px;">
            💡 ${eficiencia}
            ${custoAcum > 0 ? ` · Custo acumulado: R$ ${custoAcum.toFixed(0)}` : ' · Canal gratuito'}
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="fade-in">
        <div class="section-header">
          <div>
            <div class="section-title">📣 Marketing & Canais</div>
            <div class="section-subtitle">Dia ${s.tempo.dia} · ${canaisAtivos.length} canais ativos</div>
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
            <div class="stat-tile-label">Canais Ativos</div>
            <div class="stat-tile-value">${canaisAtivos.length}</div>
          </div>
        </div>

        <!-- Cards por Canal -->
        ${canalRows || '<div class="empty-list">Nenhum canal ativo.</div>'}

        <!-- Dica estratégica -->
        <div class="card" style="border-style:dashed; margin-top:4px;">
          <div style="font-size:13px; color:var(--text-2); line-height:1.7; padding:4px 0;">
            <strong style="color:var(--text);">📌 Estratégia de Canal:</strong>
            Familiares e amigos têm maior chance de conversão por confiança alta — ótimo para os primeiros dias.
            Boca a Boca melhora conforme sua reputação cresce. Campanhas Internas escalam volume mas exigem nutrição.
            Canais pagos só valem quando a taxa de conversão superar o CAC.
          </div>
        </div>
      </div>
    `;
  }
};
