// js/chatSimulator.js
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.chatSimulator = (function() {

  async function iniciarChat(lead, cotacao, agencia, apiKey) {
    const BAL = window.AGENCIA.BAL;
    const systemPrompt = window.AGENCIA.data.promptsClientes.getSystemPrompt(lead.perfil, lead, cotacao, agencia);
    
    const sessao = {
      lead,
      cotacao,
      historico: [{ role: 'system', content: systemPrompt }],
      turnoAtual: 0,
      scoreAcumulado: 0,
      encerrado: false,
      decisaoPrevia: null
    };

    // Gera a primeira mensagem do cliente automaticamente
    try {
      const primeiraMensagem = await _chamadaGemini(sessao.historico, apiKey);
      sessao.historico.push({ role: 'assistant', content: primeiraMensagem });
      return sessao;
    } catch (err) {
      console.error("Erro ao iniciar chat:", err);
      throw err;
    }
  }

  async function enviarMensagem(sessao, mensagemJogador, apiKey) {
    if (sessao.encerrado) return;

    sessao.historico.push({ role: 'user', content: mensagemJogador });
    
    try {
      const respostaCliente = await _chamadaGemini(sessao.historico, apiKey);
      sessao.historico.push({ role: 'assistant', content: respostaCliente });
      
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
      console.error("Erro ao enviar mensagem:", err);
      throw err;
    }
  }

  function encerrarChat(sessao) {
    return window.AGENCIA.clientAI.decisaoFinal(sessao);
  }

  async function _chamadaGemini(historico, apiKey) {
    const BAL = window.AGENCIA.BAL;
    const model = BAL.chatSimulator.modeloGemini;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Converte histórico para formato Gemini
    const contents = historico.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Injeta o system prompt na primeira mensagem se necessário ou usa o campo system_instruction se suportado
    const systemInstruction = historico.find(m => m.role === 'system')?.content;

    const body = {
      contents: contents,
      generationConfig: {
        temperature: BAL.chatSimulator.temperaturaGemini,
        maxOutputTokens: BAL.chatSimulator.maxTokensResposta,
      }
    };

    if (systemInstruction) {
      body.system_instruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Erro na API do Gemini");
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  return {
    iniciarChat,
    enviarMensagem,
    encerrarChat
  };

})();
