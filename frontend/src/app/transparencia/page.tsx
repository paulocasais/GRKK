'use client';

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SectionHeader from "@/components/SectionHeader";
import { FileText, Download, Shield, Eye, ShieldCheck, ArrowRight, Loader2, BookOpen, Award } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    compromisso_text: 'A GRKK atua como executora de projetos esportivos e sociais, operando de forma organizada, transparente e descentralizada, garantindo a lisura de suas atividades administrativas e esportivas.',
    doc_estatuto: { titulo: 'Estatuto Social', desc: 'Documento constitutivo da GRKK com suas normas e objetivos.', tipo: 'Institucional', arquivo_url: '' },
    doc_diretoria: { titulo: 'Diretoria Vigente', desc: 'Composição atual da diretoria executiva da associação.', tipo: 'Institucional', arquivo_url: '' },
    doc_cnpj: { titulo: 'CNPJ', desc: 'Dados cadastrais da pessoa jurídica da GRKK.', tipo: 'Institucional', arquivo_url: '' },
    doc_regulamentos: { titulo: 'Regulamentos', desc: 'Normas e regulamentos técnicos e administrativos.', tipo: 'Regulamento', arquivo_url: '' },
    doc_docs_institucionais: { titulo: 'Documentos Institucionais', desc: 'Documentação oficial da associação.', tipo: 'Institucional', arquivo_url: '' },
    doc_termos: { titulo: 'Termos de Serviço', desc: 'Condições de uso do Portal GRKK.', tipo: 'Institucional', arquivo_url: '/transparencia/termos' },
    doc_privacidade: { titulo: 'Aviso de Privacidade', desc: 'Política de tratamento de dados pessoais.', tipo: 'Institucional', arquivo_url: '/transparencia/privacidade' },
    doc_defesa_marca: { titulo: 'Defesa de Marca – Goju-Ryu Karate-Kai', desc: 'Apresentação sobre branding e proteção da marca.', tipo: 'Institucional', arquivo_url: '/transparencia/defesa-marca' },
  });

  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    document.title = 'Transparência - Goju-Ryu Karate Kai';
    
    // Carrega CMS config
    const carregarConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setSiteConfig(prev => ({
              ...prev,
              ...(data.config.transparencia || {}),
              doc_estatuto: data.config.doc_estatuto || prev.doc_estatuto,
              doc_diretoria: data.config.doc_diretoria || prev.doc_diretoria,
              doc_cnpj: data.config.doc_cnpj || prev.doc_cnpj,
              doc_regulamentos: data.config.doc_regulamentos || prev.doc_regulamentos,
              doc_docs_institucionais: data.config.doc_docs_institucionais || prev.doc_docs_institucionais,
              doc_termos: data.config.doc_termos || prev.doc_termos,
              doc_privacidade: data.config.doc_privacidade || prev.doc_privacidade,
              doc_defesa_marca: data.config.doc_defesa_marca || prev.doc_defesa_marca,
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar configurações do CMS:", err);
      } finally {
        setLoadingDocs(false);
      }
    };

    carregarConfig();
  }, []);

  const handleValidar = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) {
      router.push(`/transparencia/validar-certificado?codigo=${codigo.trim()}`);
    }
  };

  // Lê os documentos das configurações do CMS
  const documentosExibidos: Documento[] = [
    siteConfig.doc_estatuto,
    siteConfig.doc_diretoria,
    siteConfig.doc_cnpj,
    ...(Array.isArray(siteConfig.doc_regulamentos) ? siteConfig.doc_regulamentos : [siteConfig.doc_regulamentos].filter(Boolean)),
    ...(Array.isArray(siteConfig.doc_docs_institucionais) ? siteConfig.doc_docs_institucionais : [siteConfig.doc_docs_institucionais].filter(Boolean)),
    siteConfig.doc_termos,
    siteConfig.doc_privacidade,
    siteConfig.doc_defesa_marca,
  ].filter(Boolean);

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
                {documentosExibidos.map((doc, i) => {
                  const inner = (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all duration-300">
                        {getIcon(doc.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm mb-1 group-hover:text-primary transition font-cinzel truncate">
                          {doc.titulo}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed font-body line-clamp-3">{doc.desc || `Documento oficial da associação, sob a categoria ${doc.tipo}.`}</p>
                        {(doc as any).slug && (doc as any).s1_titulo ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-gold mt-3 font-body font-bold">
                            <Eye size={12} /> Acessar
                          </span>
                        ) : doc.arquivo_url ? (
                          doc.arquivo_url.startsWith('/') ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gold mt-3 font-body font-bold">
                              <Eye size={12} /> Acessar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gold mt-3 font-body font-bold">
                              <Download size={12} /> Download PDF
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600 mt-3 font-body">
                            <Download size={10} /> Em breve
                          </span>
                        )}
                      </div>
                    </div>
                  );

                  if ((doc as any).slug && (doc as any).s1_titulo) {
                    return (
                      <Link key={i} href={`/transparencia/documento?slug=${(doc as any).slug}`} className="border border-zinc-900 bg-zinc-900/20 p-6 rounded-3xl group cursor-pointer hover:border-primary/20 transition-all duration-300 block">
                        {inner}
                      </Link>
                    );
                  }

                  if (!doc.arquivo_url) {
                    return (
                      <div key={i} className="border border-zinc-900 bg-zinc-900/20 p-6 rounded-3xl group">
                        {inner}
                      </div>
                    );
                  }

                  if (doc.arquivo_url.startsWith('/')) {
                    return (
                      <Link key={i} href={doc.arquivo_url} className="border border-zinc-900 bg-zinc-900/20 p-6 rounded-3xl group cursor-pointer hover:border-primary/20 transition-all duration-300 block">
                        {inner}
                      </Link>
                    );
                  }

                  return (
                    <a key={i} href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" className="border border-zinc-900 bg-zinc-900/20 p-6 rounded-3xl group cursor-pointer hover:border-primary/20 transition-all duration-300 block">
                      {inner}
                    </a>
                  );
                })}
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
