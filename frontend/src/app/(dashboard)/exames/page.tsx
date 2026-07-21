'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FAIXAS_INFANTIL, FAIXAS_ADULTO } from '@/constants/faixas';
import {
  Trophy, Plus, Calendar, MapPin, Loader2,
  AlertCircle, ClipboardList, CheckCircle2, ChevronRight
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

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho:     { label: 'Rascunho',     color: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50' },
  publicado:    { label: 'Publicado',    color: 'bg-blue-950/40 text-blue-300 border border-blue-900/30' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-950/40 text-yellow-300 border border-yellow-900/30' },
  concluido:    { label: 'Concluído',    color: 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-950/40 text-red-400 border border-red-900/30' },
};

export default function ExamesPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const isAtleta = tipo === 'atleta';

  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modais
  const [showNovoExameModal, setShowNovoExameModal] = useState(false);
  const [showInscricaoModal, setShowInscricaoModal] = useState(false);

  // Forms
  const [novoExameForm, setNovoExameForm] = useState({
    titulo: '',
    descricao: '',
    data_exame: '',
    local: 'Sede Central GRKK',
    modalidade: 'Karate Goju-Ryu',
    faixa_alvo: 'Amarela',
    taxa_valor: '50.00',
    status: 'rascunho' as const
  });

  const [inscricaoForm, setInscricaoForm] = useState({
    exame_id: '',
    graduacao_pretendida: 'Amarela'
  });

  const [carenciaInfo, setCarenciaInfo] = useState<{
    apto: boolean;
    idade: number;
    diferenca_meses: number;
    carencia_exigida: number;
    data_inicio_faixa: string;
    loading: boolean;
    error?: string;
  } | null>(null);

  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  useEffect(() => {
    if (!inscricaoForm.exame_id || !inscricaoForm.graduacao_pretendida || !usuario?.id) {
      setCarenciaInfo(null);
      return;
    }

    const verificarCarencia = async () => {
      setCarenciaInfo({ apto: true, idade: 15, diferenca_meses: 0, carencia_exigida: 0, data_inicio_faixa: '', loading: true });
      try {
        const res = await fetch(
          `${API_URL}/api/exames/validar-carencia?exame_id=${inscricaoForm.exame_id}&graduacao_pretendida=${inscricaoForm.graduacao_pretendida}&atleta_id=${usuario.id}`,
          { credentials: 'include' }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao validar carência.');
        }
        const data = await res.json();
        setCarenciaInfo({
          apto: data.apto,
          idade: data.idade,
          diferenca_meses: data.diferenca_meses,
          carencia_exigida: data.carencia_exigida,
          data_inicio_faixa: data.data_inicio_faixa,
          loading: false
        });
      } catch (err: any) {
        console.error(err);
        setCarenciaInfo({
          apto: false,
          idade: 15,
          diferenca_meses: 0,
          carencia_exigida: 0,
          data_inicio_faixa: '',
          loading: false,
          error: err.message || 'Falha ao validar carência.'
        });
      }
    };

    verificarCarencia();
  }, [inscricaoForm.exame_id, inscricaoForm.graduacao_pretendida, usuario]);

  const carregarExames = async () => {
    try {
      const res = await fetch(`${API_URL}/api/exames`, { credentials: 'include' });
      if (!res.ok) throw new Error('Não foi possível carregar os exames.');
      const data = await res.json();
      setExames(data.exames || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao carregar exames.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarExames();
  }, []);

  const handleCriarExame = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    try {
      const payload = {
        ...novoExameForm,
        taxa_valor: parseFloat(novoExameForm.taxa_valor) || 0
      };

      const res = await fetch(`${API_URL}/api/exames`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao agendar exame.');

      setExames([data, ...exames]);
      setShowNovoExameModal(false);
      setNovoExameForm({
        titulo: '',
        descricao: '',
        data_exame: '',
        local: 'Sede Central GRKK',
        modalidade: 'Karate Goju-Ryu',
        faixa_alvo: 'Amarela',
        taxa_valor: '50.00',
        status: 'rascunho'
      });
      setNotif({ type: 'success', msg: 'Exame agendado com sucesso!' });
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Falha ao agendar exame.' });
    }
  };

  const handleInscreverAtleta = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    if (!inscricaoForm.exame_id) {
      setNotif({ type: 'error', msg: 'Selecione um exame válido.' });
      return;
    }

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
      if (!res.ok) throw new Error(data.error || 'Erro ao solicitar inscrição.');

      setShowInscricaoModal(false);
      setNotif({ type: 'success', msg: 'Inscrição enviada para aprovação!' });
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Falha ao realizar inscrição.' });
    }
  };

  const MODALIDADES = ['Karate Goju-Ryu', 'Kobudo', 'Defesa Pessoal'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-zinc-500 font-cinzel text-xs tracking-widest uppercase">Carregando exames de graduação...</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wider flex items-center gap-2.5">
            <Trophy className="text-primary" size={24} />
            Exames de Graduação
          </h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-semibold">
            Inscrições, cronograma e bancas de avaliação da federação
          </p>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowNovoExameModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-102 cursor-pointer shadow-lg shadow-red-950/20"
            >
              Novo Exame de Graduação
            </button>
          )}

          {isAtleta && (
            <button
              onClick={() => {
                const examesPublicados = exames.filter(e => e.status === 'publicado');
                if (examesPublicados.length > 0) {
                  setInscricaoForm(prev => ({ ...prev, exame_id: String(examesPublicados[0].id) }));
                }
                setShowInscricaoModal(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-102 cursor-pointer shadow-lg shadow-gold/10"
            >
              Solicitar Exame de Graduação
            </button>
          )}
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

      {/* Lista de Exames */}
      <div className="bg-zinc-950/40 rounded-2xl border border-zinc-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/20 text-zinc-400 text-xs font-cinzel uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Exame</th>
                <th className="px-6 py-4 font-bold hidden md:table-cell">Data / Local</th>
                <th className="px-6 py-4 font-bold hidden lg:table-cell">Modalidade / Faixa</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {exames.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-zinc-500">
                    <ClipboardList size={32} className="mx-auto mb-3 opacity-30 text-primary" />
                    <p className="font-cinzel text-xs tracking-wider">Nenhum exame cadastrado no momento.</p>
                  </td>
                </tr>
              ) : (
                exames.map((exame) => {
                  const cfg = statusConfig[exame.status] || { label: exame.status, color: 'bg-zinc-900 text-zinc-400' };
                  return (
                    <tr key={exame.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-white font-cinzel tracking-wide">{exame.titulo}</p>
                        {exame.taxa_valor ? (
                          <p className="text-[11px] text-zinc-500 mt-0.5">Taxa: R$ {Number(exame.taxa_valor).toFixed(2)}</p>
                        ) : (
                          <p className="text-[11px] text-zinc-500 mt-0.5">Sem taxa associada</p>
                        )}
                      </td>
                      <td className="px-6 py-5 hidden md:table-cell space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-300 text-xs">
                          <Calendar size={13} className="text-zinc-500" />
                          {exame.data_exame.includes('T') ? exame.data_exame.split('T')[0].split('-').reverse().join('/') : exame.data_exame.split('-').reverse().join('/')}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                          <MapPin size={12} />
                          {exame.local}
                        </div>
                      </td>
                      <td className="px-6 py-5 hidden lg:table-cell text-xs space-y-1">
                        <p className="text-zinc-350">{exame.modalidade}</p>
                        <p className="text-zinc-500">Graduação: <strong className="text-gold font-normal">{exame.faixa_alvo || 'Todas as Faixas'}</strong></p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/exames/${exame.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold font-cinzel text-primary hover:text-primary-light transition-colors uppercase tracking-wider"
                        >
                          Ver Detalhes
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO EXAME (ADMIN) */}
      {showNovoExameModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-xl p-6 sm:p-8 space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Glowing red accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white font-cinzel tracking-wider">Novo Exame de Graduação</h3>
                <p className="text-xs text-zinc-500 mt-1">Cadastre um exame de graduação no sistema. Ele será criado como rascunho.</p>
              </div>
              <button 
                onClick={() => setShowNovoExameModal(false)}
                className="w-8 h-8 rounded-xl bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-white border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCriarExame} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Título do Exame de Graduação *</label>
                <input
                  type="text" required
                  placeholder="Ex: Exame de Faixas Coloridas - Salvador"
                  value={novoExameForm.titulo}
                  onChange={(e) => setNovoExameForm({ ...novoExameForm, titulo: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl text-white text-xs focus:outline-none focus:border-primary placeholder-zinc-650"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Descrição</label>
                <textarea
                  placeholder="Instruções e avisos para os atletas candidatos..."
                  value={novoExameForm.descricao}
                  onChange={(e) => setNovoExameForm({ ...novoExameForm, descricao: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl text-white text-xs focus:outline-none focus:border-primary placeholder-zinc-650 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Data do Exame *</label>
                  <input
                    type="date" required
                    value={novoExameForm.data_exame}
                    onChange={(e) => setNovoExameForm({ ...novoExameForm, data_exame: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Local *</label>
                  <input
                    type="text" required
                    placeholder="Ex: Sede Central GRKK"
                    value={novoExameForm.local}
                    onChange={(e) => setNovoExameForm({ ...novoExameForm, local: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl text-white text-xs focus:outline-none focus:border-primary placeholder-zinc-650"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Modalidade *</label>
                  <select
                    value={novoExameForm.modalidade}
                    onChange={(e) => setNovoExameForm({ ...novoExameForm, modalidade: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                  >
                    {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Faixa Alvo *</label>
                  <select
                    value={novoExameForm.faixa_alvo}
                    onChange={(e) => setNovoExameForm({ ...novoExameForm, faixa_alvo: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="Todas">Todas as Faixas</option>
                    <optgroup label="── Divisão Infantil ──">
                      {FAIXAS_INFANTIL.map(f => <option key={`inf-${f}`} value={f}>{f}</option>)}
                    </optgroup>
                    <optgroup label="── Divisão Adulto ──">
                      {FAIXAS_ADULTO.map(f => <option key={`adu-${f}`} value={f}>{f}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Taxa de Inscrição (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    placeholder="50.00"
                    value={novoExameForm.taxa_valor}
                    onChange={(e) => setNovoExameForm({ ...novoExameForm, taxa_valor: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNovoExameModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-900 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:bg-primary-dark cursor-pointer shadow-lg shadow-red-950/20 font-cinzel"
                >
                  Criar Exame de Graduação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR GRADUAÇÃO (ATLETA) */}
      {showInscricaoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-md p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Glowing gold accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white font-cinzel tracking-wider">Solicitar Graduação</h3>
                <p className="text-xs text-zinc-500 mt-1">Inscreva-se em um exame de faixa publicado pela federação.</p>
              </div>
              <button 
                onClick={() => setShowInscricaoModal(false)}
                className="w-8 h-8 rounded-xl bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-white border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleInscreverAtleta} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Selecione o Exame *</label>
                <select
                  value={inscricaoForm.exame_id}
                  onChange={(e) => setInscricaoForm({ ...inscricaoForm, exame_id: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                >
                  <option value="">Selecione um exame...</option>
                  {exames.filter(e => e.status === 'publicado').map(e => (
                    <option key={e.id} value={e.id}>{e.titulo} ({e.data_exame.split('-').reverse().join('/')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Graduação Pretendida *</label>
                <select
                  value={inscricaoForm.graduacao_pretendida}
                  onChange={(e) => setInscricaoForm({ ...inscricaoForm, graduacao_pretendida: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                >
                  <optgroup label="── Divisão Infantil ──">
                    {FAIXAS_INFANTIL.map(f => <option key={`inf-${f}`} value={f}>{f}</option>)}
                  </optgroup>
                  <optgroup label="── Divisão Adulto ──">
                    {FAIXAS_ADULTO.map(f => <option key={`adu-${f}`} value={f}>{f}</option>)}
                  </optgroup>
                </select>
              </div>

              {/* Alerta de Carência */}
              {carenciaInfo && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  carenciaInfo.loading 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400' 
                    : carenciaInfo.error 
                    ? 'bg-red-950/20 border-red-900/30 text-red-400'
                    : carenciaInfo.apto
                    ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                    : 'bg-yellow-950/20 border-yellow-900/30 text-yellow-300'
                }`}>
                  {carenciaInfo.loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validando carência para faixa {inscricaoForm.graduacao_pretendida}...</span>
                    </div>
                  ) : carenciaInfo.error ? (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{carenciaInfo.error}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        {carenciaInfo.apto ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-300" />
                        )}
                        <span>{carenciaInfo.apto ? 'Apto para Exame' : 'Carência Mínima Pendente'}</span>
                      </div>
                      <p className="text-[11px] opacity-80 leading-relaxed">
                        Início da Faixa Atual: <strong>{carenciaInfo.data_inicio_faixa.split('T')[0].split('-').reverse().join('/')}</strong> ({carenciaInfo.diferenca_meses} meses de permanência).
                        <br />
                        Carência exigida para a {inscricaoForm.graduacao_pretendida}: <strong>{carenciaInfo.carencia_exigida} meses</strong>.
                        {!carenciaInfo.apto && (
                          <span className="block mt-1.5 font-bold text-red-400">
                            Faltam {carenciaInfo.carencia_exigida - carenciaInfo.diferenca_meses} meses para cumprir a carência mínima.
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInscricaoModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-900 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carenciaInfo?.loading || carenciaInfo?.apto === false}
                  className="px-6 py-2.5 bg-gold disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:bg-gold-dark cursor-pointer shadow-lg shadow-gold/15 font-cinzel"
                >
                  Inscrever-se
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
