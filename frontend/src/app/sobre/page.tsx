import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Heart, Star, Award, Users, Globe } from 'lucide-react';

export const metadata = {
  title: 'A Academia - Goju-Ryu Karate Kai',
  description: 'História, missão e valores da nossa federação de Karatê.',
};

export default function SobrePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 pt-20">
        {/* Page Hero */}
        <section className="relative pt-32 pb-20 border-b border-zinc-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #c41e2a 0%, transparent 60%)' }} />
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
            <p className="text-primary font-cinzel text-xs tracking-[0.3em] uppercase mb-4">Nossa História</p>
            <h1 className="font-cinzel text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              A Academia
            </h1>
            <div className="w-16 h-0.5 bg-primary mb-6" />
            <p className="text-gray-400 max-w-2xl text-lg leading-relaxed font-body">
              Conheça a história, missão e valores do Goju-Ryu Karate Kai, uma academia comprometida com a preservação do Karatê Goju-Ryu tradicional de Okinawa.
            </p>
          </div>
        </section>

        {/* História */}
        <section className="py-20 px-4 md:px-8 lg:px-16 bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-primary font-cinzel text-xs tracking-[0.3em] uppercase mb-4">Desde o Início</p>
                <h2 className="font-cinzel text-4xl font-bold text-white mb-6">Nossa História</h2>
                <div className="w-12 h-0.5 bg-primary mb-8" />
                <div className="flex flex-col gap-5 text-gray-300 leading-relaxed font-body">
                  <p>
                    O Goju-Ryu Karate Kai nasceu com a missão de preservar e difundir o Karatê Goju-Ryu Okinawano
                    em Salvador, Bahia, mantendo viva a tradição secular desta arte marcial.
                  </p>
                  <p>
                    Filiados à IOGKF Brasil — a maior organização de Karatê Goju-Ryu do mundo —, seguimos o currículo
                    técnico e filosófico estabelecido pelos grandes mestres de Okinawa, garantindo a autenticidade
                    do ensinamento.
                  </p>
                  <p>
                    Nossa academia acolhe praticantes de todas as idades e níveis, oferecendo um ambiente de
                    aprendizado respeitoso, disciplinado e transformador.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Award, title: 'IOGKF Brasil', desc: 'Tradição secular' },
                  { icon: Users, title: 'Todos os Níveis', desc: 'Da iniciação ao grau avançado' },
                  { icon: Globe, title: 'Okinawa', desc: 'Tradição autêntica preservada' },
                  { icon: Shield, title: 'Método Sólido', desc: 'Currículo técnico reconhecido mundialmente' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="p-6 border border-zinc-900 bg-zinc-900/40 flex flex-col gap-3 rounded-2xl hover:border-primary/20 transition-all duration-300">
                      <Icon size={20} className="text-primary" />
                      <h4 className="font-cinzel text-white text-sm">{item.title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed font-body">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Missão, Visão e Valores */}
        <section className="py-20 px-4 md:px-8 lg:px-16 bg-zinc-900/20 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary font-cinzel text-xs tracking-[0.3em] uppercase mb-4">Nossos Princípios</p>
              <h2 className="font-cinzel text-4xl font-bold text-white">Missão, Visão e Valores</h2>
              <div className="w-16 h-0.5 bg-primary mx-auto mt-6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Heart,
                  title: 'Missão',
                  desc: 'Preservar e transmitir o Karatê Goju-Ryu Okinawano em sua forma mais autêntica, promovendo o desenvolvimento humano integral através da arte marcial.',
                },
                {
                  icon: Star,
                  title: 'Visão',
                  desc: 'Ser referência no Karatê Goju-Ryu tradicional em Salvador, formando praticantes técnicos, éticos e comprometidos com os valores do Budo.',
                },
                {
                  icon: Shield,
                  title: 'Valores',
                  desc: 'Respeito, disciplina, perseverança, lealdade e autocontrole — os pilares que sustentam cada treino e cada relação dentro do dojo.',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="p-8 border border-zinc-900 bg-zinc-900/40 rounded-3xl hover:border-primary/20 transition-all duration-300">
                    <div className="w-12 h-12 border border-primary/30 flex items-center justify-center mb-6 rounded-xl">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <h3 className="font-cinzel text-xl text-white font-bold mb-4">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed font-body">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
