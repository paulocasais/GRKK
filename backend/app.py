import os
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from dotenv import load_dotenv

from services.supabase_service import SupabaseService
from services.ai_service import ask_sensei

load_dotenv()

app = Flask(__name__)

# Permite CORS para qualquer origem durante o desenvolvimento, com suporte a credenciais (cookies)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Helper para obter o usuário logado a partir dos cookies ou cabeçalhos
def get_current_user():
    # 1. Tenta obter do cookie do Flask
    user_email_or_id = request.cookies.get("session_user")
    
    # 2. Tenta obter do cookie padrão do mock (sb-mock-session)
    if not user_email_or_id:
        user_email_or_id = request.cookies.get("sb-mock-session")
        
    # 3. Tenta obter do cabeçalho de Autorização
    if not user_email_or_id:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            user_email_or_id = auth_header.split(" ")[1]
            
    if not user_email_or_id:
        return None

    # Se for mock, podemos buscar tanto por ID quanto por E-mail
    if SupabaseService.is_mock():
        # Busca no profile pelo email ou ID
        profiles = SupabaseService.get_all("profiles")[0] or []
        for p in profiles:
            if p["id"] == user_email_or_id or p["email"].lower() == user_email_or_id.lower():
                # Retorna o perfil completo carregado
                user_data, _ = SupabaseService.get_profile_by_id(p["id"])
                return user_data
    else:
        # Modo real do Supabase: assume que é o ID do usuário (UID)
        user_data, _ = SupabaseService.get_profile_by_id(user_email_or_id)
        return user_data
        
    return None

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "mock_mode": SupabaseService.is_mock(),
        "message": "API do Goju-Ryu Karate Kai está rodando com sucesso!"
    }), 200

# --- ROTAS DE AUTENTICAÇÃO ---

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    if not email:
        return jsonify({"error": "E-mail é obrigatório"}), 400

    user_data, error = SupabaseService.login(email, password)
    if error:
        return jsonify({"error": error}), 401

    # Cria resposta e insere os cookies de sessão correspondentes
    response = make_response(jsonify({
        "autenticado": True,
        "usuario": user_data,
        "tipo": user_data.get("tipo")
    }))
    
    # Configura o cookie de sessão para o frontend
    # sb-mock-session para compatibilidade e session_user para controle do Flask
    session_val = user_data["id"] if not SupabaseService.is_mock() else user_data["email"]
    response.set_cookie("session_user", session_val, max_age=86400, httponly=False, samesite="Lax")
    response.set_cookie("sb-mock-session", session_val, max_age=86400, httponly=False, samesite="Lax")
    
    return response, 200

@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    response = make_response(jsonify({"sucesso": True, "message": "Logout realizado com sucesso"}))
    response.delete_cookie("session_user")
    response.delete_cookie("sb-mock-session")
    return response, 200

@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    user = get_current_user()
    if not user:
        return jsonify({"autenticado": False}), 200

    # Verifica se a conta está ativa
    if user.get("status") != "ativo":
        response = make_response(jsonify({"autenticado": False, "erro": "Conta inativa."}), 200)
        response.delete_cookie("session_user")
        response.delete_cookie("sb-mock-session")
        return response

    return jsonify({
        "autenticado": True,
        "usuario": user,
        "tipo": user.get("tipo")
    }), 200

# --- ROTAS DE CADASTRO ---

@app.route("/api/atletas/public", methods=["POST"])
def register_atleta():
    data = request.json or {}
    nome = data.get("nome")
    email = data.get("email")
    telefone = data.get("telefone")
    senha = data.get("senha")

    if not nome or not email or not telefone:
        return jsonify({"error": "Nome, e-mail e telefone são obrigatórios"}), 400

    # Insere no profiles
    profile_item = {
        "nome": nome,
        "email": email,
        "telefone": telefone,
        "tipo": "atleta",
        "status": "pendente"
    }
    profile, error = SupabaseService.insert("profiles", profile_item)
    if error:
        return jsonify({"error": error}), 500

    # Insere na tabela atletas
    atleta_item = {
        "id": profile["id"],
        "email": email,
        "telefone": telefone,
        "status": "pendente",
        "faixa": "Branca"
    }
    atleta, error2 = SupabaseService.insert("atletas", atleta_item)
    if error2:
        return jsonify({"error": error2}), 500

    return jsonify({"success": True, "atleta": atleta}), 201

@app.route("/api/filiais", methods=["GET", "POST"])
def register_filial():
    if request.method == "GET":
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403
            
        filiais_db, error = SupabaseService.get_all("filiais")
        profiles_db, _ = SupabaseService.get_all("profiles")
        
        res_filiais = []
        for fil in (filiais_db or []):
            prof = next((p for p in (profiles_db or []) if p["id"] == fil["id"]), None)
            if prof:
                item = dict(prof)
                item.update(fil)
                res_filiais.append(item)
                
        return jsonify({"filiais": res_filiais}), 200

    data = request.json or {}
    nome = data.get("nome")
    email = data.get("email")
    telefone = data.get("telefone")
    senha = data.get("senha")

    if not nome or not email:
        return jsonify({"error": "Nome e e-mail da filial são obrigatórios"}), 400

    # Insere no profiles
    profile_item = {
        "nome": nome,
        "email": email,
        "telefone": telefone or "",
        "tipo": "filial",
        "status": "pendente"
    }
    profile, error = SupabaseService.insert("profiles", profile_item)
    if error:
        return jsonify({"error": error}), 500

    # Insere na tabela filiais
    filial_item = {
        "id": profile["id"],
        "nome": nome,
        "email": email,
        "telefone": telefone or "",
        "status": "pendente",
        "codigo_interno": "MOCK-FILIAL-" + profile["id"][:5].upper()
    }
    filial, error2 = SupabaseService.insert("filiais", filial_item)
    if error2:
        return jsonify({"error": error2}), 500

    return jsonify({"success": True, "filial": filial}), 201

# --- ROTAS DO CMS (CONTEÚDOS DO SITE) ---

@app.route("/api/noticias", methods=["GET", "POST"])
def manage_noticias():
    if request.method == "GET":
        publicado = request.args.get("publicado")
        categoria = request.args.get("categoria")
        
        filter_dict = {}
        if publicado is not None:
            filter_dict["publicado"] = publicado == "true"
        if categoria:
            filter_dict["categoria"] = categoria

        noticias, error = SupabaseService.get_all("noticias", order_by="created_at", ascending=False, filter_dict=filter_dict)
        if error:
            return jsonify({"error": error}), 500
            
        return jsonify({
            "noticias": noticias,
            "total": len(noticias)
        }), 200

    elif request.method == "POST":
        # Apenas admin pode criar notícias
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403
            
        body = request.json or {}
        body["autor_id"] = user["id"]
        
        noticia, error = SupabaseService.insert("noticias", body)
        if error:
            return jsonify({"error": error}), 500
            
        return jsonify({"noticia": noticia}), 201

@app.route("/api/galeria", methods=["GET"])
def get_galeria():
    categoria = request.args.get("categoria")
    filter_dict = {}
    if categoria:
        filter_dict["category"] = categoria
        
    items, error = SupabaseService.get_all("gallery_items", order_by="order", ascending=True, filter_dict=filter_dict)
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify({"items": items}), 200

@app.route("/api/equipe", methods=["GET"])
def get_equipe():
    members, error = SupabaseService.get_all("team_members", order_by="order", ascending=True)
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify({"members": members}), 200

@app.route("/api/eventos", methods=["GET"])
def get_eventos():
    eventos, error = SupabaseService.get_all("eventos", order_by="data_inicio", ascending=False)
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify({"eventos": eventos}), 200

# --- MENSAGENS E CONTATOS ---

@app.route("/api/contato", methods=["POST"])
@app.route("/api/contatos", methods=["POST"])
def submit_contato():
    data = request.json or {}
    nome = data.get("nome") or data.get("name")
    email = data.get("email")
    mensagem = data.get("mensagem") or data.get("message")
    telefone = data.get("telefone") or data.get("phone") or ""

    if not nome or not email or not mensagem:
        return jsonify({"error": "Nome, e-mail e mensagem são obrigatórios"}), 400

    # Adapta para o formato do banco (contacts / contatos)
    db_item = {
        "name": nome,
        "email": email,
        "message": mensagem,
        "phone": telefone,
        "read": False
    }

    res_item, error = SupabaseService.insert("contacts", db_item)
    if error:
        # Tenta na tabela 'contatos' se 'contacts' falhar
        res_item, error2 = SupabaseService.insert("contatos", {
            "nome": nome,
            "email": email,
            "mensagem": mensagem,
            "telefone": telefone
        })
        if error2:
            return jsonify({"error": f"Erro ao salvar mensagem: {error2}"}), 500
            
    return jsonify({
        "success": True,
        "message": "Mensagem enviada com sucesso!",
        "data": res_item
    }), 201

# --- SENSEI IA CHAT ---

@app.route("/api/ia-chat", methods=["POST"])
def chat_ia():
    data = request.json or {}
    mensagem = data.get("mensagem") or data.get("message")
    
    if not mensagem:
        return jsonify({"error": "Mensagem é obrigatória"}), 400

    resposta = ask_sensei(mensagem)
    return jsonify({"resposta": resposta}), 200



# --- VALIDAÇÃO DE CERTIFICADOS ---

@app.route("/api/certificados/validar/<codigo>", methods=["GET"])
def validar_certificado(codigo):
    # Procura na tabela de certificados
    certificados, error = SupabaseService.get_all("certificados")
    if error:
        return jsonify({"erro": error}), 500
        
    for cert in certificados:
        if cert.get("codigo_validacao", "").lower() == codigo.lower() or str(cert.get("id")).lower() == codigo.lower():
            # Encontrou o certificado!
            # Busca as informações do atleta
            atleta_id = cert.get("atleta_id")
            atleta, _ = SupabaseService.get_profile_by_id(atleta_id)
            
            atleta_nome = "Desconhecido"
            atleta_faixa = "Branca"
            filial_nome = "Dojo Central"
            
            if atleta:
                atleta_nome = atleta.get("nome", atleta_nome)
                atleta_faixa = atleta.get("faixa", atleta_faixa)
                
                # Busca nome da filial
                filial_id = atleta.get("filial_id")
                if filial_id:
                    filial, _ = SupabaseService.get_profile_by_id(filial_id)
                    if filial:
                        filial_name_val = filial.get("nome_fantasia") or filial.get("nome")
                        if filial_name_val:
                            filial_nome = filial_name_val
            
            return jsonify({
                "codigo_validacao": cert.get("codigo_validacao") or cert.get("id"),
                "data_emissao": cert.get("data_emissao") or cert.get("created_at") or "2026-06-01",
                "atleta_nome": atleta_nome,
                "atleta_faixa": atleta_faixa,
                "filial_nome": filial_nome
            }), 200
            
    # Mock de demonstração caso esteja vazio (para testar código fictício)
    if codigo.lower() == "testecode" or codigo.lower() == "demo123":
        return jsonify({
            "codigo_validacao": codigo.upper(),
            "data_emissao": "2026-06-01",
            "atleta_nome": "Atleta de Teste",
            "atleta_faixa": "Verde (4º Kyu)",
            "filial_nome": "Filial Salvador Centro"
        }), 200
            
    return jsonify({"erro": "Certificado não localizado."}), 404

# --- ADICIONAL: ENDPOINTS DE NOTIFICAÇÕES (ERP) ---

@app.route("/api/notificacoes", methods=["GET", "PATCH"])
def handle_notificacoes_list():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Não autenticado"}), 401
        
    if request.method == "GET":
        notifs, error = SupabaseService.get_all("notifications", order_by="created_at", ascending=False)
        if error or not notifs:
            # Fallback para tabela 'notificacoes' se 'notifications' falhar ou estiver vazia
            notifs, error = SupabaseService.get_all("notificacoes", order_by="created_at", ascending=False)
            
        # Filtra notificações destinadas ao usuário logado ou para todos
        user_notifs = []
        for n in (notifs or []):
            if n.get("destinatario_id") == user["id"] or n.get("destinatario_id") is None:
                user_notifs.append(n)
                
        return jsonify({"notificacoes": user_notifs}), 200
        
    elif request.method == "PATCH":
        # Marca todas as notificações do usuário logado como lidas
        notifs, _ = SupabaseService.get_all("notifications")
        if not notifs:
            notifs, _ = SupabaseService.get_all("notificacoes")
            
        for n in (notifs or []):
            if n.get("destinatario_id") == user["id"] or n.get("destinatario_id") is None:
                SupabaseService.update("notifications", n["id"], {"lida": True})
                SupabaseService.update("notificacoes", n["id"], {"lida": True})
                
        return jsonify({"success": True}), 200

@app.route("/api/notificacoes/<id>", methods=["PATCH"])
def handle_notificacao_update(id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Não autenticado"}), 401
        
    data = request.json or {}
    lida = data.get("lida", True)
    
    res, error = SupabaseService.update("notifications", id, {"lida": lida})
    if error:
        res, error = SupabaseService.update("notificacoes", id, {"lida": lida})
        
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify({"success": True, "notificacao": res}), 200

# --- ADICIONAL: ENDPOINTS DE RANKING (ERP) ---

@app.route("/api/ranking", methods=["GET", "POST"])
def handle_ranking():
    user = get_current_user()
    
    if request.method == "GET":
        # Retorna o leaderboard consolidado de atletas ordenados por pontos decrescentes
        atletas_lista, _ = SupabaseService.get_all("atletas")
        profiles_lista, _ = SupabaseService.get_all("profiles")
        
        # Junta informações
        leaderboard = []
        for a in (atletas_lista or []):
            prof = next((p for p in (profiles_lista or []) if p["id"] == a["id"]), None)
            if prof:
                leaderboard.append({
                    "id": a["id"],
                    "nome": prof.get("nome", "Atleta"),
                    "filial_id": a.get("filial_id", "dojo-central"),
                    "filial_nome": a.get("filial_nome", "Dojo Central"),
                    "faixa": a.get("faixa", "Branca"),
                    "pontos": a.get("pontos", 150),  # Valor default se não houver
                    "cidade": prof.get("cidade", "Salvador")
                })
                
        # Ordena por pontos decrescente
        leaderboard.sort(key=lambda x: x["pontos"], reverse=True)
        # Adiciona posições
        for idx, item in enumerate(leaderboard):
            item["posicao"] = idx + 1
            
        # Busca o histórico pessoal do usuário autenticado
        historico_lista = []
        if user:
            pontos_lista, _ = SupabaseService.get_all("historico_pontos", filter_dict={"atleta_id": user["id"]})
            historico_lista = pontos_lista or []
            
        return jsonify({
            "leaderboard": leaderboard,
            "historicoPessoal": historico_lista
        }), 200
        
    elif request.method == "POST":
        # Lançar nova pontuação (apenas Admin)
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403
            
        data = request.json or {}
        atleta_id = data.get("atleta_id")
        tipo_evento = data.get("tipo_evento")
        descricao = data.get("descricao")
        pontos = int(data.get("pontos", 0))
        
        if not atleta_id or not tipo_evento or not descricao:
            return jsonify({"error": "Preencha todos os campos obrigatórios"}), 400
            
        # Insere histórico de pontos
        nova_conquista = {
            "atleta_id": atleta_id,
            "tipo_evento": tipo_evento,
            "descricao": descricao,
            "pontos": pontos,
            "data_pontuacao": datetime.utcnow().date().isoformat()
        }
        res, error = SupabaseService.insert("historico_pontos", nova_conquista)
        if error:
            return jsonify({"error": error}), 500
            
        # Incrementa os pontos na tabela atletas
        atleta_perfil, _ = SupabaseService.get_profile_by_id(atleta_id)
        if atleta_perfil:
            pontos_atuais = atleta_perfil.get("pontos", 0)
            SupabaseService.update("atletas", atleta_id, {"pontos": pontos_atuais + pontos})
            
        return jsonify(res), 201

# --- ADICIONAL: ENDPOINTS DE EXAMES (ERP) ---

@app.route("/api/exames", methods=["GET", "POST"])
def handle_exames():
    if request.method == "GET":
        exames, error = SupabaseService.get_all("exames", order_by="data_exame", ascending=False)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"exames": exames}), 200
        
    elif request.method == "POST":
        # Apenas admin pode criar exames
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403
            
        data = request.json or {}
        res, error = SupabaseService.insert("exames", data)
        if error:
            return jsonify({"error": error}), 500
        return jsonify(res), 201

@app.route("/api/exames/<id>", methods=["PATCH"])
def handle_exame_edit(id):
    user = get_current_user()
    if not user or user.get("tipo") != "admin":
        return jsonify({"error": "Não autorizado"}), 403
        
    data = request.json or {}
    res, error = SupabaseService.update("exames", id, data)
    if error:
        return jsonify({"error": error}), 500
    return jsonify(res), 200

@app.route("/api/exames/candidatos", methods=["GET", "POST"])
def handle_candidatos():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Não autenticado"}), 401
        
    if request.method == "GET":
        candidatos, error = SupabaseService.get_all("candidatos_exame")
        if error or not candidatos:
            candidatos, error = SupabaseService.get_all("candidatos")
            
        filtrados = []
        for c in (candidatos or []):
            # Filtra conforme permissões
            if user.get("tipo") == "admin":
                filtrados.append(c)
            elif user.get("tipo") == "filial":
                # Vê os candidatos da sua filial
                if c.get("filial_id") == user["id"]:
                    filtrados.append(c)
            else:
                # Atleta vê apenas a si mesmo
                if c.get("atleta_id") == user["id"]:
                    filtrados.append(c)
                    
        return jsonify({"candidatos": filtrados}), 200
        
    elif request.method == "POST":
        data = request.json or {}
        # Preenche dados adicionais do perfil do atleta
        atleta_perfil, _ = SupabaseService.get_profile_by_id(data.get("atleta_id") or user["id"])
        
        novo_candidato = {
            "exame_id": data.get("exame_id"),
            "atleta_id": data.get("atleta_id") or user["id"],
            "atleta_nome": atleta_perfil.get("nome", "Atleta"),
            "filial_id": atleta_perfil.get("filial_id", "dojo-central"),
            "filial_nome": atleta_perfil.get("filial_nome", "Dojo Central"),
            "faixa_atual": atleta_perfil.get("faixa", "Branca"),
            "graduacao_pretendida": data.get("graduacao_pretendida", "Amarela"),
            "status": "pendente",
            "autorizacao_tecnica": True if user.get("tipo") in ["admin", "filial"] else False,
            "pagamento_status": "pendente",
            "dados_banca": {}
        }
        res, error = SupabaseService.insert("candidatos_exame", novo_candidato)
        if error:
            res, error = SupabaseService.insert("candidatos", novo_candidato)
            
        if error:
            return jsonify({"error": error}), 500
        return jsonify(res), 201

@app.route("/api/exames/candidatos/<id>", methods=["PATCH", "DELETE"])
def handle_candidato_actions(id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Não autenticado"}), 401
        
    if request.method == "PATCH":
        data = request.json or {}
        
        # Resolve tabela correta
        candidatos, _ = SupabaseService.get_all("candidatos_exame")
        tabela = "candidatos_exame"
        if not candidatos:
            tabela = "candidatos"
            
        res, error = SupabaseService.update(tabela, id, data)
        if error:
            return jsonify({"error": error}), 500
            
        # Se aprovado na banca, atualiza a faixa do atleta automaticamente
        if data.get("status") == "aprovado":
            candidato_info, _ = SupabaseService.get_profile_by_id(res.get("atleta_id"))
            if candidato_info:
                nova_faixa = res.get("graduacao_pretendida", "Amarela")
                SupabaseService.update("atletas", res.get("atleta_id"), {"faixa": nova_faixa})
                
        return jsonify(res), 200
        
    elif request.method == "DELETE":
        candidatos, _ = SupabaseService.get_all("candidatos_exame")
        tabela = "candidatos_exame"
        if not candidatos:
            tabela = "candidatos"
            
        res, error = SupabaseService.delete(tabela, id)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"sucesso": True}), 200

# --- ADICIONAL: ENDPOINTS FINANCEIROS (ERP) ---

@app.route("/api/financeiro", methods=["GET", "POST"])
def handle_financeiro():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Não autenticado"}), 401
        
    if request.method == "GET":
        faturas, error = SupabaseService.get_all("financeiro")
        if error or not faturas:
            faturas, error = SupabaseService.get_all("cobrancas")
            
        filtrados = []
        for f in (faturas or []):
            if user.get("tipo") == "admin":
                filtrados.append(f)
            elif user.get("tipo") == "filial":
                if f.get("filial_id") == user["id"] or f.get("filial_nome") == user.get("nome"):
                    filtrados.append(f)
            else:
                if f.get("atleta_id") == user["id"]:
                    filtrados.append(f)
                    
        return jsonify({"pagamentos": filtrados}), 200
        
    elif request.method == "POST":
        if user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403
            
        data = request.json or {}
        # Preenche os nomes de atletas/filiais de acordo com o ID enviado
        atleta_nome = None
        filial_nome = None
        
        if data.get("atleta_id"):
            prof, _ = SupabaseService.get_profile_by_id(data.get("atleta_id"))
            if prof:
                atleta_nome = prof.get("nome")
        if data.get("filial_id"):
            prof, _ = SupabaseService.get_profile_by_id(data.get("filial_id"))
            if prof:
                filial_name_val = prof.get("nome_fantasia") or prof.get("nome")
                filial_nome = filial_name_val
                
        nova_fatura = {
            "atleta_id": data.get("atleta_id"),
            "atleta_nome": atleta_nome,
            "filial_id": data.get("filial_id"),
            "filial_nome": filial_nome,
            "tipo": data.get("tipo", "anuidade"),
            "valor": float(data.get("valor", 0)),
            "data_vencimento": data.get("data_vencimento"),
            "status": "pendente"
        }
        res, error = SupabaseService.insert("financeiro", nova_fatura)
        if error:
            res, error = SupabaseService.insert("cobrancas", nova_fatura)
            
        if error:
            return jsonify({"error": error}), 500
        return jsonify(res), 201

@app.route("/api/financeiro/<id>", methods=["PATCH"])
def handle_financeiro_update(id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Não autenticado"}), 401
        
    data = request.json or {}
    
    faturas, _ = SupabaseService.get_all("financeiro")
    tabela = "financeiro"
    if not faturas:
        tabela = "cobrancas"
        
    res, error = SupabaseService.update(tabela, id, data)
    if error:
        return jsonify({"error": error}), 500
    return jsonify(res), 200

# --- NOVAS ROTAS FASE 3 ---

# 1. CRUD de Eventos
@app.route("/api/eventos", methods=["POST"])
def criar_evento():
    user = get_current_user()
    if not user or user.get("tipo") != "admin":
        return jsonify({"error": "Acesso não autorizado"}), 403
    
    data = request.json or {}
    evento, error = SupabaseService.insert("eventos", data)
    if error:
        return jsonify({"error": error}), 500
    return jsonify(evento), 201

@app.route("/api/eventos/<id>", methods=["PATCH", "DELETE"])
def gerenciar_evento(id):
    user = get_current_user()
    if not user or user.get("tipo") != "admin":
        return jsonify({"error": "Acesso não autorizado"}), 403

    if request.method == "PATCH":
        data = request.json or {}
        evento, error = SupabaseService.update("eventos", id, data)
        if error:
            return jsonify({"error": error}), 500
        return jsonify(evento), 200
        
    elif request.method == "DELETE":
        res, error = SupabaseService.delete("eventos", id)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"sucesso": True}), 200

# 2. Inscrições em Eventos
@app.route("/api/eventos/inscricoes", methods=["GET", "POST"])
def gerenciar_inscricoes():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Não autenticado"}), 401
        
    if request.method == "GET":
        evento_id = request.args.get("evento_id")
        filter_dict = {}
        if evento_id:
            filter_dict["evento_id"] = evento_id
            
        inscricoes, error = SupabaseService.get_all("eventos_inscricoes", filter_dict=filter_dict)
        if error or not inscricoes:
            inscricoes, error = SupabaseService.get_all("inscricoes_evento", filter_dict=filter_dict)
            
        filtrados = []
        for ins in (inscricoes or []):
            if user.get("tipo") == "admin":
                filtrados.append(ins)
            elif user.get("tipo") == "filial":
                if ins.get("filial_id") == user["id"]:
                    filtrados.append(ins)
            else:
                if ins.get("atleta_id") == user["id"]:
                    filtrados.append(ins)
                    
        return jsonify({"inscricoes": filtrados}), 200
        
    elif request.method == "POST":
        data = request.json or {}
        atleta_id = data.get("atleta_id") or user["id"]
        
        atleta_perfil, _ = SupabaseService.get_profile_by_id(atleta_id)
        
        nova_inscricao = {
            "evento_id": data.get("evento_id"),
            "atleta_id": atleta_id,
            "atleta_nome": atleta_perfil.get("nome", "Atleta"),
            "filial_id": atleta_perfil.get("filial_id", "dojo-central"),
            "filial_nome": atleta_perfil.get("filial_nome", "Dojo Central"),
            "categoria": data.get("categoria", "Kata"),
            "faixa": atleta_perfil.get("faixa", "Branca"),
            "idade": data.get("idade", 18),
            "pagamento_status": "pendente",
            "status": "confirmado"
        }
        
        res, error = SupabaseService.insert("eventos_inscricoes", nova_inscricao)
        if error:
            res, error = SupabaseService.insert("inscricoes_evento", nova_inscricao)
            
        if error:
            return jsonify({"error": error}), 500
        return jsonify(res), 201

@app.route("/api/eventos/inscricoes/<id>", methods=["PATCH"])
def atualizar_inscricao(id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Não autenticado"}), 401
        
    data = request.json or {}
    
    inscricoes, _ = SupabaseService.get_all("eventos_inscricoes")
    tabela = "eventos_inscricoes"
    if not inscricoes:
        tabela = "inscricoes_evento"
        
    res, error = SupabaseService.update(tabela, id, data)
    if error:
        return jsonify({"error": error}), 500
    return jsonify(res), 200

# 3. Chaves de Lutas / Brackets (Kata e Kumite)
@app.route("/api/eventos/chaves", methods=["GET", "POST"])
def gerenciar_chaves():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Não autenticado"}), 401
        
    if request.method == "GET":
        evento_id = request.args.get("evento_id")
        modalidade = request.args.get("modalidade")
        
        if not evento_id or not modalidade:
            return jsonify({"error": "Parâmetros evento_id e modalidade são obrigatórios"}), 400
            
        chaves, error = SupabaseService.get_all("eventos_chaves", filter_dict={"evento_id": evento_id, "modalidade": modalidade})
        if error or not chaves:
            chaves, error = SupabaseService.get_all("chaves_torneio", filter_dict={"evento_id": evento_id, "modalidade": modalidade})
            
        if chaves:
            return jsonify({"chave": chaves[0]}), 200
        return jsonify({"chave": None}), 200
        
    elif request.method == "POST":
        if user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403
            
        data = request.json or {}
        evento_id = data.get("evento_id")
        modalidade = data.get("modalidade")
        brackets = data.get("brackets")
        
        if not evento_id or not modalidade or brackets is None:
            return jsonify({"error": "Preencha todos os campos obrigatórios"}), 400
            
        chaves, _ = SupabaseService.get_all("eventos_chaves", filter_dict={"evento_id": evento_id, "modalidade": modalidade})
        tabela = "eventos_chaves"
        if not chaves:
            chaves, _ = SupabaseService.get_all("chaves_torneio", filter_dict={"evento_id": evento_id, "modalidade": modalidade})
            tabela = "chaves_torneio" if chaves or not SupabaseService.is_mock() else "eventos_chaves"
            
        if chaves:
            res, error = SupabaseService.update(tabela, chaves[0]["id"], {"brackets": brackets})
        else:
            payload = {
                "evento_id": evento_id,
                "modalidade": modalidade,
                "brackets": brackets
            }
            res, error = SupabaseService.insert(tabela, payload)
            
        if error:
            return jsonify({"error": error}), 500
        return jsonify(res), 200

# 4. Notícias - Edição e Exclusão
@app.route("/api/noticias/<id>", methods=["PATCH", "DELETE"])
def gerenciar_noticias_id(id):
    user = get_current_user()
    if not user or user.get("tipo") != "admin":
        return jsonify({"error": "Acesso não autorizado"}), 403
        
    if request.method == "PATCH":
        data = request.json or {}
        res, error = SupabaseService.update("noticias", id, data)
        if error:
            return jsonify({"error": error}), 500
        return jsonify(res), 200
        
    elif request.method == "DELETE":
        res, error = SupabaseService.delete("noticias", id)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"sucesso": True}), 200

# 5. Atletas - Listagem e Homologação
@app.route("/api/atletas", methods=["GET"])
def get_atletas_lista():
    user = get_current_user()
    if not user or user.get("tipo") not in ["admin", "filial"]:
        return jsonify({"error": "Não autorizado"}), 403
        
    atletas_db, error = SupabaseService.get_all("atletas")
    profiles_db, _ = SupabaseService.get_all("profiles")
    
    res_atletas = []
    for atl in (atletas_db or []):
        prof = next((p for p in (profiles_db or []) if p["id"] == atl["id"]), None)
        if prof:
            item = dict(prof)
            item.update(atl)
            
            if user.get("tipo") == "filial" and item.get("filial_id") != user["id"]:
                continue
                
            res_atletas.append(item)
            
    return jsonify({"atletas": res_atletas}), 200

@app.route("/api/atletas/<id>", methods=["PATCH"])
def patch_atleta(id):
    user = get_current_user()
    if not user or user.get("tipo") not in ["admin", "filial"]:
        return jsonify({"error": "Não autorizado"}), 403
        
    data = request.json or {}
    status = data.get("status")
    faixa = data.get("faixa")
    
    update_prof = {}
    if status:
        update_prof["status"] = status
        
    if update_prof:
        SupabaseService.update("profiles", id, update_prof)
        
    update_atl = {}
    if status:
        update_atl["status"] = status
    if faixa:
        update_atl["faixa"] = faixa
    if "filial_id" in data:
        update_atl["filial_id"] = data["filial_id"]
        
    res, error = SupabaseService.update("atletas", id, update_atl)
    if error:
        return jsonify({"error": error}), 500
        
    updated_atleta, _ = SupabaseService.get_profile_by_id(id)
    return jsonify(updated_atleta), 200

# 6. Filiais - PATCH (Homologação / Anuidade)
@app.route("/api/filiais/<id>", methods=["PATCH"])
def patch_filial(id):
    user = get_current_user()
    if not user or user.get("tipo") != "admin":
        return jsonify({"error": "Acesso não autorizado"}), 403
        
    data = request.json or {}
    status = data.get("status")
    
    update_prof = {}
    if status:
        update_prof["status"] = status
        
    if update_prof:
        SupabaseService.update("profiles", id, update_prof)
        
    update_fil = dict(data)
    res, error = SupabaseService.update("filiais", id, update_fil)
    if error:
        return jsonify({"error": error}), 500
        
    updated_filial, _ = SupabaseService.get_profile_by_id(id)
    return jsonify(updated_filial), 200

# 7. CMS - Banners, Equipe, Galeria
@app.route("/api/cms", methods=["GET", "POST"])
def manage_cms():
    if request.method == "GET":
        banners, _ = SupabaseService.get_all("cms_banners")
        equipe, _ = SupabaseService.get_all("team_members", order_by="order", ascending=True)
        galeria, _ = SupabaseService.get_all("gallery_items", order_by="order", ascending=True)
        
        return jsonify({
            "banners": banners or [],
            "equipe": equipe or [],
            "galeria": galeria or []
        }), 200
        
    elif request.method == "POST":
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403
            
        data = request.json or {}
        tipo_item = data.get("tipo")
        payload = data.get("payload")
        
        if not tipo_item or not payload:
            return jsonify({"error": "Parâmetros tipo e payload são obrigatórios"}), 400
            
        tabela = ""
        if tipo_item == "banner":
            tabela = "cms_banners"
        elif tipo_item == "equipe":
            tabela = "team_members"
        elif tipo_item == "galeria":
            tabela = "gallery_items"
        else:
            return jsonify({"error": "Tipo inválido"}), 400
            
        item_id = payload.get("id")
        if item_id:
            res, error = SupabaseService.update(tabela, item_id, payload)
        else:
            res, error = SupabaseService.insert(tabela, payload)
            
        if error:
            return jsonify({"error": error}), 500
        return jsonify(res), 200

@app.route("/api/cms/<tipo>/<id>", methods=["DELETE"])
def delete_cms_item(tipo, id):
    user = get_current_user()
    if not user or user.get("tipo") != "admin":
        return jsonify({"error": "Não autorizado"}), 403
        
    tabela = ""
    if tipo == "banner":
        tabela = "cms_banners"
    elif tipo == "equipe":
        tabela = "team_members"
    elif tipo == "galeria":
        tabela = "gallery_items"
    else:
        return jsonify({"error": "Tipo inválido"}), 400
        
    res, error = SupabaseService.delete(tabela, id)
    if error:
        return jsonify({"error": error}), 500
    return jsonify({"sucesso": True}), 200

# 8. Auditoria
@app.route("/api/auditoria", methods=["GET", "POST"])
def handle_auditoria():
    user = get_current_user()
    if not user or user.get("tipo") != "admin":
        return jsonify({"error": "Não autorizado"}), 403
        
    if request.method == "GET":
        logs, error = SupabaseService.get_all("logs_auditoria", order_by="created_at", ascending=False)
        if error or not logs:
            logs, error = SupabaseService.get_all("auditoria", order_by="created_at", ascending=False)
            
        return jsonify({"logs": logs or []}), 200
        
    elif request.method == "POST":
        data = request.json or {}
        payload = {
            "usuario_id": user["id"],
            "usuario_nome": user.get("nome", "Admin"),
            "acao": data.get("acao"),
            "detalhes": data.get("detalhes"),
            "ip": request.remote_addr or "127.0.0.1"
        }
        
        res, error = SupabaseService.insert("logs_auditoria", payload)
        if error:
            res, error = SupabaseService.insert("auditoria", payload)
            
        if error:
            return jsonify({"error": error}), 500
        return jsonify(res), 201

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    is_dev = os.environ.get("FLASK_ENV", "development") != "production"
    app.run(host="0.0.0.0", port=port, debug=is_dev)
