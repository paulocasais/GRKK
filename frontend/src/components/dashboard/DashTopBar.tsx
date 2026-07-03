'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu, Bell, ArrowUpRight, Check, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { obterIniciais } from './Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Notificacao {
  id: string | number;
  titulo: string;
  mensagem: string;
  tipo: 'sucesso' | 'alerta' | 'info';
  lida: boolean;
  created_at: string;
}

interface DashTopBarProps {
  onMenuOpen: () => void;
}

export default function DashTopBar({ onMenuOpen }: DashTopBarProps) {
  const { usuario, isAdmin, isFilial, isAtleta } = useAuth();
  const router = useRouter();
  const nomeExibido = usuario?.nome ?? usuario?.name ?? "Usuário";
  const iniciais = obterIniciais(nomeExibido);

  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const carregarNotificacoes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notificacoes`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notificacoes || []);
      }
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
      // Fallback de notificações mock se a requisição falhar (modo offline)
      setNotifs([
        {
          id: 1,
          titulo: "Mensagem do Sensei",
          mensagem: "Lembre-se de treinar o Kata Sanchin diariamente.",
          tipo: "info",
          lida: false,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          titulo: "Cadastro Aprovado",
          mensagem: "Seu perfil de atleta foi homologado pela Associação.",
          tipo: "sucesso",
          lida: true,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
    }
  };

  useEffect(() => {
    carregarNotificacoes();
    const interval = setInterval(carregarNotificacoes, 20000);
    return () => clearInterval(interval);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalNaoLidas = notifs.filter((n) => !n.lida).length;

  const marcarComoLida = async (id: string | number) => {
    try {
      const res = await fetch(`${API_URL}/api/notificacoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ lida: true }),
      });
      if (res.ok) {
        setNotifs((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
      // Fallback local caso offline
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notificacoes`, {
        method: "PATCH",
        credentials: 'include',
      });
      if (res.ok) {
        setNotifs((prev) => prev.map((n) => ({ ...n, lida: true })));
      }
    } catch (err) {
      console.error(err);
      // Fallback local
      setNotifs((prev) => prev.map((n) => ({ ...n, lida: true })));
    }
  };

  const accentColor = isAdmin ? 'from-red-500 to-red-700' : isFilial ? 'from-gold-500 to-gold-700' : 'from-cobalt-500 to-cobalt-700';

  return (
    <header className="h-14 bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-900 flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-30">
      <button
        onClick={onMenuOpen}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.06] text-zinc-500 hover:text-white transition-all cursor-pointer"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1" />

      <button
        onClick={() => router.push('/')}
        className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer"
      >
        <ArrowUpRight size={12} /> Ver site
      </button>

      {/* Sino / Dropdown de Notificações */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
            isOpen ? "bg-white/[0.08] text-white" : "hover:bg-white/[0.06] text-zinc-500 hover:text-white"
          }`}
        >
          <Bell size={16} />
          {totalNaoLidas > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Header Dropdown */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">Notificações</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">{totalNaoLidas} novos alertas</p>
              </div>
              {totalNaoLidas > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="text-[10px] font-bold text-gold hover:text-gold-light transition cursor-pointer"
                >
                  Marcar todas lidas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/50">
              {notifs.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-650 mb-3">
                    <Bell size={18} />
                  </div>
                  <p className="text-xs font-semibold text-zinc-400">Nenhum aviso novo</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Você está atualizado com o sistema.</p>
                </div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.lida && marcarComoLida(n.id)}
                    className={`p-4 flex gap-3 cursor-pointer transition ${
                      n.lida ? "opacity-60 bg-transparent hover:bg-white/[0.01]" : "bg-gold/5 hover:bg-gold/10"
                    }`}
                  >
                    <div className="mt-0.5">
                      {n.tipo === "sucesso" ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                          <Check size={11} />
                        </div>
                      ) : n.tipo === "alerta" ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center border border-amber-500/20 text-amber-400">
                          <AlertCircle size={11} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-cobalt-500/15 flex items-center justify-center border border-cobalt-500/20 text-cobalt-400">
                          <Clock size={11} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-xs font-bold ${n.lida ? "text-zinc-350" : "text-white"}`}>{n.titulo}</p>
                        <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                          {new Date(n.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-450 mt-0.5 leading-relaxed">{n.mensagem}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
        <div className={`w-6 h-6 bg-gradient-to-br ${accentColor} rounded-lg flex items-center justify-center text-white text-[9px] font-black`}>
          {iniciais}
        </div>
        <span className="text-[13px] font-medium text-zinc-300 hidden sm:block truncate max-w-[110px]">
          {nomeExibido}
        </span>
      </div>
    </header>
  );
}
