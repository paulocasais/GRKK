'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  User, Mail, Phone, Calendar, ShieldAlert, 
  Activity, HeartPulse, Stethoscope, FileHeart,
  Save, Loader2, CheckCircle2, AlertCircle, HeartHandshake,
  Send, Smartphone, ShieldCheck, X, MapPin
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

function calcularIdade(dataNasc: string): number {
  if (!dataNasc) return 18;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
}

export default function ConfiguracoesPage() {
  const { usuario, recarregarSessao, isAdmin } = useAuth();
  
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    sexo: '',
    data_nascimento: '',
    nome_professor: '',
    cep: '',
    endereco: '',
    cidade: '',
    uf: '',
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_email: '',
    responsavel_telefone: '',
    medico_alergias: '',
    medico_plano: '',
    medico_restricoes: '',
    medico_diagnosticos: '',
    arte_marcial: '',
    estilo: '',
    academia_clube: '',
    medico_tipo_sanguineo: '',
    medico_fator_rh: '',
    medico_sus: '',
    medico_emergencia_nome: '',
    medico_emergencia_telefone: '',
    medico_medicacao_uso: 'Não',
    medico_medicacao_lista: '',
    medico_alergia_medicamento: '',
    fisico_peso: '',
    fisico_altura: '',
    autoriza_uso_imagem: true,
    ja_praticou_artes_marciais: 'Não',
  });

  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });
  const [idade, setIdade] = useState(18);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [showDocBanner, setShowDocBanner] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('dismissed_doc_banner');
      if (dismissed === 'true') {
        setShowDocBanner(false);
      }
    }
  }, []);

  const handleDismissBanner = () => {
    setShowDocBanner(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissed_doc_banner', 'true');
    }
  };

  useEffect(() => {
    if (usuario) {
      setForm({
        nome: usuario.nome || '',
        email: usuario.email || '',
        telefone: usuario.telefone ? formatarTelefone(usuario.telefone) : '',
        cpf: usuario.cpf ? formatarCPF(usuario.cpf) : '',
        sexo: usuario.sexo || 'M',
        data_nascimento: usuario.data_nascimento || '',
        nome_professor: usuario.nome_professor || '',
        cep: usuario.cep ? formatarCEP(usuario.cep) : '',
        endereco: usuario.endereco || '',
        cidade: usuario.cidade || '',
        uf: usuario.uf || '',
        responsavel_nome: usuario.responsavel_nome || '',
        responsavel_cpf: usuario.responsavel_cpf ? formatarCPF(usuario.responsavel_cpf) : '',
        responsavel_email: usuario.responsavel_email || '',
        responsavel_telefone: usuario.responsavel_telefone ? formatarTelefone(usuario.responsavel_telefone) : '',
        medico_alergias: usuario.medico_alergias || '',
        medico_plano: usuario.medico_plano || '',
        medico_restricoes: usuario.medico_restricoes || '',
        medico_diagnosticos: usuario.medico_diagnosticos || '',
        arte_marcial: usuario.arte_marcial || '',
        estilo: usuario.estilo || '',
        academia_clube: usuario.academia_clube || '',
        medico_tipo_sanguineo: usuario.medico_tipo_sanguineo || '',
        medico_fator_rh: usuario.medico_fator_rh || '',
        medico_sus: usuario.medico_sus || '',
        medico_emergencia_nome: usuario.medico_emergencia_nome || '',
        medico_emergencia_telefone: usuario.medico_emergencia_telefone ? formatarTelefone(usuario.medico_emergencia_telefone) : '',
        medico_medicacao_uso: usuario.medico_medicacao_uso || 'Não',
        medico_medicacao_lista: usuario.medico_medicacao_lista || '',
        medico_alergia_medicamento: usuario.medico_alergia_medicamento || '',
        fisico_peso: usuario.fisico_peso || '',
        fisico_altura: usuario.fisico_altura || '',
        autoriza_uso_imagem: (
          (usuario.dados_atleta?.autoriza_uso_imagem !== undefined ? usuario.dados_atleta.autoriza_uso_imagem : usuario.autoriza_uso_imagem)
          === false
        ) ? false : true,
        ja_praticou_artes_marciais: usuario.ja_praticou_artes_marciais || (usuario.nome_professor ? 'Sim' : 'Não'),
      });
      if (usuario.data_nascimento) {
        setIdade(calcularIdade(usuario.data_nascimento));
      }
    }
  }, [usuario]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));

    if (field === 'data_nascimento') {
      setIdade(calcularIdade(val));
    }
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
              endereco: data.logradouro ? `${data.logradouro}${data.bairro ? `, ${data.bairro}` : ''}` : prev.endereco,
              cidade: data.localidade || prev.cidade,
              uf: data.uf || prev.uf
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

  const isMenor = idade < 18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    setLoading(true);

    if (form.cpf && !validarCPF(form.cpf)) {
      setNotif({ type: 'error', msg: 'O CPF digitado é inválido.' });
      setLoading(false);
      return;
    }

    if (isMenor) {
      if (!form.responsavel_nome || !form.responsavel_cpf || !form.responsavel_telefone) {
        setNotif({ type: 'error', msg: 'Dados do responsável (nome, CPF, telefone) são obrigatórios para menores de 18 anos.' });
        setLoading(false);
        return;
      }
      if (form.responsavel_cpf && !validarCPF(form.responsavel_cpf)) {
        setNotif({ type: 'error', msg: 'O CPF do responsável digitado é inválido.' });
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        ...form,
        telefone: (form.telefone || '').replace(/\D/g, ''),
        cpf: (form.cpf || '').replace(/\D/g, ''),
        cep: (form.cep || '').replace(/\D/g, ''),
        responsavel_cpf: (form.responsavel_cpf || '').replace(/\D/g, ''),
        responsavel_telefone: (form.responsavel_telefone || '').replace(/\D/g, ''),
      };

      const res = await fetch(`${API_URL}/api/atletas/${usuario?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar dados.');

      setNotif({ type: 'success', msg: 'Seu cadastro foi atualizado com sucesso!' });
      await recarregarSessao();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro de conexão.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Configurações do Perfil</h1>
        <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">
          Atualize seus dados cadastrais, dados de responsáveis e informações médicas.
        </p>
      </div>

      {/* Banner Documentos Exigidos */}
      {!usuario?.documentos_entregues && (
        <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 flex gap-3 text-xs text-red-400">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold font-cinzel uppercase tracking-wider mb-1">Documentos Obrigatórios para Homologação</p>
            <p className="leading-relaxed opacity-85">
              Apresente ou envie à sua filial cópias físicas ou digitais de: <strong>Cópia do RG; Cópia do RG do responsável (se menor); Cópia do Cartão do SUS; Cópia do Cartão do Plano de Saúde; Cópia do Comprovante de Residência.</strong>
            </p>
          </div>
        </div>
      )}

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
          
          {/* Card 1: Dados Pessoais */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <User className="text-primary" size={16} /> DADOS PESSOAIS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Nome completo</label>
                <input
                  required
                  value={form.nome}
                  onChange={set('nome')}
                  className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">E-mail</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full bg-zinc-950/40 border border-zinc-850 text-zinc-500 px-3.5 py-2.5 rounded-xl text-xs cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Celular</label>
                <input
                  required
                  value={form.telefone}
                  onChange={setFormatado('telefone', formatarTelefone)}
                  className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">CPF</label>
                <input
                  required
                  value={form.cpf}
                  onChange={setFormatado('cpf', formatarCPF)}
                  className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Data de Nascimento</label>
                <input
                  required
                  type="date"
                  value={form.data_nascimento}
                  onChange={set('data_nascimento')}
                  className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Sexo</label>
                <select
                  value={form.sexo}
                  onChange={set('sexo')}
                  className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                </select>
              </div>
            </div>

            {/* Sub-Card: Já praticou artes marciais antes? */}
            <div className="space-y-4 border-t border-zinc-800/80 pt-5">
              <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3 uppercase">
                <ShieldAlert className="text-gold" size={16} /> JÁ PRATICOU ARTES MARCIAIS ANTES?
              </h3>
              
              <div className="flex flex-col gap-1.5">
                <select
                  value={form.ja_praticou_artes_marciais}
                  onChange={set('ja_praticou_artes_marciais')}
                  className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors font-semibold"
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              {form.ja_praticou_artes_marciais === 'Sim' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 animate-in fade-in duration-200">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Nome do Professor / Sensei</label>
                    <input
                      value={form.nome_professor}
                      onChange={set('nome_professor')}
                      placeholder="Ex: Sensei Fulano de Tal"
                      className="w-full bg-zinc-900 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Arte Marcial / Luta</label>
                    <input
                      value={form.arte_marcial}
                      onChange={set('arte_marcial')}
                      placeholder="Ex: Karate, Judô, Jiu-Jitsu"
                      className="w-full bg-zinc-900 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Estilo / Modalidade</label>
                    <input
                      value={form.estilo}
                      onChange={set('estilo')}
                      placeholder="Ex: Goju-Ryu, Shotokan, Shorin-Ryu"
                      className="w-full bg-zinc-900 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Academia / Clube / Associação</label>
                    <input
                      value={form.academia_clube}
                      onChange={set('academia_clube')}
                      placeholder="Ex: Associação de Karatê Centro"
                      className="w-full bg-zinc-900 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Sub-Card: Endereço */}
            <div className="space-y-4 border-t border-zinc-800/80 pt-5">
              <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3 uppercase">
                <MapPin className="text-primary" size={16} /> ENDEREÇO
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
                <div className="flex flex-col gap-1.5 col-span-full">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Logradouro / Rua e Número</label>
                  <input
                    value={form.endereco}
                    onChange={set('endereco')}
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Cidade</label>
                  <input
                    value={form.cidade}
                    onChange={set('cidade')}
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">UF</label>
                  <input
                    value={form.uf}
                    onChange={set('uf')}
                    placeholder="BA"
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            
            {/* Card 2: Ficha Médica */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Activity className="text-emerald-500" size={16} /> FICHA MÉDICA
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <HeartPulse size={12} className="text-red-500" /> Alergias
                  </label>
                  <textarea
                    value={form.medico_alergias}
                    onChange={set('medico_alergias')}
                    placeholder="Ex: Medicamentos (Dipirona, Aspirina), alimentos, etc."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Stethoscope size={12} className="text-zinc-400" /> Plano de Saúde
                  </label>
                  <input
                    value={form.medico_plano}
                    onChange={set('medico_plano')}
                    placeholder="Ex: Unimed, Bradesco Saúde, SUS, etc."
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Peso (kg)</label>
                    <input
                      value={form.fisico_peso}
                      onChange={set('fisico_peso')}
                      placeholder="Ex: 72.5"
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Altura (m)</label>
                    <input
                      value={form.fisico_altura}
                      onChange={set('fisico_altura')}
                      placeholder="Ex: 1.75"
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                </div>



                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Tipo Sanguíneo</label>
                    <select
                      value={form.medico_tipo_sanguineo}
                      onChange={set('medico_tipo_sanguineo')}
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    >
                      <option value="">Selecione...</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Fator Rh</label>
                    <select
                      value={form.medico_fator_rh}
                      onChange={set('medico_fator_rh')}
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    >
                      <option value="">Selecione...</option>
                      <option value="+">Positivo (+)</option>
                      <option value="-">Negativo (-)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Cartão do SUS</label>
                    <input
                      value={form.medico_sus}
                      onChange={set('medico_sus')}
                      placeholder="Nº do Cartão SUS"
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Contato Emergência (Nome)</label>
                    <input
                      value={form.medico_emergencia_nome}
                      onChange={set('medico_emergencia_nome')}
                      placeholder="Contato de Emergência"
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Celular Emergência</label>
                    <input
                      value={form.medico_emergencia_telefone}
                      onChange={setFormatado('medico_emergencia_telefone', formatarTelefone)}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Faz uso de medicação?</label>
                    <select
                      value={form.medico_medicacao_uso}
                      onChange={set('medico_medicacao_uso')}
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    >
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Qual medicação?</label>
                    <input
                      value={form.medico_medicacao_lista}
                      onChange={set('medico_medicacao_lista')}
                      disabled={form.medico_medicacao_uso !== 'Sim'}
                      placeholder="Descreva os medicamentos que utiliza"
                      className="w-full bg-zinc-950 disabled:bg-zinc-950/40 disabled:text-zinc-500 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                </div>



                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <FileHeart size={12} className="text-amber-500" /> Restrições Médicas ou Físicas
                  </label>
                  <textarea
                    value={form.medico_restricoes}
                    onChange={set('medico_restricoes')}
                    placeholder="Ex: Problemas de articulação, dores nas costas, recomendações físicas, etc."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert size={12} className="text-red-500" /> Diagnósticos Clínicos Importantes
                  </label>
                  <textarea
                    value={form.medico_diagnosticos}
                    onChange={set('medico_diagnosticos')}
                    placeholder="Ex: Asma, Hipertensão, Arritmia cardíaca, etc."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Responsáveis (Condicional Menor de Idade) */}
            {isMenor ? (
              <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-6 space-y-5 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2">
                    <HeartHandshake className="text-gold" size={16} /> RESPONSÁVEL LEGAL
                  </h3>
                  <span className="bg-gold/10 text-gold text-[8px] font-bold px-2 py-0.5 rounded-md border border-gold/20 uppercase tracking-wider animate-pulse">
                    Obrigatório (Menor)
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-500 leading-relaxed -mt-2">
                  Detectamos que o atleta possui **{idade} anos** de idade. É mandatório preencher as informações de um responsável ou pais.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 col-span-full">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Nome do Responsável *</label>
                    <input
                      required={isMenor}
                      value={form.responsavel_nome}
                      onChange={set('responsavel_nome')}
                      placeholder="Nome completo do pai, mãe ou tutor"
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">CPF do Responsável *</label>
                    <input
                      required={isMenor}
                      value={form.responsavel_cpf}
                      onChange={setFormatado('responsavel_cpf', formatarCPF)}
                      placeholder="123.456.789-00"
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Celular do Responsável *</label>
                    <input
                      required={isMenor}
                      value={form.responsavel_telefone}
                      onChange={setFormatado('responsavel_telefone', formatarTelefone)}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 col-span-full">
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">E-mail do Responsável</label>
                    <input
                      type="email"
                      value={form.responsavel_email}
                      onChange={set('responsavel_email')}
                      placeholder="email.responsavel@exemplo.com"
                      className="w-full bg-zinc-950 border border-zinc-850 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* Card 4: Consentimento de Uso de Imagem */}
            {(() => {
              const valAutorizaSalvo = usuario?.dados_atleta?.autoriza_uso_imagem !== undefined
                ? usuario.dados_atleta.autoriza_uso_imagem
                : usuario?.autoriza_uso_imagem;

              if (valAutorizaSalvo === null || valAutorizaSalvo === undefined) {
                return (
                  <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
                      <HeartPulse className="text-gold" size={16} /> AUTORIZAÇÃO DE USO DE IMAGEM
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Ao preencher este formulário, autorizo a Associação Goju-Ryu Karatê-Kai, utilizar a imagem dos atletas para fins institucionais, promocionais e de divulgação das atividades esportivas. A imagem poderá ser usada em materiais impressos, redes sociais, sites ou qualquer outro meio de comunicação da associação. A utilização da imagem será exclusivamente relacionada às atividades promovidas pela associação. A criança não será identificada pessoalmente nas publicações, a menos que expressamente autorizado. A autorização é concedida de forma gratuita, sem qualquer expectativa de compensação financeira. Caso não deseje autorizar o uso de imagem, por favor, marque a opção de não autorização no campo abaixo.
                    </p>
                    <div className="flex gap-6 pt-2">
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                        <input
                          type="radio"
                          name="autoriza_uso_imagem"
                          checked={form.autoriza_uso_imagem === true}
                          onChange={() => setForm(prev => ({ ...prev, autoriza_uso_imagem: true }))}
                          className="accent-gold h-4 w-4"
                        />
                        <span>Autorizo o uso da imagem.</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                        <input
                          type="radio"
                          name="autoriza_uso_imagem"
                          checked={form.autoriza_uso_imagem === false}
                          onChange={() => setForm(prev => ({ ...prev, autoriza_uso_imagem: false }))}
                          className="accent-gold h-4 w-4"
                        />
                        <span>Não autorizo o uso da imagem.</span>
                      </label>
                    </div>
                  </div>
                );
              }

              const isAutorizado = valAutorizaSalvo !== false && valAutorizaSalvo !== 'false' && valAutorizaSalvo !== 0;

              return (
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <ShieldCheck className={isAutorizado ? "text-emerald-400" : "text-red-400"} size={16} /> AUTORIZAÇÃO DE USO DE IMAGEM
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                    Sua opção de consentimento para uso de imagem foi registrada em nosso banco de dados.
                  </p>
                  <div className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-xl mt-1 select-none pointer-events-none ${
                    isAutorizado
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {isAutorizado ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" /> : <AlertCircle className="w-4.5 h-4.5 text-red-400" />}
                    {isAutorizado ? 'TERMO AUTORIZADO' : 'TERMO NÃO AUTORIZADO'}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed pt-2.5 border-t border-zinc-800/60">
                    Para fins de segurança jurídica, a alteração desta preferência após a primeira escolha deve ser solicitada à secretaria do seu Dojo.
                  </p>
                </div>
              );
            })()}

          </div>

        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-900 font-cinzel">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/20 text-xs tracking-widest uppercase"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Salvando...</>
            ) : (
              <><Save size={14} /> Salvar Ficha Cadastral</>
            )}
          </button>
        </div>

      </form>

      {isAdmin && (
        <div className="mt-10">
          <AdminIntegracoes />
        </div>
      )}

    </main>
  );
}

function AdminIntegracoes() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [telefoneTeste, setTelefoneTeste] = useState('');
  const [testando, setTestando] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const carregarStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/status`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarStatus();
  }, []);

  const handleTestar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefoneTeste) return;
    setTestando(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/testar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ telefone: telefoneTeste.replace(/\D/g, '') })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ success: true, msg: 'Mensagem de teste enviada com sucesso!' });
      } else {
        setFeedback({ success: false, msg: data.error || 'Falha ao enviar mensagem.' });
      }
    } catch (err: any) {
      setFeedback({ success: false, msg: 'Erro de conexão.' });
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
      <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
        <Smartphone className="text-primary" size={16} /> INTEGRAÇÕES DO SISTEMA (WhatsApp & Pagamentos)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloco WhatsApp */}
        <div className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">WhatsApp (Evolution API)</h4>
            {loading ? (
              <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
            ) : status?.modo_mock ? (
              <span className="text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Modo Simulado (Mock)
              </span>
            ) : status?.connected ? (
              <span className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Conectado
              </span>
            ) : (
              <span className="text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Desconectado
              </span>
            )}
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
            Permite o envio automático de alertas para faturas a vencer, resultados de exames e avisos da diretoria diretamente no WhatsApp.
          </p>

          <form onSubmit={handleTestar} className="space-y-2 font-sans">
            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Enviar mensagem de teste</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="(DDD) 99999-9999"
                value={telefoneTeste}
                onChange={(e) => setTelefoneTeste(formatarTelefone(e.target.value))}
                className="flex-1 bg-zinc-900 border border-zinc-800 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                disabled={testando || !telefoneTeste}
                className="px-4 bg-gold hover:bg-gold-dark text-white rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {testando ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
            </div>
            {feedback && (
              <p className={`text-[10px] font-semibold ${feedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {feedback.msg}
              </p>
            )}
          </form>
        </div>

        {/* Bloco Asaas */}
        <div className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-xl space-y-4 flex flex-col justify-between font-sans">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Gateway de Pagamento (Asaas)</h4>
              <span className="text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Sandbox (Testes)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
              Gera automaticamente cobranças e QR Codes PIX / boletos bancários integrados na tela financeira dos atletas, atualizando o status após a compensação.
            </p>
          </div>
          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-[10px] text-zinc-400 space-y-1">
            <p className="font-bold text-white uppercase tracking-widest text-[9px] mb-1">Status do Webhook</p>
            <p className="font-mono flex justify-between">
              <span>URL:</span>
              <span className="text-zinc-500">/api/financeiro/webhook/asaas</span>
            </p>
            <p className="font-mono flex justify-between">
              <span>Integrado:</span>
              <span className="text-emerald-400">Ativo</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
