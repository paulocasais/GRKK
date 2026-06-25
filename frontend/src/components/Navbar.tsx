'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Instagram, Facebook, Phone, Mail, Lock, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const institucionalLinks = [
  { label: 'A Academia', href: '/sobre' },
  { label: 'Dojo Kun', href: '/dojo-kun' },
  { label: 'Equipe', href: '/equipe' },
  { label: 'Eventos', href: '/eventos' },
  { label: 'Transparência', href: '/transparencia' },
];

const mainLinks = [
  { label: 'Galeria', href: '/galeria' },
  { label: 'Contato', href: '/contato' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { login, autenticado, usuario, logout } = useAuth();

  const [showInstDropdown, setShowInstDropdown] = useState(false);
  const [mobileInstOpen, setMobileInstOpen] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [loginDropdownMode, setLoginDropdownMode] = useState<'login' | 'register'>('login');
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '', type: 'atleta' as 'atleta' | 'filial' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLoginDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const creds = loginForm.type === 'filial'
        ? { email: loginForm.identifier, senha: loginForm.password }
        : { telefone: loginForm.identifier, senha: loginForm.password };

      await login(loginForm.type, creds);
      
      // Para demonstração/fase 1, redireciona conforme o tipo
      if (loginForm.type === 'filial' || usuario?.tipo === 'admin') {
        router.push('/admin');
      } else {
        router.push('/home');
      }
      setShowLoginDropdown(false);
    } catch (err: any) {
      setLoginError(err.message || 'Credenciais inválidas');
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setShowInstDropdown(false);
    setMobileInstOpen(false);
  }, [pathname]);

  const isHome = pathname === '/';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || !isHome || isOpen
          ? 'bg-dark/95 backdrop-blur-md border-b border-dark-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Goju-Ryu Karate-Kai"
              className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-cinzel text-white text-sm font-semibold tracking-widest uppercase">Goju-Ryu</span>
              <span className="font-cinzel text-primary text-xs tracking-[0.15em] uppercase">Karate Kai</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Dropdown Institucional */}
            <div
              className="relative"
              onMouseEnter={() => setShowInstDropdown(true)}
              onMouseLeave={() => setShowInstDropdown(false)}
            >
              <button
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-cinzel tracking-widest uppercase transition-all duration-200 hover:text-primary outline-none cursor-pointer ${
                  institucionalLinks.some(l => pathname === l.href) ? 'text-primary' : 'text-gray-300'
                }`}
              >
                Institucional
                <ChevronDown size={11} className={`transition-transform duration-300 ${showInstDropdown ? 'rotate-180 text-primary' : 'text-gray-400'}`} />
              </button>

              <div
                className={`absolute left-0 mt-0 w-48 bg-dark/95 backdrop-blur-md border border-dark-border rounded-xl shadow-2xl py-2 z-50 transition-all duration-300 ${
                  showInstDropdown ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                {institucionalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-2.5 text-[10px] font-cinzel tracking-widest uppercase transition-colors duration-200 hover:bg-white/[0.03] hover:text-primary ${
                      pathname === link.href ? 'text-primary bg-white/[0.01]' : 'text-gray-400'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-xs font-cinzel tracking-widest uppercase transition-all duration-200 hover:text-primary ${
                  pathname === link.href ? 'text-primary' : 'text-gray-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors duration-200">
                <Instagram size={16} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors duration-200">
                <Facebook size={16} />
              </a>
            </div>

            {autenticado ? (
              <div className="flex items-center gap-3">
                <Link
                  href={usuario?.tipo === 'admin' ? '/admin' : '/home'}
                  className="bg-primary border border-primary text-white text-xs font-cinzel tracking-widest uppercase px-5 py-2 hover:bg-transparent hover:text-primary transition-all duration-300"
                >
                  Minha Área
                </Link>
                <button
                  onClick={async () => { await logout(); router.push('/'); }}
                  className="border border-red-500 text-red-500 text-xs font-cinzel tracking-widest uppercase px-4 py-2 hover:bg-red-500 hover:text-white transition-all duration-300 cursor-pointer"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Botão Área Restrita + Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => { setShowLoginDropdown(!showLoginDropdown); setLoginDropdownMode('login'); }}
                    className="border border-primary text-primary text-xs font-cinzel tracking-widest uppercase px-5 py-2 hover:bg-primary hover:text-white transition-all duration-300 cursor-pointer"
                  >
                    Área Restrita
                  </button>

                  {showLoginDropdown && (
                    <div className="absolute right-0 mt-3 w-80 bg-dark/95 backdrop-blur-md border border-dark-border rounded-xl p-5 shadow-2xl text-left z-50 animate-in fade-in slide-in-from-top-2 duration-200">

                      {/* Abas Login / Cadastro */}
                      <div className="flex gap-2 mb-4 bg-dark/40 p-1 border border-dark-border rounded-lg">
                        <button
                          type="button"
                          onClick={() => setLoginDropdownMode('login')}
                          className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition cursor-pointer ${
                            loginDropdownMode === 'login' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Login
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoginDropdownMode('register')}
                          className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition cursor-pointer ${
                            loginDropdownMode === 'register' ? 'bg-gold text-white' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Associe-se
                        </button>
                      </div>

                      {loginDropdownMode === 'login' ? (
                        <>
                          <h4 className="font-cinzel text-white text-sm font-semibold tracking-wider mb-4 text-center">Acesso Rápido</h4>

                          {/* Toggles Atleta / Filial */}
                          <div className="flex gap-2 mb-4 bg-dark/40 p-1 border border-dark-border rounded-lg">
                            <button
                              type="button"
                              onClick={() => setLoginForm(prev => ({ ...prev, type: 'atleta', identifier: '' }))}
                              className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition cursor-pointer ${
                                loginForm.type === 'atleta' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Atleta
                            </button>
                            <button
                              type="button"
                              onClick={() => setLoginForm(prev => ({ ...prev, type: 'filial', identifier: '' }))}
                              className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition cursor-pointer ${
                                loginForm.type === 'filial' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Filial / Admin
                            </button>
                          </div>

                          <form onSubmit={handleQuickLogin} className="space-y-3.5">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                {loginForm.type === 'atleta' ? 'Telefone (login)' : 'E-mail'}
                              </label>
                              <div className="relative">
                                {loginForm.type === 'atleta' ? (
                                  <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                ) : (
                                  <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                )}
                                <input
                                  required
                                  type={loginForm.type === 'atleta' ? 'text' : 'email'}
                                  placeholder={loginForm.type === 'atleta' ? '(71) 99999-0003' : 'email@exemplo.com'}
                                  value={loginForm.identifier}
                                  onChange={(e) => setLoginForm(prev => ({ ...prev, identifier: e.target.value }))}
                                  className="w-full bg-dark border border-dark-border text-white text-xs pl-8 pr-3 py-2 focus:outline-none focus:border-primary transition"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                Senha
                              </label>
                              <div className="relative">
                                <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                  required
                                  type="password"
                                  placeholder="••••••••"
                                  value={loginForm.password}
                                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                                  className="w-full bg-dark border border-dark-border text-white text-xs pl-8 pr-3 py-2 focus:outline-none focus:border-primary transition"
                                />
                              </div>
                            </div>

                            {loginError && (
                              <p className="text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-1.5 rounded-lg">
                                {loginError}
                              </p>
                            )}

                            <button
                              type="submit"
                              disabled={loginLoading}
                              className="w-full bg-primary text-white font-cinzel text-[10px] tracking-widest uppercase py-2.5 hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {loginLoading ? (
                                <><Loader2 size={12} className="animate-spin" /> Entrando...</>
                              ) : (
                                'Acessar'
                              )}
                            </button>
                          </form>

                          <div className="text-center mt-3 pt-3 border-t border-dark-border">
                            <Link href="/auth" onClick={() => setShowLoginDropdown(false)} className="text-[10px] text-gray-500 hover:text-white transition">
                              Entrar em tela cheia →
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <h4 className="font-cinzel text-white text-sm font-semibold tracking-wider mb-2 text-center">Junte-se a Nós</h4>
                          <p className="text-[10px] text-gray-400 text-center mb-4 leading-relaxed">
                            Faça parte da família Goju-Ryu Karate Kai. Escolha como deseja se associar:
                          </p>
                          <div className="space-y-2.5">
                            <Link
                              href="/auth/cadastro-atleta/"
                              onClick={() => setShowLoginDropdown(false)}
                              className="flex items-center gap-3 w-full p-3 border border-gold/30 hover:border-gold bg-gold/5 hover:bg-gold/10 transition-all duration-200 group"
                            >
                              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/30 transition">
                                <span className="text-gold text-sm">🥋</span>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-white uppercase tracking-wider">Sou Atleta</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">Cadastre-se como praticante</p>
                              </div>
                            </Link>
                            <Link
                              href="/auth/cadastro-filial/"
                              onClick={() => setShowLoginDropdown(false)}
                              className="flex items-center gap-3 w-full p-3 border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all duration-200 group"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition">
                                <span className="text-primary text-sm">🏯</span>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-white uppercase tracking-wider">Sou Filial / Dojo</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">Associe seu dojo à federação</p>
                              </div>
                            </Link>
                          </div>
                          <div className="text-center mt-3 pt-3 border-t border-dark-border">
                            <button
                              onClick={() => setLoginDropdownMode('login')}
                              className="text-[10px] text-gray-500 hover:text-white transition cursor-pointer"
                            >
                              ← Já tenho conta
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white p-2 cursor-pointer"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="bg-dark/98 border-t border-dark-border px-4 py-6 flex flex-col gap-1">
          {/* Institucional Accordion */}
          <div className="border-b border-dark-border">
            <button
              onClick={() => setMobileInstOpen(!mobileInstOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-cinzel tracking-widest uppercase text-left transition-colors duration-200 cursor-pointer ${
                institucionalLinks.some(l => pathname === l.href) ? 'text-primary' : 'text-gray-300 hover:text-white'
              }`}
            >
              Institucional
              <ChevronDown size={14} className={`transition-transform duration-300 ${mobileInstOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`} />
            </button>
            <div className={`transition-all duration-300 overflow-hidden ${mobileInstOpen ? 'max-h-60 opacity-100 py-1 pl-4' : 'max-h-0 opacity-0'}`}>
              {institucionalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block py-2.5 text-xs font-cinzel tracking-widest uppercase transition-colors duration-200 ${
                    pathname === link.href ? 'text-primary' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 text-sm font-cinzel tracking-widest uppercase border-b border-dark-border transition-colors duration-200 ${
                pathname === link.href ? 'text-primary' : 'text-gray-300 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {autenticado ? (
            <>
              <Link
                href={usuario?.tipo === 'admin' ? '/admin' : '/home'}
                className="mt-4 text-center bg-primary border border-primary text-white text-xs font-cinzel tracking-widest uppercase px-5 py-3 hover:bg-transparent hover:text-primary transition-all duration-300"
              >
                Minha Área
              </Link>
              <button
                onClick={async () => { await logout(); router.push('/'); }}
                className="mt-2 text-center border border-red-500 text-red-500 text-xs font-cinzel tracking-widest uppercase px-5 py-3 hover:bg-red-500 hover:text-white transition-all duration-300 cursor-pointer"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="mt-4 text-center border border-primary text-primary text-xs font-cinzel tracking-widest uppercase px-5 py-3 hover:bg-primary hover:text-white transition-all duration-300"
              >
                Área Restrita
              </Link>
            </>
          )}
          <div className="flex items-center justify-center gap-4 mt-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors">
              <Instagram size={18} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors">
              <Facebook size={18} />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
