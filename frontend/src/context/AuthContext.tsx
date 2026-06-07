'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: 'admin' | 'atleta' | 'filial';
  status: string;
  [key: string]: any;
}

interface AuthContextType {
  usuario: UserProfile | null;
  tipo: 'admin' | 'atleta' | 'filial' | null;
  carregando: boolean;
  autenticado: boolean;
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAtleta: boolean;
  isFilial: boolean;
  isFiliado: boolean;
  login: (tipoLogin: 'atleta' | 'filial', credenciais: any) => Promise<any>;
  loginLegado: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  recarregarSessao: () => Promise<void>;
  atualizarUsuario: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  temAcesso: (...papeis: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UserProfile | null>(null);
  const [tipo, setTipo] = useState<'admin' | 'atleta' | 'filial' | null>(null);
  const [carregando, setCarregando] = useState(true);

  const isAdmin = tipo === 'admin';
  const isAtleta = tipo === 'atleta';
  const isFilial = tipo === 'filial';
  const isFiliado = tipo === 'atleta'; // Alias para compatibilidade
  const autenticado = !!usuario;

  const carregarSessao = useCallback(async () => {
    try {
      // Usar credentials: 'include' para enviar cookies
      const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar sessão');
      const data = await res.json();

      if (data.autenticado) {
        setUsuario(data.usuario);
        setTipo(data.tipo === 'filiado' ? 'atleta' : data.tipo);
      } else {
        setUsuario(null);
        setTipo(null);
      }
    } catch (err) {
      console.error('[AuthContext] Erro ao carregar sessão:', err);
      setUsuario(null);
      setTipo(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarSessao();
  }, [carregarSessao]);

  async function login(tipoLogin: 'atleta' | 'filial', credenciais: any) {
    setCarregando(true);
    try {
      const body =
        tipoLogin === 'filial'
          ? { tipo: 'filial', email: credenciais.email, password: credenciais.senha }
          : { tipo: 'atleta', email: credenciais.telefone, password: credenciais.senha }; // Mapeia telefone para email no login mock/Supabase

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');

      setUsuario(data.usuario);
      setTipo(data.tipo === 'filiado' ? 'atleta' : data.tipo);
      return data;
    } finally {
      setCarregando(false);
    }
  }

  async function loginLegado(email: string, pass: string) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
    setUsuario(data.usuario);
    setTipo(data.tipo);
    return data;
  }

  async function logout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('[AuthContext] Erro no logout:', err);
    } finally {
      setUsuario(null);
      setTipo(null);
    }
  }

  function temAcesso(...papeis: string[]) {
    return tipo ? papeis.includes(tipo) : false;
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        tipo,
        carregando,
        autenticado,
        user: usuario,
        loading: carregando,
        isAdmin,
        isAtleta,
        isFilial,
        isFiliado,
        login,
        loginLegado,
        logout,
        recarregarSessao: carregarSessao,
        atualizarUsuario: setUsuario,
        temAcesso,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
