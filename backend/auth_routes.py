from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from services.supabase_service import SupabaseService

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

        response = make_response(jsonify({
            "autenticado": True,
            "usuario": user_data,
            "tipo": user_data.get("tipo")
        }))

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
        from backend.app import get_current_user

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
