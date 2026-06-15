from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from backend.services.audit_service import registrar_log_auditoria

def create_filial_routes(app: Flask):
    """Cria e registra as rotas de filiais"""

    @app.route("/api/filiais", methods=["GET", "POST"])
    def register_filial():
        from backend.app import get_current_user

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

    @app.route("/api/filiais/<id>", methods=["PATCH"])
    def patch_filial(id):
        from backend.app import get_current_user

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

        # Registrar log de auditoria
        registrar_log_auditoria(
            user,
            "Atualização de Filial",
            f"Filial {updated_filial.get('nome') if updated_filial else id} (ID: {id}) atualizada. Status: {status or 'Sem alteração de status'}"
        )

        updated_filial, _ = SupabaseService.get_profile_by_id(id)
        return jsonify(updated_filial), 200
