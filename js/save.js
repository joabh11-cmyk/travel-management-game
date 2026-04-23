// js/save.js — Sistema de Save/Load JSON e localStorage
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.save = (function() {
  const LOCAL_STORAGE_KEY = 'AGENCIA_SAVE_GAME';

  /**
   * Exporta o estado atual como um arquivo JSON para download.
   */
  function exportar() {
    const state = window.AGENCIA.getState();
    if (!state) {
      alert("Nenhum jogo em andamento para exportar.");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `agencia_save_dia_${state.tempo.dia}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    console.log("[Save] Jogo exportado com sucesso.");
  }

  /**
   * Importa um arquivo JSON e restaura o estado do jogo.
   */
  function importar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');

      reader.onload = readerEvent => {
        try {
          const content = readerEvent.target.result;
          const newState = JSON.parse(content);
          
          // Validação básica
          if (!newState.agencia || !newState.tempo || !newState.caixa) {
            throw new Error("Estrutura de save inválida ou incompleta.");
          }

          // Restaura o estado
          window.AGENCIA.state = newState;
          
          // Salva no localStorage para persistência imediata
          autoSave();

          // Feedback e Re-render
          alert(`Save carregado com sucesso! Dia ${newState.tempo.dia} - ${newState.agencia.nome}`);
          
          // Se estiver na tela de início, vai para a tela de jogo
          const telaInicio = document.getElementById('tela-inicio');
          if (telaInicio && telaInicio.classList.contains('ativa')) {
            window.AGENCIA.ui.renderTelaJogo();
          } else {
            // Se já estiver no jogo, apenas atualiza tudo
            window.AGENCIA.ui.renderTelaJogo();
            window.AGENCIA.ui.renderizarPainelAtivo();
          }
        } catch (err) {
          alert("Erro ao importar save: " + err.message);
        }
      };
    };

    input.click();
  }

  /**
   * Salva o estado atual no localStorage.
   */
  function autoSave() {
    const state = window.AGENCIA.getState();
    if (!state || state.gameOver) return;

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      // console.log("[Save] Auto-save realizado.");
    } catch (e) {
      console.error("[Save] Erro ao salvar no localStorage:", e);
    }
  }

  /**
   * Carrega o estado do localStorage.
   */
  function carregarDoLocalStorage() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        window.AGENCIA.state = state;
        return state;
      }
    } catch (e) {
      console.error("[Save] Erro ao carregar do localStorage:", e);
    }
    return null;
  }

  /**
   * Verifica se existe um save válido.
   */
  function temSaveLocal() {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return false;
    try {
      const s = JSON.parse(saved);
      return !!(s && s.agencia && s.tempo);
    } catch(e) {
      return false;
    }
  }

  /**
   * Deleta o save local (ex: ao dar Game Over).
   */
  function limparSaveLocal() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  return {
    exportar,
    importar,
    autoSave,
    carregarDoLocalStorage,
    temSaveLocal,
    limparSaveLocal
  };
})();
