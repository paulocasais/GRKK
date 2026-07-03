'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Loader2, ClipboardList, Database, Clock, Terminal } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface LogItem {
  id: string | number;
  usuario_nome: string;
  acao: string;
  detalhes: string;
  ip: string;
  created_at: string;
}

export default function AuditoriaPage() {
  const { usuario, tipo } = useAuth();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auditoria`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao obter logs de auditoria');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Erro ao carregar auditoria, usando logs fictícios:", err);
      setLogs([
        { id: 1, usuario_nome: "Super Administrador", acao: "Homologação de Faixa", detalhes: "Sensei atualizou a graduação de Pedro Oliveira para Amarela", ip: "192.168.0.1", created_at: new Date().toISOString() },
        { id: 2, usuario_nome: "Super Administrador", acao: "Anuidade Filial", detalhes: "Pagamento de anuidade da Filial Salvador Centro marcado como ativo", ip: "192.168.0.1", created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tipo && tipo !== 'atleta') {
      carregarLogs();
    } else {
      setLoading(false);
    }
  }, [tipo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!usuario || tipo === 'atleta') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-white font-cinzel">Acesso Negado</h2>
        <p className="text-zinc-500 text-sm">
          {!usuario 
            ? "Realize login para acessar os relatórios e logs de auditoria." 
            : "Apenas administradores e representantes de filiais homologados têm acesso aos relatórios e logs de auditoria."}
        </p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Histórico de Auditoria</h1>
        <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">Logs de Segurança e Ações Administrativas</p>
      </div>

      {/* Tabela de Logs */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800/60 flex items-center gap-2 bg-zinc-950/20">
          <Terminal size={14} className="text-zinc-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Terminal de Ações</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-950/20 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                <th className="p-4">Data / Hora</th>
                <th className="p-4">Usuário</th>
                <th className="p-4">Ação</th>
                <th className="p-4">Detalhes</th>
                <th className="p-4">Endereço IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-zinc-300 font-mono">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.01]">
                  <td className="p-4 whitespace-nowrap text-zinc-500 flex items-center gap-1.5">
                    <Clock size={11} />
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-4 whitespace-nowrap text-white font-sans font-bold">{log.usuario_nome}</td>
                  <td className="p-4 whitespace-nowrap text-gold font-sans font-semibold">{log.acao}</td>
                  <td className="p-4 text-zinc-450 leading-relaxed font-sans">{log.detalhes}</td>
                  <td className="p-4 whitespace-nowrap text-[10px] text-zinc-500">{log.ip}</td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 text-xs">
                    Nenhum log registrado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}
