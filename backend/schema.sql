-- Schema SQL para o Banco de Dados Goju-Ryu Karate Kai
-- Execute este script no SQL Editor do seu console Supabase para criar as tabelas necessárias.

-- Desativa checagem de chaves estrangeiras temporariamente para deleção limpa (opcional)
-- DROP TABLE IF EXISTS logs_auditoria, cobrancas, financeiro, candidatos_exame, chaves_torneio, eventos_chaves, eventos_inscricoes, historico_pontos, certificados, atletas, filiais, noticias, notifications, contacts, gallery_items, team_members, profiles CASCADE;

-- 1. Tabela PROFILES (Extensão de autenticação)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- Pode ser UUID do Supabase Auth ou String mockada
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(50),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('admin', 'filial', 'atleta')),
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('ativo', 'pendente', 'inativo', 'reprovado')),
    avatar_url TEXT,
    cidade VARCHAR(100),
    nome_fantasia VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabela FILIAIS
CREATE TABLE IF NOT EXISTS filiais (
    id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pendente',
    codigo_interno VARCHAR(100) UNIQUE,
    nome_fantasia VARCHAR(255),
    tipo VARCHAR(50) DEFAULT 'vinculada',
    cpf_responsavel VARCHAR(50),
    graduacao_responsavel VARCHAR(100),
    registro_federativo VARCHAR(100),
    cep VARCHAR(20),
    rua VARCHAR(255),
    numero VARCHAR(50),
    bairro VARCHAR(100),
    municipio VARCHAR(100),
    estado VARCHAR(50),
    motivo_reprovacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Tabela ATLETAS
CREATE TABLE IF NOT EXISTS atletas (
    id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pendente',
    faixa VARCHAR(100) DEFAULT 'Branca',
    filial_id TEXT REFERENCES filiais(id) ON DELETE SET NULL,
    filial_nome VARCHAR(255),
    cpf VARCHAR(50) UNIQUE,
    sexo CHAR(1),
    data_nascimento DATE,
    nome_professor VARCHAR(255),
    endereco TEXT,
    cidade VARCHAR(100),
    uf VARCHAR(10),
    responsavel_nome VARCHAR(255),
    responsavel_cpf VARCHAR(50),
    responsavel_email VARCHAR(255),
    responsavel_telefone VARCHAR(50),
    medico_alergias TEXT,
    medico_plano VARCHAR(255),
    medico_restricoes TEXT,
    medico_diagnosticos TEXT,
    pontos INTEGER DEFAULT 0,
    registro_federacao VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Tabela EVENTOS
CREATE TABLE IF NOT EXISTS eventos (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    tipo VARCHAR(50) DEFAULT 'torneio' CHECK (tipo IN ('torneio', 'seminario', 'exame', 'outro')),
    imagem_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Tabela EVENTOS_INSCRICOES
CREATE TABLE IF NOT EXISTS eventos_inscricoes (
    id TEXT PRIMARY KEY,
    evento_id TEXT REFERENCES eventos(id) ON DELETE CASCADE,
    atleta_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    atleta_nome VARCHAR(255),
    filial_id TEXT,
    filial_nome VARCHAR(255),
    categoria VARCHAR(50) DEFAULT 'Kata' CHECK (categoria IN ('Kata', 'Kumite')),
    faixa VARCHAR(100),
    idade INTEGER,
    pagamento_status VARCHAR(50) DEFAULT 'pendente',
    status VARCHAR(50) DEFAULT 'confirmado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Tabela EVENTOS_CHAVES
CREATE TABLE IF NOT EXISTS eventos_chaves (
    id TEXT PRIMARY KEY,
    evento_id TEXT REFERENCES eventos(id) ON DELETE CASCADE,
    modalidade VARCHAR(50) CHECK (modalidade IN ('Kata', 'Kumite')),
    brackets JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Tabela EXAMES
CREATE TABLE IF NOT EXISTS exames (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_exame DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'realizado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. Tabela CANDIDATOS_EXAME
CREATE TABLE IF NOT EXISTS candidatos_exame (
    id TEXT PRIMARY KEY,
    exame_id TEXT REFERENCES exames(id) ON DELETE CASCADE,
    atleta_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    atleta_nome VARCHAR(255),
    filial_id TEXT,
    filial_nome VARCHAR(255),
    faixa_atual VARCHAR(100),
    graduacao_pretendida VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'inscrito', 'aprovado', 'reprovado')),
    autorizacao_tecnica BOOLEAN DEFAULT FALSE,
    pagamento_status VARCHAR(50) DEFAULT 'pendente',
    dados_banca JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 9. Tabela FINANCEIRO
CREATE TABLE IF NOT EXISTS financeiro (
    id TEXT PRIMARY KEY,
    atleta_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    atleta_nome VARCHAR(255),
    filial_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    filial_nome VARCHAR(255),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('anuidade', 'mensalidade', 'exame', 'evento', 'outro')),
    valor NUMERIC(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 10. Tabela NOTICIAS
CREATE TABLE IF NOT EXISTS noticias (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255),
    conteudo TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    imagem_url TEXT,
    publicado BOOLEAN DEFAULT TRUE,
    autor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 11. Tabela TEAM_MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    biografia TEXT,
    foto_url TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 12. Tabela GALLERY_ITEMS
CREATE TABLE IF NOT EXISTS gallery_items (
    id TEXT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 13. Tabela LOGS_AUDITORIA
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id TEXT PRIMARY KEY,
    usuario_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(255),
    acao VARCHAR(100) NOT NULL,
    detalhes TEXT,
    ip VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 14. Tabela NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    destinatario_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'info',
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 15. Tabela CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    phone VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 16. Tabela HISTORICO_PONTOS
CREATE TABLE IF NOT EXISTS historico_pontos (
    id TEXT PRIMARY KEY,
    atleta_id TEXT REFERENCES atletas(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(100),
    descricao TEXT,
    pontos INTEGER NOT NULL,
    data_pontuacao DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 17. Tabela CERTIFICADOS
CREATE TABLE IF NOT EXISTS certificados (
    id TEXT PRIMARY KEY,
    atleta_id TEXT REFERENCES atletas(id) ON DELETE CASCADE,
    codigo_validacao VARCHAR(100) UNIQUE,
    data_emissao DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 18. Tabela CMS_BANNERS
CREATE TABLE IF NOT EXISTS cms_banners (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255) NOT NULL,
    link TEXT,
    imagem_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 19. Tabela DOCUMENTOS
CREATE TABLE IF NOT EXISTS documentos (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    "desc" TEXT,
    arquivo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 20. Tabela CMS_CONFIG
CREATE TABLE IF NOT EXISTS cms_config (
    chave VARCHAR(100) PRIMARY KEY,
    valor JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);


