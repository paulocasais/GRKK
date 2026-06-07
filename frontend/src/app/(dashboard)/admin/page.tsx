'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Layout, Settings, Image, Users, Plus, Trash2, ShieldAlert, Loader2, Save, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Banner {
  id: string | number;
  titulo: string;
  subtitulo: string;
  link?: string;
  imagem_url: string;
}

interface TeamMember {
  id: string | number;
  nome: string;
  cargo: string; // ex: Sensei 4º Dan
  biografia: string;
  foto_url: string;
  order: number;
}

interface GalleryItem {
  id: string | number;
  title: string;
  category: string;
  image_url: string;
  order: number;
}

export default function AdminCMSPage() {
  const { usuario, tipo } = useAuth();
  const [activeTab, setActiveTab] = useState<'banners' | 'equipe' | 'galeria'>('banners');
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [equipe, setEquipe] = useState<TeamMember[]>([]);
  const [galeria, setGaleria] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Forms
  const [bannerForm, setBannerForm] = useState({ titulo: '', subtitulo: '', link: '', imagem_url: '' });
  const [teamForm, setTeamForm] = useState({ nome: '', cargo: '', biografia: '', foto_url: '', order: 0 });
  const [galleryForm, setGalleryForm] = useState({ title: '', category: 'Dojo', image_url: '', order: 0 });

  const carregarCMS = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
        setEquipe(data.equipe || []);
        setGaleria(data.galeria || []);
      }
    } catch (err) {
      console.error("Erro ao carregar CMS, usando dados offline:", err);
      // Fallback local
      setBanners([
        { id: 1, titulo: "Karatê Tradicional Goju-Ryu", subtitulo: "Força e suavidade unidas na busca do autodomínio.", imagem_url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=1200" }
      ]);
      setEquipe([
        { id: 1, nome: "Sensei Paulo Roberto", cargo: "Faixa Preta 4º Dan", biografia: "Coordenador da Federação com mais de 25 anos de prática.", foto_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300", order: 1 }
      ]);
      setGaleria([
        { id: 1, title: "Treino de Kata", category: "Katas", image_url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=300", order: 1 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tipo === 'admin') {
      carregarCMS();
    } else {
      setLoading(false);
    }
  }, [tipo]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    let payload = {};
    if (activeTab === 'banners') payload = bannerForm;
    else if (activeTab === 'equipe') payload = teamForm;
    else if (activeTab === 'galeria') payload = galleryForm;

    try {
      const res = await fetch(`${API_URL}/api/cms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tipo: activeTab.slice(0, -1) === 'equip' ? 'equipe' : activeTab.slice(0, -1), payload })
      });
      if (res.ok) {
        const data = await res.json();
        if (activeTab === 'banners') setBanners([...banners, data]);
        else if (activeTab === 'equipe') setEquipe([...equipe, data]);
        else if (activeTab === 'galeria') setGaleria([...galeria, data]);
        setShowModal(false);
      }
    } catch (err) {
      // Fallback local
      const mockItem = { id: Date.now(), ...payload };
      if (activeTab === 'banners') setBanners([...banners, mockItem as any]);
      else if (activeTab === 'equipe') setEquipe([...equipe, mockItem as any]);
      else if (activeTab === 'galeria') setGaleria([...galeria, mockItem as any]);
      setShowModal(false);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string | number) => {
    if (!confirm("Excluir item permanentemente?")) return;

    try {
      const tipoItem = activeTab.slice(0, -1) === 'equip' ? 'equipe' : activeTab.slice(0, -1);
      const res = await fetch(`${API_URL}/api/cms/${tipoItem}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        if (activeTab === 'banners') setBanners(banners.filter(b => b.id !== id));
        else if (activeTab === 'equipe') setEquipe(equipe.filter(e => e.id !== id));
        else if (activeTab === 'galeria') setGaleria(galeria.filter(g => g.id !== id));
      }
    } catch (err) {
      if (activeTab === 'banners') setBanners(banners.filter(b => b.id !== id));
      else if (activeTab === 'equipe') setEquipe(equipe.filter(e => e.id !== id));
      else if (activeTab === 'galeria') setGaleria(galeria.filter(g => g.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (tipo !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-white font-cinzel">Acesso Negado</h2>
        <p className="text-zinc-500 text-sm">Painel restrito para controle do conteúdo do site institucional.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Gerenciador de Site (CMS)</h1>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold font-sans">Administração dinâmica do portal público</p>
        </div>

        <button
          onClick={() => {
            setBannerForm({ titulo: '', subtitulo: '', link: '', imagem_url: '' });
            setTeamForm({ nome: '', cargo: '', biografia: '', foto_url: '', order: equipe.length + 1 });
            setGalleryForm({ title: '', category: 'Dojo', image_url: '', order: galeria.length + 1 });
            setShowModal(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} /> Adicionar Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-zinc-900 p-1 border border-zinc-800 rounded-xl w-full sm:max-w-md">
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'banners' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Layout size={12} /> Banners
        </button>
        <button
          onClick={() => setActiveTab('equipe')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'equipe' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Users size={12} /> Equipe
        </button>
        <button
          onClick={() => setActiveTab('galeria')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'galeria' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Image size={12} /> Galeria
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {activeTab === 'banners' && banners.map(banner => (
          <div key={banner.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="h-40 bg-zinc-950 relative">
              {banner.imagem_url ? (
                <img src={banner.imagem_url} alt={banner.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-650"><Image size={32} /></div>
              )}
            </div>
            <div className="p-5 space-y-2.5">
              <h3 className="text-sm font-bold text-white font-cinzel">{banner.titulo}</h3>
              <p className="text-xs text-zinc-450 leading-relaxed">{banner.subtitulo}</p>
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => handleExcluir(banner.id)}
                className="w-full py-2 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 size={12} /> Remover
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'equipe' && equipe.map(member => (
          <div key={member.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="h-44 bg-zinc-950 relative flex items-center justify-center pt-4">
              <img src={member.foto_url} alt={member.nome} className="w-28 h-28 rounded-full object-cover border-2 border-primary" />
            </div>
            <div className="p-5 text-center space-y-2">
              <h3 className="text-sm font-bold text-white font-cinzel">{member.nome}</h3>
              <span className="text-[9px] font-bold uppercase tracking-wider text-gold-400 bg-gold/10 px-2.5 py-0.5 rounded border border-gold/20 inline-block">
                {member.cargo}
              </span>
              <p className="text-xs text-zinc-500 line-clamp-3 pt-2">{member.biografia}</p>
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => handleExcluir(member.id)}
                className="w-full py-2 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 size={12} /> Remover
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'galeria' && galeria.map(img => (
          <div key={img.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="h-40 bg-zinc-950 relative">
              <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
              <span className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white bg-black/60 rounded">
                {img.category}
              </span>
            </div>
            <div className="p-4">
              <h4 className="text-xs font-bold text-white truncate">{img.title}</h4>
            </div>
            <div className="p-4 pt-0">
              <button
                onClick={() => handleExcluir(img.id)}
                className="w-full py-2 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 size={12} /> Remover
              </button>
            </div>
          </div>
        ))}

      </div>

      {/* MODAL ADICIONAR ITEM */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-5 uppercase tracking-wide">Adicionar Novo {activeTab.slice(0, -1)}</h3>

            <form onSubmit={handleSalvar} className="space-y-4">
              
              {activeTab === 'banners' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título do Slide *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Treine Goju-Ryu Karate"
                      value={bannerForm.titulo}
                      onChange={(e) => setBannerForm({ ...bannerForm, titulo: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo *</label>
                    <input
                      type="text" required
                      placeholder="Subtexto curto descritivo"
                      value={bannerForm.subtitulo}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitulo: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Link de destino (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: /sobre"
                      value={bannerForm.link}
                      onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL da Imagem de Fundo *</label>
                    <input
                      type="text" required
                      placeholder="https://images.unsplash.com/..."
                      value={bannerForm.imagem_url}
                      onChange={(e) => setBannerForm({ ...bannerForm, imagem_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'equipe' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nome Completo *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Sensei João da Silva"
                      value={teamForm.nome}
                      onChange={(e) => setTeamForm({ ...teamForm, nome: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Cargo / Graduação *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Sensei 3º Dan"
                      value={teamForm.cargo}
                      onChange={(e) => setTeamForm({ ...teamForm, cargo: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Breve Biografia *</label>
                    <textarea
                      required rows={3}
                      placeholder="Histórico técnico e conquistas..."
                      value={teamForm.biografia}
                      onChange={(e) => setTeamForm({ ...teamForm, biografia: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL da Foto de Perfil *</label>
                    <input
                      type="text" required
                      placeholder="https://images.unsplash.com/..."
                      value={teamForm.foto_url}
                      onChange={(e) => setTeamForm({ ...teamForm, foto_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'galeria' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Legenda da Imagem *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Exame de Faixas em Salvador"
                      value={galleryForm.title}
                      onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Categoria *</label>
                      <select
                        value={galleryForm.category}
                        onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                      >
                        <option value="Dojo">Dojo</option>
                        <option value="Torneios">Torneios</option>
                        <option value="Katas">Katas</option>
                        <option value="Exames">Exames</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Ordem Visual *</label>
                      <input
                        type="number" required
                        value={galleryForm.order}
                        onChange={(e) => setGalleryForm({ ...galleryForm, order: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL da Imagem *</label>
                    <input
                      type="text" required
                      placeholder="https://images.unsplash.com/..."
                      value={galleryForm.image_url}
                      onChange={(e) => setGalleryForm({ ...galleryForm, image_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                </>
              )}

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
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
