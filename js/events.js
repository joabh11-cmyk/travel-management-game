// js/events.js
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.events = (function() {

  function sortearEventosDoDia(diaAtual, s) {
    if (!s.eventosPendentes) s.eventosPendentes = [];
    const eventosDia = [];
    const pipeline = s.pipeline || [];
    
    window.AGENCIA.data.eventos.forEach(eventoConfig => {
      // Calcula probabilidade baseada no modificador
      let prob = eventoConfig.probBase;
      
      if (s.agencia.reputacao >= 80) prob += (eventoConfig.modificadores.reputacaoAlta || 0);
      else if (s.agencia.reputacao <= 30) prob += (eventoConfig.modificadores.reputacaoBaixa || 0);
      
      // Simula verificação de segurança jurídica (se existir futuramente)
      if (s.agencia.segurancaJuridicaAlta) prob += (eventoConfig.modificadores.segurancaJurAlta || 0);

      // Limita a 0% no mínimo
      prob = Math.max(0, prob);

      if (eventoConfig.tipo === 'negociacao') {
        // Evento de negociação é rodado POR lead no pipeline
        pipeline.forEach(lead => {
          if (lead.status !== 'proposta') return; // Só acontece se a proposta já foi enviada
          
          let probLead = prob;
          // Se for perfil propenso, aumenta um pouco a chance
          if (eventoConfig.perfisMaisProvaveis.includes(lead.perfil.id)) {
            probLead += 0.05; 
          }
          
          if (Math.random() < probLead) {
            // Sorteou!
            const eventoObj = _criarInstanciaDeEvento(eventoConfig, { lead });
            s.eventosPendentes.push(eventoObj);
            eventosDia.push(eventoObj);
          }
        });
      } else if (eventoConfig.tipo === 'operacional') {
        // Evento geral da agência, rola a chance 1x no dia
        if (s.kpis.totalVendas > 0 && Math.random() < prob) { // Só tem reclamação se já vendeu algo
          const eventoObj = _criarInstanciaDeEvento(eventoConfig, { dia: diaAtual });
          s.eventosPendentes.push(eventoObj);
          eventosDia.push(eventoObj);
        }
      }
    });

    return eventosDia;
  }

  function _criarInstanciaDeEvento(config, contexto) {
    return {
      instanciaId: 'evt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      configId: config.id,
      titulo: config.gerarTitulo(contexto),
      mensagem: config.gerarMensagem(contexto),
      opcoes: config.opcoes,
      contexto: contexto
    };
  }

  function resolverEvento(instanciaId, opcaoId, s) {
    const idx = s.eventosPendentes.findIndex(e => e.instanciaId === instanciaId);
    if (idx === -1) return false;

    const evento = s.eventosPendentes[idx];
    const opcao = evento.opcoes.find(o => o.id === opcaoId);
    if (!opcao) return false;

    const imp = opcao.impactos;

    // Se a opção custa PA, tenta consumir. Se falhar, não permite resolver (tem que ser bloqueado na UI)
    if (imp.custoPA && imp.custoPA > 0) {
      if (!window.AGENCIA.loop.usarPA(imp.custoPA, `Resolução de evento: ${evento.titulo}`)) {
        window.AGENCIA.loop.logEvento(s, 'erro', `PA insuficiente para resolver evento: ${evento.titulo}`);
        return false; // falhou
      }
    }

    // Aplica Reputação
    if (imp.deltaReputacao) {
      s.agencia.reputacao = Math.max(0, Math.min(100, s.agencia.reputacao + imp.deltaReputacao));
    }

    // Aplica Caixa (Genérico Operacional)
    if (imp.deltaCaixa) {
      s.caixa.saldo += imp.deltaCaixa;
      if (imp.deltaCaixa < 0) {
        s.caixa.despesas += Math.abs(imp.deltaCaixa);
        window.AGENCIA.registrarSaida(`Resolução de evento: ${evento.titulo}`, Math.abs(imp.deltaCaixa), 'variavel');
      } else {
        s.caixa.receitas += imp.deltaCaixa;
        window.AGENCIA.registrarEntrada(`Resolução de evento: ${evento.titulo}`, imp.deltaCaixa, 'diversos');
      }
    }

    // Impactos na Venda Específica (Negociação)
    let leadPerdido = false;
    let margemAntiga = null;
    let margemNova = null;
    
    if (evento.contexto && evento.contexto.lead) {
      const lead = evento.contexto.lead;
      
      // Aplicar risco de perda da venda
      if (imp.riscoPerdaVenda !== undefined) {
        if (Math.random() < imp.riscoPerdaVenda) {
          leadPerdido = true;
          // Perde a venda
          s.pipeline = s.pipeline.filter(l => l.id !== lead.id);
          window.AGENCIA.loop.logEvento(s, 'erro', `❌ Negociação Perdida: Evento de mercado fez ${lead.nome} desistir da compra.`);
        }
      }

      if (!leadPerdido) {
        // Redução/Aumento de margem
        if (imp.deltaMargem !== undefined && imp.deltaMargem !== 0) {
          margemAntiga = lead.cotacao.fee + (lead.cotacao.valorTotal - lead.cotacao.custoLiquido);
          
          // O deltaMargem é uma % multiplicadora ou valor fixo? Vamos assumir que é multiplicador de redução.
          // Se delta = -0.5, perde 50% da comissão+fee. Se -1.0, perde 100%.
          // Vamos atualizar o custo líquido do lead (aumentando ele para reduzir a margem) 
          // ou reduzindo o valorTotal, dependendo da interpretação.
          // No jogo, a comissão está embutida no valorTotal.
          const margemAtual = lead.cotacao.valorTotal - lead.cotacao.custoLiquido;
          const margemPerdida = margemAtual * Math.abs(imp.deltaMargem);
          
          if (imp.deltaMargem < 0) {
            // Significa que estamos perdendo margem (ex: desconto dado, absorvendo custo)
            lead.cotacao.valorTotal -= margemPerdida; // Desconto pro cliente
          }
          
          margemNova = lead.cotacao.valorTotal - lead.cotacao.custoLiquido;
        }

        if (imp.deltaConfiancaDoCliente) {
          // O blueprint de F5 usa o 'perfil' que influencia a conversão final. 
          // Para simular deltaConfianca, podemos apenas gravar no lead para quando ele for avaliado pelo clientAI
          lead.confiancaExtra = (lead.confiancaExtra || 0) + imp.deltaConfiancaDoCliente;
        }
      }
    }

    // Log e histórico do evento
    const resultadoTexto = imp.mensagemResultado || 
      `Evento "${evento.titulo}" resolvido: ${opcao.label}. ` + 
      (imp.deltaReputacao ? `[Reputação ${imp.deltaReputacao > 0 ? '+' : ''}${imp.deltaReputacao}] ` : '') +
      (imp.deltaCaixa ? `[Caixa ${imp.deltaCaixa > 0 ? '+' : ''}${imp.deltaCaixa}] ` : '') +
      (leadPerdido ? `[⚠️ LEAD PERDIDO] ` : '') +
      (margemNova !== null ? `[Margem reajustada] ` : '');

    window.AGENCIA.loop.logEvento(s, 'info', resultadoTexto);

    if (!s.historicoEventos) s.historicoEventos = [];
    s.historicoEventos.push({
      dia: s.tempo.dia,
      tipo: evento.configId,
      titulo: evento.titulo,
      resolucao: opcao.label,
      impactoReputacao: imp.deltaReputacao || 0,
      impactoCaixa: imp.deltaCaixa || 0,
      leadPerdido: leadPerdido
    });

    // Mantém só os últimos 15 eventos no histórico
    if (s.historicoEventos.length > 15) s.historicoEventos.shift();

    // Remove dos pendentes
    s.eventosPendentes.splice(idx, 1);

    // --- Disparo de Processo Jurídico (F8) ---
    // Se o evento for grave (reputação caiu muito) ou não resolvido, chance de virar processo
    const eventosGrave = ['reclamacao_pos_venda', 'desconto_agressivo_cliente', 'concorrente_mais_barato', 'mudanca_tarifa_durante_negociacao'];
    if (eventosGrave.includes(evento.configId) && imp.deltaReputacao <= -5) {
       // Chance de 40% de virar processo se a reputação caiu muito
       if (Math.random() < 0.4) {
          _dispararProcessoJuridico(evento, s);
       }
    }

    return true;
  }

  function _dispararProcessoJuridico(eventoOrigem, s) {
    const BAL = window.AGENCIA.BAL;
    const jur = s.agencia.protecaoJuridica;
    const configOrigem = eventoOrigem.configId;
    
    let custoCaixa = 0;
    let custoRep = 0;
    let mensagem = "";
    let tipoLog = 'erro';

    const multaBase = BAL.protecaoJuridica.semProtecao.multaBase.min + Math.random() * (BAL.protecaoJuridica.semProtecao.multaBase.max - BAL.protecaoJuridica.semProtecao.multaBase.min);
    const repBase = BAL.protecaoJuridica.semProtecao.danoReputacaoBase.min + Math.random() * (BAL.protecaoJuridica.semProtecao.danoReputacaoBase.max - BAL.protecaoJuridica.semProtecao.danoReputacaoBase.min);

    const temPlano = jur && jur.planoAtivo;
    const planoCfg = temPlano ? BAL.protecaoJuridica.planos[jur.planoAtivo] : null;
    const coberto = planoCfg && planoCfg.cobertura.includes(configOrigem);
    const temUsos = temPlano && jur.usosSemanaAtual < jur.usosSemanaMax;

    if (temPlano && coberto && temUsos) {
      // Caso A: Protegido e com uso
      jur.usosSemanaAtual++;
      custoCaixa = 50 + Math.random() * 100;
      custoRep = 1 + Math.random() * 2;
      mensagem = `🛡️ Sua proteção jurídica foi acionada para o caso "${eventoOrigem.titulo}". O processo foi encerrado administrativamente com custo mínimo.`;
      tipoLog = 'sucesso';
    } else if (temPlano && coberto && !temUsos) {
      // Caso B: Protegido mas sem uso na semana
      custoCaixa = multaBase * 0.5;
      custoRep = 5 + Math.random() * 5;
      mensagem = `⚠️ Você já usou todos os acionamentos jurídicos desta semana. O caso "${eventoOrigem.titulo}" teve cobertura parcial da multa.`;
      tipoLog = 'aviso';
    } else {
      // Caso C: Sem proteção ou não coberto
      custoCaixa = multaBase;
      custoRep = repBase;
      mensagem = `⚖️ PROCESSO JUDICIAL: Sem proteção jurídica adequada para "${eventoOrigem.titulo}", você arcou com o custo total do processo e danos à imagem.`;
      tipoLog = 'erro';
    }

    // Aplica impactos
    s.caixa.saldo -= custoCaixa;
    s.caixa.despesas += custoCaixa;
    s.agencia.reputacao = Math.max(0, s.agencia.reputacao - custoRep);
    
    window.AGENCIA.registrarSaida('Processo Jurídico', custoCaixa, 'variavel');
    window.AGENCIA.loop.logEvento(s, tipoLog, mensagem);

    // Adiciona ao histórico de eventos como um evento passivo resolvido
    if (!s.historicoEventos) s.historicoEventos = [];
    s.historicoEventos.push({
      dia: s.tempo.dia,
      tipo: 'processo_juridico',
      titulo: 'Processo Jurídico',
      resolucao: 'Finalizado',
      impactoReputacao: -custoRep,
      impactoCaixa: -custoCaixa
    });
  }

  return {
    sortearEventosDoDia,
    resolverEvento
  };

})();
