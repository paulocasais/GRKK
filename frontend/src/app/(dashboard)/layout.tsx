'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import DashTopBar from '@/components/dashboard/DashTopBar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { carregando, autenticado } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!carregando && !autenticado) {
      router.push('/auth');
    }
  }, [carregando, autenticado, router]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center relative overflow-hidden select-none">
        {/* Animação personalizada da barra de carregamento */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loadingBar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-loading-bar-inner {
            animation: loadingBar 2.5s infinite ease-in-out;
          }
        `}} />

        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-650/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold/5 rounded-full blur-[80px] pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-xs text-center">
          {/* Logo container with elegant pulse and border glow */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-3.5 shadow-2xl flex items-center justify-center animate-pulse">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-red-600/10 to-gold/10 opacity-30" />
            <img 
              src="/logo.png" 
              alt="Logo GRKK" 
              className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(220,38,38,0.25)]"
            />
          </div>

          {/* Typography */}
          <div className="space-y-1.5">
            <h2 className="text-white font-cinzel text-xs tracking-[0.25em] font-black uppercase">
              Goju-Ryu Karate Kai
            </h2>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
              Acessando portal...
            </p>
          </div>

          {/* Premium loading bar */}
          <div className="w-40 h-[3px] bg-zinc-900 border border-zinc-850/50 rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 via-gold to-red-600 w-24 rounded-full animate-loading-bar-inner" />
          </div>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return null; // O useEffect irá redirecionar
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex font-sans">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <DashTopBar onMenuOpen={() => setSidebarOpen(true)} />
        <div className="flex-1 w-full bg-zinc-950">
          {children}
        </div>
      </div>
    </div>
  );
}
