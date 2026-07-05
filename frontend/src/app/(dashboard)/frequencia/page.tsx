'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, ClipboardCheck, Calendar, User, Search, 
  Check, X, AlertCircle, Save, Clock, Award, ChevronRight 
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Atleta {
  id: string;
  nome: string;
  email: string;
  faixa: string;
  filial_id: string;
}

interface PresencaRegistro {
  id: string;
  atleta_id: string;
  data: string;
  status: 'presente' | 'falta' | 'justificado';
}

export default function FrequenciaPage() {
  const { usuario, isFilial, isAdmin } = useAuth();
  const [dataAula, setDataAula] = useState<string>(new Date().toISOString().split('T')[0]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [busca, setBusca] = useState('');
  
  // Status de presença atual mapeado por atleta_id
  const [folhaPresenca, setFolhaPresenca] = useState<Record<string, 'presente' | 'falta' | 'justificado'>>({});
  
  // Histórico de chamadas salvas
  const [datasLancadas, setDatasLancadas] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Carrega atletas da filial e histórico de chamadas
  const inicializarDados = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Carregar Atletas
      const resAtletas = await fetch(`${API_URL}/api/atletas`, { credentials: 'include' });
      if (!resAtletas.ok) throw new Error("Erro ao carregar atletas.");
      const dataAtl = await resAtletas.json();
      const atletasLista = dataAtl.atletas || [];
      setAtletas(atletasLista);

      // Inicializa folha de presença padrão como 'presente' para todos
      const folhaInicial: Record<string, 'presente' | 'falta' | 'justificado'> = {};
      atletasLista.forEach((a: Atleta) => {
        folhaInicial[a.id] = 'presente';
      });
      setFolhaPresenca(folhaInicial);

      // 2. Carregar todas as presenças para extrair as datas já salvas
      const resPresencas = await fetch(`${API_URL}/api/presencas`, { credentials: 'include' });
      if (resPresencas.ok) {
        const dataPres = await resPresencas.json();
        const listaPres: PresencaRegistro[] = dataPres.presencas || [];
        
        // Extrai datas únicas
        const datasUnicas = Array.from(new Set(listaPres.map(p => p.data.split('T')[0])));
        datasUnicas.sort((a, b) => b.localeCompare(a)); // Mais recentes primeiro
        setDatasLancadas(datasUnicas);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Recarrega a folha de presença caso o usuário selecione uma data específica
  const carregarChamadaNaData = async (dataSelecionada: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/presencas?data=${dataSelecionada}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const presencasData: PresencaRegistro[] = data.presencas || [];
        
        if (presencasData.length > 0) {
          // Se já existe chamada salva nessa data, carrega os status reais
          const novaFolha: Record<string, 'presente' | 'falta' | 'justificado'> = {};
          // Define default como presente para quem não tiver registro
          atletas.forEach(a => { novaFolha[a.id] = 'presente'; });
          
          presencasData.forEach(p => {
            novaFolha[p.atleta_id] = p.status;
          });
          setFolhaPresenca(novaFolha);
          setSuccessMsg(`Chamada de ${formatarDataExibicao(dataSelecionada)} carregada para visualização/edição.`);
        } else {
          // Se não há chamada, define todos como presente (novo lançamento)
          const folhaPadrao: Record<string, 'presente' | 'falta' | 'justificado'> = {};
          atletas.forEach(a => { folhaPadrao[a.id] = 'presente'; });
          setFolhaPresenca(folhaPadrao);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    inicializarDados();
  }, []);

  // Monitora mudança na data da aula para carregar dados salvos
  useEffect(() => {
    if (atletas.length > 0) {
      carregarChamadaNaData(dataAula);
    }
  }, [dataAula, atletas]);

  const formatarDataExibicao = (dataStr: string) => {
    const parts = dataStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dataStr;
  };

  const handleStatusChange = (atletaId: string, status: 'presente' | 'falta' | 'justificado') => {
    setFolhaPresenca(prev => ({
      ...prev,
      [atletaId]: status
    }));
  };

  const salvarChamada = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const presencasPayload = Object.entries(folhaPresenca).map(([atleta_id, status]) => ({
      atleta_id,
      status
    }));

    try {
      const res = await fetch(`${API_URL}/api/presencas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          data: dataAula,
          presencas: presencasPayload
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar frequência.");
      }

      setSuccessMsg(`Chamada da data ${formatarDataExibicao(dataAula)} salva com sucesso!`);
      
      // Atualiza lista de datas no histórico
      if (!datasLancadas.includes(dataAula)) {
        const novasDatas = [...datasLancadas, dataAula].sort((a, b) => b.localeCompare(a));
        setDatasLancadas(novasDatas);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de rede ao salvar chamada.");
    } finally {
      setSaving(false);
    }
  };

  // Filtragem dos atletas listados
  const atletasFiltrados = atletas.filter(a => 
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.email.toLowerCase().includes(busca.toLowerCase()) ||
    a.faixa.toLowerCase().includes(busca.toLowerCase())
  );

  if (!isFilial && !isAdmin) {
    return (
      <main className="p-6 max-w-4xl mx-auto text-center mt-12">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white font-cinzel tracking-wider">Acesso Negado</h2>
          <p className="text-xs text-zinc-500 mt-2">Apenas Filiais (Dojos) e Administradores podem registrar frequência de atletas.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Cabeçalho de Título */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center text-gold">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white font-cinzel">Frequência e Presença</h1>
            <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest font-bold mt-0.5">Lançamento de Chamada Diária e Controle de Treino</p>
          </div>
        </div>
      </div>

      {/* Feedbacks */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl flex items-center gap-3 text-xs text-red-400">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-400">
          <Check size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Principal de Chamada */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header do Lançamento */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-gold" size={16} />
                <span className="text-xs font-black uppercase tracking-wider text-zinc-200">Selecionar Data do Treino</span>
              </div>
              <input 
                type="date" 
                value={dataAula}
                onChange={(e) => setDataAula(e.target.value)}
                className="bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold font-mono"
              />
            </div>

            {/* Busca rápida */}
            <div className="p-4 border-b border-zinc-850 bg-zinc-900/40">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input 
                  type="text"
                  placeholder="Pesquisar atleta por nome, e-mail ou faixa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            {/* Listagem dos Atletas */}
            <div className="divide-y divide-zinc-850 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
                  <p className="text-xs text-zinc-500 font-cinzel tracking-wider">Carregando ficha de atletas...</p>
                </div>
              ) : atletasFiltrados.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-xs">
                  <User size={24} className="mx-auto mb-3 text-zinc-600" />
                  Nenhum atleta localizado.
                </div>
              ) : (
                atletasFiltrados.map((atleta) => {
                  const status = folhaPresenca[atleta.id] || 'presente';
                  return (
                    <div key={atleta.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-750 flex items-center justify-center text-zinc-400 font-black text-xs shrink-0 select-none">
                          {atleta.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{atleta.nome}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-zinc-500 font-mono truncate max-w-[150px]">{atleta.email}</span>
                            <span className="w-1 h-1 bg-zinc-800 rounded-full shrink-0" />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-gold flex items-center gap-0.5 shrink-0">
                              <Award size={9} /> {atleta.faixa}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controles de chamada */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Presente */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(atleta.id, 'presente')}
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            status === 'presente'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5'
                              : 'bg-zinc-950 border-zinc-850/80 text-zinc-650 hover:text-zinc-400'
                          }`}
                          title="Presente"
                        >
                          <Check size={13} />
                        </button>

                        {/* Falta */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(atleta.id, 'falta')}
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            status === 'falta'
                              ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/5'
                              : 'bg-zinc-950 border-zinc-850/80 text-zinc-650 hover:text-zinc-400'
                          }`}
                          title="Falta"
                        >
                          <X size={13} />
                        </button>

                        {/* Justificado */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(atleta.id, 'justificado')}
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            status === 'justificado'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/5'
                              : 'bg-zinc-950 border-zinc-850/80 text-zinc-650 hover:text-zinc-400'
                          }`}
                          title="Justificado"
                        >
                          <Clock size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Ações Inferiores */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 flex items-center justify-between">
              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
                {atletasFiltrados.length} atletas exibidos
              </span>
              <button
                type="button"
                onClick={salvarChamada}
                disabled={saving || loading || atletas.length === 0}
                className="bg-primary hover:bg-primary-light disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-primary/10 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    Salvar Chamada
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Histórico Lateral */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-850">
              <ClipboardCheck className="text-gold" size={16} />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">Histórico de Chamadas</h3>
            </div>
            
            <p className="text-[10px] text-zinc-500 leading-relaxed uppercase font-bold tracking-wider">Aulas Registradas Recentemente</p>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {loading ? (
                <div className="py-6 text-center text-zinc-650">
                  <Loader2 size={16} className="animate-spin mx-auto text-gold" />
                </div>
              ) : datasLancadas.length === 0 ? (
                <div className="py-8 text-center text-zinc-600 text-xs italic">
                  Nenhuma chamada registrada anteriormente.
                </div>
              ) : (
                datasLancadas.map((dt) => (
                  <button
                    key={dt}
                    onClick={() => { setDataAula(dt); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      dataAula === dt
                        ? 'bg-gold/10 border-gold/30 text-gold shadow-lg shadow-gold/5'
                        : 'bg-zinc-950 border-zinc-850/60 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className={dataAula === dt ? 'text-gold' : 'text-zinc-650'} />
                      <span className="text-xs font-bold font-mono">{formatarDataExibicao(dt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-500">
                        Ver/Editar
                      </span>
                      <ChevronRight size={12} className="opacity-40" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
