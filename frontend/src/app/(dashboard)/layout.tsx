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
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-zinc-500 font-cinzel text-xs tracking-widest uppercase">Carregando painel...</p>
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
