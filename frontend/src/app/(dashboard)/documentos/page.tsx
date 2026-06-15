'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  FileText, Download, ShieldAlert, Award, 
  BookOpen, Plus, Loader2, X, Edit, Trash2 
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Documento {
  id?: string;
  titulo: string;
  tipo: string;
  desc: string;
  arquivo_url: string;
  created_at?: string;
}

function getIcon(tipo: string) {
  switch (tipo) {
    case 'Regulamento': return BookOpen;
    case 'Regras': return FileText;
    case 'Institucional': return ShieldAlert;
    case 'Financeiro': return Award;
    case 'Atestado': return FileText;
    case 'Certificado': return Award;
    case 'Diploma': return Award;
    default: return FileText;
  }
}

export default function DocumentosPage() {
  const { usuario, tipo } = useAuth();
  const isAdmin = tipo === 'admin';

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmDeleteAberto, setConfirmDeleteAberto] = useState(false);
  const [docIdToDelete, setDocIdToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);

  const [form, setForm] = useState<Documento>({
    titulo: '',
    tipo: 'Regulamento',
    desc: '',
    arquivo_url: '',
  });

  const carregarDocumentos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documentos`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDocumentos(data.documentos || []);
      } else {
        throw new Error('Falha ao buscar da API');
      }
    } catch (err) {
      console.error("Erro ao carregar documentos, usando fallback de desenvolvimento:", err);
      setDocumentos([
        { id: "doc-1", titulo: "Apostila Técnica de Kyu (Coloridas)", tipo: "Regulamento", desc: "Programa oficial de exames de faixa do 7º Kyu ao 1º Kyu.", arquivo_url: "https://gojuryukaratekai.com.br/arquivos/apostila-kyu.pdf" },
        { id: "doc-2", titulo: "Manual de Competição Goju-Ryu 2026", tipo: "Regras", desc: "Regulamento técnico unificado para Kata e Kumite.", arquivo_url: "https://gojuryukaratekai.com.br/arquivos/manual-competicao.pdf" },
        { id: "doc-3", titulo: "Estatuto Oficial da Federação", tipo: "Institucional", desc: "Regimento interno e diretrizes organizacionais do dojo.", arquivo_url: "https://gojuryukaratekai.com.br/arquivos/estatuto.pdf" },
        { id: "doc-4", titulo: "Tabela de Taxas e Anuidades 2026", tipo: "Financeiro", desc: "Valores vigentes para credenciamentos e exames.", arquivo_url: "https://gojuryukaratekai.com.br/arquivos/tabela-taxas.pdf" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDocumentos();
  }, []);

  const abrirAdicionar = () => {
    setEditingDoc(null);
    setForm({
      titulo: '',
      tipo: 'Regulamento',
      desc: '',
      arquivo_url: '',
    });
    setModalAberto(true);
  };

  const abrirEditar = (doc: Documento) => {
    setEditingDoc(doc);
    setForm({
      titulo: doc.titulo,
      tipo: doc.tipo,
      desc: doc.desc || '',
      arquivo_url: doc.arquivo_url || '',
    });
    setModalAberto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.tipo) {
      alert("Por favor, preencha o título e o tipo do documento.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingDoc 
        ? `${API_URL}/api/documentos/${editingDoc.id}`
        : `${API_URL}/api/documentos`;
      
      const method = editingDoc ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar documento.');
      }

      setModalAberto(false);
      await carregarDocumentos();
    } catch (err: any) {
      alert(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcluir = (id: string) => {
    setDocIdToDelete(id);
    setConfirmDeleteAberto(true);
  };

  const executarExcluir = async () => {
    if (!docIdToDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/documentos/${docIdToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao excluir documento.');
      }

      setConfirmDeleteAberto(false);
      setDocIdToDelete(null);
      await carregarDocumentos();
    } catch (err: any) {
      alert(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-cinzel tracking-wider">Documentação Oficial</h1>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold font-sans">
            Regulamentos, Manuais, Certificados e Estatutos da Federação
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={abrirAdicionar}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-105 cursor-pointer flex items-center gap-1.5 font-cinzel"
          >
            <Plus size={14} /> Adicionar Documento
          </button>
        )}
      </div>

      {/* Grid de Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentos.map((doc, idx) => {
          const Icon = getIcon(doc.tipo);
          return (
            <div key={doc.id || idx} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between transition hover:border-zinc-700 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                    {doc.tipo}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2 leading-tight">{doc.titulo}</h3>
                  <p className="text-xs text-zinc-450 mt-1 leading-relaxed">{doc.desc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/40">
                <a
                  href={doc.arquivo_url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-bold text-gold hover:text-gold-light uppercase tracking-wider cursor-pointer font-cinzel"
                >
                  <Download size={12} /> Visualizar / Download
                </a>

                {isAdmin && doc.id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => abrirEditar(doc)}
                      className="p-2 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1"
                    >
                      <Edit size={12} /> Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(doc.id!)}
                      className="p-2 bg-red-650/10 border border-red-650/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {documentos.length === 0 && (
          <div className="col-span-full py-16 text-center text-zinc-500 text-xs font-cinzel">
            Nenhum documento cadastrado até o momento.
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalAberto(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-5">
              {editingDoc ? "Editar Documento" : "Novo Documento"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Regulamento Técnico 2026"
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Tipo *</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  >
                    <option value="Regulamento">Regulamento</option>
                    <option value="Regras">Regras</option>
                    <option value="Institucional">Institucional</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Atestado">Atestado</option>
                    <option value="Certificado">Certificado</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL do Arquivo / PDF</label>
                  <input
                    type="text"
                    placeholder="https://exemplo.com/doc.pdf"
                    value={form.arquivo_url}
                    onChange={e => setForm({ ...form, arquivo_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                <textarea
                  rows={4}
                  placeholder="Descreva brevemente o conteúdo ou finalidade deste documento..."
                  value={form.desc}
                  onChange={e => setForm({ ...form, desc: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors resize-none font-sans"
                />
              </div>

              <div className="flex gap-2.5 pt-2 font-cinzel">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 py-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                  ) : (
                    "Salvar Documento"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {confirmDeleteAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-sm p-6 relative">
            <h3 className="text-base font-bold text-white font-cinzel mb-3">
              Confirmar Exclusão
            </h3>
            <p className="text-xs text-zinc-450 mb-6 font-sans leading-relaxed">
              Tem certeza que deseja remover este documento permanentemente? Esta ação não poderá ser desfeita e será registrada no histórico de auditoria.
            </p>
            <div className="flex gap-2.5 font-cinzel">
              <button
                type="button"
                id="cancel-delete-btn"
                onClick={() => {
                  setConfirmDeleteAberto(false);
                  setDocIdToDelete(null);
                }}
                className="flex-1 py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-delete-btn"
                onClick={executarExcluir}
                disabled={submitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <><Loader2 size={12} className="animate-spin" /> Excluindo...</>
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
