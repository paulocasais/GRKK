'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Calendar, MapPin, Users, Award, Shield,
  UserCheck, HelpCircle, Building2, Loader2, AlertCircle,
  CheckCircle2, Plus, Zap
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Exame {
  id: string | number;
  titulo: string;
  descricao: string;
  data_exame: string;
  local: string;
  modalidade: string;
  faixa_alvo: string;
  taxa_valor?: number;
  status: 'rascunho' | 'publicado' | 'em_andamento' | 'concluido' | 'cancelado';
}

interface Candidato {
  id: string | number;
  exame_id: string | number;
  atleta_id: string;
  atleta_nome: string;
  filial_id: string;
  filial_nome: string;
  faixa_atual: string;
  graduacao_pretendida: string;
  status: 'pendente' | 'inscrito' | 'aprovado' | 'reprovado';
  autorizacao_tecnica: boolean;
  pagamento_status: 'pendente' | 'pago' | 'cancelado';
  avaliado_por?: string | null;
  dados_banca?: {
    criterios?: any[];
    nota_final?: number;
    observacoes?: string;
  };
}

interface Examinador {
  id: string;
  nome: string;
  email: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho:     { label: 'Rascunho',     color: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50' },
  publicado:    { label: 'Publicado',    color: 'bg-blue-950/40 text-blue-300 border border-blue-900/30' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-950/40 text-yellow-300 border border-yellow-900/30' },
  concluido:    { label: 'Concluído',    color: 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-950/40 text-red-400 border border-red-900/30' },
};

const PROXIMOS_STATUS: Record<string, string[]> = {
  rascunho:     ['publicado', 'cancelado'],
  publicado:    ['em_andamento', 'cancelado'],
  em_andamento: ['concluido', 'cancelado'],
  concluido:    [],
  cancelado:    [],
};

export default function ExameDetalheClient({ id: idProp }: { id: string }) {
  // Resolução de ID real para exportação estática (Apache/HostGator)
  let id = idProp;
  if (typeof window !== 'undefined' && (idProp === 'exame-1' || idProp === 'exame-2' || idProp === 'exame-3')) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'exames') {
      id = parts[1];
    }
  }

  const router = useRouter();
  const { usuario, tipo, isAdmin, carregando } = useAuth();
  const isExaminador = tipo === 'filial'; // Na GRKK, representantes de filial atuam como examinadores no tatame
  const isAtleta = tipo === 'atleta';

  const [exame, setExame] = useState<Exame | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [examinadoresVinculadosIds, setExaminadoresVinculadosIds] = useState<string[]>([]);
  
  // Todos os potenciais examinadores do sistema
  const [todosExaminadores, setTodosExaminadores] = useState<Examinador[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const carregarDados = async () => {
    try {
      const [resExame, resExaminadores] = await Promise.all([
        fetch(`${API_URL}/api/exames/${id}`, { credentials: 'include' }),
        fetch(`${API_URL}/api/examinadores`, { credentials: 'include' }).catch(() => null)
      ]);

      if (resExame.ok) {
        const data = await resExame.json();
        setExame(data.exame);
        setCandidatos(data.candidatos || []);
        setExaminadoresVinculadosIds(data.examinadores_ids || []);
      } else {
        router.push('/exames');
      }

      if (resExaminadores && resExaminadores.ok) {
        const data = await resExaminadores.json();
        setTodosExaminadores(data.examinadores || []);
      }
    } catch (err) {
      console.error(err);
      setNotif({ type: 'error', msg: 'Erro ao carregar dados do exame.' });
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
    carregarDados();
  }, [id, usuario, carregando]);

  const handleSalvarExaminadores = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    try {
      const res = await fetch(`${API_URL}/api/exames/${id}/examinadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ examinador_ids: examinadoresVinculadosIds })
      });

      if (!res.ok) throw new Error('Não foi possível salvar os examinadores.');
      setNotif({ type: 'success', msg: 'Examinadores vinculados atualizados com sucesso!' });
      carregarDados();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro ao vincular examinadores.' });
    }
  };

  const handleCheckboxChange = (exId: string, checked: boolean) => {
    if (checked) {
      setExaminadoresVinculadosIds([...examinadoresVinculadosIds, exId]);
    } else {
      setExaminadoresVinculadosIds(examinadoresVinculadosIds.filter(id => id !== exId));
    }
  };

  const handleAtualizarStatus = async (novoStatus: string) => {
    setNotif({ type: null, msg: '' });
    try {
      const res = await fetch(`${API_URL}/api/exames/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) throw new Error('Erro ao alterar status do exame.');
      setNotif({ type: 'success', msg: `Status do exame alterado para ${novoStatus}!` });
      carregarDados();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro ao alterar status.' });
    }
  };

  const handleEmitirCertificados = async () => {
    setNotif({ type: null, msg: '' });
    try {
      const res = await fetch(`${API_URL}/api/exames/${id}/certificados`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao emitir certificados.');
      setNotif({ type: 'success', msg: `Certificados gerados com sucesso para os atletas aprovados! (${data.emitidos} emitidos)` });
      carregarDados();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro ao emitir certificados.' });
    }
  };

  const handleExcluirExame = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este exame permanentemente? Todos os candidatos e examinadores vinculados serão removidos.")) {
      return;
    }
    
    setNotif({ type: null, msg: '' });
    try {
      const res = await fetch(`${API_URL}/api/exames/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir o exame.');
      
      router.push('/exames');
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro ao excluir exame.' });
    }
  };

  const handleConfirmarCandidato = async (candidatoId: string | number, novoStatus: 'inscrito' | 'pendente') => {
    try {
      const res = await fetch(`${API_URL}/api/exames/candidatos/${candidatoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) {
        setCandidatos(candidatos.map(c => c.id === candidatoId ? { ...c, status: novoStatus } : c));
        setNotif({ type: 'success', msg: novoStatus === 'inscrito' ? 'Candidato confirmado na fila de avaliação!' : 'Candidato movido de volta para pendente.' });
      } else {
        const data = await res.json();
        setNotif({ type: 'error', msg: data.error || 'Erro ao atualizar status.' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAprovacaoTecnica = async (candidatoId: string | number, aprovado: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/exames/candidatos/${candidatoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ autorizacao_tecnica: aprovado })
      });
      if (res.ok) {
        setCandidatos(candidatos.map(c => c.id === candidatoId ? { ...c, autorizacao_tecnica: aprovado } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAprovacaoAdministrativa = async (candidatoId: string | number, statusPagamento: 'pago' | 'pendente') => {
    try {
      const res = await fetch(`${API_URL}/api/exames/candidatos/${candidatoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pagamento_status: statusPagamento })
      });
      if (res.ok) {
        setCandidatos(candidatos.map(c => c.id === candidatoId ? { ...c, pagamento_status: statusPagamento } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-zinc-500 font-cinzel text-xs tracking-widest uppercase">Carregando detalhes do exame...</p>
      </div>
    );
  }

  if (!exame) return null;

  const cfg = statusConfig[exame.status] || { label: exame.status, color: 'bg-zinc-900 text-zinc-400' };
  const proximos = PROXIMOS_STATUS[exame.status] || [];
  const aprovados = candidatos.filter(c => c.status === 'aprovado').length;

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-zinc-900 pb-6">
        <div className="flex items-start gap-4">
          <Link href="/exames" className="p-2.5 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800 transition mt-1">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-white font-cinzel tracking-wider">{exame.titulo}</h2>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400 flex-wrap">
              <span className="flex items-center gap-1.5 font-mono">
                <Calendar size={13} className="text-zinc-500" /> 
                {exame.data_exame.includes('T') ? exame.data_exame.split('T')[0].split('-').reverse().join('/') : exame.data_exame.split('-').reverse().join('/')}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-zinc-500" /> {exame.local}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} className="text-zinc-500" /> {candidatos.length} atletas inscritos
              </span>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex gap-2 flex-wrap items-center">
          {exame.status === 'concluido' && isAdmin && (
            <button
              onClick={handleEmitirCertificados}
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold hover:text-white transition duration-300 font-cinzel cursor-pointer"
            >
              🏅 Emitir Certificados
            </button>
          )}

          {isAdmin && (exame.status === 'cancelado' || exame.status === 'rascunho') && (
            <button
              onClick={handleExcluirExame}
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-500 hover:text-white transition duration-300 font-cinzel cursor-pointer"
            >
              🗑 Excluir Exame
            </button>
          )}

          {isAdmin && proximos.map((s) => (
            <button
              key={s}
              onClick={() => handleAtualizarStatus(s)}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition font-cinzel uppercase tracking-wider cursor-pointer ${
                s === 'cancelado'
                  ? 'bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-900/20'
                  : 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-red-950/20'
              }`}
            >
              → {statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Notificações */}
      {notif.type && (
        <div className={`p-4 rounded-xl flex items-start gap-3 text-xs border ${
          notif.type === 'success' 
            ? 'bg-emerald-950/30 border-emerald-900/30 text-emerald-400' 
            : 'bg-red-950/30 border-red-900/30 text-red-400'
        }`}>
          {notif.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notif.msg}</span>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Modalidade', value: exame.modalidade },
          { label: 'Graduação Pretendida', value: exame.faixa_alvo },
          { label: 'Taxa de Inscrição', value: exame.taxa_valor ? `R$ ${Number(exame.taxa_valor).toFixed(2)}` : 'Gratuito' },
          { label: 'Aprovados', value: `${aprovados} / ${candidatos.length}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4 shadow-sm space-y-1">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
            <p className="font-bold text-white text-sm sm:text-base font-cinzel">{value}</p>
          </div>
        ))}
      </div>

      {/* Seção de Examinadores e Distribuição de Bancas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Vincular Examinadores (Apenas Admins) */}
        {isAdmin && ['rascunho', 'publicado', 'em_andamento'].includes(exame.status) && (
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-white mb-2 flex items-center gap-2 font-cinzel text-xs uppercase tracking-wider">
                <UserCheck size={15} className="text-primary" /> Vincular Examinadores
              </h3>
              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">Selecione os examinadores para julgar as apresentações. Cada banca avalia até 3 alunos ativos simultâneos.</p>
              
              <form id="form-examinadores" onSubmit={handleSalvarExaminadores} className="space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                  {todosExaminadores.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">Nenhum examinador cadastrado no sistema.</p>
                  ) : (
                    todosExaminadores.map((ex) => (
                      <label key={ex.id} className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={examinadoresVinculadosIds.includes(ex.id)}
                          onChange={(e) => handleCheckboxChange(ex.id, e.target.checked)}
                          className="rounded bg-zinc-950 border-zinc-800 text-primary focus:ring-primary w-4 h-4"
                        />
                        {ex.nome}
                      </label>
                    ))
                  )}
                </div>
              </form>
            </div>
            
            <button
              type="submit"
              form="form-examinadores"
              className="w-full text-center bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl transition text-xs uppercase tracking-wider font-cinzel cursor-pointer shadow-lg shadow-red-950/20"
            >
              Salvar Examinadores
            </button>
          </div>
        )}

        {/* Fila de Examinadores / Distribuição de Alunos */}
        <div className={`${isAdmin && ['rascunho', 'publicado', 'em_andamento'].includes(exame.status) ? 'md:col-span-2' : 'md:col-span-3'} bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 shadow-sm`}>
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 font-cinzel text-xs uppercase tracking-wider">
            <Shield size={15} className="text-primary" /> Distribuição de Bancas
          </h3>
          
          {examinadoresVinculadosIds.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              <HelpCircle size={24} className="mx-auto mb-2 opacity-30 text-primary" />
              Nenhum examinador vinculado a este exame.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {todosExaminadores.filter(ex => examinadoresVinculadosIds.includes(ex.id)).map((ex) => {
                const ativos = candidatos.filter(c => c.avaliado_por === ex.id && c.status === 'inscrito');
                const isCurrentUser = ex.id === usuario?.id;
                const canEvaluate = isAdmin || isCurrentUser;

                return (
                  <div key={ex.id} className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 space-y-3 hover:border-zinc-800 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-white text-xs sm:text-sm font-cinzel">{ex.nome}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Banca de Avaliação</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ativos.length >= 3 ? 'bg-red-950/30 text-red-400 border border-red-900/20' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/20'}`}>
                        {ativos.length} / 3 ativos
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-zinc-900 pt-2">
                      {ativos.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 italic py-1">Aguardando início ou sem alunos alocados...</p>
                      ) : (
                        ativos.map(cand => (
                          <div key={cand.id} className="flex justify-between items-center bg-zinc-900/40 px-3 py-2 border border-zinc-900 rounded-xl text-xs">
                            <span className="text-zinc-350 truncate max-w-[150px] font-medium">{cand.atleta_nome}</span>
                            {exame.status === 'em_andamento' && canEvaluate ? (
                              <Link
                                href={`/exames/${id}/avaliar/${cand.id}`}
                                className="text-[10px] font-bold text-primary hover:text-primary-light transition uppercase tracking-widest font-cinzel"
                              >
                                Avaliar →
                              </Link>
                            ) : (
                              <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">Em espera</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {isCurrentUser && exame.status === 'em_andamento' && (
                      <div className="pt-2 border-t border-zinc-900">
                        <Link
                          href={`/exames/${id}/avaliar-banca`}
                          className="flex items-center justify-center gap-1.5 w-full bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold py-2 rounded-xl transition border border-primary/20 text-[10px] uppercase tracking-widest font-cinzel text-center cursor-pointer"
                        >
                          <Zap size={10} className="animate-pulse" /> Banca Concorrente
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Homologações e Validações (Alunos e Filiais) */}
      {(isAdmin || isExaminador) && (
        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2' : ''} gap-6`}>
          {/* Homologação Técnica (Recomendação) */}
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2 font-cinzel text-xs uppercase tracking-wider">
              <Award size={15} className="text-primary" /> Homologação Técnica (Alunos)
            </h3>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              {isAdmin
                ? 'Autorize os alunos inscritos a irem para a banca de avaliação baseado em critérios técnicos.'
                : 'Autorize os alunos de sua filial a irem para a banca de avaliação baseado em critérios técnicos.'}
            </p>
            
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
              {candidatos.filter(c => isAdmin || c.filial_id === usuario?.id).length === 0 ? (
                <p className="text-xs text-zinc-600 italic py-4">Nenhum aluno para homologação técnica.</p>
              ) : (
                candidatos.filter(c => isAdmin || c.filial_id === usuario?.id).map((c) => (
                  <div key={c.id} className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-xl border border-zinc-900 text-xs">
                    <div>
                      <p className="font-semibold text-white">{c.atleta_nome}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{c.filial_nome}</p>
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 mt-1 rounded-md border ${
                        c.autorizacao_tecnica 
                          ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}>
                        {c.autorizacao_tecnica ? 'Autorizado' : 'Não Autorizado'}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAprovacaoTecnica(c.id, true)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition cursor-pointer hover:bg-emerald-950/20 ${
                          c.autorizacao_tecnica ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' : 'border-zinc-900 text-zinc-500'
                        }`}
                      >
                        Autorizar
                      </button>
                      <button
                        onClick={() => handleAprovacaoTecnica(c.id, false)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition cursor-pointer hover:bg-red-950/20 ${
                          !c.autorizacao_tecnica ? 'bg-red-950/20 border-red-800 text-red-400' : 'border-zinc-900 text-zinc-500'
                        }`}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Homologação Administrativa (Pagamento) - Exclusivo do Admin */}
          {isAdmin && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2 font-cinzel text-xs uppercase tracking-wider">
                <Building2 size={15} className="text-primary" /> Homologação Administrativa (Taxas)
              </h3>
              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">Valide se as taxas de inscrição correspondentes foram quitadas para homologar a inscrição.</p>
              
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                {candidatos.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic py-4">Nenhum aluno inscrito.</p>
                ) : (
                  candidatos.map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-xl border border-zinc-900 text-xs">
                      <div>
                        <p className="font-semibold text-white">{c.atleta_nome}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{c.filial_nome}</p>
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 mt-1 rounded-md border ${
                          c.pagamento_status === 'pago'
                            ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                            : 'bg-yellow-950/20 border-yellow-900/30 text-yellow-300'
                        }`}>
                          {c.pagamento_status === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAprovacaoAdministrativa(c.id, 'pago')}
                          className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition cursor-pointer hover:bg-emerald-950/20 ${
                            c.pagamento_status === 'pago' ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' : 'border-zinc-900 text-zinc-500'
                          }`}
                        >
                          Quitar
                        </button>
                        <button
                          onClick={() => handleAprovacaoAdministrativa(c.id, 'pendente')}
                          className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition cursor-pointer hover:bg-yellow-950/20 ${
                            c.pagamento_status === 'pendente' ? 'bg-yellow-950/20 border-yellow-800 text-yellow-300' : 'border-zinc-900 text-zinc-500'
                          }`}
                        >
                          Pendente
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabela Geral de Candidatos */}
      <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/10">
          <h3 className="font-bold text-white flex items-center gap-2 font-cinzel text-xs uppercase tracking-wider">
            <Users size={15} className="text-zinc-400" /> Fila e Status Geral de Inscrições
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-900 text-zinc-400 text-xs font-cinzel uppercase tracking-wider">
                <th className="px-6 py-3.5 font-bold">Candidato</th>
                <th className="px-6 py-3.5 font-bold hidden md:table-cell">Graduação</th>
                <th className="px-6 py-3.5 font-bold hidden lg:table-cell">Banca Designada</th>
                <th className="px-6 py-3.5 font-bold hidden lg:table-cell">Pagamento</th>
                <th className="px-6 py-3.5 font-bold">Resultado</th>
                <th className="px-6 py-3.5 text-right font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {candidatos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-500 italic text-xs font-cinzel tracking-wider">
                    Nenhum aluno inscrito neste exame ainda.
                  </td>
                </tr>
              ) : (
                candidatos.map((c) => {
                  const examinadorNome = todosExaminadores.find(ex => ex.id === c.avaliado_por)?.nome;
                  const canEvaluate = isAdmin || (isExaminador && c.avaliado_por === usuario?.id);

                  return (
                    <tr key={c.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white text-xs sm:text-sm font-cinzel">{c.atleta_nome}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{c.filial_nome}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-xs">
                        <p className="text-zinc-300 font-medium">{c.faixa_atual} → <strong className="text-gold font-normal">{c.graduacao_pretendida}</strong></p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-xs">
                        {examinadorNome ? (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <UserCheck size={12} className="text-primary" />
                            <span>{examinadorNome}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-600 italic">Fila de espera geral</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-xs">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          c.pagamento_status === 'pago' 
                            ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/20' 
                            : 'bg-yellow-950/30 text-yellow-300 border border-yellow-900/20'
                        }`}>
                          {c.pagamento_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          c.status === 'aprovado'
                            ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/20'
                            : c.status === 'reprovado'
                            ? 'bg-red-950/30 text-red-400 border border-red-900/20'
                            : c.status === 'inscrito'
                            ? 'bg-blue-950/30 text-blue-400 border border-blue-900/20'
                            : 'bg-zinc-900 text-zinc-450 border border-zinc-800'
                        }`}>
                          {c.status === 'pendente' ? 'Pendente' :
                           c.status === 'inscrito' ? 'Na Fila' :
                           c.status === 'aprovado' ? 'Aprovado' :
                           c.status === 'reprovado' ? 'Reprovado' : c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2 flex-wrap">
                          {c.status === 'aprovado' && c.dados_banca && (
                            <Link
                              href={`/exames/boletim/${c.id}`}
                              className="text-[10px] font-bold text-gold hover:text-gold-light transition uppercase tracking-wider font-cinzel"
                            >
                              Boletim
                            </Link>
                          )}

                          {/* Admin ou Filial Vinculada: Confirmar candidato pendente na fila */}
                          {(isAdmin || (isExaminador && c.filial_id === usuario?.id)) && c.status === 'pendente' && exame.status !== 'concluido' && exame.status !== 'cancelado' && (
                            <button
                              onClick={() => handleConfirmarCandidato(c.id, 'inscrito')}
                              className="text-[10px] font-bold bg-blue-900/30 hover:bg-blue-700 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg transition uppercase tracking-widest font-cinzel shadow-sm border border-blue-900/30 cursor-pointer"
                            >
                              ✓ Confirmar
                            </button>
                          )}

                          {/* Admin ou Filial Vinculada: Devolver candidato inscrito para pendente */}
                          {(isAdmin || (isExaminador && c.filial_id === usuario?.id)) && c.status === 'inscrito' && exame.status !== 'concluido' && exame.status !== 'cancelado' && (
                            <button
                              onClick={() => handleConfirmarCandidato(c.id, 'pendente')}
                              className="text-[10px] font-bold bg-zinc-900 hover:bg-zinc-700 text-zinc-400 hover:text-white px-2 py-1.5 rounded-lg transition uppercase tracking-widest font-cinzel border border-zinc-800 cursor-pointer"
                            >
                              ↩ Pendente
                            </button>
                          )}

                          {exame.status === 'em_andamento' && c.status === 'inscrito' && canEvaluate && (
                            <Link
                              href={`/exames/${id}/avaliar/${c.id}`}
                              className="text-[10px] font-bold bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg transition uppercase tracking-widest font-cinzel shadow-sm"
                            >
                              Avaliar
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}
