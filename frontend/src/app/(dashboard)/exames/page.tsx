'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Trophy, Plus, Calendar, User, Star, Clock,
  CheckCircle2, AlertCircle, Award, Loader2,
  Building2, ChevronDown, ChevronRight, X
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Exame {
  id: string | number;
  titulo: string;
  descricao: string;
  data_exame: string;
  status: 'agendado' | 'realizado' | 'cancelado';
}

interface Candidato {
  id: string | number;
  exame_id: string | number;
  atleta_id: string;
  atleta_nome: string;
  filial_nome: string;
  faixa_atual: string;
  graduacao_pretendida: string;
  status: 'pendente' | 'inscrito' | 'aprovado' | 'reprovado';
  autorizacao_tecnica: boolean;
  pagamento_status: 'pendente' | 'pago';
  dados_banca?: {
    examinadores?: string;
    nota_tecnica?: number;
    nota_kihon?: number;
    nota_kata?: number;
    nota_combate?: number;
    parecer?: string;
    bancada?: string;
  };
}

function formatDate(isoString: string) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

const FAIXAS = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];

export default function ExamesPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const isFilial = tipo === 'filial';
  const isAtleta = tipo === 'atleta';

  const [exames, setExames] = useState<Exame[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [exameFiltro, setExameFiltro] = useState<'todos' | 'agendado' | 'realizado'>('todos');
  const [busca, setBusca] = useState('');

  // Modais
  const [showInscricaoModal, setShowInscricaoModal] = useState(false);
  const [showNovoExameModal, setShowNovoExameModal] = useState(false);
  const [showBancaModal, setShowBancaModal] = useState(false);
  
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null);

  // Forms
  const [inscricaoForm, setInscricaoForm] = useState({ exame_id: '', graduacao_pretendida: 'Amarela' });
  const [novoExameForm, setNovoExameForm] = useState({ titulo: '', descricao: '', data_exame: '', status: 'agendado' as const });
  const [bancaForm, setBancaForm] = useState({ examinadores: '', nota_tecnica: '7.0', nota_kihon: '7.0', nota_kata: '7.0', nota_combate: '7.0', parecer: '', aprovado: true });

  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const carregarDados = async () => {
    try {
      const [resExames, resCandidatos] = await Promise.all([
        fetch(`${API_URL}/api/exames`, { credentials: 'include' }),
        fetch(`${API_URL}/api/exames/candidatos`, { credentials: 'include' }).catch(() => null)
      ]);

      if (resExames.ok) {
        const data = await resExames.json();
        setExames(data.exames || []);
      }

      if (resCandidatos && resCandidatos.ok) {
        const data = await resCandidatos.json();
        setCandidatos(data.candidatos || []);
      }
    } catch (err) {
      console.error("Erro ao carregar exames, usando dados mockados:", err);
      // Fallback offline estruturado
      setExames([
        { id: 1, titulo: "Exame de Faixas Coloridas - Capital", descricao: "Exame oficial de graduação para Kyu", data_exame: "2026-06-25", status: "agendado" },
        { id: 2, titulo: "Exame Geral de Faixas Pretas 2026", descricao: "Banca avaliadora para Dan", data_exame: "2026-04-12", status: "realizado" }
      ]);
      setCandidatos([
        { id: 1, exame_id: 1, atleta_id: "user-1", atleta_nome: "Pedro Albuquerque", filial_nome: "Dojo Salvador Centro", faixa_atual: "Branca", graduacao_pretendida: "Amarela", status: "pendente", autorizacao_tecnica: true, pagamento_status: "pendente" },
        { id: 2, exame_id: 1, atleta_id: "user-2", atleta_nome: "Maria Fernanda", filial_nome: "Goju-Ryu Lauro", faixa_atual: "Amarela", graduacao_pretendida: "Laranja", status: "inscrito", autorizacao_tecnica: true, pagamento_status: "pago" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCriarExame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/exames`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(novoExameForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      setExames([data, ...exames]);
      setShowNovoExameModal(false);
      setNovoExameForm({ titulo: '', descricao: '', data_exame: '', status: 'agendado' });
    } catch (err: any) {
      // Simulação local
      const mockExame: Exame = {
        id: Date.now(),
        titulo: novoExameForm.titulo,
        descricao: novoExameForm.descricao,
        data_exame: novoExameForm.data_exame,
        status: novoExameForm.status
      };
      setExames([mockExame, ...exames]);
      setShowNovoExameModal(false);
    }
  };

  const handleInscreverAtleta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/exames/candidatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          exame_id: inscricaoForm.exame_id,
          atleta_id: usuario?.id,
          graduacao_pretendida: inscricaoForm.graduacao_pretendida
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      setCandidatos([data, ...candidatos]);
      setShowInscricaoModal(false);
    } catch (err: any) {
      // Simulação local
      const mockCandidato: Candidato = {
        id: Date.now(),
        exame_id: Number(inscricaoForm.exame_id),
        atleta_id: usuario?.id || 'me',
        atleta_nome: usuario?.nome || 'Atleta Logado',
        filial_nome: usuario?.filial_nome || 'Dojo Central',
        faixa_atual: usuario?.faixa || 'Branca',
        graduacao_pretendida: inscricaoForm.graduacao_pretendida,
        status: 'pendente',
        autorizacao_tecnica: false,
        pagamento_status: 'pendente'
      };
      setCandidatos([mockCandidato, ...candidatos]);
      setShowInscricaoModal(false);
    }
  };

  const handleAutorizarCandidato = async (candidatoId: string | number, atual: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/exames/candidatos/${candidatoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ autorizacao_tecnica: !atual })
      });
      if (res.ok) {
        setCandidatos(candidatos.map(c => c.id === candidatoId ? { ...c, autorizacao_tecnica: !atual } : c));
      }
    } catch (err) {
      // Fallback local
      setCandidatos(candidatos.map(c => c.id === candidatoId ? { ...c, autorizacao_tecnica: !atual } : c));
    }
  };

  const handleAbrirBancaModal = (candidato: Candidato) => {
    setSelectedCandidato(candidato);
    setBancaForm({
      examinadores: candidato.dados_banca?.examinadores || '',
      nota_tecnica: String(candidato.dados_banca?.nota_tecnica || '7.0'),
      nota_kihon: String(candidato.dados_banca?.nota_kihon || '7.0'),
      nota_kata: String(candidato.dados_banca?.nota_kata || '7.0'),
      nota_combate: String(candidato.dados_banca?.nota_combate || '7.0'),
      parecer: candidato.dados_banca?.parecer || '',
      aprovado: candidato.status === 'aprovado'
    });
    setShowBancaModal(true);
  };

  const handleSalvarBancaAvaliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidato) return;

    try {
      const payload = {
        status: bancaForm.aprovado ? 'aprovado' : 'reprovado',
        dados_banca: {
          examinadores: bancaForm.examinadores,
          nota_tecnica: parseFloat(bancaForm.nota_tecnica),
          nota_kihon: parseFloat(bancaForm.nota_kihon),
          nota_kata: parseFloat(bancaForm.nota_kata),
          nota_combate: parseFloat(bancaForm.nota_combate),
          parecer: bancaForm.parecer
        }
      };

      const res = await fetch(`${API_URL}/api/exames/candidatos/${selectedCandidato.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setCandidatos(candidatos.map(c => c.id === selectedCandidato.id ? { ...c, status: payload.status as any, dados_banca: payload.dados_banca } : c));
      }
      setShowBancaModal(false);
    } catch (err) {
      // Fallback local
      setCandidatos(candidatos.map(c => c.id === selectedCandidato.id ? { 
        ...c, 
        status: (bancaForm.aprovado ? 'aprovado' : 'reprovado') as any, 
        dados_banca: {
          examinadores: bancaForm.examinadores,
          nota_tecnica: parseFloat(bancaForm.nota_tecnica),
          nota_kihon: parseFloat(bancaForm.nota_kihon),
          nota_kata: parseFloat(bancaForm.nota_kata),
          nota_combate: parseFloat(bancaForm.nota_combate),
          parecer: bancaForm.parecer
        }
      } : c));
      setShowBancaModal(false);
    }
  };

  const examesFiltrados = exames.filter(ex => {
    const matchesFiltro = exameFiltro === 'todos' || ex.status === exameFiltro;
    const matchesBusca = ex.titulo.toLowerCase().includes(busca.toLowerCase());
    return matchesFiltro && matchesBusca;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Exames de Faixa</h1>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">Inscrições, avaliações e homologações da Federação</p>
        </div>
        
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowNovoExameModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer"
            >
              Agendar Exame
            </button>
          )}

          {isAtleta && (
            <button
              onClick={() => {
                if (exames.length > 0) {
                  setInscricaoForm(prev => ({ ...prev, exame_id: String(exames[0].id) }));
                }
                setShowInscricaoModal(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer"
            >
              Solicitar Inscrição
            </button>
          )}
        </div>
      </div>

      {/* Abas e Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 border border-zinc-800 rounded-xl">
          {(['todos', 'agendado', 'realizado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setExameFiltro(f)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                exameFiltro === f ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'agendado' ? 'Agendados' : 'Realizados'}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Buscar exame..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="px-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none w-full sm:max-w-xs"
        />
      </div>

      {/* Grid Exames */}
      <div className="grid grid-cols-1 gap-6">
        {examesFiltrados.map(exame => {
          const candList = candidatos.filter(c => c.exame_id === exame.id);
          return (
            <div key={exame.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-cinzel">{exame.titulo}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{exame.descricao}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-2 flex items-center gap-1">
                    <Calendar size={11} /> {formatDate(exame.data_exame)}
                  </p>
                </div>
                <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                  exame.status === 'agendado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gold/10 text-gold border border-gold/20'
                }`}>
                  {exame.status}
                </span>
              </div>

              {/* Lista Candidatos */}
              {candList.length > 0 && (
                <div className="border-t border-zinc-800/60 pt-4 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Candidatos Inscritos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candList.map(c => (
                      <div key={c.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-white">{c.atleta_nome}</p>
                          <p className="text-[9px] text-zinc-500">{c.filial_nome} · {c.faixa_atual} → <strong className="text-gold">{c.graduacao_pretendida}</strong></p>
                          <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              c.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-400' :
                              c.status === 'reprovado' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {c.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              c.pagamento_status === 'pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              Pagamento: {c.pagamento_status}
                            </span>
                          </div>
                          {c.dados_banca && (c.dados_banca.nota_tecnica !== undefined || c.dados_banca.nota_kihon !== undefined || c.dados_banca.nota_kata !== undefined || c.dados_banca.nota_combate !== undefined) && (
                            <div className="mt-3 text-[10px] text-zinc-400 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800 space-y-1.5 max-w-[240px]">
                              <p className="font-black text-zinc-300 text-[8px] uppercase tracking-wider">Notas da Banca</p>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-zinc-400">
                                <div>Técnica: <strong className="text-white">{c.dados_banca.nota_tecnica ?? '-'}</strong></div>
                                <div>Kihon: <strong className="text-white">{c.dados_banca.nota_kihon ?? '-'}</strong></div>
                                <div>Kata: <strong className="text-white">{c.dados_banca.nota_kata ?? '-'}</strong></div>
                                <div>Combate: <strong className="text-white">{c.dados_banca.nota_combate ?? '-'}</strong></div>
                              </div>
                              {c.dados_banca.examinadores && (
                                <p className="text-[8px] text-zinc-500 border-t border-zinc-800/60 pt-1 mt-1">
                                  Banca: <span className="text-zinc-400 font-medium">{c.dados_banca.examinadores}</span>
                                </p>
                              )}
                              {c.dados_banca.parecer && (
                                <p className="text-[8px] text-zinc-500 italic">"{c.dados_banca.parecer}"</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Ações baseadas no tipo de usuário */}
                        <div className="flex gap-2 shrink-0">
                          {isFilial && !c.autorizacao_tecnica && (
                            <button
                              onClick={() => handleAutorizarCandidato(c.id, false)}
                              className="px-2.5 py-1.5 bg-gold/10 hover:bg-gold text-gold hover:text-white border border-gold/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                            >
                              Recomendar
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleAbrirBancaModal(c)}
                              className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary text-white border border-primary/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                            >
                              Avaliar Banca
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL BANCA EXAMINADORA */}
      {showBancaModal && selectedCandidato && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowBancaModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-lg font-bold text-white font-cinzel mb-2">Banca Examinadora</h3>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-5">Atleta: <strong className="text-white">{selectedCandidato.atleta_nome}</strong></p>
            
            <form onSubmit={handleSalvarBancaAvaliacao} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Examinador(es) *</label>
                <input
                  type="text" required
                  placeholder="Ex: Sensei Paulo Roberto, Sensei Cássio"
                  value={bancaForm.examinadores}
                  onChange={(e) => setBancaForm({ ...bancaForm, examinadores: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Técnica *</label>
                  <input
                    type="number" step="0.1" required
                    value={bancaForm.nota_tecnica}
                    onChange={(e) => setBancaForm({ ...bancaForm, nota_tecnica: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Kihon *</label>
                  <input
                    type="number" step="0.1" required
                    value={bancaForm.nota_kihon}
                    onChange={(e) => setBancaForm({ ...bancaForm, nota_kihon: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Kata *</label>
                  <input
                    type="number" step="0.1" required
                    value={bancaForm.nota_kata}
                    onChange={(e) => setBancaForm({ ...bancaForm, nota_kata: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Combate *</label>
                  <input
                    type="number" step="0.1" required
                    value={bancaForm.nota_combate}
                    onChange={(e) => setBancaForm({ ...bancaForm, nota_combate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Parecer / Observações</label>
                <textarea
                  placeholder="Observações técnicas..." rows={3}
                  value={bancaForm.parecer}
                  onChange={(e) => setBancaForm({ ...bancaForm, parecer: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 p-1 bg-zinc-950 border border-zinc-850 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBancaForm({ ...bancaForm, aprovado: true })}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    bancaForm.aprovado ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500'
                  }`}
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => setBancaForm({ ...bancaForm, aprovado: false })}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    !bancaForm.aprovado ? 'bg-red-500/10 text-red-400' : 'text-zinc-500'
                  }`}
                >
                  Reprovar
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition cursor-pointer"
              >
                Salvar Avaliação
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
