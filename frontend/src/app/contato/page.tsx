import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContatoSection from '@/components/ContatoSection';

export const metadata = {
  title: 'Contato - Goju-Ryu Karate Kai',
  description: 'Fale conosco, agende uma aula experimental ou envie uma mensagem.',
};

export default function ContatoPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 pt-20">
        <section className="relative pt-32 pb-20 border-b border-zinc-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #c41e2a 0%, transparent 60%)' }} />
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
            <p className="text-primary font-cinzel text-xs tracking-[0.3em] uppercase mb-4">Fale Conosco</p>
            <h1 className="font-cinzel text-5xl md:text-6xl font-bold text-white leading-tight mb-6">Contato</h1>
            <div className="w-16 h-0.5 bg-primary mb-6" />
            <p className="text-gray-400 max-w-xl text-lg font-body">
              Tire suas dúvidas, agende uma aula experimental ou venha nos conhecer. Onegai shimasu!
            </p>
          </div>
        </section>
        <ContatoSection />
      </main>
      <Footer />
    </>
  );
}
