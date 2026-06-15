from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_auditoria_routes(app: Flask):
    """Cria e registra as rotas de auditoria"""

    @app.route("/api/auditoria", methods=["GET"])
    def get_auditoria_logs():
        from backend.app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        # Recupera os logs de auditoria ordenados do mais recente ao mais antigo
        logs, error = SupabaseService.get_all("logs_auditoria", order_by="created_at", ascending=False)
        if error:
            return jsonify({"error": f"Erro ao carregar logs de auditoria: {error}"}), 500

        return jsonify({"logs": logs or []}), 200
