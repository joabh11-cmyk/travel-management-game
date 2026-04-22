// js/clientAI.js
window.AGENCIA = window.AGENCIA || {};

window.AGENCIA.clientAI = (function() {

  const PESOS_BASE = {
    preco:      30,
    confianca:  20,
    velocidade: 15,
    adequacao:  20,
    reputacao:  10,
    objecoes:   15,
  };

  function avaliarCotacao(lead, cotacao, agencia, state) {
    const BAL = window.AGENCIA.BAL;
    const seg = BAL.segmentos[agencia.segmento];
    const ticket = lead.ticketPotencial || ((seg.ticketMin + seg.ticketMax) / 2);
    const valor = cotacao.valorTotal;

    // Componentes base
    let precoComp = 50;
    const ratio = valor / ticket;
    if (ratio <= 0.8) precoComp = 100;
    else if (ratio >= 1.2) precoComp = 0;
    else precoComp = ((1.2 - ratio) / 0.4) * 100;

    let confiancaComp = lead.confianca || 50;
    
    const dias = state.tempo.dia - lead.diaCriacao;
    let velocidadeComp = dias === 0 ? 100 : (dias === 1 ? 75 : (dias === 2 ? 40 : 10));

    let adequacaoComp = 60; // Base média
    let reputacaoComp = agencia.reputacao || 0;
    let objecoesComp = lead.scoreObjecoes || 50; // Começa em 50, alterado pelas respostas

    // Modificadores dinâmicos armazenados no lead (após respostas)
    if (lead.modificadoresScore) {
      precoComp += (lead.modificadoresScore.preco || 0);
      confiancaComp += (lead.modificadoresScore.confianca || 0);
      velocidadeComp += (lead.modificadoresScore.velocidade || 0);
      adequacaoComp += (lead.modificadoresScore.adequacao || 0);
      reputacaoComp += (lead.modificadoresScore.reputacao || 0);
      objecoesComp += (lead.modificadoresScore.objecoes || 0);
    }

    // Aplica bônus/penalidades de perfil aos componentes
    if (lead.perfil === 'cacador_preco' && ratio > 1.0) {
      precoComp *= 0.5; // muito sensível a preço alto
    }
    if (lead.perfil === 'indicacao') {
      confiancaComp = Math.min(100, confiancaComp + 15);
    }

    // Limita de 0 a 100
    const clamp = v => Math.max(0, Math.min(100, v));
    precoComp = clamp(precoComp);
    confiancaComp = clamp(confiancaComp);
    velocidadeComp = clamp(velocidadeComp);
    adequacaoComp = clamp(adequacaoComp);
    reputacaoComp = clamp(reputacaoComp);
    objecoesComp = clamp(objecoesComp);

    // Ajusta Pesos baseados no Perfil
    let w = { ...PESOS_BASE };
    if (lead.perfil === 'cacador_preco') {
      w.preco *= 1.4;
      w.confianca *= 0.7;
    } else if (lead.perfil === 'inseguro') {
      w.confianca *= 1.4;
      w.reputacao *= 1.3;
      w.preco *= 0.8;
    } else if (lead.perfil === 'apressado') {
      w.velocidade *= 1.5;
      w.adequacao *= 0.8;
    } else if (lead.perfil === 'detalhista') {
      w.adequacao *= 1.5;
    } else if (lead.perfil === 'indicacao') {
      w.reputacao *= 1.2;
    }

    // Normaliza pesos
    const totalW = Object.values(w).reduce((a, b) => a + b, 0);
    for (let k in w) w[k] = w[k] / totalW;

    // Calcula Total
    let scoreTotal = (
      (precoComp * w.preco) +
      (confiancaComp * w.confianca) +
      (velocidadeComp * w.velocidade) +
      (adequacaoComp * w.adequacao) +
      (reputacaoComp * w.reputacao) +
      (objecoesComp * w.objecoes)
    );

    // Casos extremos obrigatórios
    if (ratio <= 0.8 && dias <= 1 && reputacaoComp >= 30) {
      scoreTotal = Math.max(scoreTotal, 85); // Força ganho
    }
    if (ratio >= 1.2 && dias >= 2 && reputacaoComp < 40) {
      scoreTotal = Math.min(scoreTotal, 35); // Força perdido
    }

    let decisao = 'perdido';
    if (scoreTotal >= 65) decisao = 'ganho';
    else if (scoreTotal >= 45) decisao = 'objecao';

    // Evita loop infinito de objeções: max 1 objeção por lead
    if (decisao === 'objecao' && lead.teveObjecao) {
      decisao = scoreTotal >= 55 ? 'ganho' : 'perdido'; // Um pouco mais rígido na segunda vez
    }

    // Mensagens
    let msg = "";
    let motivo = null;
    if (decisao === 'ganho') {
      msg = "Gostei da proposta. Vamos fechar!";
      if (lead.perfil === 'cacador_preco') msg = "O preço está justo, podemos seguir.";
      if (lead.perfil === 'inseguro') msg = "Me sinto confortável com a sua agência. Vamos lá.";
      if (lead.perfil === 'apressado') msg = "Perfeito, bora fechar rápido.";
      if (lead.perfil === 'detalhista') msg = "A proposta está bem clara e atende ao que pedi.";
    } else if (decisao === 'perdido') {
      if (precoComp < 30) {
        motivo = "preco";
        msg = "Ficou muito acima do meu orçamento, infelizmente.";
      } else if (velocidadeComp < 30) {
        motivo = "tempo";
        msg = "Demorou muito, acabei fechando com outra agência.";
      } else if (confiancaComp < 30) {
        motivo = "confianca";
        msg = "Preferi fechar com alguém mais conhecido.";
      } else {
        motivo = "geral";
        msg = "Analisamos bem mas decidimos seguir por outro caminho dessa vez.";
      }
    } else if (decisao === 'objecao') {
      // Seleciona uma objeção baseada no perfil
      const obj = sortearObjecao(lead.perfil);
      lead.objecaoId = obj.id;
      msg = obj.mensagem;
    }

    return {
      decisao,
      motivo,
      scoreDetalhado: {
        total: Math.round(scoreTotal),
        preco: Math.round(precoComp),
        confianca: Math.round(confiancaComp),
        velocidade: Math.round(velocidadeComp),
        adequacao: Math.round(adequacaoComp),
        reputacao: Math.round(reputacaoComp),
        objecoes: Math.round(objecoesComp)
      },
      mensagemCliente: msg
    };
  }

  function sortearObjecao(perfil) {
    const list = window.AGENCIA.BAL.objecoes;
    let pool = [];
    list.forEach(o => {
      const peso = (o.pesosPerfil && o.pesosPerfil[perfil]) || 0.1;
      pool.push({ obj: o, peso });
    });
    
    const total = pool.reduce((acc, it) => acc + it.peso, 0);
    let rnd = Math.random() * total;
    for (let it of pool) {
      rnd -= it.peso;
      if (rnd <= 0) return it.obj;
    }
    return list[0];
  }

  function processarRespostaObjecao(lead, cotacao, agencia, state, respostaId) {
    const objId = lead.objecaoId;
    const objData = window.AGENCIA.BAL.objecoes.find(o => o.id === objId);
    if (!objData) return avaliarCotacao(lead, cotacao, agencia, state);

    const respData = objData.respostas.find(r => r.id === respostaId);
    if (!respData) return avaliarCotacao(lead, cotacao, agencia, state);

    if (!lead.modificadoresScore) lead.modificadoresScore = {};
    
    // Aplica modificadores da resposta
    for (let k in respData.modificadores) {
      if (k === 'margem') continue; // margem é tratado abaixo
      lead.modificadoresScore[k] = (lead.modificadoresScore[k] || 0) + respData.modificadores[k];
    }

    // Se cedeu margem, ajustamos a cotação
    if (respostaId === 'ceder_margem' || (respData.modificadores.margem && respData.modificadores.margem < 0)) {
      const desconto = cotacao.valorTotal * 0.05; // 5% de desconto
      cotacao.valorTotal -= desconto;
      cotacao.fee -= desconto; // tira direto do fee/margem
      if (cotacao.fee < 0) {
        cotacao.custoLiquido += Math.abs(cotacao.fee); // entra no prejuízo
        cotacao.fee = 0;
      }
    }

    lead.teveObjecao = true;
    
    return avaliarCotacao(lead, cotacao, agencia, state);
  }

  return {
    avaliarCotacao,
    processarRespostaObjecao
  };

})();
