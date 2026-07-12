'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DojoKunInteractive from '@/components/DojoKunInteractive';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function DojoKunPublicPage() {
  const [preambulo, setPreambulo] = useState('Os cinco preceitos que regem a mente e o corpo dos praticantes de Karatê Tradicional. Mais do que regras de comportamento dentro do Dojo, são diretrizes morais para a vida.');

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.config?.dojo_kun?.preambulo) {
            setPreambulo(data.config.dojo_kun.preambulo);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar preambulo do Dojo Kun:", err);
      }
    }
    loadConfig();
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 pt-20">
        
        {/* Hero Banner */}
        <section className="relative pt-32 pb-20 border-b border-zinc-900/60 overflow-hidden">
          {/* Background glow effects */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gold/10 rounded-full blur-[140px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 text-center space-y-4 relative z-10">
            <p className="text-primary font-cinzel text-xs sm:text-sm tracking-[0.3em] uppercase">Código de Conduta</p>
            
            {/* Calligraphy Kanji title */}
            <h1 className="font-cinzel text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-400 to-zinc-800 tracking-widest leading-none select-none">
              道場訓
            </h1>

            <h2 className="text-2xl sm:text-3xl font-cinzel text-white tracking-[0.25em] font-semibold uppercase pt-2">
              Dojo Kun
            </h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-4" />
            
            <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-sans pt-4 whitespace-pre-line">
              {preambulo}
            </p>
          </div>
        </section>

        {/* Interactive Menu Section */}
        <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            <DojoKunInteractive />
          </div>
        </section>

        {/* Philosophy Footer Card */}
        <section className="pb-20 px-4 md:px-8 lg:px-16 bg-zinc-950">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-3xl border border-zinc-900 bg-gradient-to-br from-zinc-900/40 to-zinc-950/60 p-8 sm:p-12 text-center space-y-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              
              <span className="text-[10px] font-semibold text-gold tracking-widest uppercase block font-cinzel">
                A Filosofia da Recitação
              </span>
              
              <h3 className="font-cinzel text-white text-lg sm:text-xl font-bold">
                "Por que cada preceito começa com 'Hitotsu'?"
              </h3>

              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-sans">
                Tradicionalmente, ao recitar o Dojo Kun no encerramento de cada treino, todos os preceitos são iniciados com a palavra <strong>Hitotsu (一)</strong>, que significa "Primeiro" ou "Um". 
                Isso demonstra que não existe uma hierarquia entre os ensinamentos: nenhum princípio é mais importante que o outro. Todos possuem o mesmo peso e devem ser observados com a mesma dedicação absoluta.
              </p>

              <div className="w-12 h-px bg-zinc-800 mx-auto" />

              <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                Praticado e recitado nas escolas tradicionais de Goju-Ryu no mundo inteiro.
              </p>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
