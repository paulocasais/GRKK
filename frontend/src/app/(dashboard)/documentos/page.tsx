'use client';

import React from 'react';
import { FileText, Download, ShieldAlert, Award, BookOpen } from 'lucide-react';

export default function DocumentosPage() {
  const docs = [
    { titulo: "Apostila Técnica de Kyu (Coloridas)", tipo: "Regulamento", desc: "Programa oficial de exames de faixa do 7º Kyu ao 1º Kyu.", icon: BookOpen },
    { titulo: "Manual de Competição Goju-Ryu 2026", tipo: "Regras", desc: "Regulamento técnico unificado para Kata e Kumite.", icon: FileText },
    { titulo: "Estatuto Oficial da Federação", tipo: "Institucional", desc: "Regimento interno e diretrizes organizacionais do dojo.", icon: ShieldAlert },
    { titulo: "Tabela de Taxas e Anuidades 2026", tipo: "Financeiro", desc: "Valores vigentes para credenciamentos e exames.", icon: Award },
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Documentação Oficial</h1>
        <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">Regulamentos, Manuais e Circulares da Federação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docs.map((doc, idx) => {
          const Icon = doc.icon;
          return (
            <div key={idx} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex items-start gap-4 transition hover:border-zinc-700">
              <div className="w-10 h-10 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[8px] font-bold uppercase tracking-wider text-gold-400 bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                  {doc.tipo}
                </span>
                <h3 className="text-sm font-bold text-white mt-2 leading-tight">{doc.titulo}</h3>
                <p className="text-xs text-zinc-450 mt-1 leading-relaxed">{doc.desc}</p>
                
                <button
                  onClick={() => alert('Download do arquivo simulado com sucesso!')}
                  className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-gold hover:text-gold-light uppercase tracking-wider cursor-pointer"
                >
                  <Download size={12} /> Download PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </main>
  );
}
