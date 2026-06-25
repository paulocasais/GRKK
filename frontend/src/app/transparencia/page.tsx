'use client';

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SectionHeader from "@/components/SectionHeader";
import { FileText, Download, Shield, Eye, ShieldCheck, ArrowRight, Loader2, BookOpen, Award } from "lucide-react";
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Documento {
  id?: string;
  titulo: string;
  tipo: string;
  desc: string;
  arquivo_url: string;
}

function getIcon(tipo: string) {
  switch (tipo) {
    case 'Regulamento': return <BookOpen size={20} />;
    case 'Regras': return <FileText size={20} />;
    case 'Institucional': return <Shield size={20} />;
    case 'Financeiro': return <Award size={20} />;
    default: return <FileText size={20} />;
  }
}

export default function TransparenciaPage() {
  const [codigo, setCodigo] = useState('');
  const router = useRouter();
  
  const [siteConfig, setSiteConfig] = useState({
    hero_title: 'Transparência',
    hero_subtitle: 'A GRKK atua com ética, responsabilidade e compromisso público.',
    hero_breadcrumb: 'Transparência',
    intro_text: 'A GRKK disponibiliza seu estatuto social, diretoria vigência, CNPJ, regulamentos e documentos institucionais para consulta pública, reafirmando seu compromisso com a transparência e a boa governança esportiva.',
    compromisso_title: 'Nosso Compromisso',
    compromisso_text: 'A GRKK atua como executora de projetos esportivos e sociais, operando de forma organizada, transparente e descentralizada, garantindo a lisura de suas atividades administrativas e esportivas.'
  });

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    document.title = 'Transparência - Goju-Ryu Karate Kai';
    
    // Carrega CMS config
    const carregarConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.config && data.config.transparencia) {
            setSiteConfig(prev => ({ ...prev, ...data.config.transparencia }));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar configurações do CMS:", err);
      }
    };

    // Carrega Documentos reais
    const carregarDocs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/documentos`);
        if (res.ok) {
          const data = await res.json();
          // Filtra apenas tipos pertinentes à transparência pública
          const publicTypes = ['Regulamento', 'Regras', 'Institucional', 'Financeiro'];
          const filtered = (data.documentos || []).filter((d: Documento) => publicTypes.includes(d.tipo));
          setDocumentos(filtered);
        }
      } catch (err) {
        console.error("Erro ao carregar documentos:", err);
      } finally {
        setLoadingDocs(false);
      }
    };

    carregarConfig();
    carregarDocs();
  }, []);

  const handleValidar = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) {
      router.push(`/transparencia/validar-certificado?codigo=${codigo.trim()}`);
    }
  };

  // Fallback caso a lista do banco esteja vazia
  const documentosExibidos = documentos.length > 0 ? documentos : [
    { titulo: "Estatuto Social", desc: "Documento constitutivo da GRKK com suas normas e objetivos.", tipo: "Institucional", arquivo_url: "" },
    { titulo: "Diretoria Vigente", desc: "Composição atual da diretoria executiva da federação.", tipo: "Institucional", arquivo_url: "" },
    { titulo: "CNPJ", desc: "Dados cadastrais da pessoa jurídica da GRKK.", tipo: "Institucional", arquivo_url: "" },
    { titulo: "Regulamentos", desc: "Normas e regulamentos técnicos e administrativos.", tipo: "Regulamento", arquivo_url: "" },
    { titulo: "Documentos Institucionais", desc: "Documentação oficial da federação.", tipo: "Institucional", arquivo_url: "" },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 pt-20">
        <PageHero
          title={siteConfig.hero_title}
          subtitle={siteConfig.hero_subtitle}
          breadcrumb={siteConfig.hero_breadcrumb}
        />

        <section className="bg-zinc-950 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-gray-400 leading-relaxed text-center max-w-2xl mx-auto text-sm font-body">
              {siteConfig.intro_text}
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

            {loadingDocs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {documentosExibidos.map((doc, i) => (
                  <div key={i} className="border border-zinc-900 bg-zinc-900/20 p-6 rounded-3xl group cursor-pointer hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all duration-300">
                        {getIcon(doc.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm mb-1 group-hover:text-primary transition font-cinzel truncate">
                          {doc.titulo}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed font-body line-clamp-3">{doc.desc || `Documento oficial da federação, sob a categoria ${doc.tipo}.`}</p>
                        {doc.arquivo_url ? (
                          <a
                            href={doc.arquivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light mt-3 font-body font-bold transition-colors cursor-pointer"
                          >
                            <Download size={12} /> Download PDF
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600 mt-3 font-body">
                            <Download size={10} /> Em breve
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-zinc-950 py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center">
              <Shield size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-4 font-cinzel">{siteConfig.compromisso_title}</h2>
            <div className="w-12 h-0.5 bg-primary mx-auto mb-6" />
            <p className="text-gray-400 leading-relaxed font-body text-sm">
              {siteConfig.compromisso_text}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
