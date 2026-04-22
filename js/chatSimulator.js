// js/chatSimulator.js
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.chatSimulator = (function() {

  async function iniciarChat(lead, cotacao, agencia, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error("API Key não encontrada. Configure na tela inicial.");
    }

    const systemPrompt = window.AGENCIA.data.promptsClientes.getSystemPrompt(lead.perfil, lead, cotacao, agencia);
    
    const sessao = {
      lead,
      cotacao,
      systemPrompt: systemPrompt,
      historico: [], // Apenas mensagens user/model
      turnoAtual: 0,
      scoreAcumulado: 0,
      encerrado: false,
      decisaoPrevia: null
    };

    // Para gerar a primeira mensagem, enviamos um prompt invisível do "sistema" via user role
    const promptAbertura = {
      role: 'user',
      parts: [{
        text: 'Inicie a conversa agora com sua mensagem de abertura, como se você acabasse de receber a proposta do agente.'
      }]
    };

    try {
      const primeiraMensagem = await _chamadaGemini(sessao.systemPrompt, [promptAbertura], apiKey);
      // Salva no histórico real da sessão
      sessao.historico.push({ role: 'model', content: primeiraMensagem });
      return sessao;
    } catch (err) {
      console.error("[ChatSimulator] Erro ao iniciar chat:", err);
      throw err;
    }
  }

  async function enviarMensagem(sessao, mensagemJogador, apiKey) {
    if (sessao.encerrado) return;

    // Adiciona mensagem do jogador ao histórico
    sessao.historico.push({ role: 'user', content: mensagemJogador });
    
    // Converte histórico para formato Gemini (roles 'user' e 'model')
    const historicoFormatado = sessao.historico.map(m => ({
      role: m.role, // Já usamos 'user' e 'model' internamente agora
      parts: [{ text: m.content }]
    }));

    try {
      const respostaCliente = await _chamadaGemini(sessao.systemPrompt, historicoFormatado, apiKey);
      
      // Adiciona resposta do cliente ao histórico
      sessao.historico.push({ role: 'model', content: respostaCliente });
      
      const avaliacao = window.AGENCIA.clientAI.avaliarTurno(sessao, mensagemJogador, respostaCliente);
      sessao.turnoAtual++;
      
      const maxTurnos = window.AGENCIA.BAL.chatSimulator.maxTurnos;
      if (sessao.turnoAtual >= maxTurnos || avaliacao.encerramentoDetectado) {
        sessao.encerrado = true;
        sessao.decisaoPrevia = avaliacao.tipoEncerramento;
      }

      return {
        respostaCliente,
        scoreAtual: sessao.scoreAcumulado,
        turnoAtual: sessao.turnoAtual,
        encerrado: sessao.encerrado
      };
    } catch (err) {
      console.error("[ChatSimulator] Erro ao enviar mensagem:", err);
      throw err;
    }
  }

  function encerrarChat(sessao) {
    return window.AGENCIA.clientAI.decisaoFinal(sessao);
  }

  async function _chamadaGemini(systemPrompt, contents, apiKey, isRetry = false) {
    if (!contents || contents.length === 0) {
      console.error('[ChatSimulator] contents vazio — chamada abortada');
      throw new Error("Histórico de mensagens vazio.");
    }

    // A) Delay de 2 segundos ANTES de cada chamada fetch
    await new Promise(r => setTimeout(r, 2000));

    const BAL = window.AGENCIA.BAL;
    const model = 'gemini-2.0-flash'; // Modelo definitivo
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log('[ChatSimulator] usando modelo: gemini-2.0-flash');
    console.log('[ChatSimulator] endpoint:', url);

    const body = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: BAL.chatSimulator?.temperaturaGemini ?? 0.85,
        maxOutputTokens: BAL.chatSimulator?.maxTokensResposta ?? 150,
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // B) Detectar erro 429 na resposta
    if (response.status === 429) {
      if (isRetry) {
        _bloquearInputTemporariamente(30);
        throw new Error("O cliente está ocupado agora. Tente novamente em alguns segundos.");
      }
      return await _tratarRateLimit(systemPrompt, contents, apiKey);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Erro na API do Gemini");
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Resposta inválida da API (vazio)");
    }

    return data.candidates[0].content.parts[0].text;
  }

  // C) Função tratarRateLimit
  async function _tratarRateLimit(systemPrompt, contents, apiKey) {
    const pausas = [
      'peraí, voltei já...',
      'um segundo, tô resolvendo outra coisa',
      'opa, caiu a net aqui kk. já volto'
    ];
    const frase = pausas[Math.floor(Math.random() * pausas.length)];

    // Exibir frase como bolha do cliente
    if (window.AGENCIA.ui && window.AGENCIA.ui._addChatBubble) {
      window.AGENCIA.ui._addChatBubble('cliente', frase);
    }

    // Mostrar "cliente digitando..." por 8 segundos
    const typing = document.getElementById('chat-typing');
    if (typing) {
      typing.style.visibility = 'visible';
      await new Promise(r => setTimeout(r, 8000));
      typing.style.visibility = 'hidden';
    } else {
      await new Promise(r => setTimeout(r, 8000));
    }

    // Retry 1 vez
    return await _chamadaGemini(systemPrompt, contents, apiKey, true);
  }

  function _bloquearInputTemporariamente(segundos) {
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('btn-chat-send');
    if (!input || !btn) return;

    input.disabled = true;
    btn.disabled = true;

    let restante = segundos;
    const interval = setInterval(() => {
      restante--;
      input.placeholder = `Aguarde ${restante}s para continuar...`;
      if (restante <= 0) {
        clearInterval(interval);
        input.disabled = false;
        btn.disabled = false;
        input.placeholder = "Digite sua mensagem...";
        input.focus();
      }
    }, 1000);
  }

  return {
    iniciarChat,
    enviarMensagem,
    encerrarChat
  };

})();
