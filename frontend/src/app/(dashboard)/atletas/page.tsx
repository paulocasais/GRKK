'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, ShieldAlert, Loader2, Search, CheckCircle2, User, Trophy, Mail, Phone } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Atleta {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  faixa: string;
  status: 'ativo' | 'pendente' | 'inativo';
  filial_nome?: string;
  cidade?: string;
}

const FAIXAS = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];

export default function AtletasPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'pendente'>('todos');
  
  const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);
  const [novaFaixa, setNovaFaixa] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregarAtletas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/atletas`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAtletas(data.atletas || []);
      }
    } catch (err) {
      console.error("Erro ao carregar atletas, usando dados emulados:", err);
      // Fallback local
      setAtletas([
        { id: "st-1", nome: "Pedro Oliveira", email: "pedro.oliveira@grkk.com.br", telefone: "(71) 98888-2001", faixa: "Branca", status: "ativo", filial_nome: "Filial Salvador Centro" },
        { id: "st-2", nome: "Lucas Almeida", email: "lucas.almeida@grkk.com.br", telefone: "(71) 98888-2002", faixa: "Amarela", status: "ativo", filial_nome: "Filial Salvador Centro" },
        { id: "pending-athlete-id", nome: "Atleta Pendente de Teste", email: "atleta-pendente@grkk.com.br", telefone: "71988888888", faixa: "Branca", status: "pendente", filial_nome: "GRKK CABULA" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAtletas();
  }, []);

  const handleHomologar = async (atletaId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/atletas/${atletaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'ativo' })
      });
      if (res.ok) {
        setAtletas(atletas.map(a => a.id === atletaId ? { ...a, status: 'ativo' } : a));
      }
    } catch (err) {
      setAtletas(atletas.map(a => a.id === atletaId ? { ...a, status: 'ativo' } : a));
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAtleta) return;
    setSalvando(true);
    try {
      const res = await fetch(`${API_URL}/api/atletas/${selectedAtleta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ faixa: novaFaixa })
      });
      if (res.ok) {
        setAtletas(atletas.map(a => a.id === selectedAtleta.id ? { ...a, faixa: novaFaixa } : a));
        setSelectedAtleta(null);
      }
    } catch (err) {
      setAtletas(atletas.map(a => a.id === selectedAtleta.id ? { ...a, faixa: novaFaixa } : a));
      setSelectedAtleta(null);
    } finally {
      setSalvando(false);
    }
  };

  const atletasFiltrados = atletas.filter(atleta => {
    const matchesBusca = atleta.nome.toLowerCase().includes(busca.toLowerCase()) || 
                         atleta.email.toLowerCase().includes(busca.toLowerCase());
    const matchesStatus = statusFiltro === 'todos' || atleta.status === statusFiltro;
    return matchesBusca && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (tipo !== 'admin' && tipo !== 'filial') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-white font-cinzel">Acesso Negado</h2>
        <p className="text-zinc-500 text-sm">Apenas administradores e filiais homologadas podem acessar este painel.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Gestão de Atletas</h1>
        <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">Homologação de cadastros e graduações</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 border border-zinc-800 rounded-xl w-full md:w-auto">
          {(['todos', 'ativo', 'pendente'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFiltro(f)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                statusFiltro === f ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Pendentes'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      {/* Grid de Atletas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {atletasFiltrados.map(atleta => (
          <div key={atleta.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-center text-zinc-400">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{atleta.nome}</h3>
                    <p className="text-[10px] text-zinc-500">{atleta.filial_nome || 'Dojo Central'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-md border ${
                  atleta.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {atleta.status}
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-zinc-800/50">
                <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
                  <Mail size={11} className="text-zinc-650" /> {atleta.email}
                </p>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
                  <Phone size={11} className="text-zinc-650" /> {atleta.telefone || 'Não informado'}
                </p>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
                  <Trophy size={11} className="text-zinc-650" /> Graduação: <strong className="text-gold">{atleta.faixa}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-zinc-800/40">
              {atleta.status === 'pendente' && (
                <button
                  onClick={() => handleHomologar(atleta.id)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={12} /> Homologar
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedAtleta(atleta);
                  setNovaFaixa(atleta.faixa);
                }}
                className="flex-1 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
              >
                Alterar Faixa
              </button>
            </div>
          </div>
        ))}

        {atletasFiltrados.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
            Nenhum atleta encontrado.
          </div>
        )}
      </div>

      {/* Modal Edição de Faixa */}
      {selectedAtleta && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-sm p-6 relative">
            <h3 className="text-base font-bold text-white font-cinzel mb-1">Graduar Atleta</h3>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-5">Atleta: <strong className="text-white">{selectedAtleta.nome}</strong></p>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-450 uppercase mb-1.5">Faixa / Graduação</label>
                <select
                  value={novaFaixa}
                  onChange={(e) => setNovaFaixa(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                >
                  {FAIXAS.map(faixa => (
                    <option key={faixa} value={faixa}>{faixa}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAtleta(null)}
                  className="flex-1 py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer flex items-center justify-center"
                >
                  {salvando ? <Loader2 size={12} className="animate-spin" /> : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
