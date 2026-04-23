// paineis/operacional.js — F8
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.painelOperacional = {
  render: function(container) {
    const s   = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    if (!s) { container.innerHTML = '<div class="stub-msg">Estado não inicializado.</div>'; return; }

    const fadiga      = Math.round(s.agencia.fadiga || 0);
    const reputacao   = s.agencia.reputacao || 0;
    const diasNeg     = s.caixa.diasNegativo || 0;
    const diasRepCrit = s.agencia.diasReputacaoCritica || 0;

    // --- Visão de Risco ---
    const riscos = [];
    if (diasNeg > 0) riscos.push({ icon: '🔴', texto: `Caixa negativo há ${diasNeg} dia(s). Limite: ${BAL.gameOver.diasCaixaNegativoParaGameOver} dias.` });
    if (reputacao <= 5) riscos.push({ icon: '🔴', texto: `Reputação crítica (${reputacao}/100). ${diasRepCrit}/7 dias consecutivos para encerramento.` });
    else if (reputacao < 15) riscos.push({ icon: '🟡', texto: `Reputação baixa (${reputacao}/100). Atenda bem seus clientes.` });
    if (fadiga >= 80) riscos.push({ icon: '🟡', texto: `Fadiga elevada (${fadiga}/100). PA reduzido até descansar.` });
    if (s.caixa.saldo < BAL.gameOver.caixaMinimoAlerta) riscos.push({ icon: '🟡', texto: `Caixa abaixo do mínimo recomendado (R$ ${BAL.gameOver.caixaMinimoAlerta}).` });
    const burnRate = window.AGENCIA.economy ? window.AGENCIA.economy.calcularBurnRate(s) : 0;
    if (burnRate > BAL.fluxoCaixa.burnRateThreshold) riscos.push({ icon: '🟡', texto: `Burn rate semanal acima do limite (R$ ${burnRate.toFixed(0)}).` });

    const riscosHtml = riscos.length === 0
      ? '<div class="empty-list" style="color:var(--green);">✅ Nenhum risco operacional imediato identificado.</div>'
      : riscos.map(r => `
          <div style="display:flex; gap:8px; align-items:flex-start; padding:8px 0; border-bottom:1px solid var(--border);">
            <span>${r.icon}</span>
            <span style="font-size:13px; color:var(--text); line-height:1.5;">${r.texto}</span>
          </div>
        `).join('');

    // --- Leads Expirados ---
    const perdas = s.perdas || [];
    const expirados = perdas.filter(p => p.motivo === 'expirado' || p.motivo === 'tempo');
    const perdidosMercado = perdas.filter(p => p.motivo !== 'expirado' && p.motivo !== 'tempo');

    // --- Log do Dia Atual ---
    const log = (s.logDiaAtual && s.logDiaAtual.eventos) || [];
    const logErros = log.filter(e => e.tipo === 'erro' || e.tipo === 'aviso');

    // --- Histórico de Eventos F7 ---
    const historicoEventos = (s.historicoEventos || []).slice(-8).reverse();

    container.innerHTML = `
      <div class="fade-in">
        <div class="section-header">
          <div>
            <div class="section-title">⚙️ Painel Operacional</div>
            <div class="section-subtitle">Dia ${s.tempo.dia} · Visão de risco e incidentes</div>
          </div>
          <div class="phase-badge" style="${riscos.some(r=>r.icon==='🔴') ? 'background:var(--red-soft); color:var(--red); border-color:var(--red);' : riscos.length > 0 ? 'background:var(--amber-soft); color:var(--amber); border-color:var(--amber);' : ''}">
            ${riscos.some(r=>r.icon==='🔴') ? '🔴 Risco Crítico' : riscos.length > 0 ? '⚠️ Atenção' : '✅ Estável'}
          </div>
        </div>

        <!-- Visão de Risco Atual -->
        <div class="card" style="margin-bottom:16px; ${riscos.some(r=>r.icon==='🔴') ? 'border-color:var(--red);' : riscos.length > 0 ? 'border-color:var(--amber);' : ''}">
          <div class="card-header">
            <div class="card-title">🎯 Riscos Operacionais Ativos</div>
          </div>
          <div style="padding-top:6px;">
            ${riscosHtml}
          </div>
        </div>

        <!-- Stats operacionais -->
        <div class="stats-row" style="margin-bottom:16px;">
          <div class="stat-tile">
            <div class="stat-tile-label">Fadiga</div>
            <div class="stat-tile-value ${fadiga>=80?'r':fadiga>=50?'':'g'}">${fadiga}/100</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Leads Expirados</div>
            <div class="stat-tile-value ${expirados.length > 3 ? 'r' : ''}">${expirados.length}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Perdidos (Mercado)</div>
            <div class="stat-tile-value r">${perdidosMercado.length}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Eventos Resolvidos</div>
            <div class="stat-tile-value b">${(s.historicoEventos||[]).length}</div>
          </div>
        </div>

        <!-- Erros/alertas do log do dia -->
        ${logErros.length > 0 ? `
          <div class="card" style="border-color:var(--amber); margin-bottom:16px;">
            <div class="card-header"><div class="card-title" style="color:var(--amber);">⚠️ Alertas do Dia ${s.tempo.dia}</div></div>
            <div style="padding-top:8px;">
              ${logErros.map(e => `<div class="log-entry log-${e.tipo}" style="padding:8px 0; border-bottom:1px solid var(--border);">${e.msg}</div>`).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Histórico de Eventos de Mercado (F7) -->
        <div class="card">
          <div class="card-header"><div class="card-title">⚡ Histórico de Incidentes de Mercado</div></div>
          <div style="padding-top:8px;">
            ${historicoEventos.length === 0
              ? '<div class="empty-list">Nenhum incidente ocorreu ainda.</div>'
              : historicoEventos.map(e => `
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid var(--border);">
                    <div>
                      <div style="font-size:13px; font-weight:700; color:var(--text);">${e.titulo}</div>
                      <div style="font-size:12px; color:var(--text-2); margin-top:3px;">Dia ${e.dia} · ${e.resolucao}</div>
                    </div>
                    <div style="text-align:right; min-width:80px; font-size:12px;">
                      ${e.impactoReputacao ? `<div class="${e.impactoReputacao>0?'g':'r'}" style="font-weight:600;">Rep ${e.impactoReputacao>0?'+':''}${e.impactoReputacao}</div>` : ''}
                      ${e.impactoCaixa ? `<div class="${e.impactoCaixa>0?'g':'r'}">Caixa ${e.impactoCaixa>0?'+':''}${e.impactoCaixa}</div>` : ''}
                      ${e.leadPerdido ? `<div class="r" style="font-weight:700;">Lead Perdido</div>` : ''}
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
