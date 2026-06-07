'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Newspaper, Plus, Search, Edit2, Trash2, X, Loader2, Calendar } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Noticia {
  id: string | number;
  titulo: string;
  subtitulo: string;
  conteudo: string;
  categoria: string;
  imagem_url?: string;
  publicado: boolean;
  created_at: string;
}

export default function NoticiasPage() {
  const { usuario, isAdmin } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [form, setForm] = useState({ titulo: '', subtitulo: '', conteudo: '', categoria: 'Eventos', imagem_url: '', publicado: true });
  const [salvando, setSalvando] = useState(false);

  const carregarNoticias = async () => {
    try {
      const res = await fetch(`${API_URL}/api/noticias`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNoticias(data.noticias || []);
      }
    } catch (err) {
      console.error("Erro ao carregar notícias, usando dados mock:", err);
      setNoticias([
        { id: 1, titulo: "Exame Geral de Faixas Pretas 2026", subtitulo: "Abertura oficial de inscrições de Kyu e Dan", conteudo: "Inscrições abertas até dia 20 de Junho...", categoria: "Graduações", publicado: true, created_at: new Date().toISOString() },
        { id: 2, titulo: "Seminário Técnico com Sensei Tanaka", subtitulo: "Treinamento intensivo de Kata tradicional", conteudo: "O seminário ocorrerá no Dojo Central no dia 15 de Julho...", categoria: "Treinamentos", publicado: true, created_at: new Date(Date.now() - 86400000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarNoticias();
  }, []);

  const handleOpenCreate = () => {
    setEditingNoticia(null);
    setForm({ titulo: '', subtitulo: '', conteudo: '', categoria: 'Eventos', imagem_url: '', publicado: true });
    setShowModal(true);
  };

  const handleOpenEdit = (noticia: Noticia) => {
    setEditingNoticia(noticia);
    setForm({
      titulo: noticia.titulo,
      subtitulo: noticia.subtitulo,
      conteudo: noticia.conteudo,
      categoria: noticia.categoria,
      imagem_url: noticia.imagem_url || '',
      publicado: noticia.publicado
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const method = editingNoticia ? 'PATCH' : 'POST';
      const endpoint = editingNoticia ? `${API_URL}/api/noticias/${editingNoticia.id}` : `${API_URL}/api/noticias`;
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (editingNoticia) {
          setNoticias(noticias.map(n => n.id === editingNoticia.id ? { ...n, ...form } : n));
        } else {
          setNoticias([data.noticia || data, ...noticias]);
        }
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      if (editingNoticia) {
        setNoticias(noticias.map(n => n.id === editingNoticia.id ? { ...n, ...form } : n));
      } else {
        const mockNew: Noticia = {
          id: Date.now(),
          ...form,
          created_at: new Date().toISOString()
        };
        setNoticias([mockNew, ...noticias]);
      }
      setShowModal(false);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string | number) => {
    if (!confirm("Deseja realmente excluir esta notícia?")) return;

    try {
      const res = await fetch(`${API_URL}/api/noticias/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setNoticias(noticias.filter(n => n.id !== id));
      }
    } catch (err) {
      setNoticias(noticias.filter(n => n.id !== id));
    }
  };

  const noticiasFiltradas = noticias.filter(n => 
    n.titulo.toLowerCase().includes(busca.toLowerCase()) || 
    n.subtitulo.toLowerCase().includes(busca.toLowerCase())
  );

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
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Notícias & Comunicados</h1>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold font-sans">Gerenciamento de publicações oficiais</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} /> Nova Notícia
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="relative max-w-xs">
        <input
          type="text"
          placeholder="Buscar notícias..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
        />
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
      </div>

      {/* Grid de Notícias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {noticiasFiltradas.map(noticia => (
          <div key={noticia.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gold bg-gold/10 rounded border border-gold/20">
                  {noticia.categoria}
                </span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                  <Calendar size={11} />
                  {new Date(noticia.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white font-cinzel leading-snug">{noticia.titulo}</h3>
              <p className="text-xs text-zinc-400 font-medium">{noticia.subtitulo}</p>
              <p className="text-[11px] text-zinc-500 line-clamp-3 leading-relaxed">{noticia.conteudo}</p>
            </div>

            {isAdmin && (
              <div className="flex gap-2 pt-4 border-t border-zinc-800/40">
                <button
                  onClick={() => handleOpenEdit(noticia)}
                  className="flex-1 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Edit2 size={12} /> Editar
                </button>
                <button
                  onClick={() => handleExcluir(noticia.id)}
                  className="flex-1 py-2 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} /> Excluir
                </button>
              </div>
            )}
          </div>
        ))}

        {noticiasFiltradas.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
            Nenhuma notícia cadastrada.
          </div>
        )}
      </div>

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-5">{editingNoticia ? 'Editar Notícia' : 'Nova Notícia'}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título *</label>
                <input
                  type="text" required
                  placeholder="Ex: Novo Dojo homologado"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo *</label>
                <input
                  type="text" required
                  placeholder="Resumo curto da notícia"
                  value={form.subtitulo}
                  onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Categoria *</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  >
                    <option value="Eventos">Eventos</option>
                    <option value="Graduações">Graduações</option>
                    <option value="Treinamentos">Treinamentos</option>
                    <option value="Comunicados">Comunicados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL da Imagem (Opcional)</label>
                  <input
                    type="text"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={form.imagem_url}
                    onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Conteúdo da Notícia *</label>
                <textarea
                  required rows={5}
                  placeholder="Escreva a matéria ou comunicado aqui..."
                  value={form.conteudo}
                  onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer flex items-center justify-center"
                >
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : 'Salvar Notícia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
