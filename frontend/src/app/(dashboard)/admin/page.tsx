'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Layout, Settings, Image, Users, Plus, Trash2, ShieldAlert, Loader2, Save, X, MessageSquare, Send, Mail, Phone, Shield, FileText, BookOpen } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Banner {
  id: string | number;
  titulo: string;
  subtitulo: string;
  link?: string;
  imagem_url: string;
}

interface TeamMember {
  id: string | number;
  nome: string;
  cargo: string; // ex: Sensei 4º Dan
  biografia: string;
  foto_url: string;
  order: number;
}

interface GalleryItem {
  id: string | number;
  title: string;
  category: string;
  image_url: string;
  order: number;
}

export default function AdminCMSPage() {
  interface Contato {
    id: string | number;
    name: string;
    email: string;
    message: string;
    phone?: string;
    read?: boolean;
    lida?: boolean;
    created_at: string;
  }

  const { usuario, tipo } = useAuth();
  const [activeTab, setActiveTab] = useState<'banners' | 'equipe' | 'galeria' | 'mensagens' | 'paginainicial' | 'sensei-ia' | 'academia' | 'transparencia' | 'contato'>('banners');
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [equipe, setEquipe] = useState<TeamMember[]>([]);
  const [galeria, setGaleria] = useState<GalleryItem[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [selectedContato, setSelectedContato] = useState<Contato | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);

  // Glossário do Sensei IA
  interface GlossaryTerm {
    termo: string;
    definicao: string;
  }
  const [glossario, setGlossario] = useState<GlossaryTerm[]>([]);
  const [loadingGlossario, setLoadingGlossario] = useState(false);
  const [termoSearch, setTermoSearch] = useState('');
  const [showGlossarioModal, setShowGlossarioModal] = useState(false);
  const [glossarioForm, setGlossarioForm] = useState<GlossaryTerm>({ termo: '', definicao: '' });
  const [salvandoGlossario, setSalvandoGlossario] = useState(false);
  const [isEditingTerm, setIsEditingTerm] = useState(false);

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Forms
  const [bannerForm, setBannerForm] = useState({ titulo: '', subtitulo: '', link: '', imagem_url: '' });
  const [teamForm, setTeamForm] = useState({ nome: '', cargo: '', biografia: '', foto_url: '', order: 0 });
  const [galleryForm, setGalleryForm] = useState({ title: '', category: 'Dojo', image_url: '', order: 0 });

  // Site configuration states
  interface ConfigInicial {
    hero: { badge: string; titulo: string; descricao: string };
    principios: {
      subtitulo: string;
      go_titulo: string;
      go_desc: string;
      go_itens: string[];
      ju_titulo: string;
      ju_desc: string;
      ju_itens: string[];
    };
    katas: Array<{ nome: string; significado: string; foco: string; desc: string }>;
    academia?: {
      hero_subtitulo: string;
      hero_titulo: string;
      hero_descricao: string;
      desde_subtitulo: string;
      desde_titulo: string;
      desde_paragrafo1: string;
      desde_paragrafo2: string;
      desde_paragrafo3: string;
      missao_desc: string;
      visao_desc: string;
      valores_desc: string;
    };
    transparencia?: {
      hero_title: string;
      hero_subtitle: string;
      hero_breadcrumb: string;
      intro_text: string;
      compromisso_title: string;
      compromisso_text: string;
    };
    contato?: {
      hero_title: string;
      hero_subtitle: string;
      secao_subtitulo: string;
      secao_titulo: string;
      secao_desc: string;
      telefone: string;
      telefone_tel: string;
      email: string;
      endereco: string;
      horarios: string;
    };
  }

  const [siteConfig, setSiteConfig] = useState<ConfigInicial | null>(null);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  const [heroForm, setHeroForm] = useState({
    badge: 'Tradição de Okinawa & IA Moderna',
    titulo: 'Onde a Força (Go) encontra a Suavidade (Ju)',
    descricao: 'O Karate Goju-Ryu harmoniza ataques diretos e bloqueios rígidos com movimentos circulares fluidos, respiração profunda e controle mental. Aprenda a arte marcial tradicional e consulte o nosso Sensei IA para expandir seus horizontes.'
  });
  const [principiosForm, setPrincipiosForm] = useState({
    subtitulo: 'O Goju-Ryu é construído sobre o conceito yin-yang chinês, equilibrando aspectos que parecem opostos, mas são complementares.',
    go_titulo: 'GO (Força / Rigidez)',
    go_desc: 'Refere-se ao endurecimento físico, golpes diretos, posições estáveis de combate e resistência ao impacto. É a força e firmeza necessárias para absorver o impacto e desferir contra-ataques decisivos com coragem implacável.',
    go_itens: 'Katas de fortalecimento como Sanchin, Calejamento de membros (Kote Kitae), Posturas baixas e firmes',
    ju_titulo: 'JU (Suavidade / Flexibilidade)',
    ju_desc: 'Representa movimentos circulares de esquiva, desvios suaves da força adversária, controle respiratório relaxado e agilidade. Ensina a ceder para vencer, redirecionando o fluxo de energia do oponente com precisão.',
    ju_itens: 'Katas de flexibilidade como Tensho, Esquivas circulares e fluidas (Tai Sabaki), Técnicas de agarre e projeção (Kakie)'
  });

  const [academiaForm, setAcademiaForm] = useState({
    hero_subtitulo: 'Nossa História',
    hero_titulo: 'A Academia',
    hero_descricao: 'Conheça a história, missão e valores do Goju-Ryu Karate Kai, uma academia comprometida com a preservação do Karatê Goju-Ryu tradicional de Okinawa.',
    desde_subtitulo: 'Desde o Início',
    desde_titulo: 'Nossa História',
    desde_paragrafo1: 'O Goju-Ryu Karate Kai nasceu com a missão de preservar e difundir o Karatê Goju-Ryu Okinawano em Salvador, Bahia, mantendo viva a tradição secular desta arte marcial.',
    desde_paragrafo2: 'Filiados à IOGKF Brasil — a maior organização de Karatê Goju-Ryu do mundo —, seguimos o currículo técnico e filosófico estabelecido pelos grandes mestres de Okinawa, garantindo a autenticidade do ensinamento.',
    desde_paragrafo3: 'Nossa academia acolhe praticantes de todas as idades e níveis, oferecendo um ambiente de aprendizado respeitoso, disciplinado e transformador.',
    missao_desc: 'Preservar e transmitir o Karatê Goju-Ryu Okinawano em sua forma mais autêntica, promovendo o desenvolvimento humano integral através da arte marcial.',
    visao_desc: 'Ser referência no Karatê Goju-Ryu tradicional em Salvador, formando praticantes técnicos, éticos e comprometidos com os valores do Budo.',
    valores_desc: 'Respeito, disciplina, perseverança, lealdade e autocontrole — os pilares que sustentam cada treino e cada relação dentro do dojo.'
  });

  const [transparenciaForm, setTransparenciaForm] = useState({
    hero_title: 'Transparência',
    hero_subtitle: 'A GRKK atua com ética, responsabilidade e compromisso público.',
    hero_breadcrumb: 'Transparência',
    intro_text: 'A GRKK disponibiliza seu estatuto social, diretoria vigência, CNPJ, regulamentos e documentos institucionais para consulta pública, reafirmando seu compromisso com a transparência e a boa governança esportiva.',
    compromisso_title: 'Nosso Compromisso',
    compromisso_text: 'A GRKK atua como executora de projetos esportivos e sociais, operando de forma organizada, transparente e descentralizada, garantindo a lisura de suas atividades administrativas e esportivas.'
  });

  const [contatoForm, setContatoForm] = useState({
    hero_title: 'Contato',
    hero_subtitle: 'Tire suas dúvidas, agende uma aula experimental ou venha nos conhecer. Onegai shimasu!',
    secao_subtitulo: 'Fale Conosco',
    secao_titulo: 'Entre em Contato',
    secao_desc: 'Tire suas dúvidas, agende uma aula experimental ou venha nos conhecer.',
    telefone: '(71) 9 0000-0000',
    telefone_tel: '+5571900000000',
    email: 'contato@gojoryukaratekai.com.br',
    endereco: 'Salvador, Bahia, Brasil',
    horarios: 'Segunda e Quarta: 19:00 — 21:00\nSábado: 09:00 — 11:00'
  });
  const [katasForm, setKatasForm] = useState<Array<{ nome: string; significado: string; foco: string; desc: string }>>([
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
  ]);

  const carregarSiteConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms/config`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSiteConfig(data.config || null);
      }
    } catch (err) {
      console.error("Erro ao carregar configurações do site:", err);
    }
  };

  const handleSaveConfig = async (chave: string, valor: any) => {
    setSalvandoConfig(true);
    try {
      const res = await fetch(`${API_URL}/api/cms/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chave, valor })
      });
      if (res.ok) {
        alert(`Configuração de '${chave}' salva com sucesso!`);
        await carregarSiteConfig();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar configuração.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoConfig(false);
    }
  };

  useEffect(() => {
    if (siteConfig && Object.keys(siteConfig).length > 0) {
      setHeroForm({
        badge: siteConfig.hero?.badge || 'Tradição de Okinawa & IA Moderna',
        titulo: siteConfig.hero?.titulo || 'Onde a Força (Go) encontra a Suavidade (Ju)',
        descricao: siteConfig.hero?.descricao || 'O Karate Goju-Ryu harmoniza ataques diretos e bloqueios rígidos com movimentos circulares fluidos, respiração profunda e controle mental. Aprenda a arte marcial tradicional e consulte o nosso Sensei IA para expandir seus horizontes.'
      });
      setPrincipiosForm({
        subtitulo: siteConfig.principios?.subtitulo || 'O Goju-Ryu é construído sobre o conceito yin-yang chinês, equilibrando aspectos que parecem opostos, mas são complementares.',
        go_titulo: siteConfig.principios?.go_titulo || 'GO (Força / Rigidez)',
        go_desc: siteConfig.principios?.go_desc || 'Refere-se ao endurecimento físico, golpes diretos, posições estáveis de combate e resistência ao impacto. É a força e firmeza necessárias para absorver o impacto e desferir contra-ataques decisivos com coragem implacável.',
        go_itens: siteConfig.principios?.go_itens?.join(', ') || 'Katas de fortalecimento como Sanchin, Calejamento de membros (Kote Kitae), Posturas baixas e firmes',
        ju_titulo: siteConfig.principios?.ju_titulo || 'JU (Suavidade / Flexibilidade)',
        ju_desc: siteConfig.principios?.ju_desc || 'Representa movimentos circulares de esquiva, desvios suaves da força adversária, controle respiratório relaxado e agilidade. Ensina a ceder para vencer, redirecionando o fluxo de energia do oponente com precisão.',
        ju_itens: siteConfig.principios?.ju_itens?.join(', ') || 'Katas de flexibilidade como Tensho, Esquivas circulares e fluidas (Tai Sabaki), Técnicas de agarre e projeção (Kakie)'
      });
      setKatasForm(siteConfig.katas && siteConfig.katas.length > 0 ? siteConfig.katas : [
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
      ]);
      if (siteConfig.academia) {
        setAcademiaForm({
          hero_subtitulo: siteConfig.academia.hero_subtitulo || 'Nossa História',
          hero_titulo: siteConfig.academia.hero_titulo || 'A Academia',
          hero_descricao: siteConfig.academia.hero_descricao || '',
          desde_subtitulo: siteConfig.academia.desde_subtitulo || 'Desde o Início',
          desde_titulo: siteConfig.academia.desde_titulo || 'Nossa História',
          desde_paragrafo1: siteConfig.academia.desde_paragrafo1 || '',
          desde_paragrafo2: siteConfig.academia.desde_paragrafo2 || '',
          desde_paragrafo3: siteConfig.academia.desde_paragrafo3 || '',
          missao_desc: siteConfig.academia.missao_desc || '',
          visao_desc: siteConfig.academia.visao_desc || '',
          valores_desc: siteConfig.academia.valores_desc || ''
        });
      }
      if (siteConfig.transparencia) {
        setTransparenciaForm({
          hero_title: siteConfig.transparencia.hero_title || 'Transparência',
          hero_subtitle: siteConfig.transparencia.hero_subtitle || '',
          hero_breadcrumb: siteConfig.transparencia.hero_breadcrumb || 'Transparência',
          intro_text: siteConfig.transparencia.intro_text || '',
          compromisso_title: siteConfig.transparencia.compromisso_title || 'Nosso Compromisso',
          compromisso_text: siteConfig.transparencia.compromisso_text || ''
        });
      }
      if (siteConfig.contato) {
        setContatoForm({
          hero_title: siteConfig.contato.hero_title || 'Contato',
          hero_subtitle: siteConfig.contato.hero_subtitle || '',
          secao_subtitulo: siteConfig.contato.secao_subtitulo || 'Fale Conosco',
          secao_titulo: siteConfig.contato.secao_titulo || 'Entre em Contato',
          secao_desc: siteConfig.contato.secao_desc || '',
          telefone: siteConfig.contato.telefone || '(71) 9 0000-0000',
          telefone_tel: siteConfig.contato.telefone_tel || '+5571900000000',
          email: siteConfig.contato.email || '',
          endereco: siteConfig.contato.endereco || '',
          horarios: siteConfig.contato.horarios || 'Segunda e Quarta: 19:00 — 21:00\nSábado: 09:00 — 11:00'
        });
      }
    }
  }, [siteConfig]);

  const carregarCMS = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
        setEquipe(data.equipe || []);
        setGaleria(data.galeria || []);
      }
    } catch (err) {
      console.error("Erro ao carregar CMS, usando dados offline:", err);
      // Fallback local
      setBanners([
        { id: 1, titulo: "Karatê Tradicional Goju-Ryu", subtitulo: "Força e suavidade unidas na busca do autodomínio.", imagem_url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=1200" }
      ]);
      setEquipe([
        { id: 1, nome: "Sensei Paulo Roberto", cargo: "Faixa Preta 4º Dan", biografia: "Coordenador da Federação com mais de 25 anos de prática.", foto_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300", order: 1 }
      ]);
      setGaleria([
        { id: 1, title: "Treino de Kata", category: "Katas", image_url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=300", order: 1 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarContatos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/contatos`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setContatos(data.contatos || []);
      }
    } catch (err) {
      console.error("Erro ao carregar contatos:", err);
      // Fallback local
      setContatos([
        { id: 'msg-1', name: 'José Augusto Ramos', email: 'jose.ramos@gmail.com', phone: '(71) 98888-9999', message: 'Olá, gostaria de saber o valor da mensalidade e os horários das turmas infantis no dojo de Salvador Centro.', read: false, created_at: new Date().toISOString() }
      ]);
    }
  };

  const carregarGlossario = async () => {
    setLoadingGlossario(true);
    try {
      const res = await fetch(`${API_URL}/api/cms/glossario`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setGlossario(data.glossario || []);
      }
    } catch (err) {
      console.error("Erro ao carregar glossário do Sensei IA:", err);
    } finally {
      setLoadingGlossario(false);
    }
  };

  const handleSalvarGlossario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!glossarioForm.termo.trim() || !glossarioForm.definicao.trim()) return;
    setSalvandoGlossario(true);

    try {
      const res = await fetch(`${API_URL}/api/cms/glossario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          termo: glossarioForm.termo,
          definicao: glossarioForm.definicao
        })
      });

      if (res.ok) {
        alert(isEditingTerm ? 'Termo atualizado com sucesso!' : 'Novo termo adicionado com sucesso!');
        setShowGlossarioModal(false);
        setGlossarioForm({ termo: '', definicao: '' });
        await carregarGlossario();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar termo no glossário.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoGlossario(false);
    }
  };

  const handleExcluirGlossario = async (termo: string) => {
    if (!confirm(`Excluir o termo "${termo.toUpperCase()}" do glossário do Sensei IA permanentemente?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/cms/glossario/${encodeURIComponent(termo)}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        setGlossario(glossario.filter(g => g.termo !== termo));
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao excluir o termo.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (tipo === 'admin') {
      carregarCMS();
      carregarContatos();
      carregarSiteConfig();
      carregarGlossario();
    } else {
      setLoading(false);
    }
  }, [tipo]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedContato) return;
    setSendingReply(true);
    try {
      const res = await fetch(`${API_URL}/api/contatos/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contatoId: selectedContato.id,
          email: selectedContato.email,
          mensagem: replyText
        }),
        credentials: 'include'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao enviar resposta.');
      }

      alert('Resposta enviada com sucesso!');
      setReplyText('');
      carregarContatos();
      setSelectedContato(prev => prev ? { ...prev, read: true } : null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleExcluirContato = async (id: string | number) => {
    if (!confirm("Remover esta mensagem permanentemente?")) return;

    try {
      const res = await fetch(`${API_URL}/api/contatos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setContatos(contatos.filter(c => c.id !== id));
        if (selectedContato?.id === id) setSelectedContato(null);
      }
    } catch (err) {
      setContatos(contatos.filter(c => c.id !== id));
      if (selectedContato?.id === id) setSelectedContato(null);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    let payload = {};
    if (activeTab === 'banners') payload = bannerForm;
    else if (activeTab === 'equipe') payload = teamForm;
    else if (activeTab === 'galeria') payload = galleryForm;

    const getTipoItem = (tab: string) => {
      if (tab === 'banners') return 'banner';
      if (tab === 'equipe') return 'equipe';
      if (tab === 'galeria') return 'galeria';
      return tab;
    };
    const tipoItem = getTipoItem(activeTab);

    try {
      const res = await fetch(`${API_URL}/api/cms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tipo: tipoItem, payload })
      });
      if (res.ok) {
        const data = await res.json();
        if (activeTab === 'banners') setBanners([...banners, data]);
        else if (activeTab === 'equipe') setEquipe([...equipe, data]);
        else if (activeTab === 'galeria') setGaleria([...galeria, data]);
        setShowModal(false);
      } else {
        let errorMsg = 'Erro do servidor ao salvar o item.';
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            errorMsg = errData.error || errData.message || errorMsg;
          } else {
            const textData = await res.text();
            errorMsg = textData.slice(0, 300) || errorMsg;
          }
        } catch (e) {
          console.error("Erro ao ler resposta de erro:", e);
        }
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro de conexão ou permissão. Salvando localmente para fins de teste...');
      // Fallback local
      const mockItem = { id: Date.now(), ...payload };
      if (activeTab === 'banners') setBanners([...banners, mockItem as any]);
      else if (activeTab === 'equipe') setEquipe([...equipe, mockItem as any]);
      else if (activeTab === 'galeria') setGaleria([...galeria, mockItem as any]);
      setShowModal(false);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string | number) => {
    if (!confirm("Excluir item permanentemente?")) return;

    const getTipoItem = (tab: string) => {
      if (tab === 'banners') return 'banner';
      if (tab === 'equipe') return 'equipe';
      if (tab === 'galeria') return 'galeria';
      return tab;
    };
    const tipoItem = getTipoItem(activeTab);

    try {
      const res = await fetch(`${API_URL}/api/cms/${tipoItem}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        if (activeTab === 'banners') setBanners(banners.filter(b => b.id !== id));
        else if (activeTab === 'equipe') setEquipe(equipe.filter(e => e.id !== id));
        else if (activeTab === 'galeria') setGaleria(galeria.filter(g => g.id !== id));
      } else {
        let errorMsg = 'Erro do servidor ao excluir o item.';
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            errorMsg = errData.error || errData.message || errorMsg;
          } else {
            const textData = await res.text();
            errorMsg = textData.slice(0, 300) || errorMsg;
          }
        } catch (e) {
          console.error("Erro ao ler resposta de erro:", e);
        }
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro de conexão ou permissão. Excluindo localmente da visualização atual...');
      if (activeTab === 'banners') setBanners(banners.filter(b => b.id !== id));
      else if (activeTab === 'equipe') setEquipe(equipe.filter(e => e.id !== id));
      else if (activeTab === 'galeria') setGaleria(galeria.filter(g => g.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (tipo !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-white font-cinzel">Acesso Negado</h2>
        <p className="text-zinc-500 text-sm">Painel restrito para controle do conteúdo do site institucional.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Gerenciador de Site (CMS)</h1>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold font-sans">Administração dinâmica do portal público</p>
        </div>

        {(activeTab === 'banners' || activeTab === 'equipe' || activeTab === 'galeria' || activeTab === 'sensei-ia') && (
          <button
            onClick={() => {
              if (activeTab === 'sensei-ia') {
                setGlossarioForm({ termo: '', definicao: '' });
                setIsEditingTerm(false);
                setShowGlossarioModal(true);
              } else {
                setBannerForm({ titulo: '', subtitulo: '', link: '', imagem_url: '' });
                setTeamForm({ nome: '', cargo: '', biografia: '', foto_url: '', order: equipe.length + 1 });
                setGalleryForm({ title: '', category: 'Dojo', image_url: '', order: galeria.length + 1 });
                setShowModal(true);
              }
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} /> Adicionar Item
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-zinc-900 p-1 border border-zinc-800 rounded-xl w-full max-w-5xl flex-wrap animate-in fade-in duration-300">
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex-1 min-w-[70px] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'banners' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Layout size={12} /> Banners
        </button>
        <button
          onClick={() => setActiveTab('equipe')}
          className={`flex-1 min-w-[70px] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'equipe' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Users size={12} /> Equipe
        </button>
        <button
          onClick={() => setActiveTab('galeria')}
          className={`flex-1 min-w-[70px] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'galeria' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Image size={12} /> Galeria
        </button>
        <button
          onClick={() => setActiveTab('mensagens')}
          className={`flex-1 min-w-[85px] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'mensagens' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <MessageSquare size={12} /> Mensagens
        </button>
        <button
          onClick={() => setActiveTab('paginainicial')}
          className={`flex-1 min-w-[100px] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'paginainicial' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Settings size={12} /> Página Inicial
        </button>
        <button
          onClick={() => setActiveTab('sensei-ia')}
          className={`flex-1 min-w-[80px] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'sensei-ia' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <MessageSquare size={12} /> Sensei IA
        </button>
        <button
          onClick={() => setActiveTab('academia')}
          className={`flex-1 min-w-[90px] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'academia' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <BookOpen size={12} /> A Academia
        </button>
        <button
          onClick={() => setActiveTab('transparencia')}
          className={`flex-1 min-w-[100px] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'transparencia' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <FileText size={12} /> Transparência
        </button>
        <button
          onClick={() => setActiveTab('contato')}
          className={`flex-1 min-w-[70px] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex-items-center justify-center gap-1.5 ${
            activeTab === 'contato' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Mail size={12} /> Contato
        </button>
      </div>

      {/* Content */}
      {activeTab === 'mensagens' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
          {/* List */}
          <div className="lg:col-span-2 flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto pr-1">
            {contatos.map(c => (
              <button key={c.id} onClick={() => setSelectedContato(c)}
                className={`text-left p-4 border transition-all duration-200 relative rounded-2xl ${
                  selectedContato?.id === c.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}>
                <div className="flex items-center justify-between">
                  <p className="font-cinzel text-white text-sm font-bold truncate pr-3">{c.name}</p>
                  {(!c.read && !c.lida) && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-zinc-400 text-xs mt-1 truncate">{c.message}</p>
                <p className="text-zinc-600 text-[10px] mt-2 font-mono">
                  {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </button>
            ))}
            {contatos.length === 0 && (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Nenhuma mensagem recebida.
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3">
            {selectedContato ? (
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-cinzel text-white text-lg font-bold">{selectedContato.name}</h3>
                    <p className="text-zinc-500 text-xs mt-1">
                      {new Date(selectedContato.created_at).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={() => handleExcluirContato(selectedContato.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs text-zinc-400">
                  <a href={`mailto:${selectedContato.email}`} className="flex items-center gap-2 hover:text-primary transition">
                    <Mail size={13} className="text-primary" /> {selectedContato.email}
                  </a>
                  {selectedContato.phone && (
                    <a href={`tel:${selectedContato.phone}`} className="flex items-center gap-2 hover:text-primary transition">
                      <Phone size={13} className="text-primary" /> {selectedContato.phone}
                    </a>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-5">
                  <h4 className="text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-2">Mensagem Recebida</h4>
                  <p className="text-zinc-300 leading-relaxed bg-zinc-950/40 p-4 border border-zinc-800/20 rounded-xl text-xs font-sans whitespace-pre-wrap">{selectedContato.message}</p>
                </div>

                <div className="border-t border-zinc-800 pt-5 space-y-4">
                  <h4 className="text-[9px] font-black uppercase text-primary tracking-wider">Responder pelo CMS</h4>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white p-4 text-xs focus:outline-none focus:border-primary transition rounded-xl resize-none font-sans"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="flex-1 bg-primary text-white font-cinzel text-xs font-bold tracking-widest uppercase py-3 hover:bg-primary-dark transition disabled:opacity-30 flex items-center justify-center gap-2 rounded-xl cursor-pointer"
                    >
                      {sendingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Enviar Resposta
                    </button>
                    <a 
                      href={`mailto:${selectedContato.email}?subject=Re: Goju-Ryu Karate Kai&body=${encodeURIComponent(replyText)}`}
                      className="border border-zinc-800 text-zinc-400 hover:text-white font-cinzel text-xs tracking-widest uppercase px-5 py-3 hover:bg-white/[0.02] transition text-center flex items-center justify-center gap-2 rounded-xl"
                    >
                      Responder via E-mail Local
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center h-64 text-zinc-500 text-xs font-cinzel">
                Selecione uma mensagem para visualizar
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'paginainicial' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* 1. HERO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layout className="text-primary" size={16} /> 1. Banner Principal (Hero Section)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Badge Superior</label>
                <input
                  type="text"
                  id="hero-badge-input"
                  value={heroForm.badge}
                  onChange={e => setHeroForm({ ...heroForm, badge: e.target.value })}
                  placeholder="Ex: Tradição de Okinawa & IA Moderna"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título Principal</label>
                <input
                  type="text"
                  id="hero-title-input"
                  value={heroForm.titulo}
                  onChange={e => setHeroForm({ ...heroForm, titulo: e.target.value })}
                  placeholder="Ex: Onde a Força (Go) encontra a Suavidade (Ju)"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                <textarea
                  id="hero-desc-input"
                  value={heroForm.descricao}
                  onChange={e => setHeroForm({ ...heroForm, descricao: e.target.value })}
                  placeholder="Descrição da associação ou estilo..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  id="save-hero-btn"
                  onClick={() => handleSaveConfig('hero', heroForm)}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Hero
                </button>
              </div>
            </div>
          </div>

          {/* 2. PRINCIPIOS CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Settings className="text-gold" size={16} /> 2. Os Princípios Fundamentais (Go & Ju)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo da Seção</label>
                <input
                  type="text"
                  id="principles-subtitle-input"
                  value={principiosForm.subtitulo}
                  onChange={e => setPrincipiosForm({ ...principiosForm, subtitulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* GO CARD */}
                <div className="space-y-4 p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                  <h4 className="text-xs font-bold text-primary font-cinzel uppercase tracking-wider">Card GO (Força)</h4>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Título</label>
                    <input
                      type="text"
                      id="go-title-input"
                      value={principiosForm.go_titulo}
                      onChange={e => setPrincipiosForm({ ...principiosForm, go_titulo: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Descrição</label>
                    <textarea
                      id="go-desc-input"
                      value={principiosForm.go_desc}
                      onChange={e => setPrincipiosForm({ ...principiosForm, go_desc: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none resize-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Itens (separados por vírgula)</label>
                    <input
                      type="text"
                      id="go-items-input"
                      value={principiosForm.go_itens}
                      onChange={e => setPrincipiosForm({ ...principiosForm, go_itens: e.target.value })}
                      placeholder="Ex: Item 1, Item 2"
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                    />
                  </div>
                </div>

                {/* JU CARD */}
                <div className="space-y-4 p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                  <h4 className="text-xs font-bold text-zinc-350 font-cinzel uppercase tracking-wider">Card JU (Suavidade)</h4>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Título</label>
                    <input
                      type="text"
                      id="ju-title-input"
                      value={principiosForm.ju_titulo}
                      onChange={e => setPrincipiosForm({ ...principiosForm, ju_titulo: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Descrição</label>
                    <textarea
                      id="ju-desc-input"
                      value={principiosForm.ju_desc}
                      onChange={e => setPrincipiosForm({ ...principiosForm, ju_desc: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none resize-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Itens (separados por vírgula)</label>
                    <input
                      type="text"
                      id="ju-items-input"
                      value={principiosForm.ju_itens}
                      onChange={e => setPrincipiosForm({ ...principiosForm, ju_itens: e.target.value })}
                      placeholder="Ex: Item 1, Item 2"
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  id="save-principles-btn"
                  onClick={() => handleSaveConfig('principios', {
                    subtitulo: principiosForm.subtitulo,
                    go_titulo: principiosForm.go_titulo,
                    go_desc: principiosForm.go_desc,
                    go_itens: principiosForm.go_itens.split(',').map(i => i.trim()).filter(Boolean),
                    ju_titulo: principiosForm.ju_titulo,
                    ju_desc: principiosForm.ju_desc,
                    ju_itens: principiosForm.ju_itens.split(',').map(i => i.trim()).filter(Boolean)
                  })}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Princípios
                </button>
              </div>
            </div>
          </div>

          {/* 3. KATAS CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Users className="text-emerald-500" size={16} /> 3. Os Katas Tradicionais (Lista de 4)
            </h3>
            <div className="space-y-6">
              {katasForm.map((kata, idx) => (
                <div key={idx} className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-gold font-cinzel">Kata {idx + 1}: {kata.nome || 'Novo Kata'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Nome do Kata</label>
                      <input
                        type="text"
                        id={`kata-name-${idx}`}
                        value={kata.nome}
                        onChange={e => {
                          const newKatas = [...katasForm];
                          newKatas[idx].nome = e.target.value;
                          setKatasForm(newKatas);
                        }}
                        className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Significado</label>
                      <input
                        type="text"
                        id={`kata-meaning-${idx}`}
                        value={kata.significado}
                        onChange={e => {
                          const newKatas = [...katasForm];
                          newKatas[idx].significado = e.target.value;
                          setKatasForm(newKatas);
                        }}
                        className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Foco Principal</label>
                      <input
                        type="text"
                        id={`kata-focus-${idx}`}
                        value={kata.foco}
                        onChange={e => {
                          const newKatas = [...katasForm];
                          newKatas[idx].foco = e.target.value;
                          setKatasForm(newKatas);
                        }}
                        className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Descrição</label>
                    <textarea
                      id={`kata-desc-${idx}`}
                      value={kata.desc}
                      onChange={e => {
                        const newKatas = [...katasForm];
                        newKatas[idx].desc = e.target.value;
                        setKatasForm(newKatas);
                      }}
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none resize-none font-sans"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  id="save-katas-btn"
                  onClick={() => handleSaveConfig('katas', katasForm)}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Katas
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'sensei-ia' ? (
        <div className="space-y-6 max-w-5xl mx-auto w-full">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2">
                  <MessageSquare className="text-primary" size={16} /> Base de Conhecimento do Sensei IA
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Gerencie os termos e definições que guiam as respostas da inteligência artificial.</p>
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Pesquisar termo..."
                  value={termoSearch}
                  onChange={e => setTermoSearch(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-primary transition"
                />
              </div>
            </div>

            {loadingGlossario ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                {glossario
                  .filter(g => g.termo.toLowerCase().includes(termoSearch.toLowerCase()) || g.definicao.toLowerCase().includes(termoSearch.toLowerCase()))
                  .map((item) => (
                    <div key={item.termo} className="bg-zinc-950/40 border border-zinc-855 hover:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-3 transition group">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-0.5 rounded border border-gold/20 inline-block mb-2">
                          {item.termo}
                        </span>
                        <p className="text-zinc-450 text-xs leading-relaxed line-clamp-4 font-sans">{item.definicao}</p>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-zinc-850 justify-end">
                        <button
                          onClick={() => {
                            setGlossarioForm({ termo: item.termo, definicao: item.definicao });
                            setIsEditingTerm(true);
                            setShowGlossarioModal(true);
                          }}
                          className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition hover:bg-zinc-900 cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleExcluirGlossario(item.termo)}
                          className="px-3 py-1.5 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={10} /> Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                {glossario.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-zinc-500 text-xs">
                    Nenhum termo cadastrado no glossário.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'academia' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* 1. HERO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layout className="text-primary" size={16} /> 1. Banner Superior (Hero Section)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo Superior</label>
                <input
                  type="text"
                  value={academiaForm.hero_subtitulo}
                  onChange={e => setAcademiaForm({ ...academiaForm, hero_subtitulo: e.target.value })}
                  placeholder="Ex: Nossa História"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título Principal</label>
                <input
                  type="text"
                  value={academiaForm.hero_titulo}
                  onChange={e => setAcademiaForm({ ...academiaForm, hero_titulo: e.target.value })}
                  placeholder="Ex: A Academia"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                <textarea
                  value={academiaForm.hero_descricao}
                  onChange={e => setAcademiaForm({ ...academiaForm, hero_descricao: e.target.value })}
                  placeholder="Descrição..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 2. HISTORIA CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <BookOpen className="text-gold" size={16} /> 2. História da Academia
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo da Seção</label>
                  <input
                    type="text"
                    value={academiaForm.desde_subtitulo}
                    onChange={e => setAcademiaForm({ ...academiaForm, desde_subtitulo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título da Seção</label>
                  <input
                    type="text"
                    value={academiaForm.desde_titulo}
                    onChange={e => setAcademiaForm({ ...academiaForm, desde_titulo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Parágrafo 1</label>
                <textarea
                  value={academiaForm.desde_paragrafo1}
                  onChange={e => setAcademiaForm({ ...academiaForm, desde_paragrafo1: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Parágrafo 2</label>
                <textarea
                  value={academiaForm.desde_paragrafo2}
                  onChange={e => setAcademiaForm({ ...academiaForm, desde_paragrafo2: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Parágrafo 3</label>
                <textarea
                  value={academiaForm.desde_paragrafo3}
                  onChange={e => setAcademiaForm({ ...academiaForm, desde_paragrafo3: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 3. PRINCIPIOS CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Shield className="text-emerald-500" size={16} /> 3. Pilares (Missão, Visão e Valores)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição da Missão</label>
                <textarea
                  value={academiaForm.missao_desc}
                  onChange={e => setAcademiaForm({ ...academiaForm, missao_desc: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição da Visão</label>
                <textarea
                  value={academiaForm.visao_desc}
                  onChange={e => setAcademiaForm({ ...academiaForm, visao_desc: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição dos Valores</label>
                <textarea
                  value={academiaForm.valores_desc}
                  onChange={e => setAcademiaForm({ ...academiaForm, valores_desc: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  onClick={() => handleSaveConfig('academia', academiaForm)}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Academia
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'transparencia' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* 1. HERO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layout className="text-primary" size={16} /> 1. Hero da Página de Transparência
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título da Página</label>
                <input
                  type="text"
                  value={transparenciaForm.hero_title}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, hero_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={transparenciaForm.hero_subtitle}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, hero_subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Caminho / Breadcrumb</label>
                <input
                  type="text"
                  value={transparenciaForm.hero_breadcrumb}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, hero_breadcrumb: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 2. INTRODUCAO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <FileText className="text-gold" size={16} /> 2. Texto de Introdução
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Texto Principal</label>
                <textarea
                  value={transparenciaForm.intro_text}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, intro_text: e.target.value })}
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 3. COMPROMISSO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Shield className="text-emerald-500" size={16} /> 3. Compromisso da Federação
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título da Seção</label>
                <input
                  type="text"
                  value={transparenciaForm.compromisso_title}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, compromisso_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Texto de Compromisso</label>
                <textarea
                  value={transparenciaForm.compromisso_text}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, compromisso_text: e.target.value })}
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  onClick={() => handleSaveConfig('transparencia', transparenciaForm)}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Transparência
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'contato' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* 1. HERO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layout className="text-primary" size={16} /> 1. Hero da Página de Contato
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título da Página</label>
                <input
                  type="text"
                  value={contatoForm.hero_title}
                  onChange={e => setContatoForm({ ...contatoForm, hero_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição do Hero</label>
                <textarea
                  value={contatoForm.hero_subtitle}
                  onChange={e => setContatoForm({ ...contatoForm, hero_subtitle: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 2. SECAO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <FileText className="text-gold" size={16} /> 2. Títulos da Seção de Contato
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo da Seção</label>
                  <input
                    type="text"
                    value={contatoForm.secao_subtitulo}
                    onChange={e => setContatoForm({ ...contatoForm, secao_subtitulo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título da Seção</label>
                  <input
                    type="text"
                    value={contatoForm.secao_titulo}
                    onChange={e => setContatoForm({ ...contatoForm, secao_titulo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição da Seção</label>
                <textarea
                  value={contatoForm.secao_desc}
                  onChange={e => setContatoForm({ ...contatoForm, secao_desc: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 3. DADOS CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Phone className="text-emerald-500" size={16} /> 3. Informações de Contato e Horários
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Telefone Exibido</label>
                  <input
                    type="text"
                    value={contatoForm.telefone}
                    onChange={e => setContatoForm({ ...contatoForm, telefone: e.target.value })}
                    placeholder="Ex: (71) 9 0000-0000"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Link de Telefone (tel:...)</label>
                  <input
                    type="text"
                    value={contatoForm.telefone_tel}
                    onChange={e => setContatoForm({ ...contatoForm, telefone_tel: e.target.value })}
                    placeholder="Ex: +5571900000000"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    value={contatoForm.email}
                    onChange={e => setContatoForm({ ...contatoForm, email: e.target.value })}
                    placeholder="contato@exemplo.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Endereço Exibido</label>
                  <input
                    type="text"
                    value={contatoForm.endereco}
                    onChange={e => setContatoForm({ ...contatoForm, endereco: e.target.value })}
                    placeholder="Cidade, Estado, País"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Horários de Funcionamento (um por linha, formato: Dia: Hora)</label>
                <textarea
                  value={contatoForm.horarios}
                  onChange={e => setContatoForm({ ...contatoForm, horarios: e.target.value })}
                  placeholder="Segunda e Quarta: 19:00 — 21:00&#10;Sábado: 09:00 — 11:00"
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  onClick={() => handleSaveConfig('contato', contatoForm)}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Contato
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {activeTab === 'banners' && banners.map(banner => (
            <div key={banner.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="h-40 bg-zinc-950 relative">
                {banner.imagem_url ? (
                  <img src={banner.imagem_url} alt={banner.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600"><Image size={32} /></div>
                )}
              </div>
              <div className="p-5 space-y-2.5">
                <h3 className="text-sm font-bold text-white font-cinzel">{banner.titulo}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{banner.subtitulo}</p>
              </div>
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleExcluir(banner.id)}
                  className="w-full py-2 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} /> Remover
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'equipe' && equipe.map(member => (
            <div key={member.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="h-44 bg-zinc-950 relative flex items-center justify-center pt-4">
                <img src={member.foto_url} alt={member.nome} className="w-28 h-28 rounded-full object-cover border-2 border-primary" />
              </div>
              <div className="p-5 text-center space-y-2">
                <h3 className="text-sm font-bold text-white font-cinzel">{member.nome}</h3>
                <span className="text-[9px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-0.5 rounded border border-gold/20 inline-block">
                  {member.cargo}
                </span>
                <p className="text-xs text-zinc-500 line-clamp-3 pt-2">{member.biografia}</p>
              </div>
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleExcluir(member.id)}
                  className="w-full py-2 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} /> Remover
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'galeria' && galeria.map(img => (
            <div key={img.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="h-40 bg-zinc-950 relative">
                <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white bg-black/60 rounded">
                  {img.category}
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-xs font-bold text-white truncate">{img.title}</h4>
              </div>
              <div className="p-4 pt-0">
                <button
                  onClick={() => handleExcluir(img.id)}
                  className="w-full py-2 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} /> Remover
                </button>
              </div>
            </div>
          ))}

        </div>
      )}

      {/* MODAL ADICIONAR ITEM */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-5 uppercase tracking-wide">
              Adicionar Novo {activeTab === 'banners' ? 'Banner' : activeTab === 'equipe' ? 'Membro da Equipe' : activeTab === 'galeria' ? 'Item da Galeria' : activeTab}
            </h3>

            <form onSubmit={handleSalvar} className="space-y-4">
              
              {activeTab === 'banners' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título do Slide *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Treine Goju-Ryu Karate"
                      value={bannerForm.titulo}
                      onChange={(e) => setBannerForm({ ...bannerForm, titulo: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo *</label>
                    <input
                      type="text" required
                      placeholder="Subtexto curto descritivo"
                      value={bannerForm.subtitulo}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitulo: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Link de destino (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: /sobre"
                      value={bannerForm.link}
                      onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL da Imagem de Fundo *</label>
                    <input
                      type="text" required
                      placeholder="https://images.unsplash.com/..."
                      value={bannerForm.imagem_url}
                      onChange={(e) => setBannerForm({ ...bannerForm, imagem_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'equipe' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nome Completo *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Sensei João da Silva"
                      value={teamForm.nome}
                      onChange={(e) => setTeamForm({ ...teamForm, nome: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Cargo / Graduação *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Sensei 3º Dan"
                      value={teamForm.cargo}
                      onChange={(e) => setTeamForm({ ...teamForm, cargo: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Breve Biografia *</label>
                    <textarea
                      required rows={3}
                      placeholder="Histórico técnico e conquistas..."
                      value={teamForm.biografia}
                      onChange={(e) => setTeamForm({ ...teamForm, biografia: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL da Foto de Perfil *</label>
                    <input
                      type="text" required
                      placeholder="https://images.unsplash.com/..."
                      value={teamForm.foto_url}
                      onChange={(e) => setTeamForm({ ...teamForm, foto_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'galeria' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Legenda da Imagem *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Exame de Faixas em Salvador"
                      value={galleryForm.title}
                      onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Categoria *</label>
                      <select
                        value={galleryForm.category}
                        onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                      >
                        <option value="Dojo">Dojo</option>
                        <option value="Torneios">Torneios</option>
                        <option value="Katas">Katas</option>
                        <option value="Exames">Exames</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Ordem Visual *</label>
                      <input
                        type="number" required
                        value={galleryForm.order}
                        onChange={(e) => setGalleryForm({ ...galleryForm, order: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL da Imagem *</label>
                    <input
                      type="text" required
                      placeholder="https://images.unsplash.com/..."
                      value={galleryForm.image_url}
                      onChange={(e) => setGalleryForm({ ...galleryForm, image_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer flex items-center justify-center"
                >
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SENSEI IA GLOSSARIO */}
      {showGlossarioModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-855 rounded-2xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowGlossarioModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-5 uppercase tracking-wide">
              {isEditingTerm ? 'Editar Termo do Glossário' : 'Adicionar Termo ao Glossário'}
            </h3>

            <form onSubmit={handleSalvarGlossario} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Termo (Palavra-chave ou conceito) *</label>
                <input
                  type="text" required
                  disabled={isEditingTerm}
                  placeholder="Ex: sanchin"
                  value={glossarioForm.termo}
                  onChange={(e) => setGlossarioForm({ ...glossarioForm, termo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                />
                {!isEditingTerm && (
                  <span className="text-[9px] text-zinc-500 mt-1 block">Escreva o termo em letras minúsculas (ex: "sanchin", "makiwara").</span>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Definição Oficial / Conteúdo *</label>
                <textarea
                  required rows={6}
                  placeholder="Descreva o significado, a história ou a aplicação técnica para alimentar o prompt da IA..."
                  value={glossarioForm.definicao}
                  onChange={(e) => setGlossarioForm({ ...glossarioForm, definicao: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-primary font-sans"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGlossarioModal(false)}
                  className="flex-1 py-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoGlossario}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer flex items-center justify-center"
                >
                  {salvandoGlossario ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
