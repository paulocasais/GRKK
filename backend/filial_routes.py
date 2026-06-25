from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

def create_filial_routes(app: Flask):
    """Cria e registra as rotas de filiais"""

    @app.route("/api/filiais", methods=["GET", "POST"])
    def register_filial():
        from app import get_current_user

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

        import uuid
        data = request.json or {}
        nome = data.get("nome")
        email = data.get("email")
        telefone = data.get("telefone")
        senha = data.get("senha")

        if not nome or not email:
            return jsonify({"error": "Nome e e-mail da filial são obrigatórios"}), 400

        user_id = str(uuid.uuid4())

        # Cria a conta no Supabase Auth se não estiver em modo mock
        if not SupabaseService.is_mock():
            try:
                from services.supabase_service import supabase
                user_attrs = {
                    "email": email,
                    "password": senha if senha else "GojuRyu123!",
                    "email_confirm": True,
                    "id": user_id
                }
                supabase.auth.admin.create_user(user_attrs)
            except Exception as auth_err:
                return jsonify({"error": f"Erro ao criar conta no Supabase Auth: {str(auth_err)}"}), 400

        profile_item = {
            "id": user_id,
            "nome": nome,
            "email": email,
            "telefone": telefone or "",
            "tipo": "filial",
            "status": "pendente"
        }
        profile, error = SupabaseService.insert("profiles", profile_item)
        if error:
            # Se der erro de banco na inserção de dados, tenta remover o usuário do Auth para consistência
            if not SupabaseService.is_mock():
                try:
                    from services.supabase_service import supabase
                    supabase.auth.admin.delete_user(user_id)
                except Exception:
                    pass
            return jsonify({"error": error}), 500

        filial_item = {
            "id": user_id,
            "nome": nome,
            "email": email,
            "telefone": telefone or "",
            "status": "pendente",
            "codigo_interno": "MOCK-FILIAL-" + user_id[:5].upper()
        }
        filial, error2 = SupabaseService.insert("filiais", filial_item)
        if error2:
            return jsonify({"error": error2}), 500

        return jsonify({"success": True, "filial": filial}), 201

    @app.route("/api/filiais/<id>", methods=["PATCH"])
    def patch_filial(id):
        from app import get_current_user

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

        # Registrar log de auditoria
        registrar_log_auditoria(
            user,
            "Atualização de Filial",
            f"Filial {updated_filial.get('nome') if updated_filial else id} (ID: {id}) atualizada. Status: {status or 'Sem alteração de status'}"
        )

        return jsonify(updated_filial), 200

    @app.route("/api/filiais/<id>", methods=["DELETE"])
    def delete_filial(id):
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        # Busca filial antes de deletar para obter o nome para auditoria
        filial, _ = SupabaseService.get_profile_by_id(id)
        filial_nome = filial.get("nome") if filial else id

        # Remove de filiais
        _, error = SupabaseService.delete("filiais", id)
        if error:
            return jsonify({"error": error}), 500

        # Remove do profiles
        _, error2 = SupabaseService.delete("profiles", id)
        if error2:
            return jsonify({"error": error2}), 500

        # Registrar log de auditoria
        registrar_log_auditoria(
            user,
            "Exclusão de Filial",
            f"Filial '{filial_nome}' (ID: {id}) excluída com sucesso."
        )

        return jsonify({"sucesso": True}), 200
