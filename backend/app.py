import os
import sys
# Adiciona o diretório pai ao sys.path para permitir importações absolutas do pacote 'backend'
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from services.supabase_service import SupabaseService

load_dotenv()

app = Flask(__name__)

# Permite CORS apenas para as origens front-end explícitas quando credenciais são necessárias.
# Usamos a variável de ambiente FRONTEND_ORIGINS (lista separada por vírgula) ou FRONTEND_URL.
# Se nenhuma variável for fornecida, habilitamos um conjunto razoável de origens de desenvolvimento
# comuns (localhost:3000 e 127.0.0.1:3000). Não use '*' quando credentials=True.
frontend_origins_env = os.environ.get("FRONTEND_ORIGINS") or os.environ.get("FRONTEND_URL")
if frontend_origins_env:
    if "," in frontend_origins_env:
        origins = [o.strip() for o in frontend_origins_env.split(",") if o.strip()]
    else:
        origins = frontend_origins_env
else:
    # Ambiente de desenvolvimento padrão: permitir explicitamente localhost:3000
    origins = ["http://localhost:3000"]

# Registrar CORS com suporte a credenciais (cookies).
CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)



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

# Importar e registrar todos os módulos de rotas
from auth_routes import create_auth_routes
from atleta_routes import create_atleta_routes
from filial_routes import create_filial_routes
from cms_routes import create_cms_routes
from messages_routes import create_messages_routes
from ai_routes import create_ai_routes
from cert_routes import create_cert_routes
from notif_routes import create_notif_routes
from ranking_routes import create_ranking_routes
from exam_routes import create_exam_routes
from finance_routes import create_finance_routes
from event_routes import create_event_routes

# Registrar todas as rotas
create_auth_routes(app)
create_atleta_routes(app)
create_filial_routes(app)
create_cms_routes(app)
create_messages_routes(app)
create_ai_routes(app)
create_cert_routes(app)
create_notif_routes(app)
create_ranking_routes(app)
create_exam_routes(app)
create_finance_routes(app)
create_event_routes(app)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "mock_mode": SupabaseService.is_mock(),
        "message": "API do Goju-Ryu Karate Kai está rodando com sucesso!"
    }), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    is_dev = os.environ.get("FLASK_ENV", "development") != "production"
    app.run(host="0.0.0.0", port=port, debug=is_dev)
