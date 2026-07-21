'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarDays, Users, Trophy, TrendingUp,
  Clock, ArrowUpRight, Zap, Loader2,
  Building2, UserCheck, Settings, ShieldCheck,
  Star, Lock, Newspaper, ChevronRight,
  Activity, BarChart3, Award, QrCode, Medal,
  FileWarning, DollarSign, CreditCard, History,
  GraduationCap, CheckCircle2, MapPin, Flame, ClipboardCheck,
  AlertTriangle, Download
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

import { FAIXAS, CORES_FAIXAS, obterEstiloFaixa } from '@/constants/faixas';

function formatDate(iso: string) {
  if (!iso) return 'A definir';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs text-zinc-500 font-bold tracking-[0.2em] uppercase font-cinzel">Carregando painel...</p>
      </div>
    </div>
  );
}

/* --- Stat Card --- */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: 'brand' | 'gold' | 'blue' | 'green';
  loading: boolean;
}

function StatCard({ label, value, icon: Icon, color, loading }: StatCardProps) {
  const styles = {
    brand: { iconBg: 'bg-red-500/15', icon: 'text-red-500', val: 'text-white', glow: 'hover:border-red-500/30' },
    gold: { iconBg: 'bg-gold/15', icon: 'text-gold', val: 'text-white', glow: 'hover:border-gold/30' },
    blue: { iconBg: 'bg-cobalt-500/15', icon: 'text-cobalt-400', val: 'text-white', glow: 'hover:border-cobalt-500/30' },
    green: { iconBg: 'bg-emerald-500/15', icon: 'text-emerald-400', val: 'text-white', glow: 'hover:border-emerald-500/30' },
  }[color];

  return (
    <div className={`relative bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 ${styles.glow} transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${styles.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <BarChart3 className="w-4 h-4 text-zinc-650 group-hover:text-zinc-400 transition-colors" />
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-16 bg-zinc-800 rounded-xl animate-pulse mb-2" />
        ) : (
          <p className="text-2xl sm:text-3xl font-black text-white leading-none mb-1.5 font-cinzel">{value}</p>
        )}
        <p className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

/* --- Quick Action Item --- */
interface QuickItemProps {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  color: 'brand' | 'gold' | 'blue' | 'green';
}

function QuickItem({ label, href, icon: Icon, color }: QuickItemProps) {
  const styles = {
    brand: 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:border-red-500/40',
    gold: 'border-gold/20 bg-gold/5 hover:bg-gold/10 text-gold hover:border-gold/40',
    blue: 'border-cobalt-500/20 bg-cobalt-500/5 hover:bg-cobalt-500/10 text-cobalt-400 hover:border-cobalt-500/40',
    green: 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/40',
  }[color];

  return (
    <Link href={href} className={`flex flex-col items-center gap-2.5 py-4 px-3 sm:py-5 sm:px-4 rounded-2xl border transition-all duration-200 group hover:scale-[1.03] text-center ${styles}`}>
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-current/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 opacity-80">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors leading-tight">
        {label}
      </span>
    </Link>
  );
}

/* --- Empty Module --- */
function EmptySection({ icon: Icon, text, emBreve = false }: { icon: React.ComponentType<any>; text: string; emBreve?: boolean }) {
  return (
    <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6">
      <div className="flex flex-col items-center justify-center gap-3 text-center py-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center">
          <Icon className="w-5 h-5 text-zinc-600" />
        </div>
        <p className="text-xs text-zinc-400 font-medium">{text}</p>
        {emBreve && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-800 rounded-full px-2.5 py-0.5">
            <Lock size={9} /> Em breve
          </span>
        )}
      </div>
    </div>
  );
}

/* --- ADMIN DASHBOARD --- */

interface AnalyticsData {
  matriculas_por_mes: { mes: string; atletas: number }[];
  receita_por_mes: { mes: string; receita: number; pendente: number }[];
  distribuicao_faixas: { faixa: string; total: number }[];
  frequencia_por_filial: { filial: string; treinos: number }[];
  kpis: {
    variacao_atletas_pct: number;
    variacao_receita_pct: number;
    taxa_adimplencia: number;
    taxa_aprovacao_exames: number;
    total_atletas: number;
    total_filiais: number;
  };
}

function VariacaoBadge({ pct }: { pct: number }) {
  const positivo = pct >= 0;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
      positivo ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
    }`}>
      {positivo ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  );
}function AdminDashboard({ usuario }: { usuario: any }) {
  const [stats, setStats] = useState({ activeAthletes: 0, openEvents: 0, pendingExams: 0, totalFiliais: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [resAtletas, resEventos, resExames, resFiliais] = await Promise.all([
          fetch(`${API_URL}/api/atletas`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/eventos`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/exames`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/filiais`, { credentials: 'include' }).then(r => r.ok ? r.json() : null)
        ]);
        setStats({
          activeAthletes: (resAtletas?.atletas || []).filter((a: any) => a.status === 'ativo').length,
          openEvents: (resEventos?.eventos || []).length,
          pendingExams: (resExames?.exames || []).filter((e: any) => e.status === 'publicado' || e.status === 'em_andamento').length,
          totalFiliais: (resFiliais?.filiais || []).length,
        });
      } catch (err) {
        console.error('Erro ao carregar stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <main className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 w-full">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-950/20 via-zinc-900 to-zinc-900 border border-red-900/20 rounded-3xl p-5 sm:p-8">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-red-650/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500/20 to-red-700/10 rounded-2xl flex items-center justify-center border border-red-500/25 shrink-0">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-red-400 font-bold uppercase tracking-[0.2em] mb-1">Painel do Administrador</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-cinzel">{usuario?.nome ?? 'Administrador'}</h1>
              <p className="text-xs text-zinc-400 mt-1">Associação Goju-Ryu Karatê-Kai</p>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center justify-center sm:justify-end gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 shrink-0">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-400">Sistema Online</span>
            </div>
            <p className="text-[10px] text-zinc-500 text-center sm:text-right">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[
          { label: 'Atletas Ativos', value: stats.activeAthletes, icon: Users, color: 'brand' as const, badge: null },
          { label: 'Eventos em Aberto', value: stats.openEvents, icon: CalendarDays, color: 'gold' as const, badge: null },
          { label: 'Exames Ativos', value: stats.pendingExams, icon: Trophy, color: 'blue' as const, badge: null },
          { label: 'Filiais Credenciadas', value: stats.totalFiliais, icon: Building2, color: 'green' as const, badge: null },
        ].map(({ label, value, icon: IconComp, color, badge }) => (
          <div key={label} className={`relative bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 transition-all duration-300 group
            ${{ brand: 'hover:border-red-500/30', gold: 'hover:border-gold/30', blue: 'hover:border-cobalt-500/30', green: 'hover:border-emerald-500/30' }[color]}`}>
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300
                ${{ brand: 'bg-red-500/15', gold: 'bg-gold/15', blue: 'bg-cobalt-500/15', green: 'bg-emerald-500/15' }[color]}`}>
                <IconComp className={`w-5 h-5 sm:w-5 sm:h-5 ${{ brand: 'text-red-500', gold: 'text-gold', blue: 'text-cobalt-400', green: 'text-emerald-400' }[color]}`} />
              </div>
              {badge}
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-16 bg-zinc-800 rounded-xl animate-pulse mb-2" />
              ) : (
                <p className="text-2xl sm:text-3xl font-black text-white leading-none mb-1.5 font-cinzel">{value}</p>
              )}
              <p className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}

      </div>


      {/* Ações Rápidas */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white font-cinzel">Ações Rápidas</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Acesso direto a todos os módulos do sistema</p>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
          <QuickItem label="Filiais" href="/filiais" icon={Building2} color="brand" />
          <QuickItem label="Atletas" href="/atletas" icon={Users} color="gold" />
          <QuickItem label="Frequência" href="/frequencia" icon={Activity} color="green" />
          <QuickItem label="Eventos" href="/eventos-dash" icon={CalendarDays} color="blue" />
          <QuickItem label="Notícias" href="/noticias" icon={Star} color="green" />
          <QuickItem label="Graduações" href="/exames" icon={Trophy} color="brand" />
          <QuickItem label="Financeiro" href="/financeiro" icon={CreditCard} color="gold" />
        </div>
      </div>


    </main>
  );
}

/* --- FILIAL DASHBOARD --- */
interface Aviso {
  id: string | number;
  titulo: string;
  conteudo: string;
  categoria: string;
  destinatario: 'todos' | 'filial' | 'atleta';
  created_at?: string;
}

function FilialDashboard({ usuario }: { usuario: any }) {
  const [stats, setStats] = useState({ totalAlunos: 0, alunosAtivos: 0, preAvaliacoes: 0 });
  const [loading, setLoading] = useState(true);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);

  useEffect(() => {
    async function loadFilialStats() {
      try {
        const res = await fetch(`${API_URL}/api/atletas`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const list = data.atletas || [];
          const total = list.length;
          const ativos = list.filter((a: any) => a.status === 'ativo').length;
          const pendentes = list.filter((a: any) => a.status === 'pendente').length;
          setStats({
            totalAlunos: total,
            alunosAtivos: ativos,
            preAvaliacoes: pendentes
          });
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas da filial:", err);
      } finally {
        setLoading(false);
      }
    }
    async function loadAvisos() {
      try {
        const res = await fetch(`${API_URL}/api/avisos`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAvisos(data || []);
        }
      } catch (err) {
        console.error("Erro ao carregar avisos:", err);
      } finally {
        setLoadingAvisos(false);
      }
    }
    loadFilialStats();
    loadAvisos();
  }, []);

  return (
    <main className="p-6 lg:p-10 space-y-8 w-full">
      <div className="relative overflow-hidden bg-gradient-to-br from-gold/10 via-zinc-900 to-zinc-900 border border-gold/20 rounded-3xl p-8">
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold-700/10 rounded-2xl flex items-center justify-center border border-gold/25 shrink-0">
            <Building2 className="w-8 h-8 text-gold" />
          </div>
          <div>
            <p className="text-xs text-gold font-bold uppercase tracking-[0.2em] mb-1">Painel do Dojo / Filial</p>
            <h1 className="text-3xl font-black text-white font-cinzel">{usuario?.nome ?? 'Filial Credenciada'}</h1>
            <p className="text-xs text-zinc-400 mt-1">Dojo filiado à GRKK</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard label="Total de Alunos" value={stats.totalAlunos} icon={Users} color="brand" loading={loading} />
        <StatCard label="Alunos Ativos" value={stats.alunosAtivos} icon={CheckCircle2} color="green" loading={loading} />
        <StatCard label="Pré-Avaliações" value={stats.preAvaliacoes} icon={FileWarning} color="gold" loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white font-cinzel mb-4">Avisos da Diretoria</h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {loadingAvisos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : avisos.length > 0 ? (
              avisos.map(aviso => (
                <div key={aviso.id} className="p-4 bg-zinc-950/60 border border-zinc-850 rounded-xl space-y-1.5 transition hover:border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                      {aviso.categoria}
                    </span>
                    {aviso.created_at && (
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {new Date(aviso.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white font-cinzel">{aviso.titulo}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{aviso.conteudo}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 italic py-4">Nenhum aviso no momento.</p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white font-cinzel mb-4">Próximas Graduações</h3>
          <EmptySection icon={GraduationCap} text="Nenhum exame agendado para o seu dojo." />
        </div>
      </div>
    </main>
  );
}

/* --- ATLETA DASHBOARD --- */
function AtletaDashboard({ usuario }: { usuario: any }) {
  const nome = usuario?.nome ?? 'Atleta';
  const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase();
  const cpfMask = usuario?.cpf ? usuario.cpf.replace(/(\d{3})\.\d{3}\.(\d{3})-(\d{2})/, '$1.***.***-$3') : '—';
  const regNum = usuario?.registro_federacao || usuario?.dados_atleta?.registro_federacao || (usuario?.id ? `GRKK-${usuario.id.slice(0, 8).toUpperCase()}` : '—');
  const faixa = usuario?.faixa || usuario?.dados_atleta?.faixa || 'Branca';
  const faixaIdx = FAIXAS.indexOf(faixa);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);
  const [presencas, setPresencas] = useState<any[]>([]);
  const [loadingPresencas, setLoadingPresencas] = useState(true);
  const [candidaturas, setCandidaturas] = useState<any[]>([]);
  const [loadingCandidaturas, setLoadingCandidaturas] = useState(true);
  const [inscricoesEventos, setInscricoesEventos] = useState<any[]>([]);
  const [loadingInscricoes, setLoadingInscricoes] = useState(true);
  const [certificados, setCertificados] = useState<any[]>([]);
  const [loadingCertificados, setLoadingCertificados] = useState(true);

  useEffect(() => {
    async function loadAvisos() {
      try {
        const res = await fetch(`${API_URL}/api/avisos`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAvisos(data || []);
        }
      } catch (err) {
        console.error("Erro ao carregar avisos:", err);
      } finally {
        setLoadingAvisos(false);
      }
    }

    async function loadPresencas() {
      try {
        const res = await fetch(`${API_URL}/api/presencas`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPresencas(data.presencas || []);
        }
      } catch (err) {
        console.error("Erro ao carregar presenças:", err);
      } finally {
        setLoadingPresencas(false);
      }
    }

    async function loadCandidaturas() {
      try {
        const res = await fetch(`${API_URL}/api/exames/candidatos`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const list = data.candidatos || [];
          const filtered = list.filter((cand: any) => {
            if (cand.status === 'aprovado' || cand.status === 'reprovado') {
              const dataResultado = cand.updated_at ? new Date(cand.updated_at) : (cand.created_at ? new Date(cand.created_at) : new Date());
              const diffHoras = (new Date().getTime() - dataResultado.getTime()) / (1000 * 60 * 60);
              return diffHoras <= 72;
            }
            return true;
          });
          setCandidaturas(filtered);
        }
      } catch (err) {
        console.error("Erro ao carregar exames:", err);
      } finally {
        setLoadingCandidaturas(false);
      }
    }

    async function loadInscricoes() {
      try {
        const res = await fetch(`${API_URL}/api/eventos/inscricoes`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setInscricoesEventos(data.inscricoes || []);
        }
      } catch (err) {
        console.error("Erro ao carregar eventos:", err);
      } finally {
        setLoadingInscricoes(false);
      }
    }

    async function loadCertificados() {
      try {
        const res = await fetch(`${API_URL}/api/documentos-assinados`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const signed = (data.documentos || []).filter((d: any) => d.status === 'assinado');
          setCertificados(signed);
        }
      } catch (err) {
        console.error("Erro ao carregar certificados:", err);
      } finally {
        setLoadingCertificados(false);
      }
    }

    loadAvisos();
    loadPresencas();
    loadCandidaturas();
    loadInscricoes();
    loadCertificados();
  }, []);

  const metasTreinos: Record<string, number> = {
    'Branca': 24,
    'Branca/Amarela': 24,
    'Amarela': 32,
    'Amarela/Laranja': 32,
    'Laranja': 32,
    'Laranja/Verde': 32,
    'Verde': 48,
    'Verde/Azul': 48,
    'Azul': 56,
    'Azul/Vermelha': 64,
    'Vermelha': 72,
    'Marrom': 80,
    'Marrom I': 88,
    'Marrom II': 96,
  };
  const metaAtual = metasTreinos[faixa] || 24;
  const treinosRealizados = presencas.filter((p: any) => p.status === 'presente').length;
  const progresso = Math.min(100, Math.round((treinosRealizados / metaAtual) * 100));

  return (
    <main className="p-6 lg:p-10 space-y-8 w-full">
      <div>
        <p className="text-xs text-cobalt-400 font-bold uppercase tracking-[0.2em]">Área do Aluno</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1 leading-tight font-cinzel">{nome}</h1>
        <p className="text-xs text-zinc-400 mt-1.5">Matrícula ativa na Associação Goju-Ryu Karatê-Kai</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Carteirinha Digital */}
        <div className="xl:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 flex items-center gap-2">
            <CreditCard size={11} /> Carteirinha Digital
          </p>
          <div
            className="relative overflow-hidden rounded-2xl group hover:-translate-y-1 transition-all duration-400"
            style={{
              background: 'linear-gradient(135deg, #09090b 0%, #17171c 100%)',
              border: '1px solid rgba(200, 169, 110, 0.2)',
              minHeight: '180px',
            }}
          >
            <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
            <div className="relative z-10 p-6">
              <div className="flex items-start justify-between mb-7">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-gold rounded-full flex items-center justify-center shrink-0">
                    <span className="font-cinzel text-gold text-xs font-bold">GR</span>
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-gold/80">Associação</p>
                    <p className="text-base font-black text-white tracking-wider leading-none mt-0.5 font-cinzel">GOJU-RYU KARATÊ-KAI</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Ativo</span>
                </div>
              </div>

              <div className="flex items-end gap-5">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 font-cinzel font-black text-2xl text-gold">
                  {iniciais}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-black text-white truncate mb-3 font-cinzel">{nome}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {[
                      { label: 'Registro', value: regNum },
                      { label: 'CPF', value: cpfMask },
                      { label: 'Filial', value: usuario?.filial_nome ?? 'Dojo Central' },
                      { label: 'Faixa', value: faixa },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-xs font-mono font-bold text-zinc-300 truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-14 h-14 bg-white border border-zinc-850 rounded-xl flex items-center justify-center shrink-0 p-0.5 overflow-hidden">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&color=09090b&margin=0&data=${encodeURIComponent(
                      typeof window !== 'undefined' 
                        ? `${window.location.origin}/transparencia/validar-certificado?codigo=${usuario?.id}`
                        : `https://gojuryukaratekai.com.br/transparencia/validar-certificado?codigo=${usuario?.id}`
                    )}`}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
            <div className="relative z-10 px-6 py-3 border-t border-zinc-900 bg-black/10 flex items-center justify-between">
              <p className="text-[8px] text-zinc-500 uppercase tracking-[0.15em]">Válido com verificação digital · gojuryukaratekai.com.br</p>
              <p className="text-[8px] font-mono text-zinc-500">GRKK · {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>

        {/* Graduação de Faixa */}
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 hover:border-gold/30 transition-all duration-300">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-1.5">
              <Medal size={11} /> Graduação
            </p>
            <div>
              <div className="flex items-center gap-3 mb-3">
                {(() => {
                  const est = obterEstiloFaixa(faixa);
                  return (
                    <div className={`w-12 h-4 rounded-full relative overflow-hidden border ${est.bg} ${est.border}`}>
                      {est.centerStripe && (
                        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 ${est.centerStripe}`} />
                      )}
                      {est.tipStripe && (
                        <div className={`absolute right-0 top-0 bottom-0 w-1.5 ${est.tipStripe}`} />
                      )}
                    </div>
                  );
                })()}
                <span className="font-bold text-white font-cinzel">{faixa}</span>
              </div>
              <div className="flex gap-1 mb-2">
                {FAIXAS.map((f, i) => (
                  <div key={f} title={f} className={`flex-1 h-2 rounded-full transition-all ${i <= faixaIdx ? 'bg-gold' : 'bg-zinc-800'}`} />
                ))}
              </div>
              <p className="text-[11px] text-zinc-500">
                {faixaIdx < FAIXAS.length - 1 ? `Próxima graduação: ${FAIXAS[faixaIdx + 1]}` : 'Graduação máxima'}
              </p>
            </div>
          </div>

          {/* Frequência de Treinos */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 hover:border-primary/30 transition-all duration-300">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ClipboardCheck size={11} className="text-primary" /> Frequência de Treinos
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">{treinosRealizados}/{metaAtual} treinos</span>
            </p>
            
            {loadingPresencas ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Progresso para Exame</span>
                  <span className="font-mono font-bold text-white">{progresso}%</span>
                </div>
                
                {/* Barra de Progresso */}
                <div className="w-full h-2.5 bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-gold rounded-full transition-all duration-500"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                
                <p className="text-[10px] text-zinc-500 leading-normal">
                  {progresso >= 100 
                    ? "🎉 Frequência mínima atingida! Você cumpre a carência de treinos para exame."
                    : `Faltam mais ${Math.max(0, metaAtual - treinosRealizados)} presenças para estar apto técnica e estatisticamente.`}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Dojo</p>
              <p className="text-xs font-bold text-white truncate">{usuario?.filial_nome ?? 'Dojo Central'}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Status</p>
              <p className="text-xs font-bold text-emerald-400">Regular</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-xl ${usuario?.documentos_entregues ? 'bg-emerald-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
              <FileWarning className={`w-4 h-4 ${usuario?.documentos_entregues ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <p className="text-sm font-bold text-white font-cinzel">Pendências Documentais</p>
          </div>
          <p className={`text-xs ${usuario?.documentos_entregues ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-1.5`}>
            {usuario?.documentos_entregues ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} 
            {usuario?.documentos_entregues ? 'Sua documentação está em dia!' : 'Documentos obrigatórios pendentes de homologação!'}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white font-cinzel">Situação Financeira</p>
          </div>
          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Mensalidades em dia!
          </p>
        </div>
      </div>

      {/* Grid: Avisos & Exame de Graduação (Lado a Lado se houver exame agendado na mesma proporção) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Coluna de Avisos: Ocupa 1 coluna se houver Exame, ou 2 colunas se não houver */}
        <div className={`bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 ${candidaturas.length > 0 ? 'md:col-span-1' : 'md:col-span-2'}`}>
          <h3 className="text-sm font-bold text-white font-cinzel mb-4">Avisos da Diretoria</h3>
          <div className={`grid grid-cols-1 ${candidaturas.length > 0 ? '' : 'md:grid-cols-2'} gap-4`}>
            {loadingAvisos ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : avisos.length > 0 ? (
              avisos.map(aviso => (
                <div key={aviso.id} className="p-4 bg-zinc-950/60 border border-zinc-850 rounded-xl space-y-1.5 transition hover:border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                      {aviso.categoria}
                    </span>
                    {aviso.created_at && (
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {new Date(aviso.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white font-cinzel">{aviso.titulo}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{aviso.conteudo}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 italic py-4 col-span-full">Nenhum aviso no momento.</p>
            )}
          </div>
        </div>

        {/* Card 1: Exame de Graduação (Ocupa 1 coluna ao lado dos Avisos) */}
        {candidaturas.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 hover:border-gold/20 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-gold" />
                </div>
                <p className="text-sm font-bold text-white font-cinzel">Exame de Graduação</p>
              </div>
              
              {loadingCandidaturas ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 text-gold animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {candidaturas.map((cand, idx) => (
                    <div key={cand.id || idx} className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-1">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Inscrição em Exame</p>
                      <p className="text-xs font-bold text-white font-cinzel">{cand.exame_titulo || 'Exame de Faixa'}</p>
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-1">
                        <span>Faixa: <strong className="text-gold">{cand.faixa || '—'}</strong></span>
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px] ${
                          cand.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          cand.status === 'reprovado' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          cand.status === 'em_andamento' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-gold/10 text-gold border border-gold/20'
                        }`}>
                          {cand.status === 'pendente' || cand.status === 'inscrito' ? 'Inscrito' : 
                           cand.status === 'aprovado' ? 'Aprovado' : 
                           cand.status === 'reprovado' ? 'Reprovado' : 
                           'Em andamento'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Eventos e Certificados (Grid secundário abaixo) */}
      {((inscricoesEventos.length > 0) || (certificados.length > 0)) && (
        <div className={`grid grid-cols-1 md:grid-cols-${
          (inscricoesEventos.length > 0 ? 1 : 0) + 
          (certificados.length > 0 ? 1 : 0)
        } gap-5`}>
          {/* Card 2: Eventos */}
          {inscricoesEventos.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 hover:border-primary/20 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-white font-cinzel">Inscrições em Eventos</p>
                </div>
                
                {loadingInscricoes ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inscricoesEventos.map((ins, idx) => (
                      <div key={ins.id || idx} className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-1">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Inscrito no Evento</p>
                        <p className="text-xs font-bold text-white truncate font-cinzel">{ins.evento_titulo || 'Evento GRKK'}</p>
                        <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-1">
                          <span>Categoria: <strong className="text-white">{ins.categoria || 'Geral'}</strong></span>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">Confirmado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 3: Certificados */}
          {certificados.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 hover:border-emerald-500/20 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-white font-cinzel">Diplomas & Certificados</p>
                </div>
                
                {loadingCertificados ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {certificados.map((cert, idx) => (
                      <div key={cert.id || idx} className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-1.5 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{cert.tipo_documento === 'certificado' ? 'Certificado Oficial' : 'Documento Homologado'}</p>
                          <p className="text-xs font-bold text-white truncate font-cinzel">{cert.titulo}</p>
                        </div>
                        {cert.arquivo_url && (
                          <a href={cert.arquivo_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-gold hover:text-white uppercase tracking-wider transition-colors self-start">
                            <Download size={10} /> Baixar Arquivo
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/* --- CORE PAGE DIRECTIVE --- */
export default function HomeDashboardPage() {
  const { usuario, tipo, carregando } = useAuth();

  if (carregando) {
    return <PageLoader />;
  }

  // Renderiza conforme o papel ativo selecionado
  if (tipo === 'admin') {
    return <AdminDashboard usuario={usuario} />;
  }
  
  if (tipo === 'filial') {
    return <FilialDashboard usuario={usuario} />;
  }

  return <AtletaDashboard usuario={usuario} />;
}
