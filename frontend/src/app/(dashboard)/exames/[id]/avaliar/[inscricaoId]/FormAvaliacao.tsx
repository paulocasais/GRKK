'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Save, ClipboardList, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

type FormAvaliacaoProps = {
  exameId: string;
  inscricaoId: string;
  candidatoNome: string;
  faixaAlvo: string;
  modalidade: string;
  isMulti?: boolean;
};

const ALL_TESTS = [
  { key: 'kihon', label: '1° TESTE: KIHON ESPECÍFICO', desc: 'Técnicas básicas específicas da graduação.', yudanshaOnly: false },
  { key: 'controle', label: '2° TESTE: CONTROLE DE GOLPES', desc: 'Precisão técnica, controle de impacto e distância.', yudanshaOnly: false },
  { key: 'kata', label: '3° TESTE: KATA', desc: 'Apresentação de forma técnica, ritmo, foco e respiração.', yudanshaOnly: false },
  { key: 'kumite', label: '4° TESTE: KUMITE', desc: 'Combate regulamentado e aplicação das técnicas.', yudanshaOnly: false },
  { key: 'conhecimentos', label: '5° TESTE: CONHECIMENTOS GERAIS', desc: 'História, termos em japonês, filosofia e regras.', yudanshaOnly: false },
  { key: 'tameshiwari', label: '6° TESTE: TAMESHIWARI', desc: 'Quebramento de tábuas (Exclusivo para Exame Yudansha - Faixa Preta).', yudanshaOnly: true },
] as const;

const CONCEITOS = [
  { value: 'F', label: 'F', fullName: 'Fraco', desc: 'Sem qualidade técnica/eficiência', activeColor: 'bg-red-500/20 text-red-200 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]' },
  { value: 'R', label: 'R', fullName: 'Regular', desc: 'Qualidade/eficiência irregular', activeColor: 'bg-amber-500/20 text-amber-200 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]' },
  { value: 'B', label: 'B', fullName: 'Bom', desc: 'Com qualidade e eficiência', activeColor: 'bg-emerald-500/20 text-emerald-200 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]' },
  { value: 'E', label: 'E', fullName: 'Excelente', desc: 'Qualidade/eficiência impecáveis', activeColor: 'bg-blue-500/20 text-blue-200 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.2)]' },
] as const;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function FormAvaliacao({
  exameId,
  inscricaoId,
  candidatoNome,
  faixaAlvo,
  modalidade,
  isMulti = false,
}: FormAvaliacaoProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Determina se é exame para Faixa Preta (Yudansha)
  const isYudansha = faixaAlvo.toLowerCase().includes('preta') || faixaAlvo.toLowerCase().includes('dan');
  const activeTests = ALL_TESTS.filter(t => !t.yudanshaOnly || isYudansha);
  const totalActiveTests = activeTests.length;

  // Estado das avaliações por critério
  const [evaluations, setEvaluations] = useState<Record<string, {
    conceito: 'F' | 'R' | 'B' | 'E' | '';
    nota: string;
    observacoes: string;
  }>>(() => {
    const initial: Record<string, any> = {};
    ALL_TESTS.forEach(t => {
      initial[t.key] = {
        conceito: '',
        nota: '',
        observacoes: ''
      };
    });
    return initial;
  });

  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [resultado, setResultado] = useState<'aprovado' | 'reprovado' | 'ausente'>('aprovado');

  // Cálculos dinâmicos da regra "50% + 1 dos conceitos R, B ou E"
  const passingCount = activeTests.reduce((acc, t) => {
    const conc = evaluations[t.key]?.conceito;
    return (conc === 'R' || conc === 'B' || conc === 'E') ? acc + 1 : acc;
  }, 0);

  const requiredPassing = Math.floor(totalActiveTests * 0.5) + 1;
  const isApprovedByFormula = passingCount >= requiredPassing;

  // Atualiza automaticamente a sugestão do resultado
  useEffect(() => {
    if (resultado !== 'ausente') {
      const allEvaluated = activeTests.every(t => evaluations[t.key]?.conceito !== '');
      if (allEvaluated) {
        setResultado(isApprovedByFormula ? 'aprovado' : 'reprovado');
      }
    }
  }, [passingCount, isApprovedByFormula]);

  const handleConceptChange = (key: string, val: 'F' | 'R' | 'B' | 'E') => {
    setEvaluations(prev => ({
      ...prev,
      [key]: { ...prev[key], conceito: val }
    }));
  };

  const handleNotaChange = (key: string, val: string) => {
    if (val === '' || (/^\d*\.?\d*$/.test(val) && parseFloat(val) <= 10)) {
      setEvaluations(prev => ({
        ...prev,
        [key]: { ...prev[key], nota: val }
      }));
    }
  };

  const handleTestObsChange = (key: string, val: string) => {
    setEvaluations(prev => ({
      ...prev,
      [key]: { ...prev[key], observacoes: val }
    }));
  };

  // Média final baseada nas notas digitadas
  const scoresWithValues = activeTests.filter(t => evaluations[t.key]?.nota !== '');
  const sumScores = scoresWithValues.reduce((acc, t) => acc + parseFloat(evaluations[t.key].nota), 0);
  const mediaFinal = scoresWithValues.length > 0 ? parseFloat((sumScores / scoresWithValues.length).toFixed(2)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    const pendingTests = activeTests.filter(t => evaluations[t.key]?.conceito === '');
    if (pendingTests.length > 0) {
      alert(`Por favor, defina o conceito de todos os testes ativos. Pendente: ${pendingTests.map(t => t.label).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const detalhes = {
        criterios: activeTests.map((t) => ({
          nome: t.label,
          conceito: evaluations[t.key].conceito,
          nota: evaluations[t.key].nota !== '' ? parseFloat(evaluations[t.key].nota) : null,
          observacoes: evaluations[t.key].observacoes || null,
        })),
        nota_final: mediaFinal > 0 ? mediaFinal : null,
        observacoes: observacoesGerais || null,
        passing_count: passingCount,
        total_tests: totalActiveTests,
        required_passing: requiredPassing,
        approved_by_formula: isApprovedByFormula
      };

      const res = await fetch(`${API_URL}/api/exames/candidatos/${inscricaoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: resultado,
          dados_banca: detalhes
        })
      });

      if (!res.ok) throw new Error('Não foi possível salvar a avaliação.');

      setIsSaved(true);
      if (!isMulti) {
        router.push(`/exames/${exameId}`);
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar avaliação.');
      setLoading(false);
    }
  };

  if (isSaved) {
    return (
      <div className="bg-zinc-900/40 border border-emerald-900/40 rounded-2xl p-8 text-center space-y-4 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-800 flex items-center justify-center text-emerald-400">
          <CheckCircle size={32} />
        </div>
        <div>
          <h3 className="font-bold text-white font-cinzel text-base uppercase tracking-wider">Avaliação Concluída</h3>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Os dados de <strong>{candidatoNome}</strong> foram salvos com sucesso e o resultado foi processado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`grid grid-cols-1 ${isMulti ? '' : 'lg:grid-cols-3'} gap-6 items-start`}>
      {/* Coluna Principal: Testes */}
      <div className={`${isMulti ? '' : 'lg:col-span-2'} space-y-6`}>
        {isMulti && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between shadow-sm border-l-4 border-l-primary">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-cinzel">Atleta Avaliado</p>
              <p className="text-base font-black text-white font-cinzel tracking-wide mt-0.5">{candidatoNome}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 capitalize">{modalidade} · Faixa {faixaAlvo}</p>
            </div>
          </div>
        )}

        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-white flex items-center gap-2 font-cinzel text-xs uppercase tracking-wider border-b border-zinc-900 pb-3">
            <ClipboardList size={16} className="text-primary" /> Testes de Avaliação (GRKK)
          </h3>

          <div className="space-y-6 divide-y divide-zinc-900/60">
            {activeTests.map((test, index) => {
              const currentEval = evaluations[test.key] || { conceito: '', nota: '', observacoes: '' };
              return (
                <div key={test.key} className={`space-y-4 ${index > 0 ? 'pt-6 border-t border-zinc-900/50' : ''}`}>
                  {/* Informações do Teste */}
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white font-cinzel tracking-wide">{test.label}</h4>
                    <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">{test.desc}</p>
                  </div>

                  {/* Seleção do Conceito */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Conceito de Avaliação</label>
                    <div className="grid grid-cols-4 gap-2">
                      {CONCEITOS.map((c) => {
                        const isSelected = currentEval.conceito === c.value;
                        return (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => handleConceptChange(test.key, c.value as any)}
                            className={`py-2 px-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                              isSelected
                                ? c.activeColor + ' border-current'
                                : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:bg-zinc-900 hover:text-white'
                            }`}
                          >
                            <span className="text-base font-black font-mono">{c.label}</span>
                            <span className="text-[9px] font-medium hidden sm:inline opacity-80 mt-0.5">{c.fullName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nota & Observações do Teste */}
                  <div className={`grid grid-cols-1 ${isMulti ? '' : 'sm:grid-cols-3'} gap-3`}>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nota (0 a 10)</label>
                      <input
                        type="text"
                        placeholder="Ex: 8.5"
                        value={currentEval.nota}
                        onChange={(e) => handleNotaChange(test.key, e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-primary font-mono placeholder-zinc-700"
                      />
                    </div>
                    <div className={`${isMulti ? '' : 'sm:col-span-2'} space-y-1`}>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Observações do Teste</label>
                      <input
                        type="text"
                        placeholder="Observações pontuais sobre a execução técnica..."
                        value={currentEval.observacoes}
                        onChange={(e) => handleTestObsChange(test.key, e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Parecer / Observações Gerais */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 shadow-sm">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 font-cinzel">Observações Gerais / Parecer Final</label>
          <textarea
            value={observacoesGerais}
            onChange={(e) => setObservacoesGerais(e.target.value)}
            rows={isMulti ? 2 : 4}
            placeholder="Comentários consolidados sobre o desempenho geral do atleta..."
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-900 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-700 resize-none"
          />
        </div>
      </div>

      {/* Coluna Lateral: Resumo & Conclusão */}
      <div className="space-y-6">
        {/* Painel do Candidato */}
        {!isMulti && (
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-zinc-400 font-cinzel uppercase tracking-wider border-b border-zinc-900 pb-2">Atleta Avaliado</h4>
            <div>
              <p className="text-sm font-semibold text-white font-cinzel">{candidatoNome}</p>
              <p className="text-xs text-zinc-400 mt-0.5 capitalize">{modalidade} · Faixa {faixaAlvo}</p>
            </div>
          </div>
        )}

        {/* Formulário GRKK Card */}
        {!isMulti && (
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-white flex items-center gap-2 font-cinzel text-xs uppercase tracking-wider border-b border-zinc-900 pb-2">
              <Award size={15} className="text-primary" /> Regra de Aprovação
            </h3>

            <div className="space-y-3">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                <strong>Regra GRKK:</strong> 50% + 1 dos conceitos devem ser R, B ou E (ou seja, satisfatório/aprovador).
              </p>

              <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Total de Testes:</span>
                  <span className="font-bold text-white">{totalActiveTests}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Conceitos R/B/E obtidos:</span>
                  <span className="font-bold text-primary">{passingCount}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Mínimo Necessário:</span>
                  <span className="font-bold text-white">{requiredPassing}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs">
                  {passingCount >= requiredPassing ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-900/30 w-full justify-center">
                      <CheckCircle size={14} /> Fórmula: APROVADO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-400 font-bold bg-red-950/20 px-3 py-2 rounded-xl border border-red-900/30 w-full justify-center">
                      <AlertCircle size={14} /> Fórmula: REPROVADO
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conclusão Final */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2 font-cinzel text-xs uppercase tracking-wider border-b border-zinc-900 pb-2">
            Resultado Final
          </h3>

          <div className="space-y-4">
            {isMulti && (
              <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Formulário GRKK ({passingCount}/{requiredPassing}):</span>
                {passingCount >= requiredPassing ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle size={13} /> APROVADO
                  </span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <AlertCircle size={13} /> REPROVADO
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {(['aprovado', 'reprovado', 'ausente'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResultado(r)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                    resultado === r
                      ? r === 'aprovado'
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800'
                        : r === 'reprovado'
                        ? 'bg-red-950/30 text-red-400 border-red-800'
                        : 'bg-zinc-800 text-zinc-200 border-zinc-750'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:bg-zinc-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {mediaFinal > 0 && (
              <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                <span className="text-xs text-zinc-400 font-medium">Média das Notas</span>
                <span className="text-lg font-mono font-black text-white">{mediaFinal.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all font-cinzel text-sm uppercase tracking-widest shadow-lg shadow-red-950/20 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} /> Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Concluir Avaliação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
