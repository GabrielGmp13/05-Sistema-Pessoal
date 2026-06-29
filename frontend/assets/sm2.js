'use strict';

// ================================================================
// sm2.js — Algoritmo SM-2 de revisão espaçada
// Arquivo: frontend/assets/sm2.js
//
// Sem dependências. Executa 100% no frontend.
// Substitui a implementação Python que estava no Flask.
//
// Qualidade da resposta (0–3):
//   3 → perfeito, sem hesitação
//   2 → correto com algum esforço
//   1 → errado, mas a resposta era familiar
//   0 → blackout total — não lembrou nada
// ================================================================

// Calcula os novos valores SM-2 a partir dos valores atuais e da qualidade.
// Retorna: { ef, repeticoes, intervaloDias, proximaRevisao }
window.calcularSM2 = function(ef, repeticoes, intervaloDias, qualidade) {
  qualidade    = Math.max(0, Math.min(3, Math.round(qualidade)));
  ef           = typeof ef           === 'number' ? ef           : 2.5;
  repeticoes   = typeof repeticoes   === 'number' ? repeticoes   : 0;
  intervaloDias = typeof intervaloDias === 'number' ? intervaloDias : 1;

  if (qualidade >= 2) {
    // Resposta correta: avança o intervalo
    if      (repeticoes === 0) intervaloDias = 1;
    else if (repeticoes === 1) intervaloDias = 6;
    else                       intervaloDias = Math.round(intervaloDias * ef);
    repeticoes++;
  } else {
    // Resposta errada: reinicia do início
    repeticoes    = 0;
    intervaloDias = 1;
  }

  // Atualiza fator de facilidade (EF não cai abaixo de 1.3)
  ef = ef + 0.1 - (3 - qualidade) * (0.08 + (3 - qualidade) * 0.02);
  ef = Math.max(1.3, parseFloat(ef.toFixed(2)));

  // Data da próxima revisão (YYYY-MM-DD)
  const proxima = new Date();
  proxima.setDate(proxima.getDate() + intervaloDias);
  const proximaRevisao = proxima.toISOString().split('T')[0];

  return { ef, repeticoes, intervaloDias, proximaRevisao };
};

// Avalia um card existente no Supabase.
// Busca o estado atual, calcula os novos valores e salva.
// Retorna o resultado calculado ou null em caso de erro.
window.avaliarCard = async function(cardUuid, qualidade) {
  // 1. Buscar estado atual
  const { data: card, error: fetchErr } = await window.sb
    .from('revisao_espacada')
    .select('ef, repeticoes, intervalo_dias')
    .eq('uuid', cardUuid)
    .single();

  if (fetchErr) {
    console.error('[sm2] buscar card:', fetchErr.message);
    return null;
  }

  // 2. Calcular novos valores
  const resultado = window.calcularSM2(
    card.ef,
    card.repeticoes,
    card.intervalo_dias,
    qualidade
  );

  // 3. Persistir no Supabase
  const { error: updateErr } = await window.sb
    .from('revisao_espacada')
    .update({
      ef:              resultado.ef,
      repeticoes:      resultado.repeticoes,
      intervalo_dias:  resultado.intervaloDias,
      proxima_revisao: resultado.proximaRevisao,
      updated_at:      window.now()
    })
    .eq('uuid', cardUuid);

  if (updateErr) {
    console.error('[sm2] atualizar card:', updateErr.message);
    return null;
  }

  return resultado;
};