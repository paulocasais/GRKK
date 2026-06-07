'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar } from 'lucide-react';
import ImageLightbox from '@/components/ImageLightbox';

interface Evento {
  id: string | number;
  titulo: string;
  descricao: string;
  tipo: string;
  data_inicio: string;
  data_fim?: string;
  imagem_url?: string;
  link_regulamento?: string;
  link_resultados?: string;
}

const typeColors: Record<string, string> = {
  'Graduação': 'text-gold border-gold/30',
  'Seminário': 'text-blue-400 border-blue-400/30',
  'Competição': 'text-primary border-primary/30',
  'Graduacao': 'text-gold border-gold/30',
  'Seminario': 'text-blue-400 border-blue-400/30',
  'Competicao': 'text-primary border-primary/30',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEventos() {
      try {
        const res = await fetch(`${API_URL}/api/eventos`);
        if (!res.ok) throw new Error('Erro ao carregar eventos');
        const data = await res.json();
        setEventos(data.eventos || []);
      } catch (err) {
        console.error('Erro ao buscar eventos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEventos();
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 pt-20">
        <section className="relative pt-32 pb-20 border-b border-zinc-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #c41e2a 0%, transparent 60%)' }} />
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
            <p className="text-primary font-cinzel text-xs tracking-[0.3em] uppercase mb-4">Calendário</p>
            <h1 className="font-cinzel text-5xl md:text-6xl font-bold text-white leading-tight mb-6">Eventos</h1>
            <div className="w-16 h-0.5 bg-primary" />
          </div>
        </section>

        <section className="py-20 px-4 md:px-8 lg:px-16 bg-zinc-950">
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : eventos.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-cinzel">
                Nenhum evento cadastrado no momento.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {eventos.map((evento) => {
                  const date = new Date(evento.data_inicio + 'T00:00:00');
                  const day = date.getDate().toString().padStart(2, '0');
                  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
                  const year = date.getFullYear();
                  const tipoExibido = evento.tipo || 'Competição';
                  const typeClass = typeColors[tipoExibido] || 'text-gray-400 border-gray-400/30';

                  return (
                    <div key={evento.id}
                      className="flex flex-col md:flex-row gap-6 p-6 md:p-8 border border-zinc-900 bg-zinc-900/40 rounded-3xl hover:border-primary/20 transition-all duration-300">
                      {/* Image/Banner */}
                      <ImageLightbox
                        src={evento.imagem_url || 'https://images.unsplash.com/photo-1555597673-b21d5c935865'}
                        alt={evento.titulo}
                        className="flex-shrink-0 w-full md:w-44 h-28 border border-zinc-900 rounded-xl overflow-hidden"
                      />
                      {/* Date */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 border border-zinc-900 bg-zinc-950 text-center rounded-2xl">
                        <span className="font-cinzel text-primary text-2xl font-bold leading-none">{day}</span>
                        <span className="font-cinzel text-gray-500 text-xs tracking-wider">{month}</span>
                        <span className="font-cinzel text-gray-600 text-xs">{year}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="font-cinzel text-white text-xl font-bold">{evento.titulo}</h3>
                          <span className={`flex-shrink-0 text-xs font-cinzel border px-3 py-1 uppercase tracking-wider rounded-full ${typeClass}`}>
                            {tipoExibido}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4 font-body">{evento.descricao}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          {evento.data_fim && (
                            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-primary" /> Término: {new Date(evento.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                          )}
                          {evento.link_regulamento && (
                            <a href={evento.link_regulamento} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                              Regulamento
                            </a>
                          )}
                          {evento.link_resultados && (
                            <a href={evento.link_resultados} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:underline">
                              Resultados
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
