// paineis/operacional.js
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.painelOperacional = {
  render: function(container) {
    const s = window.AGENCIA.getState();
    if (!s) return;

    let historyHtml = '<div class="empty-list">Nenhum evento de mercado registrado ainda.</div>';

    if (s.historicoEventos && s.historicoEventos.length > 0) {
      historyHtml = [...s.historicoEventos].reverse().map(e => `
        <div class="fluxo-linha" style="align-items:flex-start; padding:12px 0;">
          <div style="flex:1;">
            <div style="font-size:12px; color:var(--text-2); margin-bottom:4px;">Dia ${e.dia}</div>
            <div style="font-weight:700; color:var(--text); margin-bottom:4px;">${e.titulo}</div>
            <div style="font-size:13px; color:var(--text); line-height:1.4;">Resolução: ${e.resolucao}</div>
          </div>
          <div style="text-align:right; font-size:13px; min-width:100px;">
            ${e.impactoReputacao ? `<div class="${e.impactoReputacao > 0 ? 'g' : 'r'}">Reputação: ${e.impactoReputacao > 0 ? '+' : ''}${e.impactoReputacao}</div>` : ''}
            ${e.impactoCaixa ? `<div class="${e.impactoCaixa > 0 ? 'g' : 'r'}">Caixa: ${e.impactoCaixa > 0 ? '+' : ''}${e.impactoCaixa}</div>` : ''}
            ${e.leadPerdido ? `<div class="r" style="font-weight:700; margin-top:4px;">Lead Perdido</div>` : ''}
          </div>
        </div>
      `).join('');
    }

    container.innerHTML = `
      <div class="fade-in">
        <div class="section-header">
          <div>
            <div class="section-title">⚙️ Operacional & Mercado</div>
            <div class="section-subtitle">Histórico de Incidentes e Resoluções</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Histórico Recente de Eventos (Fase 7)</div>
          </div>
          <div style="padding-top:10px;">
            ${historyHtml}
          </div>
        </div>
      </div>
    `;
  }
};
