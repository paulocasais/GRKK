from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

def create_auth_routes(app: Flask):
    """Cria e registra as rotas de autenticação"""

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

        # Registrar log de auditoria do login bem-sucedido
        registrar_log_auditoria(user_data, "Login", f"Usuário {email} realizou login com sucesso")

        response = make_response(jsonify({
            "autenticado": True,
            "usuario": user_data,
            "tipo": user_data.get("tipo")
        }))

        session_val = user_data["id"] if not SupabaseService.is_mock() else user_data["email"]
        
        # Determina o domínio do cookie de forma dinâmica (ex: .gojuryukaratekai.com.br em produção)
        host = request.headers.get("Host", "")
        cookie_domain = None
        if "localhost" not in host and "127.0.0.1" not in host:
            parts = host.split(":")[0].split(".")
            if len(parts) >= 2:
                cookie_domain = "." + ".".join(parts[-2:])

        response.set_cookie("session_user", session_val, max_age=86400, httponly=False, samesite="Lax", secure=False, domain=cookie_domain)
        response.set_cookie("sb-mock-session", session_val, max_age=86400, httponly=False, samesite="Lax", secure=False, domain=cookie_domain)

        return response, 200

    @app.route("/api/auth/logout", methods=["POST"])
    def auth_logout():
        from app import get_current_user
        user = get_current_user()
        if user:
            registrar_log_auditoria(user, "Logout", f"Usuário {user.get('email')} realizou logout")

        # Determina o domínio do cookie de forma dinâmica para remoção
        host = request.headers.get("Host", "")
        cookie_domain = None
        if "localhost" not in host and "127.0.0.1" not in host:
            parts = host.split(":")[0].split(".")
            if len(parts) >= 2:
                cookie_domain = "." + ".".join(parts[-2:])

        response = make_response(jsonify({"sucesso": True, "message": "Logout realizado com sucesso"}))
        response.delete_cookie("session_user", domain=cookie_domain)
        response.delete_cookie("sb-mock-session", domain=cookie_domain)
        return response, 200

    @app.route("/api/auth/me", methods=["GET"])
    def auth_me():
        from app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"autenticado": False}), 200

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
