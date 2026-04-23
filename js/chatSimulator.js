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
      
      const scoreAnterior = sessao.scoreAcumulado;
      const avaliacao = window.AGENCIA.clientAI.avaliarTurno(sessao, mensagemJogador, respostaCliente);
      const delta = sessao.scoreAcumulado - scoreAnterior;

      // Grava dados do turno para o feedback posterior
      if (!sessao.dadosTurnos) sessao.dadosTurnos = [];
      sessao.dadosTurnos.push({
        numero: sessao.turnoAtual + 1,
        mensagemJogador: mensagemJogador,
        deltaScore: delta,
        scoreMomento: sessao.scoreAcumulado
      });

      // Adiciona resposta do cliente ao histórico
      sessao.historico.push({ role: 'model', content: respostaCliente });
      
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
    const res = window.AGENCIA.clientAI.decisaoFinal(sessao);
    sessao.feedbackCompleto = _gerarFeedbackCompleto(sessao, res);
    return res;
  }

  function _gerarFeedbackCompleto(sessao, resultadoFinal) {
    const lead = sessao.lead;
    const historico = sessao.historico;
    const turnos = sessao.dadosTurnos || [];
    
    // 1. Turnos Detalhados
    const turnosDetalhados = turnos.map(t => ({
      numero: t.numero,
      resumoJogador: t.mensagemJogador.split(' ').slice(0, 6).join(' ') + '...',
      deltaScore: t.deltaScore,
      icone: t.deltaScore > 0 ? '✓' : (t.deltaScore < 0 ? '✗' : '~')
    }));

    // 2. Competências
    const competencias = _calcularCompetencias(sessao);

    // 3. Perfil Contexto
    const perfisContexto = {
      cacador_preco: 'Caçadores de preço comparam tudo. Sua missão é justificar o valor antes que eles comparem.',
      inseguro: 'Clientes inseguros precisam de segurança emocional antes do preço. Paciência vence aqui.',
      apressado: 'Apressados decidem rápido — para o bem ou para o mal. Seja objetivo ou perca a atenção.',
      detalhista: 'Detalhistas confiam em quem demonstra conhecimento real. Imprecisão custa caro.',
      indicacao: 'Clientes de indicação chegam abertos. Personalização e atenção fecham o negócio.'
    };

    // 4. Dica Prioritária
    const piorTurno = [...turnos].sort((a, b) => a.deltaScore - b.deltaScore)[0];
    let dicaPrioritaria = "Revise seu diálogo e pense no que o perfil desse cliente precisava ouvir.";
    if (piorTurno && piorTurno.deltaScore < 0) {
      const resumo = piorTurno.mensagemJogador.split(' ').slice(0, 5).join(' ') + '...';
      let dicaEspecifica = _getDicaEspecifica(lead.perfil, piorTurno.mensagemJogador);
      dicaPrioritaria = `Turno ${piorTurno.numero}: "${resumo}" custou ${Math.abs(piorTurno.deltaScore)} pontos. ${dicaEspecifica}`;
    }

    // 5. Score Comparativo
    const medias = { cacador_preco: 55, inseguro: 60, apressado: 65, detalhista: 58, indicacao: 70 };
    const mediaPerfil = medias[lead.perfil] || 60;
    const scoreMaximo = Math.min(100, sessao.scoreAcumulado + 20);
    
    let fraseScore = 'Abaixo da média para esse perfil. Tente de novo focando nos pontos fracos.';
    if (sessao.scoreAcumulado >= mediaPerfil + 10) fraseScore = `Acima da média. Tente bater ${scoreMaximo} pontos.`;
    else if (sessao.scoreAcumulado >= mediaPerfil) fraseScore = 'Na média. Um ajuste de linguagem pode te colocar acima.';

    return {
      decisao: resultadoFinal.decisao,
      scoreTotal: Math.round(sessao.scoreAcumulado),
      mensagemCliente: resultadoFinal.mensagemCliente,
      turnosDetalhados,
      competencias,
      perfilContexto: perfisContexto[lead.perfil] || '',
      dicaPrioritaria,
      scoreComparativo: {
        media: mediaPerfil,
        maximo: scoreMaximo,
        frase: fraseScore
      }
    };
  }

  function _calcularCompetencias(sessao) {
    const lead = sessao.lead;
    const turnos = sessao.dadosTurnos || [];
    const msg1 = turnos[0]?.mensagemJogador.toLowerCase() || "";
    
    // Escuta Ativa
    let escuta = 0;
    if (msg1.includes('?')) escuta += 30;
    if (!msg1.match(/\d/)) escuta += 20; // não falou preço/números no primeiro turno
    if (msg1.match(/r\$|\$|reais|valor|preço/)) escuta -= 20;
    escuta = Math.max(0, Math.min(100, 50 + escuta));

    // Conhecimento Produto
    let prod = turnos.filter(t => t.deltaScore > 0).length * 25;
    if (lead.fichaConsultada) prod += 15;
    if (sessao.cadernoConsultado) prod += 10;
    prod = Math.min(100, prod);

    // Gestão Objeção
    let obj = 70; // neutro
    let teveQueda = false;
    for (let i = 0; i < turnos.length; i++) {
      if (turnos[i].deltaScore < 0) teveQueda = true;
      if (teveQueda && turnos[i].deltaScore > 0) {
        obj = 100; // recuperação
        break;
      }
    }
    if (teveQueda && obj !== 100) obj = 20;

    // Leitura Perfil
    let leitura = 70;
    const avgLen = turnos.reduce((a, b) => a + b.mensagemJogador.length, 0) / (turnos.length || 1);
    if (lead.perfil === 'apressado') {
      leitura = avgLen < 80 ? 90 : (avgLen < 150 ? 60 : 30);
    } else if (lead.perfil === 'detalhista') {
      leitura = avgLen > 100 ? 90 : (avgLen > 60 ? 60 : 30);
    }

    const formatar = (val, cat) => {
      let label = 'Iniciante';
      if (val >= 80) label = 'Avançado';
      else if (val >= 60) label = 'Competente';
      else if (val >= 40) label = 'Em desenvolvimento';
      
      const dicas = {
        escutaAtiva: { Iniciante: 'Pergunte sobre as necessidades antes de apresentar qualquer preço.', 'Em desenvolvimento': 'Bom começo. Tente entender o orçamento antes da proposta.', Competente: 'Você ouviu bem. Refine ainda mais com perguntas abertas.', Avançado: 'Escuta exemplar. O cliente se sentiu compreendido.' },
        conhecimentoProduto: { 
          Iniciante: 'Estude os detalhes do produto: inclusões, políticas, categorias.', 
          'Em desenvolvimento': 'Você soube parte. Use a Ficha do Lead e o Caderno antes de negociar — eles têm os detalhes que o cliente vai perguntar.', 
          Competente: 'Bom domínio do produto. Continue aprofundando.', 
          Avançado: 'O cliente percebeu que você conhece o que vende.' 
        },
        gestaoObjecao: { Iniciante: 'Quando o cliente resistir, não ceda imediatamente. Justifique o valor.', 'Em desenvolvimento': 'Você tentou responder à objeção. Trabalhe argumentos mais sólidos.', Competente: 'Boa recuperação. Você manteve o controle da negociação.', Avançado: 'Você transformou a objeção em oportunidade. Excelente.' },
        leituraPerfil: { Iniciante: 'Adapte o ritmo ao perfil. Apressados querem brevidade. Detalhistas querem profundidade.', 'Em desenvolvimento': 'Você ajustou um pouco. Pratique mais com esse perfil.', Competente: 'Bom ajuste de linguagem para o perfil do cliente.', Avançado: 'Você leu o perfil e se adaptou perfeitamente.' }
      };

      return { score: val, rotulo: label, dica: dicas[cat][label] };
    };

    return {
      escutaAtiva: formatar(escuta, 'escutaAtiva'),
      conhecimentoProduto: formatar(prod, 'conhecimentoProduto'),
      gestaoObjecao: formatar(obj, 'gestaoObjecao'),
      leituraPerfil: formatar(leitura, 'leituraPerfil')
    };
  }

  function _getDicaEspecifica(perfil, msg) {
    const text = msg.toLowerCase();
    if (perfil === 'apressado' && msg.length > 120) return 'Com perfil Apressado, respostas longas perdem a atenção. Seja direto.';
    if (perfil === 'cacador_preco' && !text.includes('pq') && !text.includes('porque')) return 'Caçadores de preço precisam ouvir o porquê do valor, não só o preço.';
    if (perfil === 'inseguro' && !text.match(/garantia|seguro|ajuda|suporte/)) return 'O cliente inseguro quer saber quem vai resolver se der errado.';
    if (perfil === 'detalhista' && msg.length < 50) return 'Detalhistas identificam vagueza imediatamente. Dados concretos valem mais.';
    if (perfil === 'indicacao' && !text.includes('obrigado') && !text.includes('prazer')) return 'Clientes de indicação querem sentir que você valoriza a relação pessoal.';
    return 'Revise esse turno e pense no que o perfil desse cliente precisava ouvir.';
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
