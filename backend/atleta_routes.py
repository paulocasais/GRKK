from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

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
        from app import get_current_user

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
        from app import get_current_user

        user = get_current_user()
        print(f"DEBUG: patch_atleta called with id={id}, type={type(id)}")
        if user:
            print(f"DEBUG: get_current_user returned user id={user.get('id')}, type={type(user.get('id'))}, match={user.get('id') == id}")
        else:
            print("DEBUG: get_current_user returned None!")
            
        if not user or (user.get("tipo") not in ["admin", "filial"] and str(user.get("id")) != str(id)):
            return jsonify({"error": "Não autorizado"}), 403

        data = request.json or {}
        existing_atleta, _ = SupabaseService.get_profile_by_id(id)

        # Validação de menor de idade
        data_nasc = data.get("data_nascimento") or (existing_atleta.get("data_nascimento") if existing_atleta else None)
        if data_nasc:
            try:
                from datetime import datetime, date
                birth_date = datetime.strptime(data_nasc, "%Y-%m-%d").date()
                today = date.today()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                if age < 18:
                    resp_nome = data.get("responsavel_nome") or (existing_atleta.get("responsavel_nome") if existing_atleta else None)
                    resp_cpf = data.get("responsavel_cpf") or (existing_atleta.get("responsavel_cpf") if existing_atleta else None)
                    resp_tel = data.get("responsavel_telefone") or (existing_atleta.get("responsavel_telefone") if existing_atleta else None)
                    if not resp_nome or not resp_cpf or not resp_tel:
                        return jsonify({"error": "Dados do responsável (nome, CPF, telefone) são obrigatórios para menores de 18 anos."}), 400
            except Exception:
                pass

        update_prof = {}
        for field in ["nome", "email", "telefone", "cidade", "status"]:
            if field in data:
                update_prof[field] = data[field]

        # Apenas admin ou filial podem atualizar o status no profile
        if user.get("tipo") == "atleta":
            update_prof.pop("status", None)

        if update_prof:
            SupabaseService.update("profiles", id, update_prof)

        update_atl = {}
        fields_to_update = [
            "status", "faixa", "filial_id", "filial_nome", "cpf", "sexo", "data_nascimento", 
            "nome_professor", "endereco", "cidade", "uf", 
            "responsavel_nome", "responsavel_cpf", "responsavel_email", "responsavel_telefone",
            "medico_alergias", "medico_plano", "medico_restricoes", "medico_diagnosticos"
        ]
        for field in fields_to_update:
            if field in data:
                update_atl[field] = data[field]

        # Atletas não podem mudar status ou faixa
        if user.get("tipo") == "atleta":
            update_atl.pop("status", None)
            update_atl.pop("faixa", None)

        res, error = SupabaseService.update("atletas", id, update_atl)
        if error:
            return jsonify({"error": error}), 500

        # Registrar log de auditoria
        campos_atualizados = list(update_prof.keys()) + list(update_atl.keys())
        registrar_log_auditoria(
            user,
            "Atualização de Atleta",
            f"Perfil do atleta {existing_atleta.get('nome')} (ID: {id}) atualizado. Campos: {', '.join(set(campos_atualizados))}"
        )

        updated_atleta, _ = SupabaseService.get_profile_by_id(id)
        return jsonify(updated_atleta), 200
