'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Calendar, Shield, User, FileText, Printer, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Exame {
  titulo: string;
  data_exame: string;
  local: string;
  modalidade: string;
  faixa_alvo: string;
}

interface Candidato {
  id: string | number;
  atleta_nome: string;
  faixa_atual: string;
  graduacao_pretendida: string;
  resultado: string;
  status: string;
  pagamento_status: string;
  avaliado_em?: string;
  exame_id?: string | number;
  dados_banca?: {
    criterios?: any[];
    nota_final?: number;
    observacoes?: string;
    passing_count?: number;
    total_tests?: number;
    required_passing?: number;
  };
}

export default function BoletimExamePage({
  params,
}: {
  params: Promise<{ inscricaoId: string }>;
}) {
  const { inscricaoId } = use(params);
  const router = useRouter();
  const { usuario, tipo, isAdmin } = useAuth();
  const isExaminador = tipo === 'filial';

  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [exame, setExame] = useState<Exame | null>(null);
  const [examinadorNome, setExaminadorNome] = useState('Banca Examinadora');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) {
      router.push('/auth');
      return;
    }

    const carregarDados = async () => {
      try {
        const res = await fetch(`${API_URL}/api/exames/candidatos/${inscricaoId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Não foi possível carregar a ficha.');
        const data = await res.json();
        
        setCandidato(data.candidato);
        setExame(data.exame);
        setExaminadorNome(data.examinador_nome || 'Banca Examinadora');
      } catch (err) {
        console.error(err);
        router.push('/exames');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [inscricaoId, usuario]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-zinc-500 font-cinzel text-xs tracking-widest uppercase">Carregando boletim de notas...</p>
      </div>
    );
  }

  if (!candidato || !exame || !candidato.dados_banca) {
    return (
      <div className="p-10 text-center text-zinc-500 font-cinzel text-xs">
        Ficha de avaliação ou resultado indisponível para esta inscrição.
      </div>
    );
  }

  const ex = exame;
  const c = candidato;
  const detalhes = c.dados_banca!;

  const outcomeColor: Record<string, string> = {
    aprovado: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30',
    reprovado: 'text-red-400 bg-red-950/40 border-red-900/30',
    ausente: 'text-zinc-400 bg-zinc-900/40 border-zinc-800/30',
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 sm:p-6 pb-12 print:p-0 print:bg-white print:text-black">
      
      {/* Voltar (oculto na impressão) */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-900 pb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link href={`/exames/${c.exame_id}`} className="p-2.5 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800 transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-cinzel">
              <FileText size={20} className="text-primary" /> Boletim de Notas
            </h2>
            <p className="text-xs text-zinc-500">Detalhamento da avaliação técnica de graduação</p>
          </div>
        </div>

        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-cinzel text-zinc-400 hover:text-primary hover:border-primary/40 bg-zinc-900/40 border border-zinc-900 rounded-xl transition cursor-pointer"
        >
          <Printer size={13} />
          Imprimir Boletim
        </button>
      </div>

      {/* Cartão do Boletim */}
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-6 print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none print:hidden" />

        {/* Informações Cabeçalho */}
        <div className="flex justify-between items-start gap-4 flex-wrap pb-6 border-b border-zinc-900 print:border-black">
          <div>
            <h3 className="font-cinzel text-white text-base sm:text-lg font-bold uppercase tracking-wider print:text-black">{ex.titulo}</h3>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 print:text-zinc-650">
              <Calendar size={12} /> 
              {ex.data_exame.includes('T') ? ex.data_exame.split('T')[0].split('-').reverse().join('/') : ex.data_exame.split('-').reverse().join('/')} 
              · {ex.local}
            </p>
          </div>
          <span className={`text-xs font-bold font-cinzel uppercase tracking-widest px-3 py-1.5 rounded-xl border ${outcomeColor[c.status] || outcomeColor['aprovado']}`}>
            {c.status}
          </span>
        </div>

        {/* Dados do Atleta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs print:text-black">
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-wider print:text-zinc-700">Atleta</p>
            <p className="font-semibold text-white mt-0.5 print:text-black">{c.atleta_nome}</p>
          </div>
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-wider print:text-zinc-700">Graduação Atual</p>
            <p className="font-semibold text-zinc-300 mt-0.5 print:text-zinc-800">{c.faixa_atual}</p>
          </div>
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-wider print:text-zinc-700">Modalidade</p>
            <p className="font-semibold text-white mt-0.5 print:text-black">{ex.modalidade}</p>
          </div>
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-wider print:text-zinc-700">Graduação Alvo</p>
            <p className="font-semibold text-white mt-0.5 print:text-black font-cinzel text-gold">{c.graduacao_pretendida}</p>
          </div>
        </div>

        {/* Tabela de Critérios */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden print:border-black print:bg-white print:text-black">
          {/* Cabeçalho */}
          <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-900/20 flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider print:border-black print:text-black">
            <span>Critério de Avaliação</span>
            <span>Avaliação</span>
          </div>
          
          <div className="divide-y divide-zinc-900/60 print:divide-zinc-300">
            {detalhes.criterios?.map((crit: any) => {
              const hasConcept = typeof crit.conceito === 'string' && crit.conceito !== '';
              const conceptColors: Record<string, string> = {
                F: 'bg-red-950/40 text-red-400 border border-red-900/20 print:bg-red-100 print:text-red-800 print:border-red-300',
                R: 'bg-yellow-950/40 text-yellow-350 border border-yellow-900/20 print:bg-yellow-100 print:text-yellow-800 print:border-yellow-300',
                B: 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/20 print:bg-green-100 print:text-green-800 print:border-green-300',
                E: 'bg-blue-950/40 text-blue-400 border border-blue-900/20 print:bg-blue-100 print:text-blue-800 print:border-blue-300',
              };
              
              return (
                <div key={crit.nome} className="px-5 py-4 space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-zinc-300 font-semibold text-xs sm:text-sm font-cinzel print:text-black">{crit.nome}</span>
                    <div className="flex items-center gap-2">
                      {hasConcept && (
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border uppercase ${conceptColors[crit.conceito]}`}>
                          Conceito {crit.conceito}
                        </span>
                      )}
                      {crit.nota !== null && crit.nota !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-900/40 border border-zinc-900 px-2 py-0.5 rounded print:text-black print:border-zinc-300">
                          Nota: {Number(crit.nota).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {crit.observacoes && (
                    <p className="text-xs text-zinc-500 italic bg-zinc-900/10 px-3.5 py-2 rounded-xl border border-zinc-900/50 mt-1 print:text-zinc-800 print:bg-zinc-50 print:border-zinc-300">
                      "{crit.observacoes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Resumo da Regra ou Média */}
          <div className="px-5 py-4 bg-zinc-900/10 border-t border-zinc-900 space-y-2 print:border-black print:text-black">
            {detalhes.passing_count !== undefined && detalhes.total_tests !== undefined && (
              <div className="flex justify-between items-center text-xs text-zinc-500 print:text-zinc-800">
                <span>Conceitos Aprovadores (R/B/E):</span>
                <span className="font-bold text-white print:text-black">
                  {detalhes.passing_count} de {detalhes.total_tests} (Mínimo: {detalhes.required_passing})
                </span>
              </div>
            )}
            {detalhes.nota_final !== null && detalhes.nota_final !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-cinzel print:text-zinc-800">Média das Notas</span>
                <span className="text-lg font-mono font-black text-primary print:text-black">{Number(detalhes.nota_final).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Parecer do Examinador */}
        {detalhes.observacoes && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-2 print:border-black print:text-black">
            <p className="text-[10px] font-bold text-zinc-500 font-cinzel uppercase tracking-wider flex items-center gap-1.5 print:text-black">
              <Shield size={13} className="text-primary" /> Observações Técnicas do Examinador
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed italic print:text-black">
              "{detalhes.observacoes}"
            </p>
          </div>
        )}

        {/* Rodapé / Assinatura */}
        <div className="pt-4 flex justify-between items-center text-[10px] text-zinc-500 flex-wrap gap-2 border-t border-zinc-900 print:border-black print:text-black">
          <p>
            Avaliado em: {c.avaliado_em ? c.avaliado_em.split('T')[0].split('-').reverse().join('/') + ' às ' + c.avaliado_em.split('T')[1].substring(0, 5) : '—'}
          </p>
          {examinadorNome && (
            <p className="flex items-center gap-1">
              <User size={10} /> Examinador: <span className="font-semibold text-zinc-400 print:text-black font-cinzel">{examinadorNome}</span>
            </p>
          )}
        </div>
      </div>

    </div>
  );
}

// Sub-componente Loader local para simplificar import
function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      width={size || 24} 
      height={size || 24}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
