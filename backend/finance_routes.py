from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_finance_routes(app: Flask):
    """Cria e registra as rotas financeiras"""

    @app.route("/api/financeiro", methods=["GET", "POST"])
    def handle_financeiro():
        from backend.app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            faturas, error = SupabaseService.get_all("financeiro")
            if error or not faturas:
                faturas, error = SupabaseService.get_all("cobrancas")

            filtrados = []
            for f in (faturas or []):
                if user.get("tipo") == "admin":
                    filtrados.append(f)
                elif user.get("tipo") == "filial":
                    if f.get("filial_id") == user["id"] or f.get("filial_nome") == user.get("nome"):
                        filtrados.append(f)
                else:
                    if f.get("atleta_id") == user["id"]:
                        filtrados.append(f)

            return jsonify({"pagamentos": filtrados}), 200

        elif request.method == "POST":
            if user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            atleta_nome = None
            filial_nome = None

            if data.get("atleta_id"):
                prof, _ = SupabaseService.get_profile_by_id(data.get("atleta_id"))
                if prof:
                    atleta_nome = prof.get("nome")
            if data.get("filial_id"):
                prof, _ = SupabaseService.get_profile_by_id(data.get("filial_id"))
                if prof:
                    filial_name_val = prof.get("nome_fantasia") or prof.get("nome")
                    filial_nome = filial_name_val

            nova_fatura = {
                "atleta_id": data.get("atleta_id"),
                "atleta_nome": atleta_nome,
                "filial_id": data.get("filial_id"),
                "filial_nome": filial_nome,
                "tipo": data.get("tipo", "anuidade"),
                "valor": float(data.get("valor", 0)),
                "data_vencimento": data.get("data_vencimento"),
                "status": "pendente"
            }
            res, error = SupabaseService.insert("financeiro", nova_fatura)
            if error:
                res, error = SupabaseService.insert("cobrancas", nova_fatura)

            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 201

    @app.route("/api/financeiro/<id>", methods=["PATCH"])
    def handle_financeiro_update(id):
        from backend.app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        data = request.json or {}

        faturas, _ = SupabaseService.get_all("financeiro")
        tabela = "financeiro"
        if not faturas:
            tabela = "cobrancas"

        res, error = SupabaseService.update(tabela, id, data)
        if error:
            return jsonify({"error": error}), 500
        return jsonify(res), 200
