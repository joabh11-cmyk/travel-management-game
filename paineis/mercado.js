// paineis/mercado.js — F8
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.painelMercado = {

  render: function(container) {
    const s   = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    if (!s) { container.innerHTML = '<div class="stub-msg">Estado não inicializado.</div>'; return; }

    // --- Sazonalidade ---
    const mesAtual = ((s.tempo.dia - 1) % 336 < 28 ? 1 :
                      (s.tempo.dia - 1) % 336 < 56 ? 2 :
                      (s.tempo.dia - 1) % 336 < 84 ? 3 :
                      (s.tempo.dia - 1) % 336 < 112 ? 4 :
                      (s.tempo.dia - 1) % 336 < 140 ? 5 :
                      (s.tempo.dia - 1) % 336 < 168 ? 6 :
                      (s.tempo.dia - 1) % 336 < 196 ? 7 :
                      (s.tempo.dia - 1) % 336 < 224 ? 8 :
                      (s.tempo.dia - 1) % 336 < 252 ? 9 :
                      (s.tempo.dia - 1) % 336 < 280 ? 10 :
                      (s.tempo.dia - 1) % 336 < 308 ? 11 : 12);

    const nomesMes = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const sazFator = BAL.sazonalidade[mesAtual] || 1.0;
    let sazLabel, sazColor, sazDesc;
    if (sazFator >= 1.2) { sazLabel = 'Alta Temporada 🔥'; sazColor = 'var(--green)'; sazDesc = 'Demanda elevada. Momento ideal para captar e converter.'; }
    else if (sazFator >= 1.0) { sazLabel = 'Temporada Normal'; sazColor = 'var(--text)'; sazDesc = 'Demanda estável. Foco em conversão de leads existentes.'; }
    else if (sazFator >= 0.85) { sazLabel = 'Baixa Moderada'; sazColor = 'var(--amber)'; sazDesc = 'Demanda reduzida. Invista em retenção e follow-up.'; }
    else { sazLabel = 'Baixa Temporada ❄️'; sazColor = 'var(--red)'; sazDesc = 'Demanda fraca. Prepare próxima temporada e cuide do caixa.'; }

    // --- Pressão competitiva (simulada com base em rep e tempo de jogo) ---
    const rep = s.agencia.reputacao || 0;
    let competicaoLabel, competicaoColor;
    if (rep >= 60) { competicaoLabel = 'Moderada'; competicaoColor = 'var(--amber)'; }
    else if (rep >= 30) { competicaoLabel = 'Alta'; competicaoColor = 'var(--amber)'; }
    else { competicaoLabel = 'Agressiva 🦈'; competicaoColor = 'var(--red)'; }

    // --- Tendências derivadas de dados reais do estado ---
    const totalLeads   = [...(s.leads||[]), ...(s.pipeline||[]), ...(s.vendas||[]), ...(s.perdas||[])].length;
    const totalVendas  = (s.vendas||[]).length;
    const taxaConv     = totalLeads > 0 ? (totalVendas / totalLeads * 100).toFixed(1) : '0.0';
    const ticketMedio  = totalVendas > 0
      ? (s.vendas||[]).reduce((a, v) => a + (v.cotacao?.valorTotal || 0), 0) / totalVendas
      : 0;

    // --- Eventos externos recentes ---
    const eventos = (s.historicoEventos || []).slice(-5).reverse();

    // --- Risco de mercado ---
    let riscoScore = 0;
    if (sazFator < 1.0) riscoScore += 2;
    if (rep < 20) riscoScore += 3;
    if (s.caixa.saldo < 300) riscoScore += 3;
    if ((s.caixa.diasNegativo || 0) > 0) riscoScore += 2;
    const burnRate = window.AGENCIA.economy ? window.AGENCIA.economy.calcularBurnRate(s) : 0;
    if (burnRate > 500) riscoScore += 1;

    let riscoLabel, riscoColor;
    if (riscoScore >= 7) { riscoLabel = 'CRÍTICO'; riscoColor = 'var(--red)'; }
    else if (riscoScore >= 4) { riscoLabel = 'ELEVADO'; riscoColor = 'var(--amber)'; }
    else if (riscoScore >= 2) { riscoLabel = 'Moderado'; riscoColor = '#f59e0b'; }
    else { riscoLabel = 'Baixo'; riscoColor = 'var(--green)'; }

    // --- Janela de oportunidade ---
    let janela = '';
    if (sazFator >= 1.2 && rep >= 30) janela = '✅ Janela favorável aberta: alta temporada + reputação crescente.';
    else if (sazFator >= 1.0 && rep < 20) janela = '⚠️ Temporada boa, mas reputação baixa limita o potencial.';
    else if (sazFator < 0.9 && s.caixa.saldo > 500) janela = '💡 Período fraco — ótimo para preparar operação e qualificar leads.';
    else janela = '📊 Mercado em operação normal. Continue acompanhando os indicadores.';

    const seg = BAL.segmentos[s.agencia.segmento];

    container.innerHTML = `
      <div class="fade-in">
        <div class="section-header">
          <div>
            <div class="section-title">🌐 Mercado & Ambiente</div>
            <div class="section-subtitle">Dia ${s.tempo.dia} · ${seg.emoji} ${seg.label}</div>
          </div>
          <div class="phase-badge" style="background:${riscoColor}20; color:${riscoColor}; border:1px solid ${riscoColor}50;">
            Risco ${riscoLabel}
          </div>
        </div>

        <!-- Sazonalidade -->
        <div class="two-col-grid" style="margin-bottom:16px;">
          <div class="card">
            <div class="card-header">
              <div class="card-title">📅 Sazonalidade</div>
            </div>
            <div style="padding-top:10px;">
              <div style="font-size:22px; font-weight:800; color:${sazColor}; margin-bottom:4px;">
                ${sazLabel}
              </div>
              <div style="font-size:13px; color:var(--text-2); margin-bottom:12px;">${nomesMes[mesAtual]} · Fator ${sazFator.toFixed(2)}×</div>
              <div style="background:var(--surface-2); border-radius:6px; height:8px; overflow:hidden; margin-bottom:6px;">
                <div style="width:${Math.min(100, sazFator * 70)}%; height:100%; background:${sazColor}; transition:width 0.3s;"></div>
              </div>
              <div style="font-size:12px; color:var(--text-2);">${sazDesc}</div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">🦈 Competição</div>
            </div>
            <div style="padding-top:10px;">
              <div style="font-size:22px; font-weight:800; color:${competicaoColor}; margin-bottom:8px;">
                ${competicaoLabel}
              </div>
              <div style="font-size:13px; color:var(--text-2); line-height:1.6;">
                ${rep < 30 ? 'Sua reputação ainda é baixa. Concorrentes estabelecidos levam vantagem em credibilidade.' : 'Sua reputação já oferece diferencial competitivo.'}
              </div>
              <div style="margin-top:12px; font-size:12px; color:var(--text-2); border-top:1px solid var(--border); padding-top:10px;">
                Segmento: <strong style="color:var(--text);">${seg.emoji} ${seg.label}</strong>
                · Conversão base: <strong>${(seg.conversaoBase * 100).toFixed(0)}%</strong>
                · Ticket: <strong>R$ ${seg.ticketMin.toLocaleString('pt-BR')}–${seg.ticketMax.toLocaleString('pt-BR')}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicadores de mercado -->
        <div class="card" style="margin-bottom:16px;">
          <div class="card-header"><div class="card-title">📊 Desempenho Relativo da Agência</div></div>
          <div class="stats-row" style="margin-top:10px;">
            <div class="stat-tile">
              <div class="stat-tile-label">Taxa Conversão Real</div>
              <div class="stat-tile-value ${parseFloat(taxaConv) >= seg.conversaoBase*100 ? 'g' : 'r'}">${taxaConv}%</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Meta do Segmento</div>
              <div class="stat-tile-value">${(seg.conversaoBase * 100).toFixed(0)}%</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Ticket Médio Real</div>
              <div class="stat-tile-value b">${ticketMedio > 0 ? 'R$ ' + ticketMedio.toLocaleString('pt-BR', {maximumFractionDigits:0}) : '—'}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Burn Rate Semanal</div>
              <div class="stat-tile-value ${burnRate > 500 ? 'r' : 'g'}">R$ ${burnRate.toLocaleString('pt-BR', {maximumFractionDigits:0})}</div>
            </div>
          </div>
        </div>

        <!-- Janela de oportunidade -->
        <div class="card" style="border-color:var(--blue)20; background:rgba(99,102,241,0.04); margin-bottom:16px;">
          <div style="font-size:13px; color:var(--text); line-height:1.7; padding: 4px 0;">
            ${janela}
          </div>
        </div>

        <!-- Eventos externos recentes -->
        <div class="card">
          <div class="card-header"><div class="card-title">⚡ Incidentes de Mercado Recentes</div></div>
          <div style="padding-top:8px;">
            ${eventos.length === 0
              ? '<div class="empty-list">Nenhum evento de mercado ocorreu ainda.</div>'
              : eventos.map(e => `
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid var(--border);">
                    <div>
                      <div style="font-size:13px; font-weight:700; color:var(--text);">${e.titulo}</div>
                      <div style="font-size:12px; color:var(--text-2); margin-top:3px;">Dia ${e.dia} · Resolução: ${e.resolucao}</div>
                    </div>
                    <div style="text-align:right; font-size:12px; min-width:80px;">
                      ${e.impactoReputacao ? `<div class="${e.impactoReputacao > 0 ? 'g' : 'r'}">Rep ${e.impactoReputacao > 0 ? '+' : ''}${e.impactoReputacao}</div>` : ''}
                      ${e.impactoCaixa ? `<div class="${e.impactoCaixa > 0 ? 'g' : 'r'}">${e.impactoCaixa > 0 ? '+' : ''}R$ ${Math.abs(e.impactoCaixa)}</div>` : ''}
                    </div>
                  </div>
                `).join('')
            }
          </div>
        </div>
      </div>
    `;
  }
};
