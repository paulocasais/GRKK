'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CreditCard, DollarSign, Clock, Plus, Search,
  Loader2, QrCode, CheckCircle2, AlertTriangle, ArrowUpRight, X
} from 'lucide-react';

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

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [atletas, setAtletas] = useState<AtletaSelect[]>([]);
  const [filiais, setFiliais] = useState<FilialSelect[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Modais
  const [showNovaCobrancaModal, setShowNovaCobrancaModal] = useState(false);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | null>(null);

  // Form Lançamento (Admin)
  const [novaCobrancaForm, setNovaCobrancaForm] = useState({
    destinatario_tipo: 'atleta',
    atleta_id: '',
    filial_id: '',
    tipo: 'anuidade',
    valor: '',
    data_vencimento: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
  });

  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [copiouChave, setCopiouChave] = useState(false);

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
          <button
            onClick={() => setShowNovaCobrancaModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer"
          >
            Lançar Cobrança
          </button>
        )}
      </div>

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
                            className="px-3 py-1.5 bg-gold/10 hover:bg-gold text-gold hover:text-white border border-gold/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ml-auto"
                          >
                            Pagar <ArrowUpRight size={12} />
                          </button>
                        )}

                        {isAdmin && item.status === 'pendente' && (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleAlterarStatus(item.id, 'pago')}
                              className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                            >
                              Compensar
                            </button>
                            <button
                              onClick={() => handleAlterarStatus(item.id, 'cancelado')}
                              className="px-2 py-1 bg-zinc-800 border border-zinc-850 text-zinc-500 text-[10px] font-bold rounded-lg hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer"
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

      {/* MODAL PAGAMENTO */}
      {showPagarModal && selectedPagamento && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowPagarModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-2">Efetuar Pagamento</h3>
            <p className="text-[10px] text-zinc-450 uppercase tracking-widest mb-4">Selecione e confirme para compensação simulada</p>

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
                onClick={() => setMetodoPagamento('cartao')}
                className={`py-2 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                  metodoPagamento === 'cartao' ? 'bg-gold text-white shadow-md' : 'text-zinc-500 hover:text-white'
                }`}
              >
                Cartão
              </button>
            </div>

            {metodoPagamento === 'pix' ? (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-1.5 rounded-xl flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=09090b&margin=0&data=${encodeURIComponent(
                      `00020101021226830014br.gov.bcb.pix2561pix.grkk.com.br/pagamento/cobranca5204000053039865406${selectedPagamento.valor.toFixed(2)}5802BR5915Goju Ryu Karate6008Salvador62070503***63041A2B`
                    )}`}
                    alt="QR Code Pix"
                    className="w-28 h-28 object-contain"
                  />
                </div>
                <button
                  onClick={() => {
                    const valorFormatado = selectedPagamento.valor.toFixed(2);
                    const chavePix = `00020101021226830014br.gov.bcb.pix2561pix.grkk.com.br/pagamento/cobranca5204000053039865406${valorFormatado}5802BR5915Goju Ryu Karate6008Salvador62070503***63041A2B`;
                    navigator.clipboard.writeText(chavePix)
                      .then(() => {
                        setCopiouChave(true);
                        setTimeout(() => setCopiouChave(false), 2000);
                      })
                      .catch(err => {
                        console.error("Falha ao copiar a chave Pix: ", err);
                      });
                  }}
                  className="px-4 py-2 border border-zinc-800 hover:border-gold text-zinc-350 hover:text-gold text-xs rounded-xl transition cursor-pointer"
                >
                  {copiouChave ? 'Chave Copiada! ✅' : 'Copiar Chave Pix Copia e Cola'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text" placeholder="Número do Cartão"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text" placeholder="MM/AA"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                  <input
                    type="text" placeholder="CVV"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleEfetuarPagamento}
              disabled={processandoPagamento}
              className="w-full mt-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {processandoPagamento ? <Loader2 size={12} className="animate-spin" /> : 'Confirmar Pagamento'}
            </button>
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

    </main>
  );
}
