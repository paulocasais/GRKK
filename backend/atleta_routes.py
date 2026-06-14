from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_atleta_routes(app: Flask):
    """Cria e registra as rotas de atletas"""

    @app.route("/api/atletas/public", methods=["POST"])
    def register_atleta():
        data = request.json or {}
        nome = data.get("nome")
        email = data.get("email")
        telefone = data.get("telefone")
        senha = data.get("senha")

        if not nome or not email or not telefone:
            return jsonify({"error": "Nome, e-mail e telefone são obrigatórios"}), 400

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

    @app.route("/api/atletas", methods=["GET"])
    def get_atletas_lista():
        from backend.app import get_current_user

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
        from backend.app import get_current_user

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
