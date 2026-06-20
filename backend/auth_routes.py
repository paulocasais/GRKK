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
        
        # Determina o domínio, secure e samesite do cookie de forma dinâmica
        host = request.headers.get("Host", "").split(":")[0]
        cookie_domain = None
        secure_cookie = False
        samesite_val = "Lax"
        if "localhost" not in host and "127.0.0.1" not in host:
            secure_cookie = True
            samesite_val = "None"
            if "gojuryukaratekai.com.br" in host:
                cookie_domain = ".gojuryukaratekai.com.br"
            else:
                parts = host.split(".")
                if len(parts) >= 2:
                    if len(parts) >= 3 and parts[-2] in ["com", "org", "net", "edu", "gov", "mil"]:
                        cookie_domain = "." + ".".join(parts[-3:])
                    else:
                        cookie_domain = "." + ".".join(parts[-2:])

        response.set_cookie("session_user", session_val, max_age=86400, httponly=False, samesite=samesite_val, secure=secure_cookie, domain=cookie_domain)
        response.set_cookie("sb-mock-session", session_val, max_age=86400, httponly=False, samesite=samesite_val, secure=secure_cookie, domain=cookie_domain)

        return response, 200

    @app.route("/api/auth/logout", methods=["POST"])
    def auth_logout():
        from app import get_current_user
        user = get_current_user()
        if user:
            registrar_log_auditoria(user, "Logout", f"Usuário {user.get('email')} realizou logout")

        # Determina o domínio do cookie de forma dinâmica para remoção
        host = request.headers.get("Host", "").split(":")[0]
        cookie_domain = None
        secure_cookie = False
        samesite_val = "Lax"
        if "localhost" not in host and "127.0.0.1" not in host:
            secure_cookie = True
            samesite_val = "None"
            if "gojuryukaratekai.com.br" in host:
                cookie_domain = ".gojuryukaratekai.com.br"
            else:
                parts = host.split(".")
                if len(parts) >= 2:
                    if len(parts) >= 3 and parts[-2] in ["com", "org", "net", "edu", "gov", "mil"]:
                        cookie_domain = "." + ".".join(parts[-3:])
                    else:
                        cookie_domain = "." + ".".join(parts[-2:])

        response = make_response(jsonify({"sucesso": True, "message": "Logout realizado com sucesso"}))
        response.delete_cookie("session_user", domain=cookie_domain, secure=secure_cookie, samesite=samesite_val)
        response.delete_cookie("sb-mock-session", domain=cookie_domain, secure=secure_cookie, samesite=samesite_val)
        return response, 200

    @app.route("/api/auth/me", methods=["GET"])
    def auth_me():
        from app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"autenticado": False}), 200

        if user.get("status") != "ativo":
            # Determina o domínio do cookie de forma dinâmica para remoção
            host = request.headers.get("Host", "").split(":")[0]
            cookie_domain = None
            secure_cookie = False
            samesite_val = "Lax"
            if "localhost" not in host and "127.0.0.1" not in host:
                secure_cookie = True
                samesite_val = "None"
                if "gojuryukaratekai.com.br" in host:
                    cookie_domain = ".gojuryukaratekai.com.br"
                else:
                    parts = host.split(".")
                    if len(parts) >= 2:
                        if len(parts) >= 3 and parts[-2] in ["com", "org", "net", "edu", "gov", "mil"]:
                            cookie_domain = "." + ".".join(parts[-3:])
                        else:
                            cookie_domain = "." + ".".join(parts[-2:])

            response = make_response(jsonify({"autenticado": False, "erro": "Conta inativa."}), 200)
            response.delete_cookie("session_user", domain=cookie_domain, secure=secure_cookie, samesite=samesite_val)
            response.delete_cookie("sb-mock-session", domain=cookie_domain, secure=secure_cookie, samesite=samesite_val)
            return response

        return jsonify({
            "autenticado": True,
            "usuario": user,
            "tipo": user.get("tipo")
        }), 200

    @app.route("/api/auth/debug", methods=["GET"])
    def auth_debug():
        from app import get_current_user
        cookies = dict(request.cookies)
        headers = dict(request.headers)
        if "Authorization" in headers:
            headers["Authorization"] = "Bearer [REDACTED]"
            
        user = get_current_user()
        
        return jsonify({
            "cookies_recebidos": cookies,
            "headers_recebidos": {k: v for k, v in headers.items() if k.lower() in ["host", "origin", "cookie", "referer", "user-agent"]},
            "usuario_resolvido": user,
            "is_mock_mode": SupabaseService.is_mock()
        }), 200
