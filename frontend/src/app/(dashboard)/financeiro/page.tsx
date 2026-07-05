'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CreditCard, DollarSign, Clock, Plus, Search,
  Loader2, QrCode, CheckCircle2, AlertTriangle, ArrowUpRight, X, TrendingUp, Calendar, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Pagamento {
  id: string | number;
  atleta_nome?: string;
  filial_nome?: string;
  tipo: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
}

interface Despesa {
  id: string;
  filial_id?: string;
  filial_nome: string;
  categoria: string;
  descricao?: string;
  valor: number;
  data_pagamento: string;
}

interface FluxoCaixaItem {
  mes: string;
  receita: number;
  despesa: number;
  saldo: number;
}

interface AtletaSelect {
  id: string;
  nome: string;
  faixa: string;
}

interface FilialSelect {
  id: string;
  nome: string;
}

const TIPO_COBRANCA: Record<string, { label: string; cor: string }> = {
  filiacao: { label: 'Taxa de Filiação', cor: 'text-blue-400 bg-blue-500/10' },
  anuidade: { label: 'Anuidade da Associação', cor: 'text-purple-400 bg-purple-500/10' },
  exame: { label: 'Taxa de Graduação de Faixa', cor: 'text-red-400 bg-red-500/10' },
  evento: { label: 'Taxa de Evento/Torneio', cor: 'text-teal-400 bg-teal-500/10' },
  mensalidade: { label: 'Mensalidade', cor: 'text-orange-400 bg-orange-500/10' },
};

const STATUS_COBRANCA: Record<string, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  pago: { label: 'Pago', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  atrasado: { label: 'Atrasado', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
  cancelado: { label: 'Cancelado', cls: 'bg-zinc-800 text-zinc-500 border-zinc-850' },
};

export default function FinanceiroPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const isAtleta = tipo === 'atleta';

  const [activeTab, setActiveTab] = useState<'faturas' | 'despesas' | 'fluxo'>('faturas');

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [atletas, setAtletas] = useState<AtletaSelect[]>([]);
  const [filiais, setFiliais] = useState<FilialSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDespesas, setLoadingDespesas] = useState(false);
  const [loadingFluxo, setLoadingFluxo] = useState(false);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Modais
  const [showNovaCobrancaModal, setShowNovaCobrancaModal] = useState(false);
  const [showNovaDespesaModal, setShowNovaDespesaModal] = useState(false);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | null>(null);

  const [submittingDespesa, setSubmittingDespesa] = useState(false);
  const [novaDespesaForm, setNovaDespesaForm] = useState({
    categoria: 'Aluguel',
    valor: '',
    data_pagamento: new Date().toISOString().split('T')[0],
    descricao: '',
    filial_id: ''
  });

  const [fluxoCaixaDados, setFluxoCaixaDados] = useState<FluxoCaixaItem[]>([]);

  // Form Lançamento (Admin)
  const [novaCobrancaForm, setNovaCobrancaForm] = useState({
    destinatario_tipo: 'atleta',
    atleta_id: '',
    filial_id: '',
    tipo: 'anuidade',
    valor: '',
    data_vencimento: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
  });

  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'boleto'>('pix');
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [copiouChave, setCopiouChave] = useState(false);
  const [cobrancaGerada, setCobrancaGerada] = useState<{
    id_cobranca?: string;
    pix_copia_cola?: string;
    qr_code_base64?: string;
    url_boleto?: string;
    linha_digitavel?: string;
    mock?: boolean;
  } | null>(null);
  const [carregandoMetodo, setCarregandoMetodo] = useState(false);

  const obterCobranca = async (metodo: 'pix' | 'boleto', pagamentoId: string | number) => {
    setCarregandoMetodo(true);
    setCobrancaGerada(null);
    try {
      const endpoint = metodo === 'pix' ? 'gerar-pix' : 'gerar-boleto';
      const res = await fetch(`${API_URL}/api/financeiro/${pagamentoId}/${endpoint}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setCobrancaGerada(data);
      }
    } catch (err) {
      console.error("Erro ao gerar cobranca:", err);
    } finally {
      setCarregandoMetodo(false);
    }
  };

  useEffect(() => {
    if (showPagarModal && selectedPagamento) {
      obterCobranca(metodoPagamento, selectedPagamento.id);
    } else {
      setCobrancaGerada(null);
    }
  }, [showPagarModal, metodoPagamento, selectedPagamento?.id]);

  useEffect(() => {
    let intervalId: any;
    if (showPagarModal && selectedPagamento && cobrancaGerada?.id_cobranca) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/financeiro/${selectedPagamento.id}/status-pagamento`, {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            if (data.fatura_status === 'pago') {
              setShowPagarModal(false);
              carregarDados();
              clearInterval(intervalId);
            }
          }
        } catch (err) {
          console.error("Erro ao verificar status:", err);
        }
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showPagarModal, selectedPagamento, cobrancaGerada]);

  const carregarDados = async () => {
    try {
      const res = await fetch(`${API_URL}/api/financeiro`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPagamentos(data.pagamentos || []);
      } else {
        throw new Error("Erro no servidor");
      }
    } catch (err) {
      console.error("Erro ao carregar dados financeiros, usando dados mockados:", err);
      // Fallback offline
      setPagamentos([
        { id: 1, atleta_nome: "Maria Fernanda", tipo: "anuidade", valor: 150.00, data_vencimento: "2026-06-30", status: "pendente" },
        { id: 2, atleta_nome: "Pedro Albuquerque", tipo: "exame", valor: 80.00, data_vencimento: "2026-05-15", status: "pago" },
        { id: 3, filial_nome: "Dojo Salvador Centro", tipo: "mensalidade", valor: 200.00, data_vencimento: "2026-05-01", status: "atrasado" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarDestinatarios = async () => {
    try {
      const [resAtletas, resFiliais] = await Promise.all([
        fetch(`${API_URL}/api/atletas`, { credentials: 'include' }),
        fetch(`${API_URL}/api/filiais`, { credentials: 'include' })
      ]);
      if (resAtletas.ok) {
        const data = await resAtletas.json();
        setAtletas(data.atletas || []);
      }
      if (resFiliais.ok) {
        const data = await resFiliais.json();
        setFiliais(data.filiais || []);
      }
    } catch (err) {
      console.error("Erro ao carregar destinatários:", err);
    }
  };

  const carregarDespesas = async () => {
    setLoadingDespesas(true);
    try {
      const res = await fetch(`${API_URL}/api/despesas`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDespesas(data.despesas || []);
      }
    } catch (err) {
      console.error("Erro ao carregar despesas, usando mock:", err);
      setDespesas([
        { id: "desp-1", filial_nome: "Dojo Central", categoria: "Aluguel", descricao: "Aluguel da sala comercial do Dojo Central", valor: 1200.00, data_pagamento: "2026-07-01" },
        { id: "desp-2", filial_nome: "Dojo Central", categoria: "Energia/Água", descricao: "Fatura de Energia Elétrica - Dojo Central", valor: 280.50, data_pagamento: "2026-07-03" },
        { id: "desp-3", filial_nome: "Matriz / Associação", categoria: "Marketing", descricao: "Panfletos de divulgação da GRKK", valor: 450.00, data_pagamento: "2026-07-04" }
      ]);
    } finally {
      setLoadingDespesas(false);
    }
  };

  const carregarFluxoCaixa = async () => {
    setLoadingFluxo(true);
    try {
      const res = await fetch(`${API_URL}/api/relatorios/analytics`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFluxoCaixaDados(data.fluxo_caixa || []);
      }
    } catch (err) {
      console.error("Erro ao carregar fluxo de caixa, usando mock:", err);
      setFluxoCaixaDados([
        { mes: "Fev/26", receita: 4500.00, despesa: 1900.00, saldo: 2600.00 },
        { mes: "Mar/26", receita: 5200.00, despesa: 2100.00, saldo: 3100.00 },
        { mes: "Abr/26", receita: 4900.00, despesa: 2200.00, saldo: 2700.00 },
        { mes: "Mai/26", receita: 5800.00, despesa: 1800.00, saldo: 4000.00 },
        { mes: "Jun/26", receita: 6100.00, despesa: 2400.00, saldo: 3700.00 },
        { mes: "Jul/26", receita: 6500.00, despesa: 1930.50, saldo: 4569.50 }
      ]);
    } finally {
      setLoadingFluxo(false);
    }
  };

  const handleSalvarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaDespesaForm.categoria || !novaDespesaForm.valor || !novaDespesaForm.data_pagamento) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    setSubmittingDespesa(true);
    try {
      const res = await fetch(`${API_URL}/api/despesas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(novaDespesaForm)
      });
      if (res.ok) {
        setShowNovaDespesaModal(false);
        setNovaDespesaForm({
          categoria: 'Aluguel',
          valor: '',
          data_pagamento: new Date().toISOString().split('T')[0],
          descricao: '',
          filial_id: ''
        });
        carregarDespesas();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar despesa.");
      }
    } catch (err: any) {
      alert(err.message || "Erro de conexão.");
      // Fallback local
      const mockDesp: Despesa = {
        id: String(Date.now()),
        filial_nome: filiais.find(f => f.id === novaDespesaForm.filial_id)?.nome || "Matriz / Associação",
        categoria: novaDespesaForm.categoria,
        descricao: novaDespesaForm.descricao,
        valor: parseFloat(novaDespesaForm.valor),
        data_pagamento: novaDespesaForm.data_pagamento
      };
      setDespesas([mockDesp, ...despesas]);
      setShowNovaDespesaModal(false);
    } finally {
      setSubmittingDespesa(false);
    }
  };

  const handleExcluirDespesa = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta despesa?")) return;
    try {
      const res = await fetch(`${API_URL}/api/despesas/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        carregarDespesas();
      }
    } catch (err) {
      setDespesas(despesas.filter(d => d.id !== id));
    }
  };

  useEffect(() => {
    if (activeTab === 'despesas') {
      carregarDespesas();
    } else if (activeTab === 'fluxo') {
      carregarFluxoCaixa();
    }
  }, [activeTab]);

  useEffect(() => {
    carregarDados();
    if (isAdmin) {
      carregarDestinatarios();
    }
  }, [isAdmin]);

  const handleCriarCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        tipo: novaCobrancaForm.tipo,
        valor: parseFloat(novaCobrancaForm.valor),
        data_vencimento: novaCobrancaForm.data_vencimento
      };
      if (novaCobrancaForm.destinatario_tipo === 'atleta') {
        payload.atleta_id = novaCobrancaForm.atleta_id;
      } else {
        payload.filial_id = novaCobrancaForm.filial_id;
      }

      const res = await fetch(`${API_URL}/api/financeiro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowNovaCobrancaModal(false);
        setNovaCobrancaForm({
          destinatario_tipo: 'atleta',
          atleta_id: '',
          filial_id: '',
          tipo: 'anuidade',
          valor: '',
          data_vencimento: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
        });
        carregarDados();
      }
    } catch (err) {
      // Simulação local
      const mockNova: Pagamento = {
        id: Date.now(),
        atleta_nome: novaCobrancaForm.destinatario_tipo === 'atleta' 
          ? (atletas.find(a => a.id === novaCobrancaForm.atleta_id)?.nome || 'Atleta Selecionado') 
          : undefined,
        filial_nome: novaCobrancaForm.destinatario_tipo === 'filial' 
          ? (filiais.find(f => f.id === novaCobrancaForm.filial_id)?.nome || 'Filial Selecionada') 
          : undefined,
        tipo: novaCobrancaForm.tipo,
        valor: parseFloat(novaCobrancaForm.valor || '0'),
        data_vencimento: novaCobrancaForm.data_vencimento,
        status: 'pendente'
      };
      setPagamentos([mockNova, ...pagamentos]);
      setShowNovaCobrancaModal(false);
    }
  };

  const handleEfetuarPagamento = async () => {
    if (!selectedPagamento) return;
    setProcessandoPagamento(true);

    try {
      const res = await fetch(`${API_URL}/api/financeiro/${selectedPagamento.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'pago', metodo_pagamento: metodoPagamento })
      });
      if (res.ok) {
        setShowPagarModal(false);
        carregarDados();
      }
    } catch (err) {
      // Simulação local
      setPagamentos(pagamentos.map(p => p.id === selectedPagamento.id ? { ...p, status: 'pago' } : p));
      setShowPagarModal(false);
    } finally {
      setProcessandoPagamento(false);
    }
  };

  const handleAlterarStatus = async (id: string | number, status: any) => {
    try {
      const res = await fetch(`${API_URL}/api/financeiro/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        carregarDados();
      }
    } catch (err) {
      setPagamentos(pagamentos.map(p => p.id === id ? { ...p, status } : p));
    }
  };

  const hoje = new Date().toISOString().split('T')[0];
  const faturasPagas = pagamentos.filter(p => p.status === 'pago');
  const faturasPendentes = pagamentos.filter(p => p.status === 'pendente');
  const faturasAtrasadas = pagamentos.filter(p => p.status === 'atrasado' || (p.status === 'pendente' && p.data_vencimento < hoje));

  const totalPago = faturasPagas.reduce((acc, curr) => acc + curr.valor, 0);
  const totalPendente = faturasPendentes.reduce((acc, curr) => acc + curr.valor, 0);
  const totalAtrasado = faturasAtrasadas.reduce((acc, curr) => acc + curr.valor, 0);

  const pagamentosFiltrados = pagamentos.filter(p => {
    const nomeBusca = (p.atleta_nome || p.filial_nome || '').toLowerCase();
    const matchesBusca = busca === '' || nomeBusca.includes(busca.toLowerCase());
    const matchesStatus = filtroStatus === 'todos' || p.status === filtroStatus;
    return matchesBusca && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Controle Financeiro</h1>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">Mensalidades, anuidades e taxas da associação</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {activeTab === 'faturas' ? (
              <button
                onClick={() => setShowNovaCobrancaModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer font-cinzel"
              >
                Lançar Cobrança
              </button>
            ) : activeTab === 'despesas' ? (
              <button
                onClick={() => setShowNovaDespesaModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer font-cinzel"
              >
                Lançar Despesa
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Abas */}
      {!isAtleta && (
        <div className="flex gap-6 border-b border-zinc-800 pb-px font-cinzel">
          <button
            onClick={() => setActiveTab('faturas')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition relative cursor-pointer ${
              activeTab === 'faturas' ? 'text-white' : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            Mensalidades & Taxas
            {activeTab === 'faturas' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('despesas')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition relative cursor-pointer ${
              activeTab === 'despesas' ? 'text-white' : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            Despesas do Dojo
            {activeTab === 'despesas' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('fluxo')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition relative cursor-pointer ${
              activeTab === 'fluxo' ? 'text-white' : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            Fluxo de Caixa
            {activeTab === 'fluxo' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
        </div>
      )}

      {activeTab === 'faturas' && (
        <>
          {/* Pódio Financeiro */}
          <div className={`grid grid-cols-1 ${isAtleta ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-5`}>
            {!isAtleta && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white font-cinzel">R$ {totalPago.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500">Total Pago</p>
                </div>
              </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-cinzel">R$ {totalPendente.toFixed(2)}</p>
                <p className="text-xs text-zinc-500">Pendente</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-cinzel">R$ {totalAtrasado.toFixed(2)}</p>
                <p className="text-xs text-zinc-500">Atrasado / Vencido</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wide">Minhas Faturas</h2>
            <div className="flex gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="px-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none w-full"
              />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 outline-none"
              >
                <option value="todos">Todos Status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>

          {/* Tabela de Cobranças */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/20">
                    <th className="p-4">Fatura</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Vencimento</th>
                    <th className="p-4 text-right">Valor</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-zinc-600 italic">
                        Nenhuma fatura localizada.
                      </td>
                    </tr>
                  ) : (
                    pagamentosFiltrados.map((item) => {
                      const statusConfig = STATUS_COBRANCA[item.status] || STATUS_COBRANCA.pendente;
                      const vencido = item.status === 'pendente' && item.data_vencimento < hoje;
                      return (
                        <tr key={item.id} className="border-b border-zinc-800/40 hover:bg-white/[0.01] transition-all">
                          <td className="p-4 font-bold text-white">
                            {item.atleta_nome || item.filial_nome || 'Cobrança Geral'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${TIPO_COBRANCA[item.tipo]?.cor || 'bg-zinc-950 text-zinc-400'}`}>
                              {TIPO_COBRANCA[item.tipo]?.label || item.tipo}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-zinc-350">
                            {new Date(item.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-4 text-right font-mono font-black text-white">
                            R$ {item.valor.toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              vencido ? STATUS_COBRANCA.atrasado.cls : statusConfig.cls
                            }`}>
                              {vencido ? 'Atrasado' : statusConfig.label}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {item.status === 'pendente' && (isAtleta || !isAdmin) && (
                              <button
                                onClick={() => {
                                  setSelectedPagamento(item);
                                  setShowPagarModal(true);
                                }}
                                className="px-3 py-1.5 bg-gold/10 hover:bg-gold text-gold hover:text-white border border-gold/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ml-auto font-cinzel"
                              >
                                Pagar <ArrowUpRight size={12} />
                              </button>
                            )}

                            {isAdmin && item.status === 'pendente' && (
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleAlterarStatus(item.id, 'pago')}
                                  className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg hover:bg-emerald-500 hover:text-white transition cursor-pointer font-cinzel"
                                >
                                  Compensar
                                </button>
                                <button
                                  onClick={() => handleAlterarStatus(item.id, 'cancelado')}
                                  className="px-2 py-1 bg-zinc-800 border border-zinc-850 text-zinc-500 text-[10px] font-bold rounded-lg hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer font-cinzel"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'despesas' && (
        <>
          {/* Pódio Despesas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-cinzel">
                  R$ {despesas.reduce((acc, curr) => acc + curr.valor, 0).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">Total de Saídas / Despesas</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-cinzel">{despesas.length}</p>
                <p className="text-xs text-zinc-500">Despesas Registradas</p>
              </div>
            </div>
          </div>

          {/* Filtros de Despesas */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wide">Saídas & Despesas Operacionais</h2>
            <input
              type="text"
              placeholder="Filtrar por categoria ou filial..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="px-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none w-full sm:w-80"
            />
          </div>

          {/* Tabela de Despesas */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden">
            {loadingDespesas ? (
              <div className="p-10 text-center text-zinc-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gold" /> Carregando despesas...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/20">
                      <th className="p-4">Filial/Destino</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4">Descrição</th>
                      <th className="p-4">Data Pagamento</th>
                      <th className="p-4 text-right">Valor</th>
                      {isAdmin && <th className="p-4 text-center">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.filter(d => {
                      const text = `${d.categoria} ${d.filial_nome} ${d.descricao || ''}`.toLowerCase();
                      return text.includes(busca.toLowerCase());
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-zinc-600 italic">
                          Nenhuma despesa registrada.
                        </td>
                      </tr>
                    ) : (
                      despesas.filter(d => {
                        const text = `${d.categoria} ${d.filial_nome} ${d.descricao || ''}`.toLowerCase();
                        return text.includes(busca.toLowerCase());
                      }).map((item) => (
                        <tr key={item.id} className="border-b border-zinc-800/40 hover:bg-white/[0.01] transition-all">
                          <td className="p-4 font-bold text-white">{item.filial_nome}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/10 text-red-400">
                              {item.categoria}
                            </span>
                          </td>
                          <td className="p-4 text-zinc-400 italic max-w-xs truncate">{item.descricao || 'Sem descrição'}</td>
                          <td className="p-4 font-semibold text-zinc-350">
                            {new Date(item.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-4 text-right font-mono font-black text-red-400">
                            - R$ {item.valor.toFixed(2)}
                          </td>
                          {isAdmin && (
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleExcluirDespesa(item.id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition cursor-pointer"
                                title="Excluir despesa"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'fluxo' && (
        <>
          {/* Resumo do Fluxo de Caixa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-cinzel">
                  R$ {fluxoCaixaDados.reduce((acc, curr) => acc + curr.receita, 0).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">Total Recebido (Período)</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-cinzel">
                  R$ {fluxoCaixaDados.reduce((acc, curr) => acc + curr.despesa, 0).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">Total Despendido (Período)</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
              {(() => {
                const totalReceitas = fluxoCaixaDados.reduce((acc, curr) => acc + curr.receita, 0);
                const totalDespesas = fluxoCaixaDados.reduce((acc, curr) => acc + curr.despesa, 0);
                const saldoLiquido = totalReceitas - totalDespesas;
                return (
                  <>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      saldoLiquido >= 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      <TrendingUp size={22} />
                    </div>
                    <div>
                      <p className={`text-2xl font-black font-cinzel ${saldoLiquido >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                        R$ {saldoLiquido.toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-500">Saldo Líquido Acumulado</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Gráfico Recharts */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 space-y-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-cinzel">Entradas vs Saídas Mensais</h3>
              <p className="text-[10px] text-zinc-500">Comparativo consolidado do fluxo financeiro do dojo (últimos 6 meses)</p>
            </div>
            <div className="h-80 w-full text-xs">
              {loadingFluxo ? (
                <div className="h-full flex items-center justify-center text-zinc-500">
                  <Loader2 className="w-5 h-5 animate-spin text-gold mr-2" /> Carregando gráfico...
                </div>
              ) : fluxoCaixaDados.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-600 italic">
                  Sem dados suficientes para gerar o gráfico.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fluxoCaixaDados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="mes" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Bar name="Receitas (+)" dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar name="Despesas (-)" dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tabela Resumo Mensal */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/20">
                    <th className="p-4">Mês/Ano</th>
                    <th className="p-4 text-right">Receitas Total (+)</th>
                    <th className="p-4 text-right">Despesas Total (-)</th>
                    <th className="p-4 text-right">Saldo Líquido</th>
                    <th className="p-4 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {fluxoCaixaDados.map((item, idx) => (
                    <tr key={idx} className="border-b border-zinc-800/40 hover:bg-white/[0.01] transition-all">
                      <td className="p-4 font-bold text-white font-cinzel">{item.mes}</td>
                      <td className="p-4 text-right font-mono font-black text-emerald-400">R$ {item.receita.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-black text-red-400">R$ {item.despesa.toFixed(2)}</td>
                      <td className={`p-4 text-right font-mono font-black ${item.saldo >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                        R$ {item.saldo.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          item.saldo >= 0
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {item.saldo >= 0 ? 'Superavitário' : 'Deficitário'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL PAGAMENTO */}
      {showPagarModal && selectedPagamento && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowPagarModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-2">Efetuar Pagamento</h3>
            <p className="text-[10px] text-zinc-450 uppercase tracking-widest mb-4">Escolha a forma de pagamento oficial da associação</p>

            <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Cobrança:</span>
                <span className="font-bold text-white">{TIPO_COBRANCA[selectedPagamento.tipo]?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Valor total:</span>
                <span className="font-mono font-bold text-gold">R$ {selectedPagamento.valor.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setMetodoPagamento('pix')}
                className={`py-2 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                  metodoPagamento === 'pix' ? 'bg-gold text-white shadow-md' : 'text-zinc-500 hover:text-white'
                }`}
              >
                PIX
              </button>
              <button
                type="button"
                onClick={() => setMetodoPagamento('boleto')}
                className={`py-2 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                  metodoPagamento === 'boleto' ? 'bg-gold text-white shadow-md' : 'text-zinc-500 hover:text-white'
                }`}
              >
                Boleto
              </button>
            </div>

            {carregandoMetodo ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Gerando cobrança...</p>
              </div>
            ) : cobrancaGerada ? (
              metodoPagamento === 'pix' ? (
                <div className="flex flex-col items-center gap-4">
                  {cobrancaGerada.qr_code_base64 ? (
                    <div className="bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                      <img
                        src={cobrancaGerada.qr_code_base64.startsWith('data:') 
                          ? cobrancaGerada.qr_code_base64 
                          : `data:image/png;base64,${cobrancaGerada.qr_code_base64}`}
                        alt="QR Code Pix"
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-center text-zinc-650 text-xs">
                      QR Code Indisponível
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (cobrancaGerada.pix_copia_cola) {
                        navigator.clipboard.writeText(cobrancaGerada.pix_copia_cola)
                          .then(() => {
                            setCopiouChave(true);
                            setTimeout(() => setCopiouChave(false), 2000);
                          });
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-zinc-800 hover:border-gold text-zinc-350 hover:text-gold text-xs rounded-xl transition cursor-pointer font-semibold truncate text-center"
                  >
                    {copiouChave ? 'Chave Copiada! ✅' : 'Copiar código Pix Copia e Cola'}
                  </button>

                  <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-450 uppercase tracking-widest font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Aguardando confirmação do pagamento...
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Linha Digitável</p>
                    <p className="text-xs font-mono font-bold text-white break-all leading-relaxed bg-zinc-900 p-2 rounded border border-zinc-800">
                      {cobrancaGerada.linha_digitavel || 'Linha digitável indisponível'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (cobrancaGerada.linha_digitavel) {
                          navigator.clipboard.writeText(cobrancaGerada.linha_digitavel)
                            .then(() => {
                              setCopiouChave(true);
                              setTimeout(() => setCopiouChave(false), 2000);
                            });
                        }
                      }}
                      className="flex-1 py-2.5 border border-zinc-800 hover:border-gold text-zinc-350 hover:text-gold text-xs font-semibold rounded-xl transition cursor-pointer text-center"
                    >
                      {copiouChave ? 'Copiado! ✅' : 'Copiar Código'}
                    </button>

                    {cobrancaGerada.url_boleto && (
                      <a
                        href={cobrancaGerada.url_boleto}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 bg-gold hover:bg-gold-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        Abrir Boleto <ArrowUpRight size={14} />
                      </a>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="text-center text-xs text-zinc-500 py-6">
                Erro ao gerar cobrança. Tente novamente.
              </div>
            )}

            <div className="border-t border-zinc-800/60 mt-6 pt-4">
              <button
                onClick={handleEfetuarPagamento}
                disabled={processandoPagamento}
                className="w-full py-2.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {processandoPagamento ? <Loader2 size={12} className="animate-spin" /> : 'Confirmar Simulação (Offline)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVA COBRANÇA */}
      {showNovaCobrancaModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowNovaCobrancaModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-lg font-bold text-white font-cinzel mb-4">Lançar Nova Fatura</h3>
            
            <form onSubmit={handleCriarCobranca} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Tipo de Destinatário *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setNovaCobrancaForm({ ...novaCobrancaForm, destinatario_tipo: 'atleta', atleta_id: '', filial_id: '' })}
                    className={`py-2 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                      novaCobrancaForm.destinatario_tipo === 'atleta' ? 'bg-gold text-white shadow-md' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Atleta
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovaCobrancaForm({ ...novaCobrancaForm, destinatario_tipo: 'filial', atleta_id: '', filial_id: '' })}
                    className={`py-2 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                      novaCobrancaForm.destinatario_tipo === 'filial' ? 'bg-gold text-white shadow-md' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Filial
                  </button>
                </div>
              </div>

              {novaCobrancaForm.destinatario_tipo === 'atleta' ? (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Selecionar Atleta *</label>
                  <select
                    required
                    value={novaCobrancaForm.atleta_id}
                    onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, atleta_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  >
                    <option value="">Selecione um atleta...</option>
                    {atletas.map((atl) => (
                      <option key={atl.id} value={atl.id}>
                        {atl.nome} {atl.faixa ? `(${atl.faixa})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Selecionar Filial *</label>
                  <select
                    required
                    value={novaCobrancaForm.filial_id}
                    onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, filial_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  >
                    <option value="">Selecione uma filial...</option>
                    {filiais.map((fil) => (
                      <option key={fil.id} value={fil.id}>
                        {fil.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Tipo de Cobrança *</label>
                <select
                  value={novaCobrancaForm.tipo}
                  onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, tipo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                >
                  <option value="anuidade">Anuidade da Associação</option>
                  <option value="mensalidade">Mensalidade</option>
                  <option value="exame">Taxa de Graduação de Faixa</option>
                  <option value="evento">Taxa de Torneio / Evento</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Valor (R$) *</label>
                  <input
                    type="number" required placeholder="120.00"
                    value={novaCobrancaForm.valor}
                    onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, valor: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Vencimento *</label>
                  <input
                    type="date" required
                    value={novaCobrancaForm.data_vencimento}
                    onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, data_vencimento: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition cursor-pointer"
              >
                Lançar Fatura
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVA DESPESA */}
      {showNovaDespesaModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowNovaDespesaModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-lg font-bold text-white font-cinzel mb-4">Lançar Nova Despesa</h3>
            
            <form onSubmit={handleSalvarDespesa} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Dojo / Filial da Despesa *</label>
                <select
                  value={novaDespesaForm.filial_id}
                  onChange={(e) => setNovaDespesaForm({ ...novaDespesaForm, filial_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                >
                  <option value="">Matriz / Associação Geral</option>
                  {filiais.map((fil) => (
                    <option key={fil.id} value={fil.id}>
                      {fil.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Categoria *</label>
                <select
                  value={novaDespesaForm.categoria}
                  onChange={(e) => setNovaDespesaForm({ ...novaDespesaForm, categoria: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                >
                  <option value="Aluguel">Aluguel</option>
                  <option value="Energia/Água">Energia/Água</option>
                  <option value="Salários/Instrutores">Salários/Instrutores</option>
                  <option value="Equipamentos/Estoque">Equipamentos/Estoque</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Impostos/Taxas">Impostos/Taxas</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                <textarea
                  placeholder="Ex: Fatura de energia elétrica Ref Julho"
                  value={novaDespesaForm.descricao}
                  onChange={(e) => setNovaDespesaForm({ ...novaDespesaForm, descricao: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Valor (R$) *</label>
                  <input
                    type="number" required placeholder="0.00" step="0.01" min="0.01"
                    value={novaDespesaForm.valor}
                    onChange={(e) => setNovaDespesaForm({ ...novaDespesaForm, valor: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Data Pagamento *</label>
                  <input
                    type="date" required
                    value={novaDespesaForm.data_pagamento}
                    onChange={(e) => setNovaDespesaForm({ ...novaDespesaForm, data_pagamento: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingDespesa}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingDespesa ? <Loader2 size={12} className="animate-spin" /> : 'Lançar Despesa'}
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
