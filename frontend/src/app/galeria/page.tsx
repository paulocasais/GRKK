'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ImageLightbox from '@/components/ImageLightbox';

interface GalleryItem {
  id: string | number;
  title: string;
  image_url: string;
  type: string;
  category: string;
  order: number;
}

const categorias = ['Todos', 'Treinos', 'Eventos', 'Gasshukus', 'Graduações'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function GaleriaPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await fetch(`${API_URL}/api/galeria`);
        if (!res.ok) throw new Error('Erro ao carregar galeria');
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error('Erro ao carregar galeria:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'Todos') return true;

    // Normalização básica de acentos para comparação
    const normActive = activeCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normItem = item.category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    return normActive === normItem;
  });

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 pt-20">
        <section className="relative pt-32 pb-20 border-b border-zinc-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #c41e2a 0%, transparent 60%)' }} />
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
            <p className="text-primary font-cinzel text-xs tracking-[0.3em] uppercase mb-4">Memórias e Momentos</p>
            <h1 className="font-cinzel text-5xl md:text-6xl font-bold text-white leading-tight mb-6">Galeria</h1>
            <div className="w-16 h-0.5 bg-primary" />
          </div>
        </section>

        <section className="py-20 px-4 md:px-8 lg:px-16 bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            {/* Filter */}
            <div className="flex flex-wrap gap-3 mb-12">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`font-cinzel text-xs tracking-widest uppercase px-5 py-2 border rounded-full transition-all duration-200 cursor-pointer ${cat === activeCategory
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'border-zinc-900 text-gray-400 hover:border-primary hover:text-primary'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 font-cinzel">Nenhuma imagem encontrada nesta categoria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="aspect-square bg-zinc-900 border border-zinc-900 rounded-3xl overflow-hidden relative group hover:border-primary/20 transition-all duration-300">
                    <ImageLightbox
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 right-4 pointer-events-none bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-xs font-cinzel truncate">{item.title}</p>
                      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-gray-600 text-sm mt-12 font-cinzel">
              As fotos serão adicionadas pelo administrador no painel de controle.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
