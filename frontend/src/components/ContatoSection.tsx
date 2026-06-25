'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function ContatoSection() {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', mensagem: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [siteConfig, setSiteConfig] = useState({
    secao_subtitulo: 'Fale Conosco',
    secao_titulo: 'Entre em Contato',
    secao_desc: 'Tire suas dúvidas, agende uma aula experimental ou venha nos conhecer.',
    telefone: '(71) 9 0000-0000',
    telefone_tel: '+5571900000000',
    email: 'contato@gojoryukaratekai.com.br',
    endereco: 'Salvador, Bahia, Brasil',
    horarios: 'Segunda e Quarta: 19:00 — 21:00\nSábado: 09:00 — 11:00'
  });

  useEffect(() => {
    const carregarConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.config && data.config.contato) {
            setSiteConfig(prev => ({
              ...prev,
              ...data.config.contato
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar contato config:", err);
      }
    };
    carregarConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/contatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar mensagem');
      
      setSuccess(true);
      setForm({ nome: '', email: '', telefone: '', mensagem: '' });
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contato" className="py-20 px-4 md:px-8 lg:px-16 bg-zinc-950">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-primary font-cinzel text-xs tracking-[0.3em] uppercase mb-4">{siteConfig.secao_subtitulo}</p>
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold text-white">{siteConfig.secao_titulo}</h2>
          <div className="w-16 h-0.5 bg-primary mx-auto mt-6 mb-5" />
          <p className="text-gray-400 max-w-lg mx-auto font-body">
            {siteConfig.secao_desc}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="p-6 border border-zinc-900 bg-zinc-900/40 rounded-3xl hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center gap-4 mb-2">
                <MapPin size={18} className="text-primary flex-shrink-0" />
                <h4 className="font-cinzel text-white text-sm tracking-wider">Localização</h4>
              </div>
              <p className="text-gray-400 text-sm pl-8 font-body">{siteConfig.endereco}</p>
            </div>
            
            <div className="p-6 border border-zinc-900 bg-zinc-900/40 rounded-3xl hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center gap-4 mb-2">
                <Phone size={18} className="text-primary flex-shrink-0" />
                <h4 className="font-cinzel text-white text-sm tracking-wider">Telefone</h4>
              </div>
              <a href={`tel:${siteConfig.telefone_tel}`} className="text-gray-400 text-sm pl-8 hover:text-primary transition-colors font-body">
                {siteConfig.telefone}
              </a>
            </div>

            <div className="p-6 border border-zinc-900 bg-zinc-900/40 rounded-3xl hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center gap-4 mb-2">
                <Mail size={18} className="text-primary flex-shrink-0" />
                <h4 className="font-cinzel text-white text-sm tracking-wider">E-mail</h4>
              </div>
              <a href={`mailto:${siteConfig.email}`}
                className="text-gray-400 text-sm pl-8 hover:text-primary transition-colors break-all font-body">
                {siteConfig.email}
              </a>
            </div>

            {/* Horários */}
            <div className="p-6 border border-zinc-900 bg-zinc-900/40 rounded-3xl">
              <h4 className="font-cinzel text-white text-sm tracking-wider mb-4">Horários de Treino</h4>
              <div className="flex flex-col gap-2 font-body">
                {siteConfig.horarios.split('\n').map((line, idx) => {
                  const parts = line.split(':');
                  const dia = parts[0]?.trim() || '';
                  const hora = parts.slice(1).join(':')?.trim() || '';
                  return { dia, hora };
                }).filter(h => h.dia && h.hora).map((h, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">{h.dia}</span>
                    <span className="text-white font-cinzel">{h.hora}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {success ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 py-20 border border-zinc-900 bg-zinc-900/20 rounded-3xl">
                <CheckCircle size={48} className="text-emerald-500" />
                <h3 className="font-cinzel text-white text-xl">Mensagem enviada!</h3>
                <p className="text-gray-400 text-center font-body">Entraremos em contato em breve. Onegai shimasu!</p>
                <button onClick={() => setSuccess(false)}
                  className="text-primary font-cinzel text-xs tracking-widest uppercase hover:text-white transition-colors cursor-pointer">
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 border border-zinc-900 bg-zinc-900/20 p-8 rounded-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-400 text-xs font-cinzel tracking-wider uppercase">Nome *</label>
                    <input
                      type="text" name="nome" value={form.nome} onChange={handleChange} required
                      className="bg-zinc-950 border border-zinc-900 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-400 text-xs font-cinzel tracking-wider uppercase">E-mail *</label>
                    <input
                      type="email" name="email" value={form.email} onChange={handleChange} required
                      className="bg-zinc-950 border border-zinc-900 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 text-xs font-cinzel tracking-wider uppercase">Telefone</label>
                  <input
                    type="tel" name="telefone" value={form.telefone} onChange={handleChange}
                    className="bg-zinc-950 border border-zinc-900 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="(71) 9 0000-0000"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 text-xs font-cinzel tracking-wider uppercase">Mensagem *</label>
                  <textarea
                    name="mensagem" value={form.mensagem} onChange={handleChange} required rows={5}
                    className="bg-zinc-950 border border-zinc-900 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Sua mensagem, dúvida ou interesse..."
                  />
                </div>
                {error && <p className="text-red-400 text-sm font-body">{error}</p>}
                <button
                  type="submit" disabled={loading}
                  className="flex items-center justify-center gap-3 bg-primary text-white font-cinzel text-xs tracking-widest uppercase px-8 py-4 rounded-xl hover:bg-primary-dark transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? 'Enviando...' : (<><Send size={14} /> Enviar Mensagem</>)}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
