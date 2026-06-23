'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User } from 'lucide-react';

interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  belt: string;
  bio: string;
  photo_url: string | null;
}

const defaultTeam: TeamMember[] = [
  {
    id: 1,
    name: 'Sensei Paulo Roberto',
    role: 'Instrutor Chefe',
    belt: 'Preta 4º Dan',
    bio: 'Praticante de Karatê Goju-Ryu há mais de 20 anos, formado e graduado pela IOGKF Brasil. Dedicado à preservação e ensino da arte marcial em sua forma mais tradicional.',
    photo_url: null,
  },
  {
    id: 2,
    name: 'Senpai Carlos Silva',
    role: 'Instrutor Auxiliar',
    belt: 'Preta 1º Dan',
    bio: 'Instrutor credenciado pela IOGKF Brasil com vasta experiência em competições nacionais e internacionais. Especialista em kata e bunkai.',
    photo_url: null,
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function EquipePage() {
  const [members, setMembers] = useState<TeamMember[]>(defaultTeam);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await fetch(`${API_URL}/api/equipe`);
        if (!res.ok) throw new Error('Erro ao carregar equipe');
        const data = await res.json();
        if (data.members && data.members.length > 0) {
          const mapped = data.members.map((m: any) => {
            let belt = "Faixa Preta";
            let role = m.cargo || m.role || "";
            if (role.includes(" - ")) {
              const parts = role.split(" - ");
              role = parts[0];
              belt = parts[1];
            }
            return {
              id: m.id,
              name: m.nome || m.name || "",
              role: role,
              belt: m.belt || m.graduacao || belt,
              bio: m.biografia || m.bio || "",
              photo_url: m.foto_url || m.photo_url || null
            };
          });
          setMembers(mapped);
        }
      } catch (err) {
        console.error('Erro ao buscar equipe do backend:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 pt-20">
        {/* Page Hero */}
        <section className="relative pt-32 pb-20 border-b border-zinc-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #c41e2a 0%, transparent 60%)' }} />
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
            <p className="text-primary font-cinzel text-xs tracking-[0.3em] uppercase mb-4">Quem Nos Guia</p>
            <h1 className="font-cinzel text-5xl md:text-6xl font-bold text-white leading-tight mb-6">Nossa Equipe</h1>
            <div className="w-16 h-0.5 bg-primary mb-6" />
            <p className="text-gray-400 max-w-xl text-lg font-body">
              Instrutores qualificados e comprometidos com a transmissão autêntica do Karatê Goju-Ryu.
            </p>
          </div>
        </section>

        {/* Team grid */}
        <section className="py-20 px-4 md:px-8 lg:px-16 bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {members.map((member) => (
                  <div key={member.id} className="border border-zinc-900 bg-zinc-900/40 rounded-3xl overflow-hidden group hover:border-primary/20 transition-all duration-300">
                    {/* Photo */}
                    <div className="aspect-[4/3] bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="flex flex-col items-center gap-3 opacity-20 text-white">
                          <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center">
                            <User size={28} />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-8">
                      <span className="text-primary font-cinzel text-xs tracking-wider uppercase">{member.belt}</span>
                      <h3 className="font-cinzel text-white text-xl font-bold mt-2 mb-1">{member.name}</h3>
                      <p className="text-gray-500 text-sm font-cinzel tracking-wider uppercase mb-4">{member.role}</p>
                      <div className="w-8 h-px bg-primary mb-4" />
                      <p className="text-gray-400 text-sm leading-relaxed font-body">{member.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
