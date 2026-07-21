'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CURRICULO_ADULTO, CURRICULO_INFANTIL, CurriculoFaixa } from '@/constants/curriculo';
import { FAIXAS_ADULTO, FAIXAS_INFANTIL, CORES_FAIXAS, obterEstiloFaixa } from '@/constants/faixas';
import { BookOpen, Calendar, Shield, Swords, Info, User, CheckCircle2 } from 'lucide-react';

export default function CurriculoPage() {
  const { usuario, tipo, isAdmin, isFilial, isAtleta } = useAuth();
  
  // Estados para seleção da grade
  const [gradeTipo, setGradeTipo] = useState<'adulto' | 'infantil'>('adulto');
  const [faixaSelecionada, setFaixaSelecionada] = useState<string>('Amarela');

  // Determinar se o aluno segue a grade infantil ou adulta com base na data de nascimento
  useEffect(() => {
    if (usuario) {
      // Determina padrão pelo tipo/faixa do usuário (lendo também de dados_atleta se for perfil unificado)
      const userFaixa = usuario.faixa || (usuario as any).dados_atleta?.faixa || 'Amarela';
      
      // Calcular idade
      let eMenorDe13 = false;
      if (usuario.data_nascimento) {
        const nasc = new Date(usuario.data_nascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
          idade--;
        }
        eMenorDe13 = idade < 13;
      } else {
        // Fallback: se a faixa existir apenas na infantil, assume infantil
        eMenorDe13 = FAIXAS_INFANTIL.includes(userFaixa) && !FAIXAS_ADULTO.includes(userFaixa);
      }

      const tipoGrade = eMenorDe13 ? 'infantil' : 'adulto';
      setGradeTipo(tipoGrade);

      // Garante que a faixa selecionada é válida para a respectiva grade
      const listaValida = eMenorDe13 ? FAIXAS_INFANTIL : FAIXAS_ADULTO;
      if (listaValida.includes(userFaixa)) {
        setFaixaSelecionada(userFaixa);
      } else if (userFaixa === 'Preta') {
        setFaixaSelecionada('Preta I');
      } else if (userFaixa.includes('/')) {
        setFaixaSelecionada(userFaixa);
      } else {
        setFaixaSelecionada(listaValida[0]);
      }
    }
  }, [usuario]);

  // Se o tipo do usuário for atleta, forçamos ele a visualizar apenas sua própria faixa
  const userFaixa = usuario?.faixa || (usuario as any)?.dados_atleta?.faixa || 'Amarela';
  const podeMudarSelecao = isAdmin || isFilial;

  const faixasDisponiveis = gradeTipo === 'adulto' ? FAIXAS_ADULTO : FAIXAS_INFANTIL;
  const curriculoFonte = gradeTipo === 'adulto' ? CURRICULO_ADULTO : CURRICULO_INFANTIL;
  
  // Objeto de dados da faixa selecionada (com fallbacks inteligentes para faixas duplas e pretas)
  let dadosGrade: CurriculoFaixa | undefined = curriculoFonte[faixaSelecionada];

  if (!dadosGrade) {
    if (faixaSelecionada === 'Preta') {
      dadosGrade = curriculoFonte['Preta I'];
    } else if (faixaSelecionada === 'Preta/Branca') {
      dadosGrade = curriculoFonte['Preta I'] || CURRICULO_INFANTIL['Marrom II'];
    } else if (faixaSelecionada.includes('/')) {
      const partes = faixaSelecionada.split('/');
      dadosGrade = curriculoFonte[partes[1]] || curriculoFonte[partes[0]] || CURRICULO_INFANTIL[faixaSelecionada] || curriculoFonte['Amarela'];
    }
  }

  const beltStyle = obterEstiloFaixa(faixaSelecionada);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      {/* Cabeçalho */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-900 pb-6">
          <div>
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <BookOpen size={20} />
              <span className="text-xs uppercase font-bold tracking-widest font-cinzel">IOGKF Brasil</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-cinzel text-white">Grade Curricular</h1>
            <p className="text-zinc-500 text-xs mt-1">Requisitos oficiais para exames de graduação do Karate Goju-Ryu</p>
          </div>

          {/* Seletores (Visível apenas para Admin/Sensei) */}
          {podeMudarSelecao && (
            <div className="flex flex-wrap gap-3">
              <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-zinc-850">
                <button
                  onClick={() => {
                    setGradeTipo('adulto');
                    setFaixaSelecionada(FAIXAS_ADULTO[0]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                    gradeTipo === 'adulto' ? 'bg-red-600/10 text-red-400 border border-red-500/20' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Adulto (13+)
                </button>
                <button
                  onClick={() => {
                    setGradeTipo('infantil');
                    setFaixaSelecionada(FAIXAS_INFANTIL[0]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                    gradeTipo === 'infantil' ? 'bg-red-600/10 text-red-400 border border-red-500/20' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Infantil (Até 12)
                </button>
              </div>

              <select
                value={faixaSelecionada}
                onChange={(e) => setFaixaSelecionada(e.target.value)}
                className="bg-zinc-900/60 border border-zinc-850 rounded-xl px-3.5 py-1.5 text-xs text-zinc-300 font-bold outline-none cursor-pointer"
              >
                {faixasDisponiveis.map((f) => (
                  <option key={f} value={f} className="bg-zinc-950 text-white">
                    {f}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Badge de Faixa Trancada para o Aluno */}
          {!podeMudarSelecao && (
            <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-850 px-4 py-2.5 rounded-2xl">
              <User size={16} className="text-zinc-400" />
              <div>
                <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Sua Faixa Atual</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-3.5 h-3.5 rounded-full shrink-0 border ${beltStyle.border} ${beltStyle.bg}`} />
                  <span className="text-xs font-bold font-cinzel text-white">{faixaSelecionada}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Painel Lateral de Informações Rápidas */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full filter blur-xl pointer-events-none" />
            
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Graduação Alvo</p>
            <div className="flex items-center gap-3 mb-6">
              <span className={`w-6 h-6 rounded-full shrink-0 border-2 ${beltStyle.border} ${beltStyle.bg}`} />
              <div>
                <h3 className="font-cinzel text-lg font-bold text-white leading-tight">{faixaSelecionada}</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{dadosGrade?.kyuDan || 'Kyu'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar size={15} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Tempo de Carência Mínimo</p>
                  <p className="text-xs font-bold text-zinc-300">{dadosGrade?.carencia || '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield size={15} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Estilo e Filiação</p>
                  <p className="text-xs font-bold text-zinc-300">Goju-Ryu • IOGKF Brasil</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6">
            <div className="flex gap-2.5 items-start">
              <Info size={16} className="text-zinc-500 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-500 leading-relaxed">
                {isAtleta ? (
                  <p>
                    Esta grade apresenta as técnicas mínimas exigidas pela IOGKF para o exame da sua faixa atual. Treine regularmente sob a supervisão do seu sensei para estar apto à graduação.
                  </p>
                ) : (
                  <p>
                    Visualização administrativa da grade curricular. Selecione a faixa e a categoria de idade desejada no topo direito para consultar os critérios oficiais de graduação.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detalhamento das Matérias */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {dadosGrade ? (
            <div className="space-y-6">
              {/* KIHON */}
              {dadosGrade.kihon.length > 0 && (
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
                  <div className="flex items-center gap-2.5 border-b border-zinc-850 pb-4 mb-4">
                    <Swords size={18} className="text-red-500" />
                    <h2 className="font-cinzel text-sm font-bold uppercase tracking-wider text-white">Kihon (Técnicas Básicas)</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dadosGrade.kihon.map((item, idx) => (
                      <div key={idx} className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{item.tecnica}</p>
                          {item.detalhe && <p className="text-[10px] text-zinc-500 mt-0.5">{item.detalhe}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KUMITE */}
              {dadosGrade.kumite.length > 0 && (
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
                  <div className="flex items-center gap-2.5 border-b border-zinc-850 pb-4 mb-4">
                    <Swords size={18} className="text-red-500" />
                    <h2 className="font-cinzel text-sm font-bold uppercase tracking-wider text-white">Kumite (Combates)</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dadosGrade.kumite.map((item, idx) => (
                      <div key={idx} className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{item.tecnica}</p>
                          {item.detalhe && <p className="text-[10px] text-zinc-500 mt-0.5">{item.detalhe}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SAN DAN GI */}
              {dadosGrade.sandangi.length > 0 && (
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
                  <div className="flex items-center gap-2.5 border-b border-zinc-850 pb-4 mb-4">
                    <Shield size={18} className="text-red-500" />
                    <h2 className="font-cinzel text-sm font-bold uppercase tracking-wider text-white">San Dan Gi (Ataque e Defesa)</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dadosGrade.sandangi.map((item, idx) => (
                      <div key={idx} className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{item.tecnica}</p>
                          {item.detalhe && <p className="text-[10px] text-zinc-500 mt-0.5">{item.detalhe}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KATA */}
              {dadosGrade.kata.length > 0 && (
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
                  <div className="flex items-center gap-2.5 border-b border-zinc-850 pb-4 mb-4">
                    <BookOpen size={18} className="text-red-500" />
                    <h2 className="font-cinzel text-sm font-bold uppercase tracking-wider text-white">Kata & Bunkai (Formas e Aplicações)</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dadosGrade.kata.map((item, idx) => (
                      <div key={idx} className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{item.tecnica}</p>
                          {item.detalhe && <p className="text-[10px] text-zinc-500 mt-0.5">{item.detalhe}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TEORIA */}
              {dadosGrade.teoria.length > 0 && (
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6">
                  <div className="flex items-center gap-2.5 border-b border-zinc-850 pb-4 mb-4">
                    <Info size={18} className="text-red-500" />
                    <h2 className="font-cinzel text-sm font-bold uppercase tracking-wider text-white">Teoria & Conhecimento</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {dadosGrade.teoria.map((item, idx) => (
                      <div key={idx} className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{item.tecnica}</p>
                          {item.detalhe && <p className="text-[10px] text-zinc-500 mt-0.5">{item.detalhe}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-12 text-center">
              <Info size={32} className="text-zinc-650 mx-auto mb-4" />
              <p className="text-zinc-500 font-cinzel text-sm">Não há grade curricular cadastrada para esta faixa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
