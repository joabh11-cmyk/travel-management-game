// paineis/pessoas.js — F8
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.painelPessoas = {

  contratarPlanoJuridico: function(planoId) {
    const s = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    const plano = BAL.protecaoJuridica.planos[planoId];
    if (!plano) return;
    
    if (s.caixa.saldo < plano.valorMensal) {
      window.AGENCIA.loop.logEvento(s, 'erro', 'Caixa insuficiente para o primeiro mês da assinatura jurídica.');
      return;
    }
    
    s.agencia.protecaoJuridica.planoAtivo = planoId;
    s.agencia.protecaoJuridica.usosSemanaMax = plano.usosPorSemana;
    s.agencia.protecaoJuridica.diaContratacao = s.tempo.dia;
    s.agencia.protecaoJuridica.proximaCobranca = s.tempo.dia + 30;
    
    // Primeiro débito
    s.caixa.saldo -= plano.valorMensal;
    s.caixa.despesas += plano.valorMensal;
    window.AGENCIA.registrarSaida(`Contratação Jurídica: ${plano.nome}`, plano.valorMensal, 'fixo');
    
    window.AGENCIA.ui.renderizarPainelAtivo('pessoas');
    window.AGENCIA.loop.logEvento(s, 'sucesso', `🛡️ Plano "${plano.nome}" contratado! Usos por semana: ${plano.usosPorSemana}.`);
  },

  cancelarPlanoJuridico: function() {
    const s = window.AGENCIA.getState();
    if (!confirm('Deseja realmente cancelar sua proteção jurídica? Você ficará exposto a multas integrais em caso de processos.')) return;
    
    s.agencia.protecaoJuridica.planoAtivo = null;
    s.agencia.protecaoJuridica.usosSemanaMax = 0;
    window.AGENCIA.ui.renderizarPainelAtivo('pessoas');
    window.AGENCIA.loop.logEvento(s, 'aviso', `🛡️ Proteção Jurídica cancelada.`);
  },

  render: function(container) {
    const s   = window.AGENCIA.getState();
    const BAL = window.AGENCIA.BAL;
    if (!s) { container.innerHTML = '<div class="stub-msg">Estado não inicializado.</div>'; return; }

    const fadiga   = Math.round(s.agencia.fadiga || 0);
    const paMax    = s.pa.maximo;
    const paUsados = s.pa.usados;
    const leadsAtivos = (s.leads || []).length + (s.pipeline || []).length;
    const jur = s.agencia.protecaoJuridica || {};

    // Cálculo de sobrecarga
    let sobrecargaLabel, sobrecargaColor;
    if (fadiga >= 95) { sobrecargaLabel = 'Esgotado — capacidade crítica'; sobrecargaColor = 'var(--red)'; }
    else if (fadiga >= 80) { sobrecargaLabel = 'Sobrecarga elevada — produtividade caindo'; sobrecargaColor = 'var(--amber)'; }
    else if (fadiga >= 50) { sobrecargaLabel = 'Ritmo moderado — atenção à fadiga'; sobrecargaColor = 'var(--amber)'; }
    else { sobrecargaLabel = 'Operando bem — ritmo sustentável'; sobrecargaColor = 'var(--green)'; }

    // Eficiência operacional
    const eficiencia = paMax > 0 ? Math.round((paUsados / paMax) * 100) : 0;

    container.innerHTML = `
      <div class="fade-in">
        <div class="section-header">
          <div>
            <div class="section-title">👥 Pessoas & Capacidade</div>
            <div class="section-subtitle">Dia ${s.tempo.dia} · Gestão de Equipe e Serviços</div>
          </div>
        </div>

        <!-- Saúde e PA -->
        <div class="two-col-grid" style="margin-bottom:16px;">
          <div class="card">
            <div class="card-header"><div class="card-title">Energia do Fundador (PA)</div></div>
            <div class="stats-row" style="margin-top:8px;">
              <div class="stat-tile">
                <div class="stat-tile-label">PA Disponível</div>
                <div class="stat-tile-value b">${paMax - paUsados}</div>
              </div>
              <div class="stat-tile">
                <div class="stat-tile-label">Fadiga</div>
                <div class="stat-tile-value" style="color:${sobrecargaColor}">${fadiga}%</div>
              </div>
            </div>
            <div style="font-size:11px; color:var(--text-3); margin-top:10px;">${sobrecargaLabel}</div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">🛡️ Proteção Jurídica</div>
              ${jur.planoAtivo ? `<span class="badge" style="background:var(--green-soft);color:var(--green);">ATIVO</span>` : '<span class="badge" style="background:var(--red-soft);color:var(--red);">DESPROTEGIDO</span>'}
            </div>
            <div style="margin-top:10px;">
              ${jur.planoAtivo ? `
                <div style="font-size:13px; color:var(--text);">Plano: <strong>${BAL.protecaoJuridica.planos[jur.planoAtivo].nome}</strong></div>
                <div style="font-size:12px; color:var(--text-2); margin-top:4px;">Usos na semana: ${jur.usosSemanaAtual} / ${jur.usosSemanaMax}</div>
                <button class="btn btn-danger" style="margin-top:12px; width:100%; padding:6px;" onclick="window.AGENCIA.painelPessoas.cancelarPlanoJuridico()">Cancelar Assinatura</button>
              ` : `
                <div style="font-size:12px; color:var(--text-3); margin-bottom:10px;">Você está exposto a multas judiciais de até R$ 1.500 por incidente.</div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                  <button class="btn btn-secondary" style="font-size:11px; padding:6px;" onclick="window.AGENCIA.painelPessoas.contratarPlanoJuridico('basico')">Básico (R$ 250/m)</button>
                  <button class="btn btn-primary" style="font-size:11px; padding:6px;" onclick="window.AGENCIA.painelPessoas.contratarPlanoJuridico('completo')">Completo (R$ 350/m)</button>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Estrutura Solo -->
        <div class="card" style="margin-bottom:16px;">
          <div class="card-header"><div class="card-title">Equipe Atual</div></div>
          <div style="padding:10px 0;">
             <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:13px; color:var(--text);">🧑 <strong>Você (Fundador)</strong></div>
                <span class="badge">Ativo</span>
             </div>
             <p style="font-size:12px; color:var(--text-3); margin-top:5px; line-height:1.5;">Gerenciando marketing, vendas, operacional e financeiro de forma centralizada.</p>
          </div>
        </div>

        <!-- Próximos Passos -->
        <div class="card" style="border-style:dashed; opacity:0.8;">
          <div class="card-header"><div class="card-title" style="color:var(--text-2);">🔒 Contratações (Bloqueadas por Fase)</div></div>
          <div style="padding-top:10px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-3); padding:8px 0; border-bottom:1px solid var(--border);">
               <span>Assistente Comercial</span>
               <span>Req: Fase Tração</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-3); padding:8px 0; border-bottom:1px solid var(--border);">
               <span>Consultor de Viagens</span>
               <span>Req: Fase Organização</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
