from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_notif_routes(app: Flask):
    """Cria e registra as rotas de notificações"""

    @app.route("/api/notificacoes", methods=["GET", "PATCH"])
    def handle_notificacoes_list():
        from backend.app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            notifs, error = SupabaseService.get_all("notifications", order_by="created_at", ascending=False)
            if error or not notifs:
                notifs, error = SupabaseService.get_all("notificacoes", order_by="created_at", ascending=False)

            user_notifs = []
            for n in (notifs or []):
                if n.get("destinatario_id") == user["id"] or n.get("destinatario_id") is None:
                    user_notifs.append(n)

            return jsonify({"notificacoes": user_notifs}), 200

        elif request.method == "PATCH":
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
        from backend.app import get_current_user

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
