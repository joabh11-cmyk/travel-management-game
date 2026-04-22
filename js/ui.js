// ============================================================
// AGÊNCIA — UI v2 (operacional / sistema de gestão)
// ============================================================
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.ui = {

  painelAtivo: null,

  init: function() {
    this.renderTelaInicio();
  },

  // ----------------------------------------------------------
  // TELA DE INÍCIO — layout duas colunas, sem orbs
  // ----------------------------------------------------------
  renderTelaInicio: function() {
    const BAL  = window.AGENCIA.BAL;
    const segs = BAL.segmentos;
    const difs = BAL.dificuldades;
    const mods = BAL.modos;

    const config = {
      nome:        '',
      modo:        'realista',
      dificuldade: 'dificil',
      segmento:    'lazer_nacional',
    };

    const el = document.getElementById('tela-inicio');
    el.innerHTML = `

      <!-- Coluna esquerda: branding e contexto -->
      <div class="inicio-left">

        <div>
          <div class="brand-eyebrow">Simulador de Gestão · Brasil</div>
          <h1 class="brand-title">AGÊNCIA</h1>
          <div class="brand-rule"></div>
          <p class="brand-subtitle">
            Uma simulação de gestão com as regras reais do mercado
            brasileiro de turismo. Sem atalhos. Sem bônus mágicos.
          </p>

          <div class="info-tiles">
            <div class="info-tile">
              <div class="info-tile-label">Capital inicial</div>
              <div class="info-tile-value v-green">R$&nbsp;1.000</div>
              <div class="info-tile-desc">Tudo que você tem para montar uma operação do zero.</div>
            </div>
            <div class="info-tile">
              <div class="info-tile-label">Pontos de ação / dia</div>
              <div class="info-tile-value">8</div>
              <div class="info-tile-desc">Vender, prospectar e resolver problemas disputam o mesmo recurso.</div>
            </div>
            <div class="info-tile">
              <div class="info-tile-label">Comissão aérea</div>
              <div class="info-tile-value v-amber">0 – 5%</div>
              <div class="info-tile-desc">Fee e margem sobre pacotes são sua fonte real de receita.</div>
            </div>
            <div class="info-tile">
              <div class="info-tile-label">Primeira venda</div>
              <div class="info-tile-value">≤ dia 7</div>
              <div class="info-tile-desc">Viável com resposta rápida e cotação clara. Improvável sem isso.</div>
            </div>
          </div>
        </div>

        <div class="inicio-left-footer">
          Modos: Realista Jogável · Brasil Real &nbsp;·&nbsp;
          Fases: Sobrevivência → Tração → Organização → Escala → Sólida
        </div>
      </div>

      <!-- Coluna direita: formulário de configuração -->
      <div class="inicio-right">
        <div class="config-form fade-in">

          <div class="form-header">
            <h2>Configurar Campanha</h2>
            <p>Essas escolhas definem as regras e o ritmo da sua operação desde o dia 1.</p>
          </div>

          <!-- Nome -->
          <div class="field-group">
            <label class="field-label" for="f-nome">Nome da Agência</label>
            <input
              id="f-nome"
              class="field-input"
              type="text"
              placeholder="Ex: Viagens Prime, Mundo Turismo, TopTravel…"
              maxlength="40"
              autocomplete="off"
            />
          </div>

          <!-- Modo financeiro -->
          <div class="field-group">
            <div class="field-label">Modo Financeiro</div>
            <div class="opt-group" id="g-modo">
              <button class="opt-btn sel" data-modo="realista">
                <span class="ob-label">Realista Jogável</span>
                <span class="ob-desc">Lógica brasileira com conversão e fôlego de caixa ajustados. Ponto de partida recomendado.</span>
              </button>
              <button class="opt-btn" data-modo="brasil_real">
                <span class="ob-label">Brasil Real</span>
                <span class="ob-desc">Comissão mínima, CLT pesado, margem no limite. Sem concessões.</span>
              </button>
            </div>
          </div>

          <!-- Dificuldade -->
          <div class="field-group">
            <div class="field-label">Dificuldade</div>
            <div class="opt-group" id="g-dif">
              <button class="opt-btn" data-dif="facil">
                <span class="ob-label">Fácil</span>
                <span class="ob-desc">Mais leads, eventos menos punitivos. Para familiarizar com o sistema.</span>
              </button>
              <button class="opt-btn" data-dif="medio">
                <span class="ob-label">Médio</span>
                <span class="ob-desc">Mercado equilibrado, punições razoáveis.</span>
              </button>
              <button class="opt-btn sel" data-dif="dificil">
                <span class="ob-label">Difícil</span>
                <span class="ob-desc">Padrão. Conversão baixa, caixa curto, erro tem custo real.</span>
              </button>
            </div>
          </div>

          <!-- Segmento -->
          <div class="field-group">
            <div class="field-label">Foco da Agência</div>
            <div class="seg-grid" id="g-seg">
              ${Object.entries(segs).map(([id, s]) => `
                <button class="seg-btn ${id === config.segmento ? 'sel' : ''}" data-seg="${id}">
                  <div class="seg-label">${s.emoji} ${s.label}</div>
                  <div class="seg-meta">${s.desc}</div>
                  <div class="seg-ticket">Ticket: R$&nbsp;${s.ticketMin.toLocaleString('pt-BR')}–${s.ticketMax.toLocaleString('pt-BR')}</div>
                </button>
              `).join('')}
            </div>
          </div>

          <hr class="field-divider" />

          <div class="form-footer">
            <div class="cfg-summary" id="cfg-summary">
              <span>Capital: <strong>R$ 1.000</strong></span>
              <span>Modo: <strong id="s-modo">Realista Jogável</strong></span>
              <span>Dificuldade: <strong id="s-dif">Difícil</strong></span>
              <span>Foco: <strong id="s-seg">🗺️ Lazer Nacional</strong></span>
            </div>
            <button class="btn-start" id="btn-start">
              Iniciar Campanha →
            </button>
          </div>

        </div>
      </div>
    `;

    // ---- Interatividade ----

    document.getElementById('f-nome').addEventListener('input', function() {
      config.nome = this.value.trim();
      this.classList.remove('erro');
    });

    document.getElementById('g-modo').addEventListener('click', function(e) {
      const btn = e.target.closest('[data-modo]');
      if (!btn) return;
      config.modo = btn.dataset.modo;
      document.querySelectorAll('[data-modo]').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      document.getElementById('s-modo').textContent = BAL.modos[config.modo].label;
    });

    document.getElementById('g-dif').addEventListener('click', function(e) {
      const btn = e.target.closest('[data-dif]');
      if (!btn) return;
      config.dificuldade = btn.dataset.dif;
      document.querySelectorAll('[data-dif]').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      document.getElementById('s-dif').textContent = BAL.dificuldades[config.dificuldade].label;
    });

    document.getElementById('g-seg').addEventListener('click', function(e) {
      const btn = e.target.closest('[data-seg]');
      if (!btn) return;
      config.segmento = btn.dataset.seg;
      document.querySelectorAll('[data-seg]').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      const s = BAL.segmentos[config.segmento];
      document.getElementById('s-seg').textContent = s.emoji + ' ' + s.label;
    });

    document.getElementById('btn-start').addEventListener('click', function() {
      const nomeEl = document.getElementById('f-nome');
      const nome   = nomeEl.value.trim();
      if (!nome) {
        nomeEl.classList.add('erro');
        nomeEl.placeholder = 'Obrigatório — dê um nome à sua agência.';
        nomeEl.focus();
        return;
      }
      config.nome = nome;
      window.AGENCIA.iniciarJogo(config);
      window.AGENCIA.ui.renderTelaJogo();
    });
  },

  // ----------------------------------------------------------
  // TELA DO JOGO (F2)
  // ----------------------------------------------------------
  renderTelaJogo: function() {
    const s   = window.AGENCIA.getState();
    const ag  = s.agencia;
    const BAL = window.AGENCIA.BAL;
    const seg = BAL.segmentos[ag.segmento];
    const mod = BAL.modos[ag.modo];
    const dif = BAL.dificuldades[ag.dificuldade];

    document.getElementById('tela-inicio').classList.remove('ativa');
    const el = document.getElementById('tela-jogo');
    el.classList.add('ativa');

    el.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-name">AGÊNCIA</div>
          <div class="sidebar-brand-agency" title="${this._esc(ag.nome)}">${this._esc(ag.nome)}</div>
        </div>
        <div class="sidebar-section-label">Painéis</div>
        <nav class="sidebar-nav" id="sidebar-nav">
          ${this._navLinks()}
        </nav>
        <div class="sidebar-footer">
          <button class="btn-sm" style="width:100%;" onclick="window.AGENCIA.save.exportar()">
            💾 Exportar Save (F9)
          </button>
        </div>
      </aside>

      <div class="main-wrapper">
        <header class="topbar" id="topbar">
          <div class="topbar-cell">
            <div class="topbar-label">Dia</div>
            <div class="topbar-value v-blue" id="tp-dia">${s.tempo.dia}</div>
          </div>
          <div class="topbar-cell">
            <div class="topbar-label">Caixa</div>
            <div class="topbar-value v-green" id="tp-caixa">${this._brl(s.caixa.saldo)}</div>
          </div>
          <div class="topbar-cell">
            <div class="topbar-label">Pontos de Ação</div>
            <div class="topbar-value v-amber" id="tp-pa">${s.pa.disponivel}/${s.pa.maximo}</div>
          </div>
          <div class="topbar-cell">
            <div class="topbar-label">Reputação</div>
            <div class="topbar-value" id="tp-rep">${ag.reputacao}<span style="font-size:10px;color:var(--text-3);font-family:var(--font);">/100</span></div>
          </div>
          <div class="topbar-cell">
            <div class="topbar-label">Fase</div>
            <div class="topbar-value" style="font-size:11px;letter-spacing:0.5px;color:var(--amber);">SOBREVIVÊNCIA</div>
          </div>
          <div class="topbar-alerts" id="topbar-alerts"></div>
        </header>

        <main class="main-content" id="main-content">
          ${this._renderBemVindo(ag, seg, mod, dif, s)}
        </main>
      </div>
    `;

    document.getElementById('sidebar-nav').addEventListener('click', e => {
      const link = e.target.closest('[data-painel]');
      if (!link) return;
      this._trocarPainel(link.dataset.painel);
    });
  },

  // ----------------------------------------------------------
  // Dashboard principal (F2) — overview com log de eventos
  // ----------------------------------------------------------
  _renderBemVindo: function(ag, seg, mod, dif, s) {
    const log = (s.logDiaAtual && s.logDiaAtual.eventos) || [];
    const saldoCor = s.caixa.saldo < 200 ? 'r' : s.caixa.saldo < 500 ? 'a' : 'g';
    return `<div class="fade-in">

      <div class="section-header">
        <div>
          <div class="section-title">${seg.emoji} ${this._esc(ag.nome)}</div>
          <div class="section-subtitle">Dia ${s.tempo.dia} · Semana ${s.tempo.semana} · Fase Sobrevivência</div>
        </div>
        <div class="phase-badge">⚡ Sobrevivência</div>
      </div>

      <!-- KPIs rápidos -->
      <div class="stats-row" style="margin-bottom:16px;">
        <div class="stat-tile">
          <div class="stat-tile-label">Caixa</div>
          <div class="stat-tile-value ${saldoCor}">${this._brl(s.caixa.saldo)}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">PA Restante</div>
          <div class="stat-tile-value a">${s.pa.disponivel}/${s.pa.maximo}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">Reputação</div>
          <div class="stat-tile-value b">${ag.reputacao}/100</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">Fadiga</div>
          <div class="stat-tile-value ${ag.fadiga >= 80 ? 'r' : ag.fadiga >= 50 ? 'a' : ''}"
            >${Math.round(ag.fadiga)}/100</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">Vendas</div>
          <div class="stat-tile-value">${s.kpis.totalVendas}</div>
        </div>
      </div>

      <!-- Log de eventos do dia -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Log do Dia ${s.tempo.dia}</div>
          <button class="btn-sm" onclick="if(window.AGENCIA.getState().eventosPendentes && window.AGENCIA.getState().eventosPendentes.length > 0) { alert('Resolva os eventos pendentes antes de avançar o dia!'); window.AGENCIA.ui.mostrarEventosPendentes(); } else { window.AGENCIA.loop.avancarDia(); window.AGENCIA.ui.renderizarPainelAtivo(); }" id="btn-avancar-dia"
            style="background:var(--blue);border-color:var(--blue);color:#fff;padding:6px 16px;font-weight:700;">
            Avançar Dia →
          </button>
        </div>
        <div class="event-log" id="event-log">
          ${log.length === 0
            ? '<div class="log-empty">Nenhuma ação registrada hoje. Use PA para prospectar, qualificar ou fechar negócios.</div>'
            : log.map(e => `<div class="log-entry log-${e.tipo}">${e.msg}</div>`).join('')
          }
        </div>
      </div>

      <!-- Atributos -->
      <div class="card">
        <div class="card-header"><div class="card-title">Atributos da Agência</div></div>
        <div class="attr-row">
          ${this._attrBar('Reputação',           ag.reputacao,     'b')}
          ${this._attrBar('Eficiência Operac.',  ag.eficienciaOp,  'g')}
          ${this._attrBar('Maturidade Comercial',ag.maturidadeCom, 'g')}
          ${this._attrBar('Fadiga do Dono',      ag.fadiga,        'r')}
        </div>
      </div>

    </div>`;
  },

  // ----------------------------------------------------------
  // Re-renderiza o painel ativo (chamado após avancarDia)
  // ----------------------------------------------------------
  renderizarPainelAtivo: function() {
    const painel = this.painelAtivo;
    if (!painel || painel === 'principal') {
      // Re-render dashboard overview
      const s   = window.AGENCIA.getState();
      if (!s) return;
      const BAL = window.AGENCIA.BAL;
      const ag  = s.agencia;
      const seg = BAL.segmentos[ag.segmento];
      const mod = BAL.modos[ag.modo];
      const dif = BAL.dificuldades[ag.dificuldade];
      const mc  = document.getElementById('main-content');
      if (mc) mc.innerHTML = this._renderBemVindo(ag, seg, mod, dif, s);
      return;
    }
    const map = {
      caixa:       window.AGENCIA.painelCaixa,
      comercial:   window.AGENCIA.painelComercial,
      operacional: window.AGENCIA.painelOperacional,
      marketing:   window.AGENCIA.painelMarketing,
      pessoas:     window.AGENCIA.painelPessoas,
      mercado:     window.AGENCIA.painelMercado,
    };
    const mc = document.getElementById('main-content');
    if (mc && map[painel]) { mc.innerHTML = ''; map[painel].render(mc); }

    // Dispara modal de eventos F7, se houver
    this.mostrarEventosPendentes();
  },

  // ----------------------------------------------------------
  // Modal de fechamento semanal / mensal
  // ----------------------------------------------------------
  mostrarModal: function(dados) {
    const old = document.getElementById('modal-overlay');
    if (old) old.remove();

    const isMensal = dados.tipo === 'mensal';
    const resCor   = dados.resultado >= 0 ? 'g' : 'r';
    const sinal    = dados.resultado >= 0 ? '+' : '';
    const ui       = this;

    const el = document.createElement('div');
    el.id = 'modal-overlay';
    el.className = 'modal-overlay';

    const extraSemanal = !isMensal ? `
      <div style="margin:14px 0; padding:12px; background:rgba(99,102,241,0.06); border-radius:8px; border-left:3px solid var(--blue);">
        <div style="font-size:12px; color:var(--text-2); font-weight:700; letter-spacing:.5px; margin-bottom:6px;">ALERTA DA SEMANA</div>
        <div style="font-size:13px; color:var(--text);">${dados.alertaPrincipal || '—'}</div>
      </div>
      <div style="margin:0 0 14px; padding:12px; background:rgba(34,197,94,0.05); border-radius:8px; border-left:3px solid var(--green);">
        <div style="font-size:12px; color:var(--text-2); font-weight:700; letter-spacing:.5px; margin-bottom:6px;">RECOMENDAÇÃO</div>
        <div style="font-size:13px; color:var(--text);">${dados.recomendacao || '—'}</div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:14px;">
        <div class="stat-tile"><div class="stat-tile-label">Vendas</div><div class="stat-tile-value g">${dados.vendasSemana || 0}</div></div>
        <div class="stat-tile"><div class="stat-tile-label">Perdidas</div><div class="stat-tile-value r">${dados.perdasSemana || 0}</div></div>
        <div class="stat-tile"><div class="stat-tile-label">Margem</div><div class="stat-tile-value ${parseFloat(dados.margemPct||0)>=10?'g':'r'}">${dados.margemPct || '0.0'}%</div></div>
      </div>
    ` : `
      <div style="margin:14px 0; padding:12px; background:rgba(99,102,241,0.06); border-radius:8px;">
        <div style="font-size:12px; color:var(--text-2); font-weight:700; letter-spacing:.5px; margin-bottom:6px;">CICLO MENSAL CONCLUÍDO</div>
        <div style="font-size:13px; color:var(--text); line-height:1.6;">
          ${dados.resultado >= 0 ? '✅ Mês encerrado com saldo positivo. Você está construindo a base da agência.' : '🔴 Mês no vermelho. Revise custos e taxa de conversão antes do próximo ciclo.'}
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
        <div class="stat-tile"><div class="stat-tile-label">Total Vendas</div><div class="stat-tile-value g">${dados.totalVendas || 0}</div></div>
        <div class="stat-tile"><div class="stat-tile-label">Fase Atual</div><div class="stat-tile-value b">Sobrevivência</div></div>
      </div>
    `;

    el.innerHTML = `
      <div class="modal-box fade-in">
        <div class="modal-header">
          <div class="modal-tipo">${isMensal ? '📅 BALANÇO MENSAL' : '📊 FECHAMENTO SEMANAL'}</div>
          <div class="modal-titulo">${dados.titulo}</div>
        </div>
        <div class="modal-body">
          <div class="stats-row" style="margin-bottom:14px;">
            <div class="stat-tile">
              <div class="stat-tile-label">Receitas</div>
              <div class="stat-tile-value g">${ui._brl(dados.receitas)}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Despesas</div>
              <div class="stat-tile-value r">${ui._brl(dados.despesas)}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Resultado</div>
              <div class="stat-tile-value ${resCor}">${sinal}${ui._brl(dados.resultado)}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Saldo Atual</div>
              <div class="stat-tile-value">${ui._brl(dados.saldo)}</div>
            </div>
          </div>
          ${extraSemanal}
          <div class="modal-linha">
            <span>Reputação</span>
            <span class="${dados.ajusteRep >= 0 ? 'g' : 'r'}">${dados.reputacao}/100 (${dados.ajusteRep >= 0 ? '+' : ''}${dados.ajusteRep || 0})</span>
          </div>
          <div class="modal-linha">
            <span>Fadiga do Fundador</span>
            <span class="${dados.fadiga >= 80 ? 'r' : 'a'}">${Math.round(dados.fadiga)}/100</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-start" onclick="document.getElementById('modal-overlay').remove()" style="padding:10px 28px;">
            Continuar →
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    el.addEventListener('click', function(e) {
      if (e.target === el) el.remove();
    });
  },

  // ----------------------------------------------------------
  // Eventos de Mercado Pendentes (F7)
  // ----------------------------------------------------------
  mostrarEventosPendentes: function() {
    const s = window.AGENCIA.getState();
    if (!s || s.gameOver || !s.eventosPendentes || s.eventosPendentes.length === 0) return;

    // Se já tem modal aberto (exceto o próprio modal-evento para não encavalar)
    if (document.getElementById('modal-overlay-evento')) return;

    const evento = s.eventosPendentes[0];

    const el = document.createElement('div');
    el.id = 'modal-overlay-evento';
    el.className = 'modal-overlay';
    
    // Evita clicar fora para fechar (é obrigatório)
    
    const botoes = evento.opcoes.map(o => {
      let extra = o.impactos.custoPA ? ` <small>(Custa ${o.impactos.custoPA} PA)</small>` : '';
      return `<button class="btn-sm" style="width:100%; text-align:left; justify-content:flex-start; margin-bottom:10px; padding:12px; background:var(--surface); border:1px solid var(--border); color:var(--text);"
                onclick="window.AGENCIA.ui.resolverEventoUi('${evento.instanciaId}', '${o.id}')">
                ${o.label}${extra}
              </button>`;
    }).join('');

    el.innerHTML = `
      <div class="modal-box fade-in" style="border-color:var(--amber);">
        <div class="modal-header" style="border-color:var(--amber);">
          <div class="modal-tipo" style="color:var(--amber);">⚠️ EVENTO DE MERCADO</div>
          <div class="modal-titulo">${evento.titulo}</div>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-2);font-size:14px;line-height:1.6;margin-bottom:20px;">
            ${evento.mensagem.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </p>
          <div style="margin-top:20px;">
            <p style="font-size:13px; font-weight:700; margin-bottom:10px; color:var(--text);">Como você quer agir?</p>
            ${botoes}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(el);
  },

  resolverEventoUi: function(instanciaId, opcaoId) {
    const s = window.AGENCIA.getState();
    const ok = window.AGENCIA.events.resolverEvento(instanciaId, opcaoId, s);
    if (!ok) return; // Talvez sem PA suficiente, o logEvento já avisa

    const el = document.getElementById('modal-overlay-evento');
    if (el) el.remove();

    // Re-renderiza a tela atual (atualiza stats, PA, caixa)
    this.atualizarTopbar();
    this.renderizarPainelAtivo();
    
    // Tenta mostrar o próximo, se houver
    this.mostrarEventosPendentes();
  },

  // ----------------------------------------------------------
  // Game Over
  // ----------------------------------------------------------
  mostrarGameOver: function(motivo) {
    const old = document.getElementById('modal-overlay');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'modal-overlay';
    el.className = 'modal-overlay';
    el.innerHTML = `
      <div class="modal-box fade-in" style="border-color:var(--red);">
        <div class="modal-header" style="border-color:var(--red);">
          <div class="modal-tipo" style="color:var(--red);">🔴 GAME OVER</div>
          <div class="modal-titulo">Sua agência encerrou as operações.</div>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-2);font-size:13px;line-height:1.7;margin-bottom:20px;">${motivo}</p>
          <div class="modal-linha"><span>Total de Vendas</span><span>${window.AGENCIA.getState().kpis.totalVendas}</span></div>
          <div class="modal-linha"><span>Dias Sobrevividos</span><span>${window.AGENCIA.getState().tempo.dia}</span></div>
        </div>
        <div class="modal-footer">
          <button class="btn-start" onclick="location.reload()" style="background:var(--red);padding:10px 28px;">Recomeçar</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
  },

  // ----------------------------------------------------------
  // Troca de painel
  // ----------------------------------------------------------
  _trocarPainel: function(painel) {
    this.painelAtivo = painel;
    document.querySelectorAll('[data-painel]').forEach(l => l.classList.remove('ativo'));
    const link = document.querySelector(`[data-painel="${painel}"]`);
    if (link) link.classList.add('ativo');

    if (painel === 'principal') {
      this.renderizarPainelAtivo();
      return;
    }

    const map = {
      caixa:       window.AGENCIA.painelCaixa,
      comercial:   window.AGENCIA.painelComercial,
      operacional: window.AGENCIA.painelOperacional,
      marketing:   window.AGENCIA.painelMarketing,
      pessoas:     window.AGENCIA.painelPessoas,
      mercado:     window.AGENCIA.painelMercado,
    };
    const mc = document.getElementById('main-content');
    if (map[painel]) { mc.innerHTML = ''; map[painel].render(mc); }
  },

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  _navLinks: function() {
    const pAtivo = this.painelAtivo || 'principal';
    return [
      { id: 'principal',   icon: '🏠', label: 'Principal' },
      { id: 'caixa',       icon: '💰', label: 'Caixa' },
      { id: 'comercial',   icon: '📈', label: 'Comercial' },
      { id: 'operacional', icon: '⚙️', label: 'Operação' },
      { id: 'marketing',   icon: '📣', label: 'Marketing' },
      { id: 'pessoas',     icon: '👥', label: 'Pessoas' },
      { id: 'mercado',     icon: '🌐', label: 'Mercado' },
    ].map(n => `
      <button class="nav-link ${n.id === pAtivo ? 'ativo' : ''}" data-painel="${n.id}">
        <span class="nav-icon">${n.icon}</span>
        ${n.label}
      </button>
    `).join('');
  },

  _attrBar: function(nome, val, cor) {
    return `
      <div class="attr-item">
        <div class="attr-header">
          <span class="attr-name">${nome}</span>
          <span class="attr-value">${val}</span>
        </div>
        <div class="attr-bar">
          <div class="attr-fill ${cor}" style="width:${val}%"></div>
        </div>
      </div>`;
  },

  _brl: function(n) {
    return 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  _esc: function(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  // Atualiza topbar
  atualizarTopbar: function() {
    const s = window.AGENCIA.getState();
    if (!s) return;
    const ids = {
      'tp-dia':   s.tempo.dia,
      'tp-caixa': this._brl(s.caixa.saldo),
      'tp-pa':    s.pa.disponivel + '/' + s.pa.maximo,
      'tp-rep':   s.agencia.reputacao,
    };
    Object.entries(ids).forEach(function([id, val]) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
    // Cor dinâmica do caixa
    const caixaEl = document.getElementById('tp-caixa');
    if (caixaEl) {
      caixaEl.className = 'topbar-value ' + (s.caixa.saldo < 0 ? 'v-red' : s.caixa.saldo < 200 ? 'v-amber' : 'v-green');
    }
    // Cor dinâmica do PA
    const paEl = document.getElementById('tp-pa');
    if (paEl) {
      paEl.className = 'topbar-value ' + (s.pa.disponivel === 0 ? 'v-red' : s.pa.disponivel <= 2 ? 'v-amber' : 'v-amber');
    }
  },
};

document.addEventListener('DOMContentLoaded', function() {
  window.AGENCIA.ui.init();
});
