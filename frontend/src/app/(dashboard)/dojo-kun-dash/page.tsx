'use client';

import React from 'react';
import DojoKunInteractive from '@/components/DojoKunInteractive';

export default function DojoKunDashboardPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Title block */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-6">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-white tracking-wide">Dojo Kun</h1>
          <p className="text-zinc-500 text-xs mt-1">Preceitos de conduta filosófica e moral para os karatecas do Goju-Ryu.</p>
        </div>
        
        <div className="text-right">
          <span className="text-2xl font-black text-zinc-800 font-cinzel leading-none select-none tracking-widest">
            道場訓
          </span>
        </div>
      </div>

      {/* Interactive content */}
      <DojoKunInteractive />

    </main>
  );
}

