'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, ShieldAlert, Loader2, Search, CheckCircle2, User, Trophy, Mail, Phone, Printer, FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Atleta {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  faixa: string;
  status: 'ativo' | 'pendente' | 'inativo';
  filial_nome?: string;
  cidade?: string;
  cpf?: string;
  sexo?: string;
  data_nascimento?: string;
  nome_professor?: string;
  cep?: string;
  endereco?: string;
  uf?: string;
  responsavel_nome?: string;
  responsavel_cpf?: string;
  responsavel_email?: string;
  responsavel_telefone?: string;
  medico_alergias?: string;
  medico_plano?: string;
  medico_restricoes?: string;
  medico_diagnosticos?: string;
  arte_marcial?: string;
  estilo?: string;
  academia_clube?: string;
  medico_tipo_sanguineo?: string;
  medico_fator_rh?: string;
  medico_sus?: string;
  medico_emergencia_nome?: string;
  medico_emergencia_telefone?: string;
  medico_medicacao_uso?: string;
  medico_medicacao_lista?: string;
  medico_alergia_medicamento?: string;
  fisico_peso?: string;
  fisico_altura?: string;
  autoriza_uso_imagem?: boolean;
  registro_federacao?: string;
  documentos_entregues?: boolean;
  ja_praticou_artes_marciais?: string;
  federacao?: string;
}

import { FAIXAS, FAIXAS_INFANTIL, FAIXAS_ADULTO, CORES_FAIXAS, obterEstiloFaixa } from '@/constants/faixas';

function renderFaixaBadge(faixa: string) {
  const cor = obterEstiloFaixa(faixa);

  return (
    <div className={`relative flex items-center justify-between px-2.5 py-1 rounded border text-[9px] font-black uppercase tracking-wider ${cor.bg} ${cor.border} ${cor.text} shadow-sm overflow-hidden h-[22px] min-w-[95px] select-none`}>
      {cor.centerStripe && (
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 ${cor.centerStripe} pointer-events-none opacity-90`} />
      )}
      <span className="relative z-10 truncate pr-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{faixa || 'Branca'}</span>
      {cor.tipStripe ? (
        <div className={`relative z-10 w-2.5 h-full ${cor.tipStripe}`} title="Ponteira de Graduação" />
      ) : !cor.centerStripe ? (
        <div className="relative z-10 w-1 h-full bg-zinc-950/20" />
      ) : null}
    </div>
  );
}

export default function AtletasPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'pendente'>('todos');
  
  interface Filial {
    id: string;
    nome: string;
  }
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);
  const [viewingAtleta, setViewingAtleta] = useState<Atleta | null>(null);
  const [novaFaixa, setNovaFaixa] = useState('');
  const [novaFilialId, setNovaFilialId] = useState('');
  const [novaFederacao, setNovaFederacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregarAtletas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/atletas`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao obter atletas da API');
      const data = await res.json();
      setAtletas(data.atletas || []);
    } catch (err) {
      console.error("Erro ao carregar atletas, usando dados emulados:", err);
      // Fallback local
      setAtletas([
        { id: "st-1", nome: "Pedro Oliveira", email: "pedro.oliveira@grkk.com.br", telefone: "(71) 98888-2001", faixa: "Branca", status: "ativo", filial_nome: "Filial Salvador Centro" },
        { id: "st-2", nome: "Lucas Almeida", email: "lucas.almeida@grkk.com.br", telefone: "(71) 98888-2002", faixa: "Amarela", status: "ativo", filial_nome: "Filial Salvador Centro" },
        { id: "pending-athlete-id", nome: "Atleta Pendente de Teste", email: "atleta-pendente@grkk.com.br", telefone: "71988888888", faixa: "Branca", status: "pendente", filial_nome: "GRKK CABULA" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarFiliais = async () => {
    try {
      const res = await fetch(`${API_URL}/api/filiais`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFiliais(data.filiais || []);
      }
    } catch (err) {
      console.error("Erro ao carregar filiais na área administrativa:", err);
    }
  };

  useEffect(() => {
    carregarAtletas();
    carregarFiliais();
  }, []);

  const handleStatusChange = async (atletaId: string, novoStatus: 'ativo' | 'inativo' | 'pendente') => {
    try {
      const res = await fetch(`${API_URL}/api/atletas/${atletaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) throw new Error('Erro ao alterar status do atleta');
      setAtletas(atletas.map(a => a.id === atletaId ? { ...a, status: novoStatus } : a));
    } catch (err) {
      setAtletas(atletas.map(a => a.id === atletaId ? { ...a, status: novoStatus } : a));
    }
  };

  const handleToggleDocumentos = async (atletaId: string, entregues: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/atletas/${atletaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ documentos_entregues: entregues })
      });
      if (!res.ok) throw new Error('Erro ao atualizar status dos documentos do atleta');
      setAtletas(atletas.map(a => a.id === atletaId ? { ...a, documentos_entregues: entregues } : a));
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar documentos');
    }
  };

  const handleImprimirFicha = (atleta: Atleta) => {
    const dataNasc = atleta.data_nascimento 
      ? atleta.data_nascimento.split('-').reverse().join('/') 
      : 'Não informada';
    const cpf = atleta.cpf 
      ? atleta.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') 
      : 'Não informado';
    const idade = atleta.data_nascimento 
      ? (new Date().getFullYear() - new Date(atleta.data_nascimento).getFullYear()) 
      : '—';
    const isMenor = atleta.data_nascimento && (new Date().getFullYear() - new Date(atleta.data_nascimento).getFullYear() < 18);
    const respCpf = atleta.responsavel_cpf 
      ? atleta.responsavel_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') 
      : 'Não informado';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>Ficha Cadastral e Médica - ${atleta.nome}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;600;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #111;
            background-color: #fff;
            padding: 20px;
            font-size: 10px;
            line-height: 1.35;
          }
          .header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .header-logo {
            height: 55px;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
            flex: 1;
            margin: 0 15px;
          }
          .header-text h1 {
            font-family: 'Cinzel', serif;
            font-size: 16px;
            margin: 0 0 3px 0;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            font-weight: 800;
          }
          .header-text p {
            font-size: 8.5px;
            margin: 0;
            font-weight: 600;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            color: #444;
          }
          .section-title {
            font-family: 'Cinzel', serif;
            font-size: 10px;
            font-weight: bold;
            border-bottom: 1px solid #111;
            padding-bottom: 2px;
            margin-top: 15px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }
          .grid-full {
            grid-column: span 2;
          }
          .grid-full-3 {
            grid-column: span 3;
          }
          .field {
            display: flex;
            flex-direction: column;
          }
          .label {
            font-size: 7.5px;
            font-weight: 800;
            text-transform: uppercase;
            color: #555;
            margin-bottom: 2px;
          }
          .value {
            font-size: 10px;
            font-weight: 600;
            color: #000;
            padding: 5px 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            min-height: 12px;
          }
          .value-large {
            min-height: 32px;
          }
          .signature-area {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            gap: 25px;
          }
          .signature-box {
            flex: 1;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #111;
            margin-top: 25px;
            padding-top: 4px;
            font-size: 7.5px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .list-rules {
            margin: 0;
            padding-left: 12px;
          }
          .list-rules li {
            margin-bottom: 2px;
          }
          @media print {
            body { padding: 10px; }
            .section-title { margin-top: 10px; }
            .signature-area { margin-top: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header-container" style="justify-content: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
          <div class="header-text" style="text-align: center;">
            <img src="${window.location.origin}/logo.png" alt="GRKK" style="height: 55px; margin-bottom: 5px; display: block; margin-left: auto; margin-right: auto;" />
            <h1>Associação Goju-Ryu Karate Kai</h1>
            <p>Ficha de Matrícula & Ficha Médica de Emergência</p>
          </div>
        </div>

        <div class="section-title">Dados Gerais e Técnicos</div>
        <div class="grid grid-3">
          <div class="field grid-full-3">
            <span class="label">Nome Completo</span>
            <span class="value">${atleta.nome}</span>
          </div>
          <div class="field">
            <span class="label">Nº de Registro da Federação</span>
            <span class="value">${atleta.registro_federacao || 'Pendente de homologação'}</span>
          </div>
          <div class="field">
            <span class="label">Graduação Atual (Faixa/Nível)</span>
            <span class="value">${atleta.faixa}</span>
          </div>
          <div class="field">
            <span class="label">Academia / Dojo / Filial</span>
            <span class="value">${atleta.filial_nome || 'Dojo Central'}</span>
          </div>
          <div class="field">
            <span class="label">Professor Responsável</span>
            <span class="value">${atleta.nome_professor || 'Não informado'}</span>
          </div>
          <div class="field">
            <span class="label">Arte Marcial</span>
            <span class="value">${atleta.arte_marcial || 'Karate'}</span>
          </div>
          <div class="field">
            <span class="label">Estilo</span>
            <span class="value">${atleta.estilo || 'Goju-Ryu'}</span>
          </div>
          <div class="field">
            <span class="label">Entidade de Prática</span>
            <span class="value">${atleta.academia_clube || 'Associação Goju-Ryu Karate Kai'}</span>
          </div>
          <div class="field">
            <span class="label">Peso / Altura</span>
            <span class="value">${atleta.fisico_peso ? `${atleta.fisico_peso} kg` : '—'} / ${atleta.fisico_altura ? `${atleta.fisico_altura} m` : '—'}</span>
          </div>
        </div>

        <div class="section-title">Informações Pessoais</div>
        <div class="grid">
          <div class="field">
            <span class="label">CPF</span>
            <span class="value">${cpf}</span>
          </div>
          <div class="field">
            <span class="label">Data de Nascimento</span>
            <span class="value">${dataNasc} (Idade: ${idade} anos)</span>
          </div>
          <div class="field">
            <span class="label">Sexo</span>
            <span class="value">${atleta.sexo === 'M' ? 'Masculino' : atleta.sexo === 'F' ? 'Feminino' : 'Outro'}</span>
          </div>
          <div class="field">
            <span class="label">Celular</span>
            <span class="value">${atleta.telefone || 'Não informado'}</span>
          </div>
          <div class="field grid-full">
            <span class="label">E-mail</span>
            <span class="value">${atleta.email}</span>
          </div>
          <div class="field grid-full">
            <span class="label">Endereço Residencial</span>
            <span class="value">${atleta.endereco || 'Não cadastrado'} ${atleta.cidade ? `, ${atleta.cidade} - ${atleta.uf || 'BA'}` : ''}</span>
          </div>
        </div>

        ${isMenor ? `
        <div class="section-title">Responsável Legal (Menor de 18 Anos)</div>
        <div class="grid">
          <div class="field grid-full">
            <span class="label">Nome do Responsável</span>
            <span class="value">${atleta.responsavel_nome || 'Não informado'}</span>
          </div>
          <div class="field">
            <span class="label">CPF do Responsável</span>
            <span class="value">${respCpf}</span>
          </div>
          <div class="field">
            <span class="label">Celular do Responsável</span>
            <span class="value">${atleta.responsavel_telefone || 'Não informado'}</span>
          </div>
          <div class="field grid-full">
            <span class="label">E-mail do Responsável</span>
            <span class="value">${atleta.responsavel_email || 'Não informado'}</span>
          </div>
        </div>
        ` : ''}

        <div class="section-title">Ficha Médica & Dados de Saúde</div>
        <div class="grid">
          <div class="field">
            <span class="label">Tipo Sanguíneo & Fator Rh</span>
            <span class="value">${atleta.medico_tipo_sanguineo || '—'} ${atleta.medico_fator_rh || ''}</span>
          </div>
          <div class="field">
            <span class="label">Cartão do SUS</span>
            <span class="value">${atleta.medico_sus || 'Não informado'}</span>
          </div>
          <div class="field">
            <span class="label">Plano de Saúde / Convênio</span>
            <span class="value">${atleta.medico_plano || 'Sem informações de convênio médico.'}</span>
          </div>
          <div class="field">
            <span class="label">Contato de Emergência</span>
            <span class="value">${atleta.medico_emergencia_nome || '—'} ${atleta.medico_emergencia_telefone ? `(${atleta.medico_emergencia_telefone})` : ''}</span>
          </div>
          <div class="field grid-full">
            <span class="label">Alergias Gerais & Alimentares</span>
            <span class="value">${atleta.medico_alergias || 'Nenhuma alergia relatada.'}</span>
          </div>
          <div class="field grid-full">
            <span class="label font-bold text-red-700">Alergia a Medicamentos</span>
            <span class="value">${atleta.medico_alergia_medicamento || 'Nenhuma alergia a medicamentos relatada.'}</span>
          </div>
          <div class="field grid-full">
            <span class="label">Medicamentos de Uso Contínuo</span>
            <span class="value">
              <strong>Usa medicamentos?</strong> ${atleta.medico_medicacao_uso || 'Não'}<br/>
              ${atleta.medico_medicacao_uso === 'Sim' ? `<strong>Lista:</strong> ${atleta.medico_medicacao_lista}` : ''}
            </span>
          </div>
          <div class="field grid-full">
            <span class="label">Restrições Físicas / Recomendações Médicas</span>
            <span class="value value-large">${atleta.medico_restricoes || 'Nenhuma restrição física relatada.'}</span>
          </div>
          <div class="field grid-full">
            <span class="label">Diagnósticos Clínicos / Patologias</span>
            <span class="value value-large">${atleta.medico_diagnosticos || 'Nenhum diagnóstico relatado.'}</span>
          </div>
        </div>

        <div class="section-title">Checklist de Documentos Exigidos (Controle Administrativo)</div>
        <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: bold; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 5px; padding: 8px 12px; margin-bottom: 10px;">
          <label style="display: flex; align-items: center; gap: 4px;"><input type="checkbox" style="transform: scale(0.85);" /> Cópia do RG</label>
          <label style="display: flex; align-items: center; gap: 4px;"><input type="checkbox" style="transform: scale(0.85);" /> Cópia RG do Responsável (se menor)</label>
          <label style="display: flex; align-items: center; gap: 4px;"><input type="checkbox" style="transform: scale(0.85);" /> Cópia do Cartão SUS</label>
          <label style="display: flex; align-items: center; gap: 4px;"><input type="checkbox" style="transform: scale(0.85);" /> Cópia Cartão do Plano</label>
          <label style="display: flex; align-items: center; gap: 4px;"><input type="checkbox" style="transform: scale(0.85);" /> Cópia Comprovante de Residência</label>
        </div>

        <div class="section-title">Regras Gerais e Compromisso do Aluno (GRKK / Projeto Social)</div>
        <div style="font-size: 8px; line-height: 1.4; color: #222; background: #fff; border: 1px solid #ccc; border-radius: 5px; padding: 8px 12px; margin-bottom: 10px;">
          <ol class="list-rules">
            <li>Cada aluno deverá ter seu Karate-Gi (Kimono).</li>
            <li>O exame de faixa só será permitido ao aluno com Karate-Gi (Kimono).</li>
            <li>Para realizar o exame de faixa o aluno deverá ter no mínimo 75% de presença nos treinos.</li>
            <li>Para realizar o exame de faixa o aluno deverá ter no mínimo 75% de presença Escolar.</li>
            <li>Para realizar o exame de faixa o aluno não poderá ter média escolar inferior a 5,00.</li>
            <li>O aluno que for pego ou denunciado por agressão, violência ou outro fator que venha a afetar a GRKK será suspenso e, se reincidente, será excluído do projeto.</li>
            <li>Todos os custos administrativos como exames de faixa, campeonatos ou seminários são de inteira responsabilidade do aluno/responsável.</li>
            <li><strong>Comodato:</strong> Em caso de desistência, o aluno deverá devolver imediatamente todo o material e uniforme fornecido sob regime de comodato para treino pela GRKK, para oportunizar a vaga a outra pessoa.</li>
          </ol>
        </div>

        <div class="section-title">Autorização de Uso de Imagem</div>
        <div style="font-size: 8px; line-height: 1.4; color: #222; background: #fff; border: 1px solid #ccc; border-radius: 5px; padding: 8px 12px; margin-bottom: 10px;">
          <p style="margin: 0 0 6px 0;">
            Ao assinar esta ficha, declaro ciência e decisão a respeito do uso de imagem para fins institucionais e de divulgação da GRKK, conforme escolha registrada abaixo:
          </p>
          <div style="display: flex; gap: 30px; font-weight: bold; font-size: 8.5px; text-transform: uppercase;">
            <span style="color: ${atleta.autoriza_uso_imagem !== false ? '#10b981' : '#777'}">
              [${atleta.autoriza_uso_imagem !== false ? 'X' : ' '}] Autorizo o uso da imagem.
            </span>
            <span style="color: ${atleta.autoriza_uso_imagem === false ? '#ef4444' : '#777'}">
              [${atleta.autoriza_uso_imagem === false ? 'X' : ' '}] Não autorizo o uso da imagem.
            </span>
          </div>
        </div>

        <div class="signature-area">
          <div class="signature-box">
            <div class="signature-line">Assinatura do Atleta (ou Responsável Legal se menor)</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Assinatura do Sensei Responsável</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleExcluir = async (atletaId: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este atleta?")) return;
    try {
      const res = await fetch(`${API_URL}/api/atletas/${atletaId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Erro ao excluir atleta');
      setAtletas(atletas.filter(a => a.id !== atletaId));
    } catch (err) {
      setAtletas(atletas.filter(a => a.id !== atletaId));
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAtleta) return;
    setSalvando(true);
    try {
      const filialSelecionada = filiais.find(f => f.id === novaFilialId);
      const filialNome = filialSelecionada ? filialSelecionada.nome : 'Dojo Central / Sem Filial';

      const res = await fetch(`${API_URL}/api/atletas/${selectedAtleta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          faixa: novaFaixa,
          filial_id: novaFilialId || null,
          filial_nome: novaFilialId ? filialNome : null,
          federacao: novaFederacao || null
        })
      });
      if (res.ok) {
        setAtletas(atletas.map(a => a.id === selectedAtleta.id ? { 
          ...a, 
          faixa: novaFaixa,
          filial_id: novaFilialId || undefined,
          filial_nome: novaFilialId ? filialNome : 'Dojo Central / Sem Filial',
          federacao: novaFederacao || undefined
        } : a));
        setSelectedAtleta(null);
      }
    } catch (err) {
      const filialSelecionada = filiais.find(f => f.id === novaFilialId);
      const filialNome = filialSelecionada ? filialSelecionada.nome : 'Dojo Central / Sem Filial';
      setAtletas(atletas.map(a => a.id === selectedAtleta.id ? { 
        ...a, 
        faixa: novaFaixa,
        filial_id: novaFilialId || undefined,
        filial_nome: novaFilialId ? filialNome : 'Dojo Central / Sem Filial',
        federacao: novaFederacao || undefined
      } : a));
      setSelectedAtleta(null);
    } finally {
      setSalvando(false);
    }
  };

  const atletasFiltrados = atletas.filter(atleta => {
    const matchesBusca = atleta.nome.toLowerCase().includes(busca.toLowerCase()) || 
                         atleta.email.toLowerCase().includes(busca.toLowerCase());
    const matchesStatus = statusFiltro === 'todos' || atleta.status === statusFiltro;
    return matchesBusca && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (tipo !== 'admin' && tipo !== 'filial') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-white font-cinzel">Acesso Negado</h2>
        <p className="text-zinc-500 text-sm">Apenas administradores e filiais homologadas podem acessar este painel.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Gestão de Atletas</h1>
        <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">Homologação de cadastros e graduações</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 border border-zinc-800 rounded-xl w-full md:w-auto">
          {(['todos', 'ativo', 'pendente'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFiltro(f)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                statusFiltro === f ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Pendentes'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      {/* Grid de Atletas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {atletasFiltrados.map(atleta => (
          <div key={atleta.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-center text-zinc-400">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{atleta.nome}</h3>
                    <p className="text-[10px] text-zinc-500">{atleta.filial_nome || 'Dojo Central'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-md border ${
                    atleta.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    atleta.status === 'pendente' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {atleta.status}
                  </span>
                  {atleta.status === 'pendente' && !atleta.cpf && (
                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-md border bg-red-950/40 text-red-400 border-red-500/30" title="Cadastro sem CPF preenchido">
                      Falta CPF
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-zinc-800/50">
                <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
                  <Mail size={11} className="text-zinc-650" /> {atleta.email}
                </p>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
                  <Phone size={11} className="text-zinc-650" /> {atleta.telefone || 'Não informado'}
                </p>
                <div className="text-[10px] text-zinc-400 flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-800/10">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Trophy size={11} className="text-zinc-650" /> Graduação:
                  </span>
                  {renderFaixaBadge(atleta.faixa)}
                </div>
                <div className="text-[10px] text-zinc-400 flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-800/10">
                  <span className="flex items-center gap-1.5 font-mono">
                    <FileText size={11} className="text-zinc-650" /> Documentos:
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleToggleDocumentos(atleta.id, !atleta.documentos_entregues)}
                    className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border transition duration-300 cursor-pointer ${
                      atleta.documentos_entregues 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                  >
                    {atleta.documentos_entregues ? 'Entregues' : 'Pendentes'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-zinc-800/40">
              {atleta.status === 'pendente' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(atleta.id, 'ativo')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={12} /> Homologar
                  </button>
                  <button
                    onClick={() => handleStatusChange(atleta.id, 'inativo')}
                    className="flex-1 py-2 bg-zinc-950 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/30 text-zinc-400 hover:text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Negar
                  </button>
                </div>
              )}
              {atleta.status === 'ativo' && (
                <button
                  onClick={() => handleStatusChange(atleta.id, 'inativo')}
                  className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Suspender Atleta
                </button>
              )}
              {atleta.status === 'inativo' && (
                <button
                  onClick={() => handleStatusChange(atleta.id, 'ativo')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  Re-homologar
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingAtleta(atleta)}
                  className="flex-1 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Ver Ficha
                </button>
                <button
                  onClick={() => {
                    setSelectedAtleta(atleta);
                    setNovaFaixa(atleta.faixa);
                    setNovaFilialId((atleta as any).filial_id || '');
                    setNovaFederacao(atleta.federacao || '');
                  }}
                  className="flex-1 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Faixa / Dojo
                </button>
              </div>
              <button
                onClick={() => handleExcluir(atleta.id)}
                className="w-full py-1.5 bg-red-950/20 hover:bg-red-650 border border-red-900/20 hover:border-red-500 text-red-400 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
              >
                Excluir Atleta
              </button>
            </div>
          </div>
        ))}

        {atletasFiltrados.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
            Nenhum atleta encontrado.
          </div>
        )}
      </div>

      {/* Modal Edição de Faixa e Dojo */}
      {selectedAtleta && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-sm p-6 relative">
            <h3 className="text-base font-bold text-white font-cinzel mb-1">Dados Técnicos do Atleta</h3>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-5">Atleta: <strong className="text-white">{selectedAtleta.nome}</strong></p>
 
            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-450 uppercase mb-1.5">Faixa / Graduação</label>
                <select
                  value={novaFaixa}
                  onChange={(e) => setNovaFaixa(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold"
                >
                  <optgroup label="── Divisão Infantil ──">
                    {FAIXAS_INFANTIL.map(faixa => (
                      <option key={`inf-${faixa}`} value={faixa}>{faixa}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── Divisão Adulto ──">
                    {FAIXAS_ADULTO.map(faixa => (
                      <option key={`adu-${faixa}`} value={faixa}>{faixa}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-450 uppercase mb-1.5">Dojo / Filial</label>
                <select
                  value={novaFilialId}
                  onChange={(e) => setNovaFilialId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold"
                >
                  <option value="">Dojo Central (Nenhuma Filial)</option>
                  {filiais.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-450 uppercase mb-1.5">Federação</label>
                <select
                  value={novaFederacao}
                  onChange={(e) => setNovaFederacao(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold"
                >
                  <option value="">Não filiado a nenhuma federação</option>
                  <option value="FKBA">Filiado a FKBA</option>
                  <option value="IOGKF Brasil">Filiado a IOGKF Brasil</option>
                </select>
              </div>
 
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAtleta(null)}
                  className="flex-1 py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer flex items-center justify-center"
                >
                  {salvando ? <Loader2 size={12} className="animate-spin" /> : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha Completa do Atleta */}
      {viewingAtleta && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Top decorative gradient */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h3 className="text-xl font-bold text-white font-cinzel tracking-wider">{viewingAtleta.nome}</h3>
                  {renderFaixaBadge(viewingAtleta.faixa)}
                </div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-1">Ficha Cadastral e Ficha Médica</p>
              </div>
              <button 
                onClick={() => setViewingAtleta(null)}
                className="w-8 h-8 rounded-xl bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-white border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seção 1: Dados Pessoais */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gold font-cinzel tracking-wider uppercase">Dados Pessoais e Contato</h4>
                <div className="space-y-2.5 text-xs">
                  <p className="text-zinc-400">CPF: <strong className="text-white font-mono">{viewingAtleta.cpf ? viewingAtleta.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'Não informado'}</strong></p>
                  <p className="text-zinc-400">Data de Nascimento: <strong className="text-white font-mono">{viewingAtleta.data_nascimento ? viewingAtleta.data_nascimento.split('-').reverse().join('/') : 'Não informada'}</strong></p>
                  <p className="text-zinc-400">Idade: <strong className="text-white">{viewingAtleta.data_nascimento ? (new Date().getFullYear() - new Date(viewingAtleta.data_nascimento).getFullYear()) : '—'} anos</strong></p>
                  <p className="text-zinc-400">Sexo: <strong className="text-white">{viewingAtleta.sexo === 'M' ? 'Masculino' : viewingAtleta.sexo === 'F' ? 'Feminino' : 'Outro'}</strong></p>
                  <p className="text-zinc-400">Celular: <strong className="text-white font-mono">{viewingAtleta.telefone || 'Não informado'}</strong></p>
                  <p className="text-zinc-400">E-mail: <strong className="text-white font-mono">{viewingAtleta.email}</strong></p>
                  <p className="text-zinc-400">Dojo / Filial: <strong className="text-white">{viewingAtleta.filial_nome || 'Dojo Central'}</strong></p>
                  <p className="text-zinc-400">Federação: <strong className="text-white">{viewingAtleta.federacao ? (viewingAtleta.federacao.startsWith('Filiado') ? viewingAtleta.federacao : `Filiado a ${viewingAtleta.federacao}`) : 'Não filiado'}</strong></p>
                  <p className="text-zinc-400">Já praticou artes marciais antes?: <strong className="text-white">{viewingAtleta.ja_praticou_artes_marciais || (viewingAtleta.nome_professor ? 'Sim' : 'Não')}</strong></p>
                  {(viewingAtleta.ja_praticou_artes_marciais === 'Sim' || viewingAtleta.nome_professor) && (
                    <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/80 space-y-1 my-1">
                      <p className="text-zinc-400">Sensei / Professor: <strong className="text-white">{viewingAtleta.nome_professor || 'Não informado'}</strong></p>
                      <p className="text-zinc-400">Arte Marcial: <strong className="text-white">{viewingAtleta.arte_marcial || 'Karate'}</strong></p>
                      <p className="text-zinc-400">Estilo: <strong className="text-white">{viewingAtleta.estilo || 'Goju-Ryu'}</strong></p>
                      <p className="text-zinc-400">Academia / Clube: <strong className="text-white">{viewingAtleta.academia_clube || 'Associação Goju-Ryu Karate Kai'}</strong></p>
                    </div>
                  )}
                  <p className="text-zinc-400">Endereço: <strong className="text-white leading-relaxed">{viewingAtleta.endereco || 'Não cadastrado'} {viewingAtleta.cidade ? `, ${viewingAtleta.cidade} - ${viewingAtleta.uf || 'BA'}` : ''}</strong></p>
                </div>
              </div>

              {/* Seção 2: Responsáveis e Dados Médicos */}
              <div className="space-y-6">
                {/* Seção Responsável (se for menor) */}
                {viewingAtleta.data_nascimento && (new Date().getFullYear() - new Date(viewingAtleta.data_nascimento).getFullYear() < 18) ? (
                  <div className="bg-zinc-900/40 border border-gold/15 rounded-2xl p-4 space-y-3">
                    <h4 className="text-[11px] font-bold text-gold font-cinzel tracking-wider uppercase">Responsável Legal (Menor)</h4>
                    <div className="space-y-2 text-xs">
                      <p className="text-zinc-400">Nome: <strong className="text-white">{viewingAtleta.responsavel_nome || 'Não informado'}</strong></p>
                      <p className="text-zinc-400">CPF: <strong className="text-white font-mono">{viewingAtleta.responsavel_cpf ? viewingAtleta.responsavel_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'Não informado'}</strong></p>
                      <p className="text-zinc-400">Celular: <strong className="text-white font-mono">{viewingAtleta.responsavel_telefone || 'Não informado'}</strong></p>
                      <p className="text-zinc-400">E-mail: <strong className="text-white font-mono">{viewingAtleta.responsavel_email || 'Não informado'}</strong></p>
                    </div>
                  </div>
                ) : null}

                {/* Seção Ficha Médica */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-emerald-400 font-cinzel tracking-wider uppercase">Ficha Médica do Atleta</h4>
                  
                  {/* Informações Rápidas de Saúde */}
                  <div className="grid grid-cols-3 gap-3.5 bg-zinc-900/40 border border-emerald-500/10 rounded-2xl p-4">
                    <div>
                      <p className="text-zinc-500 font-bold uppercase text-[9px] mb-0.5">Tipo Sanguíneo / Rh</p>
                      <p className="text-white font-mono text-xs font-bold">
                        {viewingAtleta.medico_tipo_sanguineo || '—'} {viewingAtleta.medico_fator_rh || ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 font-bold uppercase text-[9px] mb-0.5">Peso / Altura</p>
                      <p className="text-white font-mono text-xs font-bold">
                        {viewingAtleta.fisico_peso ? `${viewingAtleta.fisico_peso} kg` : '—'} / {viewingAtleta.fisico_altura ? `${viewingAtleta.fisico_altura} m` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 font-bold uppercase text-[9px] mb-0.5">Cartão SUS</p>
                      <p className="text-white font-mono text-xs truncate">
                        {viewingAtleta.medico_sus || 'Não informado'}
                      </p>
                    </div>
                    <div className="col-span-3 border-t border-zinc-900/80 pt-2.5">
                      <p className="text-zinc-500 font-bold uppercase text-[9px] mb-0.5">Contato de Emergência</p>
                      <p className="text-white font-medium text-xs">
                        {viewingAtleta.medico_emergencia_nome || 'Não informado'}
                        {viewingAtleta.medico_emergencia_telefone ? ` (${viewingAtleta.medico_emergencia_telefone})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <p className="text-zinc-500 font-bold uppercase text-[9px] mb-1">Alergias Gerais</p>
                      <p className="text-white leading-relaxed bg-zinc-950 p-2.5 border border-zinc-900 rounded-xl">{viewingAtleta.medico_alergias || 'Nenhuma alergia relatada.'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 font-bold uppercase text-[9px] mb-1">Alergia a Medicamentos</p>
                      <p className="text-white leading-relaxed bg-zinc-950 p-2.5 border border-zinc-900 rounded-xl">{viewingAtleta.medico_alergia_medicamento || 'Nenhuma alergia a medicamentos relatada.'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 font-bold uppercase text-[9px] mb-1">Medicamento de Uso Contínuo</p>
                      <p className="text-white leading-relaxed bg-zinc-950 p-2.5 border border-zinc-900 rounded-xl">
                        {viewingAtleta.medico_medicacao_uso === 'Sim' 
                          ? `Sim: ${viewingAtleta.medico_medicacao_lista || 'Não especificado'}` 
                          : 'Não faz uso de medicamento contínuo.'}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 font-bold uppercase text-[9px] mb-1">Plano de Saúde</p>
                      <p className="text-white bg-zinc-950 p-2.5 border border-zinc-900 rounded-xl">{viewingAtleta.medico_plano || 'Sem informações de convênio médico.'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 font-bold uppercase text-[9px] mb-1">Restrições Físicas / Médicas</p>
                      <p className="text-white leading-relaxed bg-zinc-950 p-2.5 border border-zinc-900 rounded-xl">{viewingAtleta.medico_restricoes || 'Nenhuma restrição relatada.'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 font-bold uppercase text-[9px] mb-1">Diagnósticos Clínicos</p>
                      <p className="text-white leading-relaxed bg-zinc-950 p-2.5 border border-zinc-900 rounded-xl">{viewingAtleta.medico_diagnosticos || 'Nenhum diagnóstico clínico relatado.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
              <button
                onClick={() => handleImprimirFicha(viewingAtleta)}
                className="px-5 py-2.5 bg-gold hover:bg-gold-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider font-cinzel transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-gold/10"
              >
                <Printer size={13} />
                Imprimir Ficha
              </button>
              <button
                onClick={() => setViewingAtleta(null)}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider font-cinzel transition cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
