'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Building2, Mail, Phone, MapPin, ShieldCheck,
  Save, Loader2, CheckCircle2, AlertCircle, Award, User
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

function formatarCPF(valor: string) {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
}

function formatarCEP(valor: string) {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
}

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 10) {
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
  return numeros
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
}

function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto >= 10 ? 0 : resto;
  if (digito1 !== parseInt(cpfLimpo.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto >= 10 ? 0 : resto;
  if (digito2 !== parseInt(cpfLimpo.charAt(10))) return false;

  return true;
}

export default function MinhaFilialPage() {
  const { usuario, recarregarSessao, tipo } = useAuth();
  
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    nome_fantasia: '',
    cpf_responsavel: '',
    graduacao_responsavel: '',
    registro_federativo: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    municipio: '',
    estado: '',
  });

  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  useEffect(() => {
    if (usuario) {
      setForm({
        nome: usuario.nome || '',
        email: usuario.email || '',
        telefone: usuario.telefone ? formatarTelefone(usuario.telefone) : '',
        nome_fantasia: usuario.nome_fantasia || '',
        cpf_responsavel: usuario.cpf_responsavel ? formatarCPF(usuario.cpf_responsavel) : '',
        graduacao_responsavel: usuario.graduacao_responsavel || '',
        registro_federativo: usuario.registro_federativo || '',
        cep: usuario.cep ? formatarCEP(usuario.cep) : '',
        rua: usuario.rua || usuario.endereco || '', // fallback
        numero: usuario.numero || '',
        bairro: usuario.bairro || '',
        municipio: usuario.municipio || usuario.cidade || '', // fallback
        estado: usuario.estado || usuario.uf || '', // fallback
      });
    }
  }, [usuario]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const setFormatado = (field: string, formatter: (val: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: formatter(e.target.value) }));

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = formatarCEP(e.target.value);
    setForm(prev => ({ ...prev, cep: valor }));

    const cepLimpo = valor.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            setForm(prev => ({
              ...prev,
              rua: data.logradouro || prev.rua,
              bairro: data.bairro || prev.bairro,
              municipio: data.localidade || prev.municipio,
              estado: data.uf || prev.estado
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    setLoading(true);

    if (form.cpf_responsavel && !validarCPF(form.cpf_responsavel)) {
      setNotif({ type: 'error', msg: 'O CPF do responsável digitado é inválido.' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        telefone: form.telefone.replace(/\D/g, ''),
        cpf_responsavel: form.cpf_responsavel.replace(/\D/g, ''),
        cep: form.cep.replace(/\D/g, ''),
      };

      const res = await fetch(`${API_URL}/api/filiais/${usuario?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar dados da filial.');

      setNotif({ type: 'success', msg: 'Os dados do dojo/filial foram atualizados com sucesso!' });
      await recarregarSessao();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro de conexão.' });
    } finally {
      setLoading(false);
    }
  };

  if (tipo !== 'filial') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 font-sans">
        <AlertCircle className="w-16 h-16 text-red-500 animate-bounce" />
        <h2 className="text-xl font-bold text-white font-cinzel">Acesso restrito</h2>
        <p className="text-zinc-500 text-sm max-w-md">Esta tela está disponível apenas para a conta de dojo/filial credenciada.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white font-cinzel tracking-wider flex items-center gap-2">
          <Building2 className="text-gold" size={24} /> MINHA FILIAL / DOJO
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">
          Gerencie e atualize os dados cadastrais da sua filial credenciada.
        </p>
      </div>

      {/* Notificação */}
      {notif.type && (
        <div className={`p-4 rounded-xl flex items-start gap-3 text-xs border ${
          notif.type === 'success' 
            ? 'bg-emerald-950/30 border-emerald-900/30 text-emerald-400' 
            : 'bg-red-950/30 border-red-900/30 text-red-400'
        }`}>
          {notif.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notif.msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Dados do Dojo */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Building2 className="text-gold" size={16} /> INFORMAÇÕES DO DOJO
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Razão Social / Nome da Filial *</label>
                <input
                  required
                  value={form.nome}
                  onChange={set('nome')}
                  placeholder="Ex: Associação de Karatê Centro"
                  className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Nome Fantasia (Como aparece no portal)</label>
                <input
                  value={form.nome_fantasia}
                  onChange={set('nome_fantasia')}
                  placeholder="Ex: Dojo Goju-Ryu Salvador"
                  className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">E-mail de Contato</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full bg-zinc-950/40 border border-zinc-850 text-zinc-500 px-3.5 py-2.5 rounded-xl text-xs cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Telefone Comercial *</label>
                <input
                  required
                  value={form.telefone}
                  onChange={setFormatado('telefone', formatarTelefone)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Registro Federativo (FKBA/CBK)</label>
                <input
                  value={form.registro_federativo}
                  onChange={set('registro_federativo')}
                  placeholder="Ex: REG-12345"
                  className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Código Interno GRKK</label>
                <input
                  value={usuario?.codigo_interno || 'Pendente'}
                  disabled
                  className="w-full bg-zinc-950/40 border border-zinc-850 text-zinc-500 px-3.5 py-2.5 rounded-xl text-xs cursor-not-allowed font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            
            {/* Card 2: Responsável Técnico */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
                <User className="text-gold" size={16} /> RESPONSÁVEL TÉCNICO / SENSEI
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Award size={12} className="text-gold" /> Graduação do Responsável *
                  </label>
                  <input
                    required
                    value={form.graduacao_responsavel}
                    onChange={set('graduacao_responsavel')}
                    placeholder="Ex: Preta 3º Dan"
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">CPF do Responsável *</label>
                  <input
                    required
                    value={form.cpf_responsavel}
                    onChange={setFormatado('cpf_responsavel', formatarCPF)}
                    placeholder="000.000.000-00"
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Endereço do Dojo */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
                <MapPin className="text-gold" size={16} /> LOCALIZAÇÃO / ENDEREÇO
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 col-span-full">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>CEP</span>
                    {buscandoCep && <span className="text-[9px] text-gold animate-pulse">Buscando CEP...</span>}
                  </label>
                  <input
                    value={form.cep}
                    onChange={handleCepChange}
                    placeholder="00000-000"
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Rua / Avenida *</label>
                  <input
                    required
                    value={form.rua}
                    onChange={set('rua')}
                    placeholder="Ex: Av. Sete de Setembro"
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Número *</label>
                  <input
                    required
                    value={form.numero}
                    onChange={set('numero')}
                    placeholder="Ex: 123"
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-full">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Bairro *</label>
                  <input
                    required
                    value={form.bairro}
                    onChange={set('bairro')}
                    placeholder="Ex: Centro"
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Município / Cidade *</label>
                  <input
                    required
                    value={form.municipio}
                    onChange={set('municipio')}
                    placeholder="Ex: Salvador"
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Estado / UF *</label>
                  <input
                    required
                    value={form.estado}
                    onChange={set('estado')}
                    placeholder="BA"
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Botão de Submissão */}
        <div className="flex justify-end pt-4 border-t border-zinc-900 font-cinzel">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/20 text-xs tracking-widest uppercase"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Salvando...</>
            ) : (
              <><Save size={14} /> Salvar Cadastro da Filial</>
            )}
          </button>
        </div>

      </form>

    </main>
  );
}
