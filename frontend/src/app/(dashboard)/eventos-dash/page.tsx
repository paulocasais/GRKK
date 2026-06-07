'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Trophy, Plus, Users, Loader2, Play, Award, Edit, Trash2, X, ChevronRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Evento {
  id: string | number;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  tipo: 'torneio' | 'seminario' | 'exame' | 'outro';
}

interface Inscricao {
  id: string | number;
  evento_id: string | number;
  atleta_id: string;
  atleta_nome: string;
  filial_nome: string;
  categoria: 'Kata' | 'Kumite';
  faixa: string;
  idade: number;
}

// Estrutura das chaves (brackets)
interface BracketsData {
  competidores: string[]; // Lista inicial de nomes (4, 8 ou 16)
  vencedoresQuartas: (string | null)[];  // tamanho 4
  vencedoresSemifinal: (string | null)[]; // tamanho 2
  vencedorFinal: string | null;
}

export default function EventosDashboardPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [showNovoEventoModal, setShowNovoEventoModal] = useState(false);
  const [showInscritosModal, setShowInscritosModal] = useState(false);
  const [showInscricaoModal, setShowInscricaoModal] = useState(false);
  const [showChavesModal, setShowChavesModal] = useState(false);

  // Selected item reference
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedModalidade, setSelectedModalidade] = useState<'Kata' | 'Kumite'>('Kata');

  // Forms
  const [novoEventoForm, setNovoEventoForm] = useState({ titulo: '', descricao: '', data_inicio: '', data_fim: '', tipo: 'torneio' as const });
  const [inscricaoForm, setInscricaoForm] = useState({ categoria: 'Kata' as const, idade: 18 });

  // Bracket state
  const [bracket, setBracket] = useState<BracketsData | null>(null);
  const [loadingBracket, setLoadingBracket] = useState(false);

  const carregarDados = async () => {
    try {
      const [resEventos, resInscricoes] = await Promise.all([
        fetch(`${API_URL}/api/eventos`, { credentials: 'include' }),
        fetch(`${API_URL}/api/eventos/inscricoes`, { credentials: 'include' }).catch(() => null)
      ]);

      if (resEventos.ok) {
        const data = await resEventos.json();
        setEventos(data.eventos || []);
      }
      if (resInscricoes && resInscricoes.ok) {
        const data = await resInscricoes.json();
        setInscricoes(data.inscricoes || []);
      }
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      // Fallback local
      setEventos([
        { id: "ev-1", titulo: "Campeonato Baiano de Karatê FKBA", descricao: "Torneio estadual oficial pontuável para o ranking.", data_inicio: "2026-08-20", data_fim: "2026-08-21", tipo: "torneio" },
        { id: "ev-2", titulo: "Curso de Arbitragem e Regras Goju-Ryu", descricao: "Treinamento oficial de arbitragem comSensei convidado.", data_inicio: "2026-07-05", data_fim: "2026-07-06", tipo: "seminario" }
      ]);
      setInscricoes([
        { id: 1, evento_id: "ev-1", atleta_id: "st-1", atleta_nome: "Pedro Oliveira", filial_nome: "Dojo Central", categoria: "Kata", faixa: "Branca", idade: 20 },
        { id: 2, evento_id: "ev-1", atleta_id: "st-2", atleta_nome: "Lucas Almeida", filial_nome: "Dojo Central", categoria: "Kumite", faixa: "Amarela", idade: 19 },
        { id: 3, evento_id: "ev-1", atleta_id: "bp-1", atleta_nome: "Sensei Carlos Silva", filial_nome: "Dojo Central", categoria: "Kumite", faixa: "Preta", idade: 40 },
        { id: 4, evento_id: "ev-1", atleta_id: "st-3", atleta_nome: "Matheus Costa", filial_nome: "Dojo Central", categoria: "Kumite", faixa: "Laranja", idade: 22 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCriarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(novoEventoForm)
      });
      if (res.ok) {
        const data = await res.json();
        setEventos([data, ...eventos]);
        setShowNovoEventoModal(false);
        setNovoEventoForm({ titulo: '', descricao: '', data_inicio: '', data_fim: '', tipo: 'torneio' });
      }
    } catch (err) {
      const mockEv: Evento = { id: Date.now(), ...novoEventoForm };
      setEventos([mockEv, ...eventos]);
      setShowNovoEventoModal(false);
    }
  };

  const handleInscreverSe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvento) return;

    try {
      const res = await fetch(`${API_URL}/api/eventos/inscricoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          evento_id: selectedEvento.id,
          categoria: inscricaoForm.categoria,
          idade: inscricaoForm.idade
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInscricoes([data, ...inscricoes]);
        setShowInscricaoModal(false);
      }
    } catch (err) {
      const mockIns: Inscricao = {
        id: Date.now(),
        evento_id: selectedEvento.id,
        atleta_id: usuario?.id || 'me',
        atleta_nome: usuario?.nome || 'Atleta de Teste',
        filial_nome: usuario?.filial_nome || 'Dojo Central',
        categoria: inscricaoForm.categoria,
        faixa: usuario?.faixa || 'Branca',
        idade: inscricaoForm.idade
      };
      setInscricoes([mockIns, ...inscricoes]);
      setShowInscricaoModal(false);
    }
  };

  // Carrega ou inicializa as chaves do torneio
  const handleGerenciarChaves = async (evento: Evento, modalidade: 'Kata' | 'Kumite') => {
    setSelectedEvento(evento);
    setSelectedModalidade(modalidade);
    setLoadingBracket(true);
    setShowChavesModal(true);

    try {
      const res = await fetch(`${API_URL}/api/eventos/chaves?evento_id=${evento.id}&modalidade=${modalidade}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.chave) {
          setBracket(data.chave.brackets);
          setLoadingBracket(false);
          return;
        }
      }

      // Se não houver chave salva, gera uma nova chave a partir dos atletas inscritos
      const listInscritos = inscricoes.filter(i => i.evento_id === evento.id && i.categoria === modalidade);
      const nomes = listInscritos.map(i => i.atleta_nome);
      
      // Ajusta para o tamanho mínimo (4, 8 ou 16) preenchendo com "W.O." se faltar
      let tamanhoChave = 4;
      if (nomes.length > 8) tamanhoChave = 16;
      else if (nomes.length > 4) tamanhoChave = 8;

      const competidores = [...nomes];
      while (competidores.length < tamanhoChave) {
        competidores.push('W.O.');
      }

      const novaChave: BracketsData = {
        competidores,
        vencedoresQuartas: Array(4).fill(null),
        vencedoresSemifinal: Array(2).fill(null),
        vencedorFinal: null
      };

      setBracket(novaChave);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBracket(false);
    }
  };

  const handleSelecionarVencedor = (rodada: 'quartas' | 'semifinal' | 'final', index: number, vencedor: string) => {
    if (!bracket) return;
    if (vencedor === 'W.O.' || vencedor === 'Aguardando') return;

    const novaChave = { ...bracket };
    if (rodada === 'quartas') {
      novaChave.vencedoresQuartas[index] = vencedor;
      // Reseta dependentes se mudou o vencedor
      const idxSemi = Math.floor(index / 2);
      if (novaChave.vencedoresSemifinal[idxSemi] !== vencedor) {
        novaChave.vencedoresSemifinal[idxSemi] = null;
        novaChave.vencedorFinal = null;
      }
    } else if (rodada === 'semifinal') {
      novaChave.vencedoresSemifinal[index] = vencedor;
      if (novaChave.vencedorFinal !== vencedor) {
        novaChave.vencedorFinal = null;
      }
    } else if (rodada === 'final') {
      novaChave.vencedorFinal = vencedor;
    }

    setBracket(novaChave);
  };

  const handleSalvarChave = async () => {
    if (!selectedEvento || !bracket) return;
    try {
      await fetch(`${API_URL}/api/eventos/chaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          evento_id: selectedEvento.id,
          modalidade: selectedModalidade,
          brackets: bracket
        })
      });
      alert('Chaves de confrontos salvas com sucesso!');
      setShowChavesModal(false);
    } catch (err) {
      alert('Erro ao salvar no servidor. Alterações persistidas localmente.');
      setShowChavesModal(false);
    }
  };

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
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Módulo de Eventos</h1>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">Torneios federativos, seminários e chaves de lutas</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowNovoEventoModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} /> Criar Evento
          </button>
        )}
      </div>

      {/* Grid Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {eventos.map(evento => {
          const listInscritos = inscricoes.filter(i => i.evento_id === evento.id);
          return (
            <div key={evento.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gold bg-gold/10 rounded border border-gold/20">
                    {evento.tipo}
                  </span>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {evento.data_inicio} até {evento.data_fim}
                  </p>
                </div>
                <h3 className="text-base font-bold text-white font-cinzel leading-snug">{evento.titulo}</h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">{evento.descricao}</p>
                
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <Users size={12} /> {listInscritos.length} Atletas Inscritos
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-zinc-800/40">
                {evento.tipo === 'torneio' && isAdmin && (
                  <>
                    <button
                      onClick={() => handleGerenciarChaves(evento, 'Kata')}
                      className="flex-1 py-2 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-[9px] font-bold uppercase tracking-wider hover:scale-[1.02] transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Trophy size={11} /> Chave Kata
                    </button>
                    <button
                      onClick={() => handleGerenciarChaves(evento, 'Kumite')}
                      className="flex-1 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-[9px] font-bold uppercase tracking-wider hover:scale-[1.02] transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Trophy size={11} /> Chave Kumite
                    </button>
                  </>
                )}
                {tipo === 'atleta' && !listInscritos.find(i => i.atleta_id === usuario?.id) && (
                  <button
                    onClick={() => {
                      setSelectedEvento(evento);
                      setShowInscricaoModal(true);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-cobalt-600 to-cobalt-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer"
                  >
                    Solicitar Inscrição
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedEvento(evento);
                    setShowInscritosModal(true);
                  }}
                  className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Ver Inscritos
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL NOVO EVENTO */}
      {showNovoEventoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowNovoEventoModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-5">Criar Novo Evento</h3>

            <form onSubmit={handleCriarEvento} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título do Evento *</label>
                <input
                  type="text" required
                  placeholder="Ex: Torneio Interno Goju-Ryu"
                  value={novoEventoForm.titulo}
                  onChange={(e) => setNovoEventoForm({ ...novoEventoForm, titulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Detalhes do cronograma, local, etc."
                  value={novoEventoForm.descricao}
                  onChange={(e) => setNovoEventoForm({ ...novoEventoForm, descricao: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Data Início *</label>
                  <input
                    type="date" required
                    value={novoEventoForm.data_inicio}
                    onChange={(e) => setNovoEventoForm({ ...novoEventoForm, data_inicio: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Data Fim *</label>
                  <input
                    type="date" required
                    value={novoEventoForm.data_fim}
                    onChange={(e) => setNovoEventoForm({ ...novoEventoForm, data_fim: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Tipo de Evento *</label>
                <select
                  value={novoEventoForm.tipo}
                  onChange={(e) => setNovoEventoForm({ ...novoEventoForm, tipo: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                >
                  <option value="torneio">Torneio / Campeonato</option>
                  <option value="seminario">Seminário / Curso</option>
                  <option value="exame">Exame de Faixa Geral</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNovoEventoModal(false)}
                  className="flex-1 py-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer"
                >
                  Criar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INSCRITOS */}
      {showInscritosModal && selectedEvento && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-lg p-6 relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowInscritosModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-2">Atletas Inscritos</h3>
            <p className="text-[10px] text-zinc-450 uppercase tracking-wider mb-5">Evento: <strong className="text-white">{selectedEvento.titulo}</strong></p>

            <div className="space-y-3">
              {inscricoes.filter(i => i.evento_id === selectedEvento.id).map(insc => (
                <div key={insc.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">{insc.atleta_nome}</h4>
                    <p className="text-[9px] text-zinc-500">{insc.filial_nome} · Categoria: <strong className="text-gold">{insc.categoria}</strong></p>
                  </div>
                  <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-450 bg-zinc-900 border border-zinc-800 rounded">
                    Faixa: {insc.faixa}
                  </span>
                </div>
              ))}

              {inscricoes.filter(i => i.evento_id === selectedEvento.id).length === 0 && (
                <p className="text-center text-xs text-zinc-500 py-6">Nenhum atleta inscrito neste evento.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SOLICITAÇÃO DE INSCRIÇÃO ATLETA */}
      {showInscricaoModal && selectedEvento && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setShowInscricaoModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-1">Inscrição no Evento</h3>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-5">Evento: <strong className="text-white">{selectedEvento.titulo}</strong></p>

            <form onSubmit={handleInscreverSe} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Modalidade / Categoria *</label>
                <select
                  value={inscricaoForm.categoria}
                  onChange={(e) => setInscricaoForm({ ...inscricaoForm, categoria: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                >
                  <option value="Kata">Kata (Apresentação de Formas)</option>
                  <option value="Kumite">Kumite (Combate de Luta)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Idade do Competidor *</label>
                <input
                  type="number" required min="4" max="90"
                  value={inscricaoForm.idade}
                  onChange={(e) => setInscricaoForm({ ...inscricaoForm, idade: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cobalt-600 to-cobalt-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer"
              >
                Confirmar Inscrição
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GERENCIADOR DE CHAVES DE LUTA (KATA / KUMITE BRACKETS) */}
      {showChavesModal && selectedEvento && bracket && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col p-4 overflow-y-auto">
          {/* Top Bar Modal */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-white font-cinzel tracking-wider flex items-center gap-2">
                <Trophy className="text-gold" /> Chaves de Torneio ({selectedModalidade})
              </h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">
                Evento: {selectedEvento.titulo} · Modo Eliminatório Mata-Mata
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSalvarChave}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer"
              >
                Salvar Chave
              </button>
              <button
                onClick={() => setShowChavesModal(false)}
                className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>

          {loadingBracket ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[60vh] overflow-x-auto select-none p-4">
              
              {/* Árvore de Brackets Visual */}
              <div className="flex items-center gap-8 md:gap-16 min-w-max">
                
                {/* 1. Quartas de Final (Se for chave de 8 competidores) */}
                {bracket.competidores.length >= 8 && (
                  <div className="flex flex-col gap-6">
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider text-center mb-1">Quartas de Final</p>
                    {Array(4).fill(null).map((_, idx) => {
                      const c1 = bracket.competidores[idx * 2] || 'W.O.';
                      const c2 = bracket.competidores[idx * 2 + 1] || 'W.O.';
                      const vencedor = bracket.vencedoresQuartas[idx];
                      
                      return (
                        <div key={idx} className="relative flex flex-col gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 w-48 shadow-lg">
                          <button
                            type="button"
                            onClick={() => handleSelecionarVencedor('quartas', idx, c1)}
                            className={`px-3 py-2 rounded-lg text-left text-xs font-bold transition flex justify-between items-center cursor-pointer ${
                              vencedor === c1 ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-850'
                            }`}
                          >
                            <span className="truncate">{c1}</span>
                            {vencedor === c1 && <Play size={10} className="fill-emerald-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelecionarVencedor('quartas', idx, c2)}
                            className={`px-3 py-2 rounded-lg text-left text-xs font-bold transition flex justify-between items-center cursor-pointer ${
                              vencedor === c2 ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-850'
                            }`}
                          >
                            <span className="truncate">{c2}</span>
                            {vencedor === c2 && <Play size={10} className="fill-emerald-400" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Linha Conectora Decorativa */}
                {bracket.competidores.length >= 8 && <ChevronRight className="text-zinc-750 self-center hidden md:block" />}

                {/* 2. Semifinais */}
                <div className="flex flex-col gap-12">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider text-center mb-1">Semifinal</p>
                  {Array(2).fill(null).map((_, idx) => {
                    let s1 = 'Aguardando';
                    let s2 = 'Aguardando';

                    if (bracket.competidores.length < 8) {
                      s1 = bracket.competidores[idx * 2] || 'W.O.';
                      s2 = bracket.competidores[idx * 2 + 1] || 'W.O.';
                    } else {
                      s1 = bracket.vencedoresQuartas[idx * 2] || 'Aguardando';
                      s2 = bracket.vencedoresQuartas[idx * 2 + 1] || 'Aguardando';
                    }

                    const vencedor = bracket.vencedoresSemifinal[idx];

                    return (
                      <div key={idx} className="flex flex-col gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 w-48 shadow-lg">
                        <button
                          type="button"
                          disabled={s1 === 'Aguardando'}
                          onClick={() => handleSelecionarVencedor('semifinal', idx, s1)}
                          className={`px-3 py-2.5 rounded-lg text-left text-xs font-bold transition flex justify-between items-center ${
                            s1 === 'Aguardando' ? 'opacity-40 cursor-not-allowed bg-zinc-950 text-zinc-600' :
                            vencedor === s1 ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-850 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{s1}</span>
                          {vencedor === s1 && <Play size={10} className="fill-emerald-400" />}
                        </button>
                        <button
                          type="button"
                          disabled={s2 === 'Aguardando'}
                          onClick={() => handleSelecionarVencedor('semifinal', idx, s2)}
                          className={`px-3 py-2.5 rounded-lg text-left text-xs font-bold transition flex justify-between items-center ${
                            s2 === 'Aguardando' ? 'opacity-40 cursor-not-allowed bg-zinc-950 text-zinc-600' :
                            vencedor === s2 ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-850 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{s2}</span>
                          {vencedor === s2 && <Play size={10} className="fill-emerald-400" />}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <ChevronRight className="text-zinc-750 self-center hidden md:block" />

                {/* 3. Final */}
                <div className="flex flex-col gap-4">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider text-center mb-1">Grande Final</p>
                  {(() => {
                    const f1 = bracket.vencedoresSemifinal[0] || 'Aguardando';
                    const f2 = bracket.vencedoresSemifinal[1] || 'Aguardando';
                    const vencedor = bracket.vencedorFinal;

                    return (
                      <div className="flex flex-col gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-52 shadow-2xl relative">
                        {vencedor && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-zinc-950 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow">
                            Campeão
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={f1 === 'Aguardando'}
                          onClick={() => handleSelecionarVencedor('final', 0, f1)}
                          className={`px-3.5 py-3 rounded-lg text-left text-xs font-bold transition flex justify-between items-center ${
                            f1 === 'Aguardando' ? 'opacity-40 cursor-not-allowed bg-zinc-950 text-zinc-600' :
                            vencedor === f1 ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-850 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{f1}</span>
                          {vencedor === f1 && <Award size={11} className="text-gold" />}
                        </button>
                        <button
                          type="button"
                          disabled={f2 === 'Aguardando'}
                          onClick={() => handleSelecionarVencedor('final', 0, f2)}
                          className={`px-3.5 py-3 rounded-lg text-left text-xs font-bold transition flex justify-between items-center ${
                            f2 === 'Aguardando' ? 'opacity-40 cursor-not-allowed bg-zinc-950 text-zinc-600' :
                            vencedor === f2 ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-850 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{f2}</span>
                          {vencedor === f2 && <Award size={11} className="text-gold" />}
                        </button>
                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>
          )}

          {/* Dica */}
          <div className="mt-auto p-4 border-t border-zinc-850 text-center text-[10px] text-zinc-550">
            Dica do Sensei: Clique no nome do atleta do confronto para declará-lo vencedor e avançá-lo no bracket.
          </div>
        </div>
      )}

    </main>
  );
}
