'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart3, Users, CreditCard, Trophy, Download, 
  Printer, Calendar, Loader2, AlertCircle, ArrowUpRight,
  TrendingUp, Award, Building2, CheckCircle2, DollarSign,
  Clock
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface MetricasGerais {
  total_atletas: number;
  atletas_ativos: number;
  total_filiais: number;
  faturamento_total: number;
  faturamento_pendente: number;
  taxa_aprovacao_exames: number;
}

interface DadosFinanceiros {
  receita_por_tipo: Record<string, number>;
  cobrancas_por_status: Record<string, { quantidade: number; total: number }>;
  receitas_recentes: any[];
}

interface DadosAtletas {
  por_faixa: Record<string, number>;
  por_filial: Record<string, number>;
}

interface DadosExames {
  total_exames: number;
  exames_por_status: Record<string, number>;
  taxa_aprovacao_por_faixa: Record<string, number>;
  total_inscricoes_exames: number;
}

const TIPO_NOMES: Record<string, string> = {
  anuidade: 'Anuidades',
  mensalidade: 'Mensalidades de Filiais',
  exame: 'Taxas de Graduações',
  evento: 'Inscrições em Eventos',
  filiacao: 'Taxas de Filiação',
  outro: 'Outros'
};

const STATUS_NOMES: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado'
};

export default function RelatoriosPage() {
  const { usuario, tipo, carregando } = useAuth();
  const isAdmin = tipo === 'admin';

  const [activeTab, setActiveTab] = useState<'geral' | 'atletas' | 'financeiro' | 'exames'>('geral');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados dos dados dos relatórios
  const [geral, setGeral] = useState<MetricasGerais | null>(null);
  const [financeiro, setFinanceiro] = useState<DadosFinanceiros | null>(null);
  const [atletas, setAtletas] = useState<DadosAtletas | null>(null);
  const [exames, setExames] = useState<DadosExames | null>(null);

  // Filtros Financeiros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const carregarDadosRelatorios = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Métricas Gerais
      const resGeral = await fetch(`${API_URL}/api/relatorios/geral`, { credentials: 'include' });
      if (!resGeral.ok) throw new Error('Não foi possível carregar os relatórios.');
      const dataGeral = await resGeral.json();
      setGeral(dataGeral);

      // 2. Dados de Atletas
      const resAtletas = await fetch(`${API_URL}/api/relatorios/atletas`, { credentials: 'include' });
      if (resAtletas.ok) {
        const dataAtletas = await resAtletas.json();
        setAtletas(dataAtletas);
      }

      // 3. Dados de Exames
      const resExames = await fetch(`${API_URL}/api/relatorios/exames`, { credentials: 'include' });
      if (resExames.ok) {
        const dataExames = await resExames.json();
        setExames(dataExames);
      }

      // 4. Dados Financeiros com filtros
      await atualizarFinanceiro();

    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao conectar ao servidor para obter relatórios.');
      setGeral(null);
      setAtletas(null);
      setExames(null);
      setFinanceiro(null);
    } finally {
      setLoading(false);
    }
  };

  const atualizarFinanceiro = async () => {
    try {
      let queryUrl = `${API_URL}/api/relatorios/financeiro`;
      const params = [];
      if (dataInicio) params.push(`data_inicio=${dataInicio}`);
      if (dataFim) params.push(`data_fim=${dataFim}`);
      if (params.length > 0) queryUrl += `?${params.join('&')}`;

      const resFin = await fetch(queryUrl, { credentials: 'include' });
      if (resFin.ok) {
        const dataFin = await resFin.json();
        setFinanceiro(dataFin);
      }
    } catch (err) {
      console.error("Erro ao filtrar financeiro:", err);
    }
  };

  useEffect(() => {
    if (!carregando) {
      carregarDadosRelatorios();
    }
  }, [carregando]);

  const handlePrint = () => {
    window.print();
  };

  if (carregando || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-zinc-500 font-cinzel text-xs tracking-widest uppercase">Processando dados e agregando métricas...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold font-cinzel text-white">Acesso Não Autorizado</h2>
        <p className="text-zinc-400 text-sm">Este módulo contém dados sigilosos agregados de finanças, filiais e atletas. Acesso permitido exclusivamente para a Diretoria Administrativa.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto print:p-0 print:space-y-6">
      
      {/* Estilos CSS Print embutidos para garantir impressão limpa A4 */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          main {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          aside, header, nav, button, .no-print {
            display: none !important;
          }
          .card {
            border: 1px solid #ddd !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          .text-white {
            color: black !important;
          }
          .text-zinc-400, .text-zinc-500 {
            color: #555 !important;
          }
          .border-zinc-900, .border-zinc-800, .border-zinc-850 {
            border-color: #ddd !important;
          }
          .bg-zinc-950, .bg-zinc-900, .bg-zinc-900\/45, .bg-zinc-900\/40, .bg-black\/30 {
            background: transparent !important;
          }
          .print-block {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-900 pb-6 print:border-b-2 print:border-black print:pb-4">
        <div>
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider flex items-center gap-2">
            <BarChart3 className="text-primary w-6 h-6" /> Relatórios Gerenciais
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5 print:text-black">
            Balanços, desempenho esportivo e controle organizacional GRKK
          </p>
        </div>
        
        <div className="flex gap-2.5 no-print">
          <button
            onClick={carregarDadosRelatorios}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
          >
            Atualizar
          </button>
          
          <button
            onClick={handlePrint}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white shadow-lg shadow-red-950/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Navegação de Abas */}
      <nav className="flex gap-1.5 border-b border-zinc-900 pb-px overflow-x-auto no-print">
        {[
          { id: 'geral', label: 'Consolidado Geral', icon: TrendingUp },
          { id: 'atletas', label: 'Estatísticas de Atletas', icon: Users },
          { id: 'financeiro', label: 'Balanço Financeiro', icon: CreditCard },
          { id: 'exames', label: 'Desempenho de Graduações', icon: Trophy }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider font-cinzel rounded-t-xl transition-all duration-200 border-t border-x -mb-px cursor-pointer shrink-0 ${
                active 
                  ? 'bg-zinc-900/40 border-zinc-850 text-primary' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ABA: CONSOLIDADO GERAL */}
      {activeTab === 'geral' && geral && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Métricas Principais (Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2">
            
            <div className="card bg-zinc-900/45 border border-zinc-900 p-5 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Total de Atletas</span>
                <h3 className="text-3xl font-black text-white font-cinzel">{geral.total_atletas}</h3>
                <p className="text-[10px] text-zinc-400">{geral.atletas_ativos} homologados/ativos</p>
              </div>
              <div className="p-3 bg-red-500/10 text-primary border border-red-500/10 rounded-xl shrink-0">
                <Users size={20} />
              </div>
            </div>

            <div className="card bg-zinc-900/45 border border-zinc-900 p-5 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Faturamento Total</span>
                <h3 className="text-3xl font-black text-white font-cinzel">
                  {geral.faturamento_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
                <p className="text-[10px] text-emerald-400">Total arrecadado</p>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-xl shrink-0">
                <DollarSign size={20} />
              </div>
            </div>

            <div className="card bg-zinc-900/45 border border-zinc-900 p-5 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Faturamento Pendente</span>
                <h3 className="text-3xl font-black text-white font-cinzel">
                  {geral.faturamento_pendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
                <p className="text-[10px] text-amber-400">Pendente ou em atraso</p>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/10 rounded-xl shrink-0">
                <CreditCard size={20} />
              </div>
            </div>

            <div className="card bg-zinc-900/45 border border-zinc-900 p-5 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Taxa de Aprovação</span>
                <h3 className="text-3xl font-black text-white font-cinzel">{geral.taxa_aprovacao_exames}%</h3>
                <p className="text-[10px] text-blue-400">Média em graduações de faixa</p>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-xl shrink-0">
                <Trophy size={20} />
              </div>
            </div>

          </div>

          {/* Gráfico/Resumo de Filiais e Divisão Rápida */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
            
            {/* Resumo de Filiais */}
            <div className="card bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold font-cinzel tracking-wider text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Building2 size={16} className="text-primary" /> Filiais Credenciadas ({geral.total_filiais})
              </h2>
              {atletas && Object.keys(atletas.por_filial).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(atletas.por_filial).map(([filial, quantidade]) => {
                    const pct = Math.round((quantidade / geral.total_atletas) * 100);
                    return (
                      <div key={filial} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-zinc-300">{filial}</span>
                          <span className="text-zinc-400">{quantidade} atletas ({pct}%)</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-900">
                          <div 
                            className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-500 text-xs text-center py-6">Nenhuma filial cadastrada.</p>
              )}
            </div>

            {/* Informações de exames consolidadas */}
            <div className="card bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold font-cinzel tracking-wider text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Trophy size={16} className="text-primary" /> Resumo Histórico de Exames
              </h2>
              {exames ? (
                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">Total de Exames</span>
                    <span className="text-2xl font-black text-white font-cinzel">{exames.total_exames}</span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">Inscrições Processadas</span>
                    <span className="text-2xl font-black text-white font-cinzel">{exames.total_inscricoes_exames}</span>
                  </div>

                  <div className="col-span-2 bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">Aprovações de Faixa</span>
                      <span className="text-xs text-zinc-400">Total geral no Tatame</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-400 font-cinzel">{geral.taxa_aprovacao_exames}%</span>
                  </div>

                </div>
              ) : (
                <p className="text-zinc-500 text-xs text-center py-6">Nenhum exame cadastrado.</p>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ABA: ATLETAS */}
      {activeTab === 'atletas' && atletas && (
        <div className="space-y-8 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gráfico/Lista de Distribuição de Faixas */}
            <div className="lg:col-span-2 card bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl space-y-6">
              <div>
                <h2 className="text-sm font-bold font-cinzel tracking-wider text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <Award size={16} className="text-primary" /> Distribuição de Atletas por Faixa
                </h2>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-1">Total de praticantes cadastrados: {geral?.total_atletas}</p>
              </div>

              {Object.keys(atletas.por_faixa).length > 0 ? (
                <div className="space-y-3.5">
                  {Object.entries(atletas.por_faixa).map(([faixa, quantidade]) => {
                    const pct = geral ? Math.round((quantidade / geral.total_atletas) * 100) : 0;
                    return (
                      <div key={faixa} className="flex items-center gap-4 text-xs font-semibold">
                        <div className="w-28 text-zinc-300 truncate font-cinzel">{faixa}</div>
                        <div className="flex-1 bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-900 relative">
                          <div 
                            className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-16 text-right text-zinc-400 font-mono">
                          {quantidade} ({pct}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-500 text-xs text-center py-6">Nenhum dado de faixas disponível.</p>
              )}
            </div>

            {/* Listagem Consolidada por Dojo */}
            <div className="card bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold font-cinzel tracking-wider text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Building2 size={16} className="text-primary" /> Atletas Vinculados por Dojo
              </h2>

              <div className="space-y-3">
                {Object.entries(atletas.por_filial).map(([filial, quantidade]) => (
                  <div key={filial} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-300">{filial}</h4>
                      <p className="text-[9px] text-zinc-550 uppercase tracking-widest font-mono mt-0.5">Filial Credenciada</p>
                    </div>
                    <span className="text-sm font-bold text-white font-mono bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                      {quantidade}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ABA: FINANCEIRO */}
      {activeTab === 'financeiro' && financeiro && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Filtro de período */}
          <div className="card bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between no-print">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-cinzel uppercase tracking-wider">
              <Calendar size={14} className="text-primary" /> Filtrar Balanço por Vencimento
            </div>
            
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="text-xs bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:border-primary transition"
              />
              <span className="text-zinc-600 text-xs">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="text-xs bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:border-primary transition"
              />
              
              <button
                onClick={atualizarFinanceiro}
                className="text-xs font-bold px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition cursor-pointer"
              >
                Filtrar
              </button>
              
              {(dataInicio || dataFim) && (
                <button
                  onClick={() => {
                    setDataInicio('');
                    setDataFim('');
                    setTimeout(carregarDadosRelatorios, 50);
                  }}
                  className="text-xs font-bold px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Faturamento por status e categoria */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Distribuição por Categoria (Receitas) */}
            <div className="card bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold font-cinzel tracking-wider text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <DollarSign size={16} className="text-primary" /> Receitas Consolidadas por Categoria
              </h2>

              {Object.keys(financeiro.receita_por_tipo).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(financeiro.receita_por_tipo).map(([tipo, total]) => {
                    const totalGeral = Object.values(financeiro.receita_por_tipo).reduce((a, b) => a + b, 0);
                    const pct = totalGeral > 0 ? Math.round((total / totalGeral) * 100) : 0;
                    return (
                      <div key={tipo} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-zinc-300">{TIPO_NOMES[tipo] || tipo}</span>
                          <span className="text-zinc-400 font-mono">
                            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-900">
                          <div 
                            className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-500 text-xs text-center py-6">Nenhum faturamento registrado no período.</p>
              )}
            </div>

            {/* Balanço por Status de Cobrança */}
            <div className="card bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold font-cinzel tracking-wider text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <CheckCircle2 size={16} className="text-primary" /> Cobranças por Status
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(financeiro.cobrancas_por_status).map(([status, dados]) => {
                  let borderCls = 'border-zinc-900 bg-zinc-950';
                  let txtColor = 'text-white';
                  if (status === 'pago') { borderCls = 'border-emerald-950 bg-emerald-950/10'; txtColor = 'text-emerald-400'; }
                  else if (status === 'pendente') { borderCls = 'border-amber-950 bg-amber-950/10'; txtColor = 'text-amber-400'; }
                  else if (status === 'atrasado') { borderCls = 'border-red-950 bg-red-950/10'; txtColor = 'text-red-400'; }

                  return (
                    <div key={status} className={`border p-4 rounded-xl space-y-1.5 ${borderCls}`}>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">
                        {STATUS_NOMES[status] || status}
                      </span>
                      <div className="flex justify-between items-baseline flex-wrap">
                        <span className={`text-xl font-black font-cinzel ${txtColor}`}>
                          {dados.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono font-bold">
                          {dados.quantidade} docs
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Últimos Lançamentos Financeiros */}
          <div className="card bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl space-y-4 print-block">
            <h2 className="text-sm font-bold font-cinzel tracking-wider text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Clock size={16} className="text-primary" /> Recibos e Cobranças Recentes
            </h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-2">Destinatário</th>
                    <th className="pb-3 pr-2">Categoria</th>
                    <th className="pb-3 pr-2">Vencimento</th>
                    <th className="pb-3 pr-2">Valor</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {financeiro.receitas_recentes.map((f, i) => (
                    <tr key={i} className="text-zinc-300 hover:bg-white/[0.01]">
                      <td className="py-3.5 pr-2 font-medium">
                        {f.atleta_nome || f.filial_nome || 'Associação'}
                      </td>
                      <td className="py-3.5 pr-2 text-zinc-400">
                        {TIPO_NOMES[f.tipo] || f.tipo}
                      </td>
                      <td className="py-3.5 pr-2 font-mono">
                        {f.data_vencimento.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3.5 pr-2 font-bold font-mono">
                        {f.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider
                          ${f.status === 'pago' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 
                            f.status === 'atrasado' ? 'bg-red-950/20 text-red-400 border-red-900/30' : 
                            'bg-amber-950/20 text-amber-400 border-amber-900/30'}`}
                        >
                          {STATUS_NOMES[f.status] || f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ABA: EXAMES */}
      {activeTab === 'exames' && exames && (
        <div className="space-y-8 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Taxa de Aprovação por Faixa-Alvo */}
            <div className="card bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold font-cinzel tracking-wider text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Trophy size={16} className="text-primary" /> Taxa de Aprovação por Faixa Alvo
              </h2>

              {Object.keys(exames.taxa_aprovacao_por_faixa).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(exames.taxa_aprovacao_por_faixa).map(([faixa, taxa]) => (
                    <div key={faixa} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-300">Candidatos a Faixa {faixa}</span>
                        <span className="text-zinc-400 font-mono">{taxa}% aprovados</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-900">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            taxa >= 85 ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' :
                            taxa >= 70 ? 'bg-gradient-to-r from-blue-600 to-blue-500' :
                            'bg-gradient-to-r from-amber-600 to-amber-500'
                          }`}
                          style={{ width: `${taxa}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-xs text-center py-6">Nenhum candidato avaliado nos exames históricos.</p>
              )}
            </div>

            {/* Distribuição por status de Exame */}
            <div className="card bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold font-cinzel tracking-wider text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Award size={16} className="text-primary" /> Controle de Status de Eventos de Exames
              </h2>

              <div className="space-y-3.5">
                {[
                  { key: 'concluido', label: 'Concluídos', color: 'bg-emerald-400' },
                  { key: 'em_andamento', label: 'Em Andamento', color: 'bg-yellow-400' },
                  { key: 'publicado', label: 'Publicados (Agendados)', color: 'bg-blue-450' },
                  { key: 'rascunho', label: 'Rascunhos', color: 'bg-zinc-500' }
                ].map((st) => {
                  const qtd = exames.exames_por_status[st.key] || 0;
                  const pct = exames.total_exames > 0 ? Math.round((qtd / exames.total_exames) * 100) : 0;
                  return (
                    <div key={st.key} className="flex items-center justify-between text-xs border border-zinc-900 bg-zinc-950 p-3.5 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                        <span className="font-semibold text-zinc-300">{st.label}</span>
                      </div>
                      <span className="font-bold text-white font-mono bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                        {qtd} exames ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

    </main>
  );
}
