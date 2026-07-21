'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Menu, Bell, ArrowUpRight, Check, AlertCircle, Clock, 
  CreditCard, Award, UserCheck, Building2, Sparkles, ChevronRight, RefreshCw 
} from 'lucide-react';
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

interface ResolvedNotif {
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  tagLabel: string;
  route: string | null;
  actionLabel: string | null;
}

function resolveNotificationDetails(n: Notificacao, userType: string | null): ResolvedNotif {
  const text = `${n.titulo} ${n.mensagem}`.toLowerCase();
  
  // 1. Financeiro
  if (text.includes('fatura') || text.includes('pagamento') || text.includes('cobrança') || text.includes('mensalidade')) {
    return {
      icon: <CreditCard size={12} className="text-amber-400" />,
      colorClass: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
      bgClass: 'bg-amber-500/[0.02] hover:bg-amber-500/[0.05]',
      tagLabel: 'Financeiro',
      route: '/financeiro',
      actionLabel: 'Ver Faturas'
    };
  }
  
  // 2. Exames de Faixa
  if (text.includes('exame') || text.includes('banca') || text.includes('graduação') || text.includes('faixa') || text.includes('candidato')) {
    return {
      icon: <Award size={12} className="text-emerald-400" />,
      colorClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
      bgClass: 'bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]',
      tagLabel: 'Exame',
      route: '/exames',
      actionLabel: 'Ver Exames'
    };
  }

  // 3. Filiais
  if (text.includes('filial') || text.includes('dojo') || text.includes('credenciamento')) {
    const route = userType === 'admin' ? '/filiais' : '/home';
    return {
      icon: <Building2 size={12} className="text-blue-400" />,
      colorClass: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
      bgClass: 'bg-blue-500/[0.02] hover:bg-blue-500/[0.05]',
      tagLabel: 'Filial',
      route,
      actionLabel: userType === 'admin' ? 'Ver Filiais' : 'Ver Painel'
    };
  }

  // 4. Atletas
  if (text.includes('atleta') || text.includes('homologado') || text.includes('cadastro')) {
    const route = userType === 'admin' ? '/atletas' : '/home';
    return {
      icon: <UserCheck size={12} className="text-indigo-400" />,
      colorClass: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
      bgClass: 'bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05]',
      tagLabel: 'Atleta',
      route,
      actionLabel: userType === 'admin' ? 'Gerenciar Atletas' : 'Ver Carteirinha'
    };
  }

  // 5. Sensei IA
  if (text.includes('sensei') || text.includes('ia') || text.includes('chat') || text.includes('pergunta')) {
    return {
      icon: <Sparkles size={12} className="text-purple-400 animate-pulse" />,
      colorClass: 'text-purple-400 border-purple-500/20 bg-purple-500/10',
      bgClass: 'bg-purple-500/[0.02] hover:bg-purple-500/[0.05]',
      tagLabel: 'Sensei IA',
      route: '/sensei-ia',
      actionLabel: 'Falar com IA'
    };
  }

  // Fallbacks baseados no n.tipo original
  if (n.tipo === 'sucesso') {
    return {
      icon: <Check size={12} className="text-emerald-400" />,
      colorClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
      bgClass: 'hover:bg-white/[0.01]',
      tagLabel: 'Sucesso',
      route: null,
      actionLabel: null
    };
  }

  if (n.tipo === 'alerta') {
    return {
      icon: <AlertCircle size={12} className="text-red-400" />,
      colorClass: 'text-red-400 border-red-500/20 bg-red-500/10',
      bgClass: 'hover:bg-white/[0.01]',
      tagLabel: 'Alerta',
      route: null,
      actionLabel: null
    };
  }

  return {
    icon: <Bell size={12} className="text-zinc-400" />,
    colorClass: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10',
    bgClass: 'hover:bg-white/[0.01]',
    tagLabel: 'Geral',
    route: null,
    actionLabel: null
  };
}

export default function DashTopBar({ onMenuOpen }: DashTopBarProps) {
  const { usuario, isAdmin, isFilial, isAtleta, isPerfilUnificado, alternarPerfil, tipo } = useAuth();
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
      const mockData = [
        {
          id: 'mock-1',
          titulo: "Fatura de Mensalidade Pendente",
          mensagem: "Sua taxa de anuidade da GRKK está em aberto. Regularize seu status financeiro.",
          tipo: "alerta" as const,
          lida: false,
          created_at: new Date(Date.now() - 600000).toISOString()
        },
        {
          id: 'mock-2',
          titulo: "Exame de Faixa Agendado",
          mensagem: "Próxima graduação oficial agendada. Certifique-se de cumprir a carência de treinos.",
          tipo: "info" as const,
          lida: false,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'mock-3',
          titulo: "Conselho do Sensei IA",
          mensagem: "Dicas de treino para o Kata Sanchin: concentre-se na base e na respiração Ibuki.",
          tipo: "sucesso" as const,
          lida: true,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      // Adiciona notificações específicas por perfil
      if (tipo === 'admin') {
        mockData.unshift({
          id: 'mock-admin-1',
          titulo: "Nova Solicitação de Filial",
          mensagem: "A filial 'Dojo Salvador Centro' solicitou homologação de credenciamento.",
          tipo: "info" as const,
          lida: false,
          created_at: new Date().toISOString()
        });
      } else if (tipo === 'atleta') {
        mockData.unshift({
          id: 'mock-atleta-1',
          titulo: "Cadastro de Atleta Homologado",
          mensagem: "Sua ficha cadastral e filiação da GRKK foram aprovadas com sucesso.",
          tipo: "sucesso" as const,
          lida: false,
          created_at: new Date().toISOString()
        });
      }

      setNotifs(mockData);
    }
  };

  useEffect(() => {
    carregarNotificacoes();
    const interval = setInterval(carregarNotificacoes, 20000);
    return () => clearInterval(interval);
  }, [usuario]);

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

  const handleNotifClick = async (n: Notificacao) => {
    if (!n.lida) {
      await marcarComoLida(n.id);
    }
    const details = resolveNotificationDetails(n, usuario?.tipo || null);
    if (details.route) {
      router.push(details.route);
      setIsOpen(false);
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
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full border border-zinc-950 shadow-md select-none pointer-events-none animate-pulse">
              {totalNaoLidas}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Estilo para Scrollbar Premium */}
            <style dangerouslySetInnerHTML={{__html: `
              .notifs-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .notifs-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .notifs-scrollbar::-webkit-scrollbar-thumb {
                background: #27272a;
                border-radius: 2px;
              }
              .notifs-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #3f3f46;
              }
            `}} />

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
            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/50 notifs-scrollbar">
              {notifs.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-650 mb-3">
                    <Bell size={18} />
                  </div>
                  <p className="text-xs font-semibold text-zinc-400">Nenhum aviso novo</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Você está atualizado com o sistema.</p>
                </div>
              ) : (
                notifs.map((n) => {
                  const details = resolveNotificationDetails(n, tipo || null);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`p-4 flex gap-3 cursor-pointer transition relative group ${
                        n.lida 
                          ? "bg-transparent hover:bg-white/[0.02] opacity-60" 
                          : `${details.bgClass} border-l-2 border-primary`
                      }`}
                    >
                      <div className="mt-0.5">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${details.colorClass}`}>
                          {details.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-xs font-bold leading-tight ${n.lida ? "text-zinc-400" : "text-white"}`}>{n.titulo}</p>
                          <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                            {new Date(n.created_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-450 mt-1 leading-relaxed line-clamp-2">{n.mensagem}</p>
                        
                        {/* Tag de Categoria e Botão de Ação */}
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border ${details.colorClass}`}>
                            {details.tagLabel}
                          </span>
                          {details.actionLabel && (
                            <span className="text-[8px] font-bold text-gold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {details.actionLabel} <ChevronRight size={10} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé com atalhos rápidos */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-around text-[10px] text-zinc-500">
              <button 
                onClick={() => { router.push('/financeiro'); setIsOpen(false); }}
                className="hover:text-white transition cursor-pointer flex items-center gap-1 font-semibold"
              >
                <CreditCard size={10} /> Financeiro
              </button>
              <span className="w-1 h-1 bg-zinc-850 rounded-full" />
              <button 
                onClick={() => { router.push('/exames'); setIsOpen(false); }}
                className="hover:text-white transition cursor-pointer flex items-center gap-1 font-semibold"
              >
                <Award size={10} /> Exames
              </button>
              <span className="w-1 h-1 bg-zinc-850 rounded-full" />
              <button 
                onClick={() => { router.push('/sensei-ia'); setIsOpen(false); }}
                className="hover:text-white transition cursor-pointer flex items-center gap-1 font-semibold"
              >
                <Sparkles size={10} /> Sensei IA
              </button>
            </div>
          </div>
        )}
      </div>

      {isPerfilUnificado && (
        <button
          onClick={alternarPerfil}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-gold-500/20 bg-gold-500/5 text-gold-400 hover:bg-gold-500/15 transition-all cursor-pointer font-bold"
          title={tipo === 'filial' ? 'Mudar para Atleta' : 'Mudar para Dojo'}
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline">
            {tipo === 'filial' ? 'Atleta' : 'Dojo'}
          </span>
        </button>
      )}

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
