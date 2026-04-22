// paineis/pessoas.js — F8
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.painelPessoas = {

  render: function(container) {
    const s   = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    if (!s) { container.innerHTML = '<div class="stub-msg">Estado não inicializado.</div>'; return; }

    const fadiga   = Math.round(s.agencia.fadiga || 0);
    const paMax    = s.pa.maximo;
    const paUsados = s.pa.usados;
    const leadsAtivos = (s.leads || []).length + (s.pipeline || []).length;

    // Cálculo de sobrecarga
    let sobrecargaLabel, sobrecargaColor;
    if (fadiga >= 95) { sobrecargaLabel = 'Esgotado — capacidade crítica'; sobrecargaColor = 'var(--red)'; }
    else if (fadiga >= 80) { sobrecargaLabel = 'Sobrecarga elevada — produtividade caindo'; sobrecargaColor = 'var(--amber)'; }
    else if (fadiga >= 50) { sobrecargaLabel = 'Ritmo moderado — atenção à fadiga'; sobrecargaColor = '#f59e0b'; }
    else { sobrecargaLabel = 'Operando bem — ritmo sustentável'; sobrecargaColor = 'var(--green)'; }

    // Eficiência operacional
    const eficiencia = paMax > 0 ? Math.round((paUsados / paMax) * 100) : 0;

    // Recomendação de contratação
    let recomendacao, recomendacaoIcon;
    if (leadsAtivos > 8) {
      recomendacao = 'Volume de leads alto. Considere contratar um assistente comercial para atender a demanda sem perder conversão.';
      recomendacaoIcon = '🔴';
    } else if (fadiga >= 80) {
      recomendacao = 'Sua fadiga está alta. Um assistente operacional reduziria a sobrecarga e liberaria PA para vendas.';
      recomendacaoIcon = '🟡';
    } else if (leadsAtivos > 5) {
      recomendacao = 'Operação próxima do limite solo. Observe o volume de leads nas próximas semanas.';
      recomendacaoIcon = '🟡';
    } else {
      recomendacao = 'Operando dentro da capacidade. Continue assim e considere expandir quando o volume de leads dobrar.';
      recomendacaoIcon = '🟢';
    }

    // Custo de equipe (por enquanto zero — estrutura solo)
    const custoEquipe = 0;

    container.innerHTML = `
      <div class="fade-in">
        <div class="section-header">
          <div>
            <div class="section-title">👥 Pessoas & Capacidade</div>
            <div class="section-subtitle">Dia ${s.tempo.dia} · Operação solo</div>
          </div>
        </div>

        <!-- Status atual -->
        <div class="card" style="margin-bottom:16px;">
          <div class="card-header">
            <div class="card-title">Situação Atual da Equipe</div>
            <span class="badge" style="background:rgba(99,102,241,.15);color:#818cf8;">Solo</span>
          </div>
          <div style="padding: 16px 0 8px;">
            <div style="font-size:14px; color:var(--text); margin-bottom:6px;">
              🧑 <strong>Você</strong> — Fundador & Único Operador
            </div>
            <div style="font-size:13px; color:var(--text-2); line-height:1.6;">
              Está acumulando as funções de prospectador, consultor de vendas, cotador, suporte ao cliente e gestor financeiro.
              Isso é normal na fase de Sobrevivência — mas tem custo real de fadiga.
            </div>
          </div>
        </div>

        <!-- Métricas de capacidade -->
        <div class="two-col-grid" style="margin-bottom:16px;">
          <div class="card">
            <div class="card-header"><div class="card-title">Capacidade Diária</div></div>
            <div class="stats-row" style="margin-top:8px;">
              <div class="stat-tile">
                <div class="stat-tile-label">PA / Dia</div>
                <div class="stat-tile-value b">${paMax}</div>
              </div>
              <div class="stat-tile">
                <div class="stat-tile-label">PA Usados Hoje</div>
                <div class="stat-tile-value ${paUsados >= paMax ? 'r' : 'g'}">${paUsados}</div>
              </div>
              <div class="stat-tile">
                <div class="stat-tile-label">Intensidade</div>
                <div class="stat-tile-value ${eficiencia >= 80 ? 'r' : eficiencia >= 60 ? '' : 'g'}">${eficiencia}%</div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">Saúde do Operador</div></div>
            <div style="padding-top:10px;">
              <div style="font-size:13px; color:var(--text-2); margin-bottom:10px;">Fadiga Acumulada</div>
              <div style="background:var(--surface-2); border-radius:6px; height:10px; overflow:hidden; margin-bottom:8px;">
                <div style="width:${fadiga}%; height:100%; background:${fadiga>=80?'var(--red)':fadiga>=50?'var(--amber)':'var(--green)'}; transition:width 0.3s;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-2);">
                <span>${fadiga}/100</span>
                <span style="color:${sobrecargaColor}; font-weight:600;">${sobrecargaLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Custo atual de equipe -->
        <div class="card" style="margin-bottom:16px;">
          <div class="card-header">
            <div class="card-title">Custo de Equipe</div>
          </div>
          <div class="stats-row" style="margin-top:8px;">
            <div class="stat-tile">
              <div class="stat-tile-label">Folha Mensal</div>
              <div class="stat-tile-value g">R$ 0,00</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Custo por Lead Atendido</div>
              <div class="stat-tile-value">R$ 0,00</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Leads Ativos Agora</div>
              <div class="stat-tile-value ${leadsAtivos > 8 ? 'r' : leadsAtivos > 5 ? 'a' : 'b'}">${leadsAtivos}</div>
            </div>
          </div>
        </div>

        <!-- Recomendação -->
        <div class="card" style="border-color:${recomendacaoIcon === '🔴' ? 'var(--red)' : recomendacaoIcon === '🟡' ? 'var(--amber)' : 'var(--border)'};">
          <div class="card-header">
            <div class="card-title">${recomendacaoIcon} Diagnóstico Operacional</div>
          </div>
          <p style="font-size:13px; color:var(--text-2); line-height:1.7; margin:10px 0 4px;">${recomendacao}</p>
        </div>

        <!-- Estrutura futura -->
        <div class="card" style="border-style:dashed; margin-top:16px;">
          <div class="card-header">
            <div class="card-title" style="color:var(--text-2);">🔒 Contratações Futuras (Desbloqueadas por fase)</div>
          </div>
          <div style="padding-top:8px;">
            ${[
              { cargo: 'Assistente Comercial', tipo: 'Estagiário (CLT)', salario: 'R$ 1.500/mês', requisito: 'Fase Tração · 8+ leads/dia', cor: '#818cf8' },
              { cargo: 'Consultor de Viagens', tipo: 'PJ ou CLT', salario: 'R$ 2.500–4.000/mês', requisito: 'Fase Organização · 15+ leads/dia', cor: '#22c55e' },
              { cargo: 'Gestor Operacional',  tipo: 'CLT', salario: 'R$ 4.000–6.000/mês', requisito: 'Fase Escala · 3+ consultores', cor: '#fb923c' },
            ].map(c => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border);">
                <div>
                  <div style="font-size:13px; font-weight:700; color:var(--text-2);">${c.cargo}</div>
                  <div style="font-size:12px; color:var(--text-2); margin-top:2px;">${c.tipo} · ${c.salario}</div>
                </div>
                <span style="font-size:11px; padding:3px 8px; border-radius:4px; background:rgba(99,102,241,.1); color:${c.cor};">${c.requisito}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
};
