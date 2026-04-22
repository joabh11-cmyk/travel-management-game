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
  // TELA DO JOGO (skeleton F1)
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
  // Painel de boas-vindas (F1)
  // ----------------------------------------------------------
  _renderBemVindo: function(ag, seg, mod, dif, s) {
    return `<div class="fade-in">

      <div class="section-header">
        <div>
          <div class="section-title">${seg.emoji} ${this._esc(ag.nome)}</div>
          <div class="section-subtitle">Campanha iniciada · Dia 1 de operação</div>
        </div>
        <div class="phase-badge">⚡ Sobrevivência</div>
      </div>

      <!-- KPIs de início -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Estado Inicial</div>
        </div>
        <div class="stats-row">
          <div class="stat-tile">
            <div class="stat-tile-label">Caixa</div>
            <div class="stat-tile-value g">${this._brl(s.caixa.saldo)}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Foco</div>
            <div class="stat-tile-value" style="font-size:15px;">${seg.label}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Modo</div>
            <div class="stat-tile-value" style="font-size:15px;">${mod.label}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Dificuldade</div>
            <div class="stat-tile-value a" style="font-size:15px;">${dif.label}</div>
          </div>
        </div>
      </div>

      <!-- Atributos da agência -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Atributos da Agência</div>
        </div>
        <div class="attr-row">
          ${this._attrBar('Reputação',          ag.reputacao,     'b')}
          ${this._attrBar('Autoridade de Marca', ag.autoridade,    'b')}
          ${this._attrBar('Eficiência Operac.',  ag.eficienciaOp,  'g')}
          ${this._attrBar('Maturidade Comercial',ag.maturidadeCom, 'g')}
          ${this._attrBar('Segurança Jurídica',  ag.segurancaJur,  'a')}
          ${this._attrBar('Fadiga do Dono',      ag.fadiga,        'r')}
        </div>
      </div>

      <!-- Banner de status -->
      <div class="info-banner">
        <strong>F1 concluída.</strong>
        Estrutura de dados ✓ &nbsp;·&nbsp; Estado em memória ✓ &nbsp;·&nbsp; Design system ✓ &nbsp;·&nbsp; Tela de início ✓<br>
        <strong>F2</strong> implementará o game loop diário, pontos de ação, custos fixos e fechamentos semanal/mensal.
      </div>

    </div>`;
  },

  // ----------------------------------------------------------
  // Troca de painel
  // ----------------------------------------------------------
  _trocarPainel: function(painel) {
    this.painelAtivo = painel;
    document.querySelectorAll('[data-painel]').forEach(l => l.classList.remove('ativo'));
    const link = document.querySelector(`[data-painel="${painel}"]`);
    if (link) link.classList.add('ativo');

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
    return [
      { id: 'caixa',       icon: '💰', label: 'Caixa' },
      { id: 'comercial',   icon: '📈', label: 'Comercial' },
      { id: 'operacional', icon: '⚙️', label: 'Operação' },
      { id: 'marketing',   icon: '📣', label: 'Marketing' },
      { id: 'pessoas',     icon: '👥', label: 'Pessoas' },
      { id: 'mercado',     icon: '🌐', label: 'Mercado' },
    ].map(n => `
      <button class="nav-link ${n.id === this.painelAtivo ? 'ativo' : ''}" data-painel="${n.id}">
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

  // Atualiza topbar a partir do estado (chamado em F2)
  atualizarTopbar: function() {
    const s  = window.AGENCIA.getState();
    if (!s) return;
    const tp = {
      'tp-dia':  s.tempo.dia,
      'tp-caixa': this._brl(s.caixa.saldo),
      'tp-pa':   `${s.pa.disponivel}/${s.pa.maximo}`,
      'tp-rep':  s.agencia.reputacao,
    };
    Object.entries(tp).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  },
};

document.addEventListener('DOMContentLoaded', function() {
  window.AGENCIA.ui.init();
});
