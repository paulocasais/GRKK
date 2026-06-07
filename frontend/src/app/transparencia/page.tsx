'use client';

import React, { useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SectionHeader from "@/components/SectionHeader";
import { FileText, Download, Shield, Eye, ShieldCheck, ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';

const DOCUMENTOS = [
  { title: "Estatuto Social", desc: "Documento constitutivo da GRKK com suas normas e objetivos.", icon: <FileText size={20} /> },
  { title: "Diretoria Vigente", desc: "Composição atual da diretoria executiva da federação.", icon: <Shield size={20} /> },
  { title: "CNPJ", desc: "Dados cadastrais da pessoa jurídica da GRKK.", icon: <Eye size={20} /> },
  { title: "Regulamentos", desc: "Normas e regulamentos técnicos e administrativos.", icon: <FileText size={20} /> },
  { title: "Documentos Institucionais", desc: "Documentação oficial da federação.", icon: <FileText size={20} /> },
];

export default function TransparenciaPage() {
  const [codigo, setCodigo] = useState('');
  const router = useRouter();

  const handleValidar = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) {
      // Usar query string para compatibilidade total com exportação estática
      router.push(`/transparencia/validar-certificado?codigo=${codigo.trim()}`);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 pt-20">
        <PageHero
          title="Transparência"
          subtitle="A GRKK atua com ética, responsabilidade e compromisso público."
          breadcrumb="Transparência"
        />

        <section className="bg-zinc-950 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-gray-400 leading-relaxed text-center max-w-2xl mx-auto text-sm font-body">
              A GRKK disponibiliza seu estatuto social, diretoria vigência, CNPJ, regulamentos e documentos
              institucionais para consulta pública, reafirmando seu compromisso com a transparência e a boa
              governança esportiva.
            </p>
          </div>
        </section>

        {/* Seção de Validação de Certificado via Código Verificador */}
        <section className="bg-zinc-900/30 py-16 border-t border-zinc-900">
          <div className="max-w-xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white font-cinzel">Autenticar Certificado Online</h2>
              <p className="text-xs text-gray-500 font-body">Insira o código de validação do certificado para verificar sua autenticidade.</p>
            </div>
            <form onSubmit={handleValidar} className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                required
                placeholder="Ex: 5d8a9e4b7c..."
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs bg-zinc-950 border border-zinc-900 rounded-xl text-white placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-primary transition font-body"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-white font-black text-xs uppercase rounded-xl hover:scale-105 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                Validar <ArrowRight size={13} />
              </button>
            </form>
          </div>
        </section>

        <section className="bg-zinc-950 py-20 border-y border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Documentos Públicos"
              subtitle="Acesse os documentos institucionais da GRKK"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {DOCUMENTOS.map((doc, i) => (
                <div key={i} className="border border-zinc-900 bg-zinc-900/20 p-6 rounded-3xl group cursor-pointer hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all duration-300">
                      {doc.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm mb-1 group-hover:text-primary transition font-cinzel">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed font-body">{doc.desc}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600 mt-2 font-body">
                        <Download size={10} /> Em breve
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-zinc-950 py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center">
              <Shield size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-4 font-cinzel">Nosso Compromisso</h2>
            <div className="w-12 h-0.5 bg-primary mx-auto mb-6" />
            <p className="text-gray-400 leading-relaxed font-body">
              A GRKK atua como executora de projetos esportivos e sociais, operando de forma organizada,
              transparente e descentralizada, garantindo a lisura de suas atividades administrativas e esportivas.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
