'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Send, Sparkles, User, MessageSquare, 
  HelpCircle, Trash2, Award, Clock, ArrowRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { text: 'O que significa Sanchin?', label: 'Kata Sanchin' },
  { text: 'Quem fundou o estilo Goju-Ryu?', label: 'Fundador' },
  { text: 'Qual a diferença entre Go e Ju?', label: 'Go vs Ju' },
  { text: 'Qual a importância da respiração Ibuki?', label: 'Ibuki' },
];

export default function SenseiIAPage() {
  const { usuario } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Inicializa a primeira mensagem do Sensei
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Olá, ${usuario?.nome || 'praticante'}! Sou o Sensei Virtual do Goju-Ryu. Estou aqui para guiar você na filosofia, nos Katas (como Sanchin e Tensho) e nas tradições da nossa escola de Okinawa. O que deseja aprender hoje sobre o Caminho (Do)?`,
        timestamp: new Date()
      }
    ]);
  }, [usuario]);

  // Rola automaticamente para a última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    if (!textToSend) setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_URL}/api/ia-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: query })
      });
      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.resposta,
          timestamp: new Date()
        }]);
      } else {
        throw new Error('Falha no processamento da IA');
      }
    } catch (err) {
      // Fallback local do Sensei caso a chamada API retorne erro ou esteja offline
      setTimeout(() => {
        let responseText = '';
        const lowerText = query.toLowerCase();
        
        if (lowerText.includes('sanchin')) {
          responseText = "Sanchin (Três Batalhas) é o Kata fundamental do Goju-Ryu. Ele foca na respiração ibuki, postura estável (Sanchin-dachi) e fortalecimento corporal através de contração isométrica rígida (Go). O objetivo é unir mente, corpo e espírito.";
        } else if (lowerText.includes('origem') || lowerText.includes('fundador') || lowerText.includes('criador') || lowerText.includes('miyagi')) {
          responseText = "O Karate Goju-Ryu foi fundado pelo Mestre Chojun Miyagi (1888-1953) em Okinawa, Japão. Ele combinou técnicas tradicionais de Okinawa (Naha-te) com estilos chineses de Kung Fu (como o Estilo da Garça Branca de Fuzhou) para criar o estilo.";
        } else if (lowerText.includes('goju') || lowerText.includes('diferença') || lowerText.includes('suavidade') || lowerText.includes('força')) {
          responseText = "No Goju-Ryu, o 'Go' significa força/rigidez e o 'Ju' significa suavidade/flexibilidade. O estilo baseia-se no equilíbrio yin-yang, onde ataques lineares e firmes (Go) alternam-se com desvios e movimentos circulares e fluidos (Ju).";
        } else if (lowerText.includes('ibuki') || lowerText.includes('respiração')) {
          responseText = "A respiração Ibuki é a respiração abdominal ruidosa e profunda característica do Goju-Ryu. Ela serve para contrair os órgãos internos, proteger o corpo de impactos no abdômen e canalizar a energia (Ki) durante os golpes.";
        } else if (lowerText.includes('tensho')) {
          responseText = "Tensho (Mãos Rotativas) é a contraparte suave do Kata Sanchin. Desenvolvido pelo Mestre Chojun Miyagi, foca em defesas de mão aberta (Ju) e transições respiratórias fluidas e suaves.";
        } else {
          responseText = `Uma pergunta profunda sobre "${query}". O Karatê Goju-Ryu busca sempre o equilíbrio entre os opostos complementares. Você gostaria de me perguntar sobre osKatats 'Sanchin' ou 'Tensho', sobre a 'origem' do estilo ou sobre o significado de 'Go' e 'Ju'?`;
        }

        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: responseText,
          timestamp: new Date()
        }]);
        setLoading(false);
      }, 700);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Tem certeza de que deseja apagar a conversa atual?')) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `Conversa reiniciada. O que mais você deseja aprender sobre o Karate Goju-Ryu, ${usuario?.nome || 'praticante'}?`,
          timestamp: new Date()
        }
      ]);
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider flex items-center gap-2">
            <Sparkles className="text-primary animate-pulse w-5 h-5" /> Sensei Virtual IA
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">Sua enciclopédia interativa de Karatê Goju-Ryu</p>
        </div>
        
        <button
          onClick={handleClearChat}
          title="Limpar histórico"
          className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-xl transition duration-200 cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Main Chat Layout */}
      <div className="flex-1 bg-zinc-900/40 border border-zinc-850 rounded-2xl flex flex-col overflow-hidden relative backdrop-blur-sm">
        
        {/* Decorative subtle grid */}
        <div className="absolute inset-0 bg-arena-grid opacity-5 pointer-events-none" />

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative z-10">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse text-right' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border select-none
                  ${isUser 
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300' 
                    : 'bg-gradient-to-br from-red-600 to-red-800 border-red-700 text-white'}`}
                >
                  {isUser ? <User size={14} /> : <span className="font-cinzel text-xs font-bold">剛</span>}
                </div>

                {/* Message Balloon */}
                <div className="space-y-1.5 text-left">
                  <div className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md border
                    ${isUser 
                      ? 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/20 text-white rounded-tr-none' 
                      : 'bg-zinc-950 border-zinc-850 text-zinc-300 rounded-tl-none'}`}
                  >
                    {msg.text}
                  </div>
                  <p className={`text-[9px] text-zinc-650 font-medium ${isUser ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-800 border-red-700 text-white flex items-center justify-center select-none animate-pulse">
                <span className="font-cinzel text-xs font-bold">剛</span>
              </div>
              <div className="space-y-1">
                <div className="bg-zinc-950 border border-zinc-850 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-zinc-500 flex items-center gap-2.5 shadow-md">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Sensei está meditando na sua dúvida...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="px-5 pb-3 pt-1 relative z-10 shrink-0 space-y-1.5">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider flex items-center gap-1">
              <HelpCircle size={10} /> Sugestões de Perguntas
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug.text)}
                  className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-850 hover:border-gold/30 text-zinc-400 hover:text-white rounded-xl text-[10px] sm:text-xs font-semibold tracking-wide transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1 group"
                >
                  {sug.label} <ArrowRight size={10} className="text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Field */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-850 relative z-10 shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva sua pergunta ao Sensei sobre Katas, origem, princípios..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs sm:text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-red-600 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary-light text-white rounded-xl px-4 flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/10 cursor-pointer"
            >
              <Send size={15} />
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
