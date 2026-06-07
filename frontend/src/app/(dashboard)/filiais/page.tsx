'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Loader2, Building2, Search, Check, X, ShieldCheck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Filial {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  nome_fantasia?: string;
  codigo_interno?: string;
  status: 'ativo' | 'pendente' | 'inativo' | 'reprovado';
  graduacao_responsavel?: string;
  municipio?: string;
  estado?: string;
}

export default function FiliaisPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const carregarFiliais = async () => {
    try {
      const res = await fetch(`${API_URL}/api/filiais`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFiliais(data.filiais || []);
      }
    } catch (err) {
      console.error("Erro ao carregar filiais, usando dados mock:", err);
      setFiliais([
        { id: "7513aa27-452f-462e-8f5a-b3f2052612f0", nome: "Filial Salvador Centro", nome_fantasia: "Goju-Ryu Salvador", email: "filial@grkk.com.br", status: "ativo", codigo_interno: "BA-SSA-01", graduacao_responsavel: "Preta 3º Dan", municipio: "Salvador", estado: "BA" },
        { id: "pending-filial-id", nome: "Filial Pendente de Teste", nome_fantasia: "Goju-Ryu Pendente", email: "filial-pendente@grkk.com.br", status: "pendente", codigo_interno: "BA-SSA-02", graduacao_responsavel: "Preta 1º Dan", municipio: "Salvador", estado: "BA" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFiliais();
  }, []);

  const handleStatusChange = async (filialId: string, novoStatus: 'ativo' | 'reprovado' | 'inativo') => {
    try {
      const res = await fetch(`${API_URL}/api/filiais/${filialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) {
        setFiliais(filiais.map(f => f.id === filialId ? { ...f, status: novoStatus } : f));
      }
    } catch (err) {
      setFiliais(filiais.map(f => f.id === filialId ? { ...f, status: novoStatus } : f));
    }
  };

  const filiaisFiltradas = filiais.filter(filial => {
    const nome = filial.nome_fantasia || filial.nome;
    return nome.toLowerCase().includes(busca.toLowerCase()) || filial.email.toLowerCase().includes(busca.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (tipo !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-white font-cinzel">Acesso Negado</h2>
        <p className="text-zinc-500 text-sm">Apenas administradores homologados pela Federação podem acessar a gestão de filiais.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Gestão de Filiais</h1>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">Credenciamento de Dojos e Associações Vinculadas</p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Buscar filial..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filiaisFiltradas.map(filial => (
          <div key={filial.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-center text-zinc-400">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{filial.nome_fantasia || filial.nome}</h3>
                    <p className="text-[10px] text-zinc-500">Cód: {filial.codigo_interno || 'N/A'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-md border ${
                  filial.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  filial.status === 'pendente' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {filial.status}
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-zinc-800/50 text-[11px] text-zinc-400">
                <p>E-mail: <strong className="text-white font-mono">{filial.email}</strong></p>
                <p>Responsável: <strong className="text-white">{filial.graduacao_responsavel ? `Sensei (${filial.graduacao_responsavel})` : 'Não informado'}</strong></p>
                <p>Localização: <strong className="text-white">{filial.municipio ? `${filial.municipio} - ${filial.estado}` : 'Não cadastrada'}</strong></p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-zinc-800/40">
              {filial.status === 'pendente' && (
                <>
                  <button
                    onClick={() => handleStatusChange(filial.id, 'ativo')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check size={12} /> Aprovar
                  </button>
                  <button
                    onClick={() => handleStatusChange(filial.id, 'reprovado')}
                    className="flex-1 py-2 bg-red-650 hover:bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X size={12} /> Negar
                  </button>
                </>
              )}
              {filial.status === 'ativo' && (
                <button
                  onClick={() => handleStatusChange(filial.id, 'inativo')}
                  className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Desativar Filial
                </button>
              )}
              {filial.status === 'reprovado' && (
                <button
                  onClick={() => handleStatusChange(filial.id, 'ativo')}
                  className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-gold hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <ShieldCheck size={12} /> Re-homologar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </main>
  );
}
