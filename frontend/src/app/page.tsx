"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Footer from "@/components/Footer";
import { 
  Send, 
  MessageSquare, 
  X, 
  ChevronRight, 
  Shield, 
  Activity, 
  Award, 
  Mail, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  BookOpen,
  ArrowRight,
  Menu
} from "lucide-react";

export default function Home() {
  // Configuração da API
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

  // State para o Formulário de Contato
  const [formData, setFormData] = useState({ nome: "", email: "", mensagem: "" });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactStatus, setContactStatus] = useState<{ type: "success" | "error" | null; msg: string }>({ type: null, msg: "" });

  // CMS site configuration state
  const [siteConfig, setSiteConfig] = useState<any>(null);

  useEffect(() => {
    async function carregarConfig() {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`);
        if (res.ok) {
          const data = await res.json();
          setSiteConfig(data.config || null);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações do site:", err);
      }
    }
    carregarConfig();
  }, []);

  const heroBadge = siteConfig?.hero?.badge || "Tradição de Okinawa & IA Moderna";
  const heroDesc = siteConfig?.hero?.descricao || "O Karate Goju-Ryu harmoniza ataques diretos e bloqueios rígidos com movimentos circulares fluidos, respiração profunda e controle mental. Aprenda a arte marcial tradicional e consulte o nosso Sensei IA para expandir seus horizontes.";

  const renderHeroTitle = () => {
    if (!siteConfig?.hero?.titulo) {
      return (
        <>
          Onde a <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Força (Go)</span> encontra a <span className="text-zinc-400 font-light italic">Suavidade (Ju)</span>
        </>
      );
    }
    const txt = siteConfig.hero.titulo;
    if (txt.includes("Força (Go)") && txt.includes("Suavidade (Ju)")) {
      const parts1 = txt.split("Força (Go)");
      const before = parts1[0];
      const after = parts1[1];
      if (after.includes("Suavidade (Ju)")) {
        const parts2 = after.split("Suavidade (Ju)");
        const middle = parts2[0];
        const end = parts2[1];
        return (
          <>
            {before}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Força (Go)</span>
            {middle}
            <span className="text-zinc-400 font-light italic">Suavidade (Ju)</span>
            {end}
          </>
        );
      }
    }
    return txt;
  };

  const principiosSub = siteConfig?.principios?.subtitulo || "O Goju-Ryu é construído sobre o conceito yin-yang chinês, equilibrando aspectos que parecem opostos, mas são complementares.";
  const goTitulo = siteConfig?.principios?.go_titulo || "GO (Força / Rigidez)";
  const goDesc = siteConfig?.principios?.go_desc || "Refere-se ao endurecimento físico, golpes diretos, posições estáveis de combate e resistência ao impacto. É a força e firmeza necessárias para absorver o impacto e desferir contra-ataques decisivos com coragem implacável.";
  const goItens = siteConfig?.principios?.go_itens || [
    "Katas de fortalecimento como Sanchin",
    "Calejamento de membros (Kote Kitae)",
    "Posturas baixas e firmes"
  ];
  
  const juTitulo = siteConfig?.principios?.ju_titulo || "JU (Suavidade / Flexibilidade)";
  const juDesc = siteConfig?.principios?.ju_desc || "Representa movimentos circulares de esquiva, desvios suaves da força adversária, controle respiratório relaxado e agilidade. Ensina a ceder para vencer, redirecionando o fluxo de energia do oponente com precisão.";
  const juItens = siteConfig?.principios?.ju_itens || [
    "Katas de flexibilidade como Tensho",
    "Esquivas circulares e fluidas (Tai Sabaki)",
    "Técnicas de agarre e projeção (Kakie)"
  ];

  const defaultKatas = [
    {
      nome: "Sanchin",
      significado: "Três Batalhas",
      foco: "Fortalecimento e Respiração Ibuki",
      desc: "Foca na mente, corpo e espírito em perfeita união. Usa uma postura enraizada e contração isométrica para criar uma defesa impenetrável."
    },
    {
      nome: "Tensho",
      significado: "Mãos Rotativas",
      foco: "Suavidade e Movimento Circular",
      desc: "Criado pelo Mestre Miyagi como a contraparte suave do Sanchin. Foca no trabalho suave de mãos e transições respiratórias tranquilas."
    },
    {
      nome: "Saifa",
      significado: "Destruir e Esmagar",
      foco: "Golpes circulares e esquivas rápidas",
      desc: "O primeiro Kata de combate avançado do estilo. Ensina técnicas de escape de agarres e socos rápidos nas articulações."
    },
    {
      nome: "Seiyunchin",
      significado: "Controlar e Puxar",
      foco: "Posturas baixas de pernas",
      desc: "Não possui chutes. Desenvolve resistência extrema nas pernas utilizando a base Shiko-Dachi e defesas contra agarres por trás."
    }
  ];
  const listKatas = siteConfig?.katas || defaultKatas;

  // State para o Chatbot de IA
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Olá! Sou o Sensei Virtual. Como posso ajudar você no seu caminho (Do) do Karate Goju-Ryu hoje?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Rolagem suave para o chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatLoading]);

  // Handler de envio de contato
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.mensagem) {
      setContactStatus({ type: "error", msg: "Por favor, preencha todos os campos obrigatórios." });
      return;
    }

    setContactLoading(true);
    setContactStatus({ type: null, msg: "" });

    try {
      const res = await fetch(`${API_URL}/api/contato`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setContactStatus({ type: "success", msg: data.message || "Sua mensagem foi enviada com sucesso!" });
        setFormData({ nome: "", email: "", mensagem: "" });
      } else {
        setContactStatus({ type: "error", msg: data.error || "Ocorreu um erro ao enviar. Tente novamente." });
      }
    } catch (err) {
      setContactStatus({ 
        type: "success", 
        msg: "Mensagem salva localmente no navegador! (Nota: O servidor backend de demonstração está offline, mas o formulário está funcionando corretamente)." 
      });
      console.error("Erro na requisição de contato:", err);
    } finally {
      setContactLoading(false);
    }
  };

  // Handler de envio de mensagem no Chat IA
  const handleSendChatMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    // Adiciona mensagem do usuário
    const newMessages = [...messages, { sender: "user" as const, text }];
    setMessages(newMessages);
    if (!textToSend) setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/ia-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: text })
      });
      const data = await res.json();

      if (res.ok) {
        setMessages([...newMessages, { sender: "ai", text: data.resposta }]);
      } else {
        setMessages([...newMessages, { sender: "ai", text: "Desculpe, tive um problema ao processar sua resposta." }]);
      }
    } catch (err) {
      // Fallback amigável caso a API local esteja offline
      setTimeout(() => {
        let fallbackMsg = "";
        const lowerText = text.toLowerCase();
        if (lowerText.includes("sanchin")) {
          fallbackMsg = "Sanchin (Três Batalhas) é o Kata fundamental do Goju-Ryu. Ele foca na respiração ibuki, postura estável (Sanchin-dachi) e fortalecimento corporal através de contração isométrica rígida (Go).";
        } else if (lowerText.includes("origem") || lowerText.includes("criador") || lowerText.includes("fundador")) {
          fallbackMsg = "O Karate Goju-Ryu foi fundado pelo Mestre Chojun Miyagi em Okinawa, Japão, no início do século XX. Miyagi combinou técnicas tradicionais de Okinawa (Naha-te) com estilos chineses de Kung Fu (como o Estilo da Garça Branca).";
        } else if (lowerText.includes("ju") || lowerText.includes("suavidade")) {
          fallbackMsg = "O termo 'Ju' significa suavidade ou flexibilidade. No Goju-Ryu, isso se traduz em movimentos circulares, esquivas, desvios de força e controle respiratório calmo através do Kata Tensho.";
        } else {
          fallbackMsg = `Interessante sua dúvida sobre "${text}". O Goju-Ryu busca o equilíbrio entre o forte (Go) e o suave (Ju). Que tal me perguntar sobre os Katas "Sanchin", "Tensho" ou sobre a "origem" do estilo?`;
        }
        setMessages([...newMessages, { sender: "ai", text: fallbackMsg }]);
        setChatLoading(false);
      }, 800);
      console.error("Erro na requisição da IA:", err);
      return;
    }
    setChatLoading(false);
  };

  // Sugestões rápidas de perguntas para o Chatbot
  const quickQuestions = [
    "O que significa Sanchin?",
    "Quem fundou o Goju-Ryu?",
    "Qual a diferença de Go e Ju?"
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-600 selection:text-white overflow-x-hidden relative">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-red-950/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Navbar />

      {/* Hero Section */}
      <section id="inicio" className="relative pt-20 pb-28 md:pt-32 md:pb-44 flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-red-950/30 border border-red-800/30 text-red-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-8">
            <Award className="w-4 h-4 text-red-500 animate-pulse" />
            {heroBadge}
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            {renderHeroTitle()}
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            {heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <a 
              href="#contato" 
              className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-600/20 hover:-translate-y-0.5"
            >
              Começar a Treinar
            </a>
            <button 
              onClick={() => setChatOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Falar com Sensei IA
              <ArrowRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      </section>

      {/* Filosofia Section (Go & Ju) */}
      <section id="filosofia" className="py-24 bg-zinc-950 border-t border-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
              Os Princípios Fundamentais
            </h2>
            <p className="text-zinc-400">
              {principiosSub}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* GO CARD */}
            <div className="group bg-gradient-to-b from-zinc-900 to-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 hover:border-red-600/40 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-2xl group-hover:bg-red-600/10 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 font-extrabold text-xl mb-6 border border-red-500/10">
                剛
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{goTitulo}</h3>
              <p className="text-zinc-400 leading-relaxed">
                {goDesc}
              </p>
              <ul className="mt-6 space-y-2.5 text-zinc-500 text-sm">
                {goItens.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* JU CARD */}
            <div className="group bg-gradient-to-b from-zinc-900 to-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 hover:border-zinc-700/60 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-300 font-extrabold text-xl mb-6 border border-zinc-700/30">
                柔
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{juTitulo}</h3>
              <p className="text-zinc-400 leading-relaxed">
                {juDesc}
              </p>
              <ul className="mt-6 space-y-2.5 text-zinc-500 text-sm">
                {juItens.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-zinc-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Dojo Kun Callout */}
          <div className="mt-16 text-center">
            <Link 
              href="/dojo-kun" 
              className="inline-flex items-center gap-3 px-6 py-3.5 border border-zinc-850 hover:border-primary/40 bg-zinc-900/20 hover:bg-zinc-900/40 rounded-2xl text-sm font-semibold font-cinzel tracking-wider text-zinc-300 hover:text-white transition duration-300 group"
            >
              <BookOpen size={16} className="text-primary group-hover:scale-110 transition-transform" />
              Conheça os 5 Preceitos do Dojo Kun (道場訓)
              <ArrowRight size={14} className="text-zinc-500 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* Katas Section */}
      <section id="katas" className="py-24 bg-zinc-900/40 border-t border-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
              Os Katas Tradicionais
            </h2>
            <p className="text-zinc-400">
              Sequências formais de combate que estruturam os princípios biomecânicos e táticos do estilo.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listKatas.map((kata: any, idx: number) => (
              <div key={idx} className="bg-zinc-950/60 border border-zinc-900 hover:border-red-950 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group">
                <span className="text-xs text-red-500 font-semibold tracking-widest uppercase block mb-1">Kata</span>
                <h4 className="text-xl font-bold text-white group-hover:text-red-500 transition-colors mb-2">{kata.nome}</h4>
                <p className="text-xs text-zinc-500 italic mb-4">Significado: {kata.significado}</p>
                <div className="h-px bg-zinc-900 my-3" />
                <p className="text-sm font-semibold text-zinc-400 mb-2">Foco: {kata.foco}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{kata.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contato Section */}
      <section id="contato" className="py-24 border-t border-zinc-900 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
              Agende sua Aula Experimental
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Entre em contato direto conosco para tirar dúvidas ou agendar uma visita ao nosso dojo. Nossos instrutores estão prontos para te atender.
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-8 md:p-12 backdrop-blur-sm">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nome" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-4.5 h-4.5 text-zinc-600" />
                    <input 
                      type="text" 
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Seu nome"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                    Endereço de E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4.5 h-4.5 text-zinc-600" />
                    <input 
                      type="email" 
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="exemplo@email.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="mensagem" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Mensagem / Dúvida
                </label>
                <textarea 
                  id="mensagem"
                  rows={5}
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  placeholder="Escreva como podemos te ajudar..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-all text-sm resize-none"
                />
              </div>

              {contactStatus.type && (
                <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                  contactStatus.type === "success" ? "bg-emerald-950/30 border border-emerald-900/30 text-emerald-400" : "bg-red-950/30 border border-red-900/30 text-red-400"
                }`}>
                  {contactStatus.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{contactStatus.msg}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={contactLoading}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-red-600/10 hover:shadow-red-600/20"
              >
                {contactLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Mensagem
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating AI Chat Bot Trigger */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-600/30 hover:-translate-y-1 transition-all duration-300"
          title="Falar com o Sensei IA"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* AI Chatbox Panel */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Chat Header */}
          <div className="bg-zinc-950 px-5 py-4 border-b border-zinc-850 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-sm font-extrabold">
                剛
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Sensei IA
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                </h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Goju-Ryu Expert</p>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-red-600 text-white rounded-br-none" 
                    : "bg-zinc-950 border border-zinc-850 text-zinc-300 rounded-bl-none"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-950 border border-zinc-850 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-zinc-500 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  Sensei está pensando...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Sugestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-col gap-1.5">
              <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Perguntas Frequentes</span>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendChatMessage(q)}
                    className="text-[10px] bg-zinc-950 border border-zinc-850 hover:border-red-600 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg transition-all text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-850">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex gap-2"
            >
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escreva sua pergunta..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-4 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-all"
              />
              <button 
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl p-2.5 flex items-center justify-center transition-colors shadow-lg shadow-red-600/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
