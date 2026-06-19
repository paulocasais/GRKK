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
  GraduationCap, CheckCircle2, MapPin, Flame
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const FAIXAS = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Vermelha', 'Preta'];

const BELT_STYLE: Record<string, string> = {
  Branca: 'bg-white border border-gray-300',
  Amarela: 'bg-yellow-400',
  Laranja: 'bg-orange-500',
  Verde: 'bg-green-600',
  Azul: 'bg-blue-600',
  Roxa: 'bg-purple-700',
  Marrom: 'bg-amber-800',
  Vermelha: 'bg-red-500',
  Preta: 'bg-zinc-900 border border-zinc-700',
};

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
    <div className={`relative bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-5 ${styles.glow} transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${styles.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${styles.icon}`} />
        </div>
        <BarChart3 className="w-4 h-4 text-zinc-650 group-hover:text-zinc-400 transition-colors" />
      </div>
      <div>
        {loading ? (
          <div className="h-9 w-16 bg-zinc-800 rounded-xl animate-pulse mb-2" />
        ) : (
          <p className="text-3xl font-black text-white leading-none mb-1.5 font-cinzel">{value}</p>
        )}
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
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
    <Link href={href} className={`flex flex-col items-center gap-3 py-5 px-4 rounded-2xl border transition-all duration-200 group hover:scale-[1.03] text-center ${styles}`}>
      <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 opacity-80">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors leading-tight">
        {label}
      </span>
    </Link>
  );
}

/* --- Empty Module --- */
function EmptySection({ icon: Icon, text }: { icon: React.ComponentType<any>; text: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex flex-col items-center justify-center gap-3 text-center py-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center">
          <Icon className="w-5 h-5 text-zinc-600" />
        </div>
        <p className="text-xs text-zinc-400 font-medium">{text}</p>
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-800 rounded-full px-2.5 py-0.5">
          <Lock size={9} /> Em breve
        </span>
      </div>
    </div>
  );
}

/* --- ADMIN DASHBOARD --- */
function AdminDashboard({ usuario }: { usuario: any }) {
  const [stats, setStats] = useState({ activeAthletes: 0, openEvents: 0, pendingExams: 0, filiationsThisMonth: 0 });
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

        const totalAtletas = resAtletas?.atletas?.filter((a: any) => a.status === 'ativo').length || 0;
        const totalEventos = resEventos?.eventos?.length || 0;
        const totalExames = resExames?.exames?.filter((e: any) => e.status === 'publicado' || e.status === 'em_andamento').length || 0;
        const totalFiliais = resFiliais?.filiais?.length || 0;

        setStats({
          activeAthletes: totalAtletas,
          openEvents: totalEventos,
          pendingExams: totalExames,
          filiationsThisMonth: totalFiliais
        });
      } catch (err) {
        console.error("Erro ao carregar estatísticas do admin:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <main className="p-6 lg:p-10 space-y-8 w-full">
      <div className="relative overflow-hidden bg-gradient-to-br from-red-950/20 via-zinc-900 to-zinc-900 border border-red-900/20 rounded-3xl p-8">
        <div className="relative z-10 flex items-center justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-700/10 rounded-2xl flex items-center justify-center border border-red-500/25 shrink-0">
              <ShieldCheck className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-red-400 font-bold uppercase tracking-[0.2em] mb-1">Painel do Administrador</p>
              <h1 className="text-3xl font-black text-white font-cinzel">{usuario?.nome ?? 'Administrador'}</h1>
              <p className="text-xs text-zinc-400 mt-1">Federação Baiana de Karatê Goju-Ryu</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 shrink-0">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">Sistema Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Atletas Ativos" value={stats.activeAthletes} icon={Users} color="brand" loading={loading} />
        <StatCard label="Eventos em Aberto" value={stats.openEvents} icon={CalendarDays} color="gold" loading={loading} />
        <StatCard label="Exames Pendentes" value={stats.pendingExams} icon={Trophy} color="blue" loading={loading} />
        <StatCard label="Filiações no Mês" value={stats.filiationsThisMonth} icon={TrendingUp} color="green" loading={loading} />
      </div>

      <div>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white font-cinzel">Ações Rápidas</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Acesso direto a todos os módulos do sistema</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <QuickItem label="Filiais" href="/filiais" icon={Building2} color="brand" />
          <QuickItem label="Atletas" href="/atletas" icon={Users} color="gold" />
          <QuickItem label="Eventos" href="/eventos-dash" icon={CalendarDays} color="blue" />
          <QuickItem label="Notícias" href="/noticias" icon={Star} color="green" />
          <QuickItem label="Exames" href="/exames" icon={Trophy} color="brand" />
          <QuickItem label="Financeiro" href="/financeiro" icon={CreditCard} color="gold" />
          <QuickItem label="Ranking" href="/ranking" icon={Medal} color="blue" />
        </div>
      </div>
    </main>
  );
}

/* --- FILIAL DASHBOARD --- */
function FilialDashboard({ usuario }: { usuario: any }) {
  const [stats, setStats] = useState({ totalAlunos: 0, alunosAtivos: 0, preAvaliacoes: 0 });
  const [loading, setLoading] = useState(true);

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
    loadFilialStats();
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
          <div className="space-y-3">
            <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
              <p className="text-xs text-gold font-bold uppercase tracking-wider mb-1">Seminário Técnico</p>
              <p className="text-xs text-zinc-400 leading-relaxed">Prepare seus alunos graduados. O próximo gasshuku será em Julho.</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white font-cinzel mb-4">Próximos Exames</h3>
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
  const regNum = usuario?.id ? `GRKKK-${usuario.id.slice(0, 8).toUpperCase()}` : '—';
  const faixa = usuario?.faixa ?? 'Branca';
  const faixaIdx = FAIXAS.indexOf(faixa);

  return (
    <main className="p-6 lg:p-10 space-y-8 w-full">
      <div>
        <p className="text-xs text-cobalt-400 font-bold uppercase tracking-[0.2em]">Área do Aluno</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1 leading-tight font-cinzel">{nome}</h1>
        <p className="text-xs text-zinc-400 mt-1.5">Matrícula ativa na Federação Baiana de Karatê Goju-Ryu</p>
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
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-gold/80">Federação Baiana de</p>
                    <p className="text-base font-black text-white tracking-wider leading-none mt-0.5 font-cinzel">KARATÊ GOJU-RYU</p>
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
                <div className="w-14 h-14 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col items-center justify-center gap-1 shrink-0">
                  <QrCode className="w-6 h-6 text-zinc-500" />
                  <p className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider">QR</p>
                </div>
              </div>
            </div>
            <div className="relative z-10 px-6 py-3 border-t border-zinc-900 bg-black/10 flex items-center justify-between">
              <p className="text-[8px] text-zinc-500 uppercase tracking-[0.15em]">Válido com verificação digital · GRKKK.org.br</p>
              <p className="text-[8px] font-mono text-zinc-500">GRKKK · {new Date().getFullYear()}</p>
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
                <div className={`w-12 h-4 rounded-full ${BELT_STYLE[faixa] ?? 'bg-zinc-800'}`} />
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
        {[
          { icon: FileWarning, title: 'Pendências Documentais', msg: 'Sua documentação está em dia!' },
          { icon: DollarSign, title: 'Situação Financeira', msg: 'Mensalidades em dia!' }
        ].map(({ icon: Icon, title, msg }) => (
          <div key={title} className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-white font-cinzel">{title}</p>
            </div>
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> {msg}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <EmptySection icon={GraduationCap} text="Nenhum exame de faixa agendado." />
        <EmptySection icon={CalendarDays} text="Você não está inscrito em eventos." />
        <EmptySection icon={Award} text="Nenhum certificado emitido para este perfil." />
      </div>
    </main>
  );
}

/* --- CORE PAGE DIRECTIVE --- */
export default function HomeDashboardPage() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <PageLoader />;
  }

  // Renderiza conforme o papel logado
  if (usuario?.tipo === 'admin') {
    return <AdminDashboard usuario={usuario} />;
  }
  
  if (usuario?.tipo === 'filial') {
    return <FilialDashboard usuario={usuario} />;
  }

  return <AtletaDashboard usuario={usuario} />;
}
