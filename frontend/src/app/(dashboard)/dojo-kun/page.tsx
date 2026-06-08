'use client';

import React from 'react';
import { BookOpen, Shield, Flame, Compass, Award } from 'lucide-react';

const preceitos = [
  {
    numero: 'I',
    jp: 'Hitotsu — Reigi o omonzuru koto',
    pt: 'Respeitar a etiqueta e a cortesia acima de tudo',
    desc: 'O Karatê começa e termina com respeito. Valorizar os outros, os instrutores e o dojo reflete a nobreza e a modéstia do verdadeiro artista marcial.',
    icon: Compass
  },
  {
    numero: 'II',
    jp: 'Hitotsu — Yuki o yashinau koto',
    pt: 'Cultivar a coragem e a força interior',
    desc: 'Superar o medo físico e mental. A coragem não é a ausência de medo, mas sim a capacidade de enfrentá-lo com firmeza e integridade.',
    icon: Flame
  },
  {
    numero: 'III',
    jp: 'Hitotsu — Dento karate o mamori hibi no tanren o okotarazu',
    pt: 'Proteger o Karatê tradicional e praticar diariamente sem falhar',
    desc: 'Manter viva a linhagem clássica de Okinawa. A constância no treinamento diário (tanren) lapida o caráter e fortalece a técnica do praticante.',
    icon: Shield
  },
  {
    numero: 'IV',
    jp: 'Hitotsu — Shinshin o renma shi Goju-Ryu Karate no shinzui o kiwameru koto',
    pt: 'Treinar o corpo e a mente para alcançar a essência do Goju-Ryu',
    desc: 'Buscar o equilíbrio perfeito entre o forte (Go) e o suave (Ju). A união do desenvolvimento físico com a elevação espiritual é o verdadeiro caminho.',
    icon: BookOpen
  },
  {
    numero: 'V',
    jp: 'Hitotsu — Futo fukutsu no seishin o yashinau koto',
    pt: 'Nutrir um espírito indomável e de perseverança eterna',
    desc: 'Diante das maiores adversidades, manter-se inabalável. Nunca recuar, nunca desistir e perseverar até alcançar a vitória pessoal.',
    icon: Award
  }
];

export default function DojoKunPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-10 w-full max-w-5xl mx-auto">
      
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950/40 p-8 sm:p-12 text-center space-y-4">
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gold/5 rounded-full blur-[120px]" />
        </div>

        <p className="text-primary font-cinzel text-xs sm:text-sm tracking-[0.3em] uppercase">Preceitos de Conduta do Dojo</p>
        
        {/* Big Kanji */}
        <h1 className="font-cinzel text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-red-800 to-zinc-900 tracking-widest leading-none">
          道場訓
        </h1>
        
        <h2 className="text-xl sm:text-2xl font-cinzel text-zinc-400 tracking-[0.2em] font-semibold uppercase">Dojo Kun</h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-4" />
        
        <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed font-sans pt-2">
          Os cinco princípios fundamentais de comportamento e filosofia deixados pelos mestres fundadores para guiar a evolução do karateca dentro e fora do Dojo.
        </p>
      </div>

      {/* Precept Cards */}
      <div className="space-y-6">
        {preceitos.map((p, index) => {
          const Icon = p.icon;
          return (
            <div 
              key={index} 
              className="group relative bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-850 hover:border-primary/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start transition-all duration-500 overflow-hidden"
            >
              {/* Gold vertical bar on hover */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center" />

              {/* Icon / Number badge */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-primary group-hover:border-primary/40 transition duration-500">
                  <Icon size={20} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-cinzel font-black text-zinc-800 group-hover:text-primary/20 transition duration-500">
                  {p.numero}
                </div>
              </div>

              {/* Text contents */}
              <div className="flex-1 space-y-2">
                <p className="text-[11px] sm:text-xs font-mono text-zinc-500 italic uppercase tracking-wider">{p.jp}</p>
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-primary transition duration-500 font-cinzel tracking-wide leading-snug">
                  {p.pt}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-450 leading-relaxed font-sans pt-1">
                  {p.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Philosophy Callout */}
      <div className="bg-gradient-to-r from-zinc-950/80 via-zinc-900/60 to-zinc-950/80 border border-zinc-850 p-8 rounded-3xl text-center space-y-3.5 max-w-2xl mx-auto">
        <p className="text-gold font-cinzel text-[10px] tracking-widest uppercase font-bold">Kempo Hakku — Poema de Okinawa</p>
        <p className="text-sm text-zinc-350 italic leading-relaxed font-serif">
          "A mente humana deve ser uma só com o céu e a terra.<br/>
          O ritmo circulatório do corpo é o mesmo que o do sol e da lua.<br/>
          A lei da inspiração e expiração reside tanto na força quanto na suavidade."
        </p>
        <div className="w-8 h-px bg-zinc-800 mx-auto mt-2" />
        <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest">Base filosófica que deu nome ao Goju-Ryu</p>
      </div>

    </main>
  );
}
