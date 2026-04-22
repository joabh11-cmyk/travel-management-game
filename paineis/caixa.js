// ============================================================
// AGÊNCIA — Painel de Caixa (F2)
// Exibe saldo, fluxo do dia atual e histórico semanal
// ============================================================
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.painelCaixa = {

  render: function(container) {
    const s   = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    if (!s) { container.innerHTML = '<div class="stub-msg">Estado não inicializado.</div>'; return; }

    const caixa   = s.caixa;
    const alertMin = BAL.gameOver.caixaMinimoAlerta;
    const saldoCor = caixa.saldo < 0 ? 'r' : caixa.saldo < alertMin ? 'a' : 'g';

    // --- Entradas e saídas do dia atual ---
    const diaHoje = s.tempo.dia;
    const entradasHoje = caixa.entradas.filter(e => e.dia === diaHoje);
    const saidasHoje   = caixa.saidas.filter(e => e.dia === diaHoje);
    const totalEntradasHoje = entradasHoje.reduce(function(a, e) { return a + e.valor; }, 0);
    const totalSaidasHoje   = saidasHoje.reduce(function(a, e) { return a + e.valor; }, 0);
    const resultadoHoje     = totalEntradasHoje - totalSaidasHoje;

    // --- Semana atual ---
    const semanaAtual  = s.tempo.semana;
    const diaInicioSem = (semanaAtual - 1) * 7 + 1;
    const entradasSem  = caixa.entradas.filter(e => e.dia >= diaInicioSem && e.dia <= diaHoje);
    const saidasSem    = caixa.saidas.filter(e => e.dia >= diaInicioSem && e.dia <= diaHoje);
    const totalRecSem  = entradasSem.reduce(function(a, e) { return a + e.valor; }, 0);
    const totalSaidSem = saidasSem.reduce(function(a, e) { return a + e.valor; }, 0);

    container.innerHTML = `
      <div class="fade-in">
        <div class="section-header">
          <div>
            <div class="section-title">💰 Caixa</div>
            <div class="section-subtitle">Dia ${diaHoje} · Semana ${semanaAtual}</div>
          </div>
        </div>

        <!-- Saldo principal -->
        <div class="card" style="border-color:${saldoCor === 'r' ? 'var(--red)' : saldoCor === 'a' ? 'var(--amber)' : 'var(--border)'}">
          <div class="card-header">
            <div class="card-title">Saldo em Caixa</div>
            ${caixa.saldo < alertMin ? '<span class="badge badge-warn">⚠ Atenção</span>' : ''}
          </div>
          <div class="saldo-destaque ${saldoCor}">${this._brl(caixa.saldo)}</div>
          ${caixa.saldo < 0 ? `<div class="alerta-msg">🚨 Saldo negativo — ${s.caixa.diasSaldoNegativo} dia(s) consecutivo(s). Corrija ou perca a campanha.</div>` : ''}
        </div>

        <!-- Fluxo de hoje -->
        <div class="two-col-grid">
          <div class="card">
            <div class="card-header"><div class="card-title">Entradas de Hoje</div></div>
            ${entradasHoje.length === 0
              ? '<div class="empty-list">Nenhuma entrada registrada hoje.</div>'
              : entradasHoje.map(e => this._linhaFluxo(e.descricao, e.valor, 'entrada')).join('')
            }
            <div class="fluxo-total entrada">Total: ${this._brl(totalEntradasHoje)}</div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">Saídas de Hoje</div></div>
            ${saidasHoje.length === 0
              ? '<div class="empty-list">Nenhuma saída registrada hoje.</div>'
              : saidasHoje.map(e => this._linhaFluxo(e.descricao, e.valor, 'saida')).join('')
            }
            <div class="fluxo-total saida">Total: −${this._brl(totalSaidasHoje)}</div>
          </div>
        </div>

        <!-- Resumo da semana -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Semana ${semanaAtual} — Acumulado (Dia ${diaInicioSem}–${diaHoje})</div>
          </div>
          <div class="stats-row">
            <div class="stat-tile">
              <div class="stat-tile-label">Receitas</div>
              <div class="stat-tile-value g">${this._brl(totalRecSem)}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Despesas</div>
              <div class="stat-tile-value r">${this._brl(totalSaidSem)}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Resultado</div>
              <div class="stat-tile-value ${totalRecSem - totalSaidSem >= 0 ? 'g' : 'r'}">${this._brl(totalRecSem - totalSaidSem)}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Total Vendas</div>
              <div class="stat-tile-value b">${s.kpis.totalVendas}</div>
            </div>
          </div>
        </div>

        <!-- Histórico de relatórios semanais -->
        ${this._renderHistoricoSemanal(s)}

      </div>
    `;
  },

  _renderHistoricoSemanal: function(s) {
    if (!s.relatorios || !s.relatorios.semanal || s.relatorios.semanal.length === 0) {
      return `<div class="card" style="border-style:dashed">
        <div class="empty-list" style="padding:20px 0;">Primeiro fechamento semanal aparecerá aqui ao final da Semana 1.</div>
      </div>`;
    }
    const rows = [...s.relatorios.semanal].reverse().map(r => `
      <div class="hist-row">
        <span class="hist-label">Sem. ${r.semana}</span>
        <span class="hist-rec g">+${this._brl(r.totalEntradas)}</span>
        <span class="hist-sai r">−${this._brl(r.totalSaidas)}</span>
        <span class="hist-res ${r.resultado >= 0 ? 'g' : 'r'}">${r.resultado >= 0 ? '+' : ''}${this._brl(r.resultado)}</span>
        <span class="hist-saldo">${this._brl(r.saldoFinal)}</span>
      </div>
    `).join('');
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Histórico Semanal</div></div>
        <div class="hist-header hist-row">
          <span class="hist-label">Semana</span>
          <span>Receitas</span>
          <span>Despesas</span>
          <span>Resultado</span>
          <span>Saldo Final</span>
        </div>
        ${rows}
      </div>
    `;
  },

  _linhaFluxo: function(desc, valor, tipo) {
    return `<div class="fluxo-linha">
      <span class="fluxo-desc">${desc}</span>
      <span class="fluxo-val ${tipo === 'entrada' ? 'g' : 'r'}">${tipo === 'entrada' ? '+' : '−'}${this._brl(valor)}</span>
    </div>`;
  },

  _brl: function(n) {
    return 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
};
