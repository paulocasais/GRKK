import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark border-t border-dark-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
                <span className="font-cinzel text-primary text-sm font-bold">GRKK</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-cinzel text-white text-sm font-semibold tracking-widest uppercase">Goju-Ryu</span>
                <span className="font-cinzel text-primary text-xs tracking-[0.15em] uppercase">Karate Kai</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Filiada à IOGKF Brasil, preservando e ensinando o Karatê Goju-Ryu Okinawano tradicional em Salvador, Bahia.
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 border border-dark-border flex items-center justify-center text-gray-400 hover:text-white hover:border-primary transition-all duration-200">
                <Instagram size={15} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 border border-dark-border flex items-center justify-center text-gray-400 hover:text-white hover:border-primary transition-all duration-200">
                <Facebook size={15} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-cinzel text-white text-xs tracking-widest uppercase mb-5">Navegação</h4>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'A Academia', href: '/sobre' },
                { label: 'Dojo Kun', href: '/dojo-kun' },
                { label: 'Equipe', href: '/equipe' },
                { label: 'Galeria', href: '/galeria' },
                { label: 'Eventos', href: '/eventos' },
                { label: 'Transparência', href: '/transparencia' },
                { label: 'Contato', href: '/contato' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-gray-400 text-sm hover:text-primary transition-colors duration-200 hover-underline-red">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dojo Kun */}
          <div>
            <h4 className="font-cinzel text-white text-xs tracking-widest uppercase mb-5">Dojo Kun</h4>
            <ul className="flex flex-col gap-3">
              {[
                'Respeitar os outros',
                'Ser corajoso',
                'Proteger o Karate tradicional',
                'Treinar mente e corpo',
                'Nunca desistir',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary text-xs mt-0.5">—</span>
                  <span className="text-gray-400 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-cinzel text-white text-xs tracking-widest uppercase mb-5">Contato</h4>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">Salvador, Bahia, Brasil</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-primary flex-shrink-0" />
                <a href="tel:+5571900000000" className="text-gray-400 text-sm hover:text-primary transition-colors">(71) 9 0000-0000</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-primary flex-shrink-0" />
                <a href="mailto:contato@gojoryukaratekai.com.br"
                  className="text-gray-400 text-sm hover:text-primary transition-colors break-all">
                  contato@gojoryukaratekai.com.br
                </a>
              </li>
            </ul>

            <div className="mt-6 p-4 border border-dark-border">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-cinzel">Filiada a</p>
              <p className="text-white text-sm font-cinzel">IOGKF Brasil</p>
              <p className="text-gray-500 text-xs mt-1">International Okinawan Goju-Ryu Karate-Do Federation</p>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs font-cinzel tracking-wider">
            © {new Date().getFullYear()} Goju-Ryu Karate Kai — Todos os direitos reservados.
          </p>
          <p className="text-gray-700 text-xs">
            <Link href="/auth" className="hover:text-gray-500 transition-colors">Área do Membro</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
