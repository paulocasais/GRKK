'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Zap, HelpCircle, Loader2 } from 'lucide-react';
import FormAvaliacao from '../avaliar/[inscricaoId]/FormAvaliacao';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Exame {
  id: string | number;
  titulo: string;
  status: string;
  modalidade: string;
  faixa_alvo: string;
}

interface Candidato {
  id: string | number;
  atleta_nome: string;
  avaliado_por?: string | null;
  status: string;
}

export default function AvaliarBancaClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: exameId } = use(params);
  const router = useRouter();
  const { usuario, tipo, isAdmin, carregando } = useAuth();
  const isExaminador = tipo === 'filial';

  const [exame, setExame] = useState<Exame | null>(null);
  const [inscricoesAtivas, setInscricoesAtivas] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    try {
      const res = await fetch(`${API_URL}/api/exames/${exameId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Não foi possível carregar o exame.');
      const data = await res.json();
      
      setExame(data.exame);

      // Filtra candidatos designados a este examinador que estão em andamento (status 'inscrito')
      const ativos = (data.candidatos || []).filter(
        (c: any) => c.avaliado_por === usuario?.id && c.status === 'inscrito'
      );
      setInscricoesAtivas(ativos);

      if (data.exame.status !== 'em_andamento') {
        alert('Este exame não está em andamento.');
        router.push(`/exames/${exameId}`);
        return;
      }
    } catch (err) {
      console.error(err);
      router.push(`/exames/${exameId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (carregando) return;

    if (!usuario) {
      router.push('/auth');
      return;
    }

    if (!isAdmin && !isExaminador) {
      router.push('/exames');
      return;
    }

    carregarDados();
  }, [exameId, usuario, carregando]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-zinc-500 font-cinzel text-xs tracking-widest uppercase">Carregando banca concorrente...</p>
      </div>
    );
  }

  if (!exame) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 w-full max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-zinc-900 pb-6">
        <Link 
          href={`/exames/${exameId}`} 
          className="p-2.5 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800 transition"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
            <Zap size={20} className="text-primary animate-pulse" /> Banca Concorrente
          </h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-semibold">
            Avaliação Técnica Simultânea (Máx 3 atletas) · {exame.titulo}
          </p>
        </div>
      </div>

      {/* Grid de Formulários */}
      {inscricoesAtivas.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-lg flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500">
            <HelpCircle size={28} />
          </div>
          <div>
            <h3 className="font-bold text-white font-cinzel text-base uppercase tracking-wider">Banca Vazia</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Não há atletas ativos designados para a sua banca no momento. Novos atletas da fila serão alocados automaticamente conforme as vagas forem liberadas.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/exames/${exameId}`}
              className="inline-block text-xs font-bold px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900 transition font-cinzel"
            >
              Voltar ao Exame
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 items-start">
          {inscricoesAtivas.map((inscricao) => (
            <div key={inscricao.id} className="space-y-4 border border-zinc-900 p-4 rounded-3xl bg-zinc-950/45 shadow-xl">
              <FormAvaliacao
                exameId={String(exameId)}
                inscricaoId={String(inscricao.id)}
                candidatoNome={inscricao.atleta_nome}
                faixaAlvo={exame.faixa_alvo}
                modalidade={exame.modalidade}
                isMulti={true}
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
