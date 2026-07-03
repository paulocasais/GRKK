'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Package, Plus, Search, Loader2, ArrowUpRight, ArrowDownRight,
  Pencil, Trash2, AlertTriangle, TrendingUp, History, ClipboardList, X, DollarSign
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Fornecedor {
  id: string;
  nome: string;
  contato?: string;
  telefone?: string;
  email?: string;
  created_at?: string;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  preco_compra: number;
  preco_venda: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  tamanho?: string;
  created_at?: string;
  updated_at?: string;
}

interface Movimentacao {
  id: string;
  produto_id: string;
  produto_nome?: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  usuario_id?: string;
  usuario_nome?: string;
  created_at?: string;
}

const CATEGORIAS = ['Kimono', 'Faixa', 'Protetores', 'Acessórios', 'Outros'];
const TAMANHOS = ['Único', 'M0', 'M1', 'M2', 'M3', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', '1', '2', '3', '4', '5', '6', '7', 'P', 'M', 'G', 'GG'];

export default function EstoquePage() {
  const { usuario, tipo, isAdmin, isFilial } = useAuth();

  const [activeTab, setActiveTab] = useState<'inventario' | 'historico' | 'fornecedores'>('inventario');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Modais
  const [showNovoProdutoModal, setShowNovoProdutoModal] = useState(false);
  const [showEditarProdutoModal, setShowEditarProdutoModal] = useState(false);
  const [showNovaMovimentacaoModal, setShowNovaMovimentacaoModal] = useState(false);
  const [showNovoFornecedorModal, setShowNovoFornecedorModal] = useState(false);
  
  // Estados para itens selecionados
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  // Form Lançamento Produto
  const [produtoForm, setProdutoForm] = useState({
    nome: '',
    descricao: '',
    categoria: 'Kimono',
    preco_compra: '',
    preco_venda: '',
    quantidade_estoque: '0',
    estoque_minimo: '5',
    fornecedor_id: '',
    tamanho: 'Único'
  });

  // Form Lançamento Fornecedor
  const [fornecedorForm, setFornecedorForm] = useState({
    nome: '',
    contato: '',
    telefone: '',
    email: ''
  });

  // Form Lançamento Movimentação
  const [movimentacaoForm, setMovimentacaoForm] = useState({
    produto_id: '',
    tipo: 'entrada',
    quantidade: '',
    motivo: ''
  });

  // Carregar dados da API
  const carregarProdutos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/estoque/produtos`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProdutos(data.produtos || []);
      } else {
        throw new Error("Erro ao carregar produtos");
      }
    } catch (err) {
      console.error(err);
      setErro("Não foi possível carregar o inventário.");
    }
  };

  const carregarMovimentacoes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/estoque/movimentacoes`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMovimentacoes(data.movimentacoes || []);
      } else {
        throw new Error("Erro ao carregar histórico");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const carregarFornecedores = async () => {
    try {
      const res = await fetch(`${API_URL}/api/estoque/fornecedores`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFornecedores(data.fornecedores || []);
      } else {
        throw new Error("Erro ao carregar fornecedores");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    await carregarProdutos();
    await carregarMovimentacoes();
    await carregarFornecedores();
    setLoading(false);
  };

  useEffect(() => {
    if (usuario) {
      carregarDados();
    }
  }, [usuario]);

  // Handlers
  const handleCriarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoForm.nome || !produtoForm.categoria) return;

    try {
      const fNome = fornecedores.find(f => f.id === produtoForm.fornecedor_id)?.nome || '';
      const payload = {
        nome: produtoForm.nome,
        descricao: produtoForm.descricao,
        categoria: produtoForm.categoria,
        preco_compra: parseFloat(produtoForm.preco_compra || '0'),
        preco_venda: parseFloat(produtoForm.preco_venda || '0'),
        quantidade_estoque: parseInt(produtoForm.quantidade_estoque || '0'),
        estoque_minimo: parseInt(produtoForm.estoque_minimo || '5'),
        fornecedor_id: produtoForm.fornecedor_id || null,
        fornecedor_nome: fNome,
        tamanho: produtoForm.tamanho || 'Único'
      };

      const res = await fetch(`${API_URL}/api/estoque/produtos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowNovoProdutoModal(false);
        setProdutoForm({
          nome: '',
          descricao: '',
          categoria: 'Kimono',
          preco_compra: '',
          preco_venda: '',
          quantidade_estoque: '0',
          estoque_minimo: '5',
          fornecedor_id: '',
          tamanho: 'Único'
        });
        carregarDados();
      } else {
        const errData = await res.json();
        alert(errData.error || "Erro ao criar produto");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão com a API.");
    }
  };

  const handleEditarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduto) return;

    try {
      const fNome = fornecedores.find(f => f.id === produtoForm.fornecedor_id)?.nome || '';
      const payload = {
        nome: produtoForm.nome,
        descricao: produtoForm.descricao,
        categoria: produtoForm.categoria,
        preco_compra: parseFloat(produtoForm.preco_compra || '0'),
        preco_venda: parseFloat(produtoForm.preco_venda || '0'),
        estoque_minimo: parseInt(produtoForm.estoque_minimo || '5'),
        fornecedor_id: produtoForm.fornecedor_id || null,
        fornecedor_nome: fNome,
        tamanho: produtoForm.tamanho || 'Único'
      };

      const res = await fetch(`${API_URL}/api/estoque/produtos/${selectedProduto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowEditarProdutoModal(false);
        setSelectedProduto(null);
        carregarDados();
      } else {
        const errData = await res.json();
        alert(errData.error || "Erro ao salvar alterações");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão com a API.");
    }
  };

  const handleCriarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedorForm.nome) return;

    try {
      const res = await fetch(`${API_URL}/api/estoque/fornecedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(fornecedorForm)
      });

      if (res.ok) {
        setShowNovoFornecedorModal(false);
        setFornecedorForm({
          nome: '',
          contato: '',
          telefone: '',
          email: ''
        });
        carregarDados();
      } else {
        const errData = await res.json();
        alert(errData.error || "Erro ao criar fornecedor");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão com a API.");
    }
  };

  const handleDeletarFornecedor = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;

    try {
      const res = await fetch(`${API_URL}/api/estoque/fornecedores/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        carregarDados();
      } else {
        alert("Erro ao excluir fornecedor.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletarProduto = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto do inventário? Todas as movimentações continuarão registradas.")) return;

    try {
      const res = await fetch(`${API_URL}/api/estoque/produtos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        carregarDados();
      } else {
        alert("Erro ao excluir produto.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLancarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movimentacaoForm.produto_id || !movimentacaoForm.tipo || !movimentacaoForm.quantidade) return;

    try {
      const payload = {
        produto_id: movimentacaoForm.produto_id,
        tipo: movimentacaoForm.tipo,
        quantidade: parseInt(movimentacaoForm.quantidade),
        motivo: movimentacaoForm.motivo
      };

      const res = await fetch(`${API_URL}/api/estoque/movimentar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowNovaMovimentacaoModal(false);
        setMovimentacaoForm({
          produto_id: '',
          tipo: 'entrada',
          quantidade: '',
          motivo: ''
        });
        carregarDados();
      } else {
        const errData = await res.json();
        alert(errData.error || "Erro ao registrar movimentação");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão com a API.");
    }
  };

  // Filtros aplicados no frontend
  const produtosFiltrados = produtos.filter(p => {
    const matchesBusca = busca === '' || p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.descricao || '').toLowerCase().includes(busca.toLowerCase());
    const matchesCategoria = filtroCategoria === 'todas' || p.categoria === filtroCategoria;
    
    let matchesStatus = true;
    if (filtroStatus === 'critico') {
      matchesStatus = p.quantidade_estoque > 0 && p.quantidade_estoque <= p.estoque_minimo;
    } else if (filtroStatus === 'esgotado') {
      matchesStatus = p.quantidade_estoque === 0;
    } else if (filtroStatus === 'normal') {
      matchesStatus = p.quantidade_estoque > p.estoque_minimo;
    }

    return matchesBusca && matchesCategoria && matchesStatus;
  });

  // KPIs
  const totalItensDiferentes = produtos.length;
  const totalQuantidadeGeral = produtos.reduce((acc, p) => acc + p.quantidade_estoque, 0);
  const valorTotalCompra = produtos.reduce((acc, p) => acc + (p.preco_compra * p.quantidade_estoque), 0);
  const valorTotalVenda = produtos.reduce((acc, p) => acc + (p.preco_venda * p.quantidade_estoque), 0);
  const itensCriticos = produtos.filter(p => p.quantidade_estoque > 0 && p.quantidade_estoque <= p.estoque_minimo).length;
  const itensEsgotados = produtos.filter(p => p.quantidade_estoque === 0).length;

  // Render condicional para atleta
  if (tipo === 'atleta') {
    return (
      <main className="p-8 text-center max-w-lg mx-auto mt-20 bg-zinc-900 border border-zinc-800 rounded-3xl">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white font-cinzel">Acesso não autorizado</h1>
        <p className="text-sm text-zinc-400 mt-2">Você não possui permissões suficientes para visualizar a tela de estoque.</p>
      </main>
    );
  }

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
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Controle de Estoque</h1>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">
            Equipamentos, Kimonos, Faixas e Acessórios da Federação
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
          <button
            onClick={() => {
              setMovimentacaoForm({
                produto_id: '',
                tipo: 'entrada',
                quantidade: '',
                motivo: ''
              });
              setShowNovaMovimentacaoModal(true);
            }}
            className="px-4 py-2.5 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-350 hover:text-white border border-zinc-800/80 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <History size={14} className="text-zinc-500" />
            Movimentar Estoque
          </button>
          
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setFornecedorForm({ nome: '', contato: '', telefone: '', email: '' });
                  setShowNovoFornecedorModal(true);
                }}
                className="px-4 py-2.5 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-350 hover:text-white border border-zinc-800/80 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={14} className="text-zinc-500" />
                Novo Fornecedor
              </button>
              <button
                onClick={() => {
                  setProdutoForm({
                    nome: '',
                    descricao: '',
                    categoria: 'Kimono',
                    preco_compra: '',
                    preco_venda: '',
                    quantidade_estoque: '0',
                    estoque_minimo: '5',
                    fornecedor_id: '',
                    tamanho: 'Único'
                  });
                  setShowNovoProdutoModal(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-gold/10 hover:shadow-gold/20"
              >
                <Plus size={14} />
                Novo Produto
              </button>
            </>
          )}
        </div>
      </div>

      {erro && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle size={18} />
          {erro}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-xl font-black text-white font-cinzel">R$ {valorTotalCompra.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">Capital Investido</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xl font-black text-white font-cinzel">R$ {valorTotalVenda.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">Potencial de Venda</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-450">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xl font-black text-white font-cinzel">{itensCriticos}</p>
            <p className="text-xs text-zinc-500">Itens c/ Estoque Baixo</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 cursor-default">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <Package size={22} />
          </div>
          <div>
            <p className="text-xl font-black text-white font-cinzel">{itensEsgotados}</p>
            <p className="text-xs text-zinc-500">Itens Esgotados</p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="border-b border-zinc-800 flex gap-6">
        <button
          onClick={() => setActiveTab('inventario')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative transition-colors ${
            activeTab === 'inventario' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {activeTab === 'inventario' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
          )}
          Inventário Atual
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative transition-colors ${
            activeTab === 'historico' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {activeTab === 'historico' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
          )}
          Histórico de Movimentações
        </button>
        <button
          onClick={() => setActiveTab('fornecedores')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative transition-colors ${
            activeTab === 'fornecedores' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {activeTab === 'fornecedores' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
          )}
          Fornecedores
        </button>
      </div>

      {/* Tab: Inventário */}
      {activeTab === 'inventario' && (
        <div className="space-y-4">
          
          {/* Filtros Inventário */}
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wide">Produtos Cadastrados ({produtosFiltrados.length})</h2>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="relative flex-1 min-w-[200px] md:flex-none">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="text"
                  placeholder="Pesquisar produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none w-full"
                />
              </div>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 outline-none cursor-pointer"
              >
                <option value="todas">Todas Categorias</option>
                {CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 outline-none cursor-pointer"
              >
                <option value="todos">Todos Níveis</option>
                <option value="normal">Estoque Normal</option>
                <option value="critico">Estoque Baixo</option>
                <option value="esgotado">Esgotado</option>
              </select>
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/20">
                    <th className="p-4">Produto</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4 text-right">Preço Compra</th>
                    <th className="p-4 text-right">Preço Venda</th>
                    <th className="p-4 text-center">Saldo</th>
                    <th className="p-4 text-center">Nível Mínimo</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-zinc-600 italic">
                        Nenhum produto cadastrado correspondente aos filtros.
                      </td>
                    </tr>
                  ) : (
                    produtosFiltrados.map((item) => {
                      const qty = item.quantidade_estoque;
                      const min = item.estoque_minimo;
                      
                      let statusLabel = 'Em Estoque';
                      let statusCls = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
                      
                      if (qty === 0) {
                        statusLabel = 'Esgotado';
                        statusCls = 'bg-red-500/15 text-red-400 border-red-500/20';
                      } else if (qty <= min) {
                        statusLabel = 'Estoque Crítico';
                        statusCls = 'bg-amber-500/15 text-amber-400 border-amber-500/20';
                      }

                      return (
                        <tr key={item.id} className="border-b border-zinc-800/40 hover:bg-white/[0.01] transition-all">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-[13px]">{item.nome}</p>
                              {item.tamanho && item.tamanho !== 'Único' && (
                                <span className="bg-zinc-800 text-zinc-450 text-[9px] font-bold rounded px-1.5 py-0.5 border border-zinc-750" title="Tamanho">
                                  {item.tamanho}
                                </span>
                              )}
                            </div>
                            {item.descricao && (
                              <p className="text-[10px] text-zinc-500 max-w-sm truncate mt-0.5">{item.descricao}</p>
                            )}
                            {item.fornecedor_nome && (
                              <p className="text-[9px] text-zinc-650 mt-0.5 uppercase tracking-wider font-semibold">Fornecedor: <strong className="text-zinc-500">{item.fornecedor_nome}</strong></p>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-950 text-zinc-400 border border-zinc-850">
                              {item.categoria}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono font-medium text-zinc-400">
                            R$ {item.preco_compra.toFixed(2)}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-white">
                            R$ {item.preco_venda.toFixed(2)}
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-white text-sm">
                            {qty}
                          </td>
                          <td className="p-4 text-center font-mono text-zinc-400">
                            {min}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusCls}`}>
                                {statusLabel}
                              </span>
                              {qty <= min && item.fornecedor_id && (
                                <button
                                  onClick={() => {
                                    const forn = fornecedores.find(f => f.id === item.fornecedor_id);
                                    if (forn) {
                                      alert(`Fornecedor: ${forn.nome}\nContato: ${forn.contato || 'N/A'}\nTelefone: ${forn.telefone || 'N/A'}\nE-mail: ${forn.email || 'N/A'}`);
                                    }
                                  }}
                                  className="text-[9px] text-gold hover:text-gold-light underline font-bold cursor-pointer"
                                >
                                  Contato Fornecedor
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-end">
                              <button
                                title="Lançar Movimentação"
                                onClick={() => {
                                  setMovimentacaoForm({
                                    produto_id: item.id,
                                    tipo: 'entrada',
                                    quantidade: '',
                                    motivo: ''
                                  });
                                  setShowNovaMovimentacaoModal(true);
                                }}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded-lg transition border border-zinc-750 cursor-pointer"
                              >
                                <History size={13} />
                              </button>

                              {isAdmin && (
                                <>
                                  <button
                                    title="Editar Produto"
                                    onClick={() => {
                                      setSelectedProduto(item);
                                      setProdutoForm({
                                        nome: item.nome,
                                        descricao: item.descricao || '',
                                        categoria: item.categoria,
                                        preco_compra: String(item.preco_compra),
                                        preco_venda: String(item.preco_venda),
                                        quantidade_estoque: String(item.quantidade_estoque),
                                        estoque_minimo: String(item.estoque_minimo),
                                        fornecedor_id: item.fornecedor_id || '',
                                        tamanho: item.tamanho || 'Único'
                                      });
                                      setShowEditarProdutoModal(true);
                                    }}
                                    className="p-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-gold rounded-lg transition border border-zinc-750 cursor-pointer"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    title="Excluir Produto"
                                    onClick={() => handleDeletarProduto(item.id)}
                                    className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition border border-red-500/10 cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
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
        </div>
      )}

      {/* Tab: Histórico de Movimentações */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white font-cinzel tracking-wide">Tabela de Auditoria</h2>
          
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/20">
                    <th className="p-4">Data e Hora</th>
                    <th className="p-4">Produto</th>
                    <th className="p-4 text-center">Tipo</th>
                    <th className="p-4 text-center">Quantidade</th>
                    <th className="p-4">Motivo</th>
                    <th className="p-4">Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-zinc-600 italic">
                        Nenhuma movimentação registrada no histórico.
                      </td>
                    </tr>
                  ) : (
                    movimentacoes.map((item) => {
                      const isEntrada = item.tipo === 'entrada';
                      return (
                        <tr key={item.id} className="border-b border-zinc-800/40 hover:bg-white/[0.01] transition-all">
                          <td className="p-4 font-semibold text-zinc-400">
                            {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : 'Data não registrada'}
                          </td>
                          <td className="p-4 font-bold text-white">
                            {item.produto_nome || `Produto ID ${item.produto_id}`}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase inline-flex items-center gap-1 border ${
                              isEntrada 
                                ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {isEntrada ? (
                                <>
                                  <ArrowUpRight size={10} /> Entrada
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight size={10} /> Saída
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-white text-[13px]">
                            {item.quantidade}
                          </td>
                          <td className="p-4 text-zinc-300">
                            {item.motivo}
                          </td>
                          <td className="p-4 text-zinc-450 font-semibold">
                            {item.usuario_nome || 'Sistema'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Fornecedores */}
      {activeTab === 'fornecedores' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wide">Fornecedores Cadastrados ({fornecedores.length})</h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/20">
                    <th className="p-4">Nome / Empresa</th>
                    <th className="p-4">Pessoa de Contato</th>
                    <th className="p-4">Telefone</th>
                    <th className="p-4">E-mail</th>
                    {isAdmin && <th className="p-4 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {fornecedores.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-zinc-600 italic">
                        Nenhum fornecedor cadastrado.
                      </td>
                    </tr>
                  ) : (
                    fornecedores.map((item) => (
                      <tr key={item.id} className="border-b border-zinc-800/40 hover:bg-white/[0.01] transition-all">
                        <td className="p-4 font-bold text-white text-[13px]">{item.nome}</td>
                        <td className="p-4 text-zinc-300">{item.contato || 'Não informado'}</td>
                        <td className="p-4 text-zinc-450 font-semibold">{item.telefone || 'Não informado'}</td>
                        <td className="p-4 text-zinc-450 font-semibold">{item.email || 'Não informado'}</td>
                        {isAdmin && (
                          <td className="p-4">
                            <div className="flex gap-2 justify-end">
                              <button
                                title="Excluir Fornecedor"
                                onClick={() => handleDeletarFornecedor(item.id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition border border-red-500/10 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO PRODUTO */}
      {showNovoProdutoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowNovoProdutoModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-lg font-bold text-white font-cinzel mb-4">Cadastrar Novo Produto</h3>
            
            <form onSubmit={handleCriarProduto} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nome do Produto *</label>
                <input
                  type="text" required
                  placeholder="Ex: Kimono Goju-Ryu Tradicional"
                  value={produtoForm.nome}
                  onChange={(e) => setProdutoForm({ ...produtoForm, nome: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                <textarea
                  placeholder="Descrição opcional do produto, tamanhos, especificações..."
                  value={produtoForm.descricao}
                  onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Categoria *</label>
                  <select
                    value={produtoForm.categoria}
                    onChange={(e) => setProdutoForm({ ...produtoForm, categoria: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors cursor-pointer"
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Estoque Mínimo *</label>
                  <input
                    type="number" required
                    placeholder="5"
                    value={produtoForm.estoque_minimo}
                    onChange={(e) => setProdutoForm({ ...produtoForm, estoque_minimo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Preço Compra (R$)</label>
                  <input
                    type="number" step="0.01"
                    placeholder="120.00"
                    value={produtoForm.preco_compra}
                    onChange={(e) => setProdutoForm({ ...produtoForm, preco_compra: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Preço Venda (R$)</label>
                  <input
                    type="number" step="0.01"
                    placeholder="250.00"
                    value={produtoForm.preco_venda}
                    onChange={(e) => setProdutoForm({ ...produtoForm, preco_venda: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Tamanho *</label>
                  <select
                    value={produtoForm.tamanho}
                    onChange={(e) => setProdutoForm({ ...produtoForm, tamanho: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors cursor-pointer"
                  >
                    {TAMANHOS.map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Quantidade Inicial *</label>
                  <input
                    type="number" required
                    placeholder="10"
                    value={produtoForm.quantidade_estoque}
                    onChange={(e) => setProdutoForm({ ...produtoForm, quantidade_estoque: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Fornecedor Associado</label>
                <select
                  value={produtoForm.fornecedor_id}
                  onChange={(e) => setProdutoForm({ ...produtoForm, fornecedor_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors cursor-pointer"
                >
                  <option value="">Nenhum fornecedor selecionado</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition cursor-pointer"
              >
                Cadastrar Produto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PRODUTO */}
      {showEditarProdutoModal && selectedProduto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => {
              setShowEditarProdutoModal(false);
              setSelectedProduto(null);
            }} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-lg font-bold text-white font-cinzel mb-4">Editar Dados do Produto</h3>
            
            <form onSubmit={handleEditarProduto} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nome do Produto *</label>
                <input
                  type="text" required
                  value={produtoForm.nome}
                  onChange={(e) => setProdutoForm({ ...produtoForm, nome: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                <textarea
                  value={produtoForm.descricao}
                  onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Categoria *</label>
                  <select
                    value={produtoForm.categoria}
                    onChange={(e) => setProdutoForm({ ...produtoForm, categoria: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors cursor-pointer"
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Estoque Mínimo *</label>
                  <input
                    type="number" required
                    value={produtoForm.estoque_minimo}
                    onChange={(e) => setProdutoForm({ ...produtoForm, estoque_minimo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Preço Compra (R$)</label>
                  <input
                    type="number" step="0.01"
                    value={produtoForm.preco_compra}
                    onChange={(e) => setProdutoForm({ ...produtoForm, preco_compra: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Preço Venda (R$)</label>
                  <input
                    type="number" step="0.01"
                    value={produtoForm.preco_venda}
                    onChange={(e) => setProdutoForm({ ...produtoForm, preco_venda: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Tamanho *</label>
                  <select
                    value={produtoForm.tamanho}
                    onChange={(e) => setProdutoForm({ ...produtoForm, tamanho: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors cursor-pointer"
                  >
                    {TAMANHOS.map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Fornecedor Associado</label>
                  <select
                    value={produtoForm.fornecedor_id}
                    onChange={(e) => setProdutoForm({ ...produtoForm, fornecedor_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors cursor-pointer"
                  >
                    <option value="">Nenhum fornecedor selecionado</option>
                    {fornecedores.map(f => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition cursor-pointer"
              >
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA MOVIMENTAÇÃO */}
      {showNovaMovimentacaoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowNovaMovimentacaoModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-lg font-bold text-white font-cinzel mb-4">Lançar Movimentação</h3>
            
            <form onSubmit={handleLancarMovimentacao} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Produto *</label>
                <select
                  required
                  value={movimentacaoForm.produto_id}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, produto_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors cursor-pointer"
                >
                  <option value="">Selecione o produto...</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (Saldo: {p.quantidade_estoque})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Tipo de Movimentação *</label>
                  <select
                    value={movimentacaoForm.tipo}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, tipo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors cursor-pointer"
                  >
                    <option value="entrada">Entrada (+)</option>
                    <option value="saida">Saída (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Quantidade *</label>
                  <input
                    type="number" required min="1"
                    placeholder="1"
                    value={movimentacaoForm.quantidade}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, quantidade: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Motivo / Descrição *</label>
                <input
                  type="text" required
                  placeholder="Ex: Compra com fornecedor, Venda para filiado, etc."
                  value={movimentacaoForm.motivo}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, motivo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition cursor-pointer"
              >
                Confirmar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO FORNECEDOR */}
      {showNovoFornecedorModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowNovoFornecedorModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-lg font-bold text-white font-cinzel mb-4">Cadastrar Novo Fornecedor</h3>
            
            <form onSubmit={handleCriarFornecedor} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nome / Empresa *</label>
                <input
                  type="text" required
                  placeholder="Ex: Koral Fight Co."
                  value={fornecedorForm.nome}
                  onChange={(e) => setFornecedorForm({ ...fornecedorForm, nome: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Pessoa de Contato</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Santos (Vendas)"
                  value={fornecedorForm.contato}
                  onChange={(e) => setFornecedorForm({ ...fornecedorForm, contato: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-9999"
                    value={fornecedorForm.telefone}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, telefone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="Ex: vendas@koral.com.br"
                    value={fornecedorForm.email}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-gradient-to-r from-gold to-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition cursor-pointer"
              >
                Cadastrar Fornecedor
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
