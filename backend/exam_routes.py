from flask import Flask, request, jsonify
from backend.services.supabase_service import SupabaseService
from datetime import datetime
from backend.services.audit_service import registrar_log_auditoria

def create_exam_routes(app: Flask):
    """Cria e registra as rotas de exames"""

    @app.route("/api/exames", methods=["GET", "POST"])
    def handle_exames():
        from backend.app import get_current_user

        if request.method == "GET":
            exames, error = SupabaseService.get_all("exames", order_by="data_exame", ascending=False)
            if error:
                return jsonify({"error": error}), 500
            return jsonify({"exames": exames}), 200

        elif request.method == "POST":
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            res, error = SupabaseService.insert("exames", data)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Criação de Exame",
                f"Novo exame de faixa criado para data {res.get('data_exame')} (ID: {res.get('id')})"
            )

            return jsonify(res), 201

    # Rotas fixas DEVEM vir antes das rotas com <id> para evitar shadowing
    @app.route("/api/exames/candidatos", methods=["GET", "POST"])
    def handle_candidatos():
        from backend.app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            candidatos, error = SupabaseService.get_all("candidatos_exame")
            if error or not candidatos:
                candidatos, error = SupabaseService.get_all("candidatos")

            filtrados = []
            for c in (candidatos or []):
                if user.get("tipo") == "admin":
                    filtrados.append(c)
                elif user.get("tipo") == "filial":
                    if c.get("filial_id") == user["id"]:
                        filtrados.append(c)
                else:
                    if c.get("atleta_id") == user["id"]:
                        filtrados.append(c)

            return jsonify({"candidatos": filtrados}), 200

        elif request.method == "POST":
            data = request.json or {}
            atleta_perfil, _ = SupabaseService.get_profile_by_id(data.get("atleta_id") or user["id"])

            created_at_val = datetime.utcnow().isoformat() if 'datetime' in globals() else "2026-06-08T00:00:00.000Z"

            novo_candidato = {
                "exame_id": data.get("exame_id"),
                "atleta_id": data.get("atleta_id") or user["id"],
                "atleta_nome": atleta_perfil.get("nome", "Atleta") if atleta_perfil else "Atleta",
                "filial_id": atleta_perfil.get("filial_id", "dojo-central") if atleta_perfil else "dojo-central",
                "filial_nome": atleta_perfil.get("filial_nome", "Dojo Central") if atleta_perfil else "Dojo Central",
                "faixa_atual": atleta_perfil.get("faixa", "Branca") if atleta_perfil else "Branca",
                "graduacao_pretendida": data.get("graduacao_pretendida", "Amarela"),
                "status": "pendente",
                "autorizacao_tecnica": True if user.get("tipo") in ["admin", "filial"] else False,
                "pagamento_status": "pendente",
                "dados_banca": {},
                "created_at": created_at_val
            }
            res, error = SupabaseService.insert("candidatos_exame", novo_candidato)
            if error:
                res, error = SupabaseService.insert("candidatos", novo_candidato)

            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 201

    @app.route("/api/exames/candidatos/<id>", methods=["GET", "PATCH", "DELETE"])
    def handle_candidato_actions(id):
        from backend.app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            candidatos, _ = SupabaseService.get_all("candidatos_exame")
            if not candidatos:
                candidatos, _ = SupabaseService.get_all("candidatos")

            cand = next((c for c in (candidatos or []) if str(c["id"]) == id), None)
            if not cand:
                return jsonify({"error": "Candidato não encontrado"}), 404

            exames, _ = SupabaseService.get_all("exames")
            exame = next((ex for ex in (exames or []) if str(ex["id"]) == cand.get("exame_id")), None)

            examinador_nome = "Banca Examinadora"
            if cand.get("avaliado_por"):
                prof, _ = SupabaseService.get_profile_by_id(cand.get("avaliado_por"))
                if prof:
                    examinador_nome = prof.get("nome", examinador_nome)

            return jsonify({
                "candidato": cand,
                "exame": exame,
                "examinador_nome": examinador_nome
            }), 200

        elif request.method == "PATCH":
            data = request.json or {}

            candidatos, _ = SupabaseService.get_all("candidatos_exame")
            tabela = "candidatos_exame"
            if not candidatos:
                tabela = "candidatos"
                candidatos, _ = SupabaseService.get_all("candidatos")

            res, error = SupabaseService.update(tabela, id, data)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            if "status" in data:
                registrar_log_auditoria(
                    user,
                    "Avaliação de Candidato",
                    f"Candidato {res.get('atleta_nome')} (ID: {res.get('atleta_id')}) status de exame atualizado para {data.get('status')} (Graduação pretendida: {res.get('graduacao_pretendida')})"
                )

            if data.get("status") == "aprovado":
                atleta_perfil, _ = SupabaseService.update("atletas", res.get("atleta_id"), {
                    "faixa": res.get("graduacao_pretendida", "Amarela")
                })
                SupabaseService.update("profiles", res.get("atleta_id"), {
                    "faixa": res.get("graduacao_pretendida", "Amarela")
                })

            if data.get("status") in ["aprovado", "reprovado"] or "avaliado_por" in data:
                distribuir_proximos_fila(res.get("exame_id"))

            return jsonify(res), 200

        elif request.method == "DELETE":
            candidatos, _ = SupabaseService.get_all("candidatos_exame")
            tabela = "candidatos_exame"
            if not candidatos:
                tabela = "candidatos"
                candidatos, _ = SupabaseService.get_all("candidatos")

            cand = next((c for c in (candidatos or []) if str(c["id"]) == id), None)
            exame_id = cand.get("exame_id") if cand else None

            res, error = SupabaseService.delete(tabela, id)
            if error:
                return jsonify({"error": error}), 500

            if exame_id:
                distribuir_proximos_fila(exame_id)

            return jsonify({"sucesso": True}), 200

    @app.route("/api/exames/<id>", methods=["GET", "PATCH"])
    def handle_exame_detail(id):
        from backend.app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            exames, error = SupabaseService.get_all("exames")
            if error:
                return jsonify({"error": error}), 500

            exame = next((ex for ex in (exames or []) if str(ex["id"]) == id), None)
            if not exame:
                return jsonify({"error": "Exame não encontrado"}), 404

            vinculos, _ = SupabaseService.get_all("examinadores_exame", filter_dict={"exame_id": id})
            examinadores_ids = [v["examinador_id"] for v in (vinculos or [])]

            candidatos, _ = SupabaseService.get_all("candidatos_exame", filter_dict={"exame_id": id})
            if not candidatos:
                candidatos, _ = SupabaseService.get_all("candidatos", filter_dict={"exame_id": id})

            return jsonify({
                "exame": exame,
                "examinadores_ids": examinadores_ids,
                "candidatos": candidatos or []
            }), 200

        elif request.method == "PATCH":
            if user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            res, error = SupabaseService.update("exames", id, data)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Edição de Exame",
                f"Exame de faixa (ID: {id}) atualizado. Status: {data.get('status', 'Sem alteração de status')}"
            )

            if data.get("status") == "em_andamento":
                distribuir_proximos_fila(id)

            return jsonify(res), 200

    @app.route("/api/exames/<id>/examinadores", methods=["POST"])
    def vincular_examinadores(id):
        from backend.app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        data = request.json or {}
        examinador_ids = data.get("examinador_ids", [])

        ex_existentes, _ = SupabaseService.get_all("examinadores_exame", filter_dict={"exame_id": id})
        for ee in (ex_existentes or []):
            SupabaseService.delete("examinadores_exame", ee["id"])

        for ex_id in examinador_ids:
            SupabaseService.insert("examinadores_exame", {
                "exame_id": id,
                "examinador_id": ex_id
            })

        return jsonify({"success": True}), 200

    @app.route("/api/exames/<id>/certificados", methods=["POST"])
    def emitir_certificados_exame(id):
        from backend.app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        candidatos, _ = SupabaseService.get_all("candidatos_exame", filter_dict={"exame_id": id})
        if not candidatos:
            candidatos, _ = SupabaseService.get_all("candidatos", filter_dict={"exame_id": id})

        if not candidatos:
            return jsonify({"error": "Nenhum candidato localizado."}), 404

        aprovados = [c for c in candidatos if c.get("status") == "aprovado"]
        if not aprovados:
            return jsonify({"error": "Nenhum candidato aprovado para emitir certificados."}), 400

        certificados_existentes, _ = SupabaseService.get_all("certificados")
        atletas_com_cert = set(c.get("atleta_id") for c in (certificados_existentes or []))

        count = 0
        for c in aprovados:
            if c["atleta_id"] not in atletas_com_cert:
                import hashlib
                import time
                hash_code = hashlib.md5(f"{c['atleta_id']}-{time.time()}".encode()).hexdigest()[:12].upper()

                SupabaseService.insert("certificados", {
                    "atleta_id": c["atleta_id"],
                    "codigo_validacao": hash_code,
                    "data_emissao": datetime.utcnow().date().isoformat() if 'datetime' in globals() else "2026-06-08"
                })
                count += 1

        return jsonify({"success": True, "emitidos": count}), 200

    @app.route("/api/examinadores", methods=["GET"])
    def get_examinadores():
        profiles, error = SupabaseService.get_all("profiles")
        if error:
            return jsonify({"error": error}), 500
        examinadores = [p for p in (profiles or []) if p.get("tipo") in ["admin", "filial"]]
        return jsonify({"examinadores": examinadores}), 200

def distribuir_proximos_fila(exame_id):
    """Distribui os próximos candidatos na fila para um exame específico"""
    # Obter candidatos para o exame
    candidatos_exame, _ = SupabaseService.get_all("candidatos_exame", filter_dict={"exame_id": exame_id})
    if not candidatos_exame:
        candidatos_exame, _ = SupabaseService.get_all("candidatos", filter_dict={"exame_id": exame_id})
    
    if not candidatos_exame:
        return
    
    # Filtrar candidatos que ainda não foram avaliados (status != "aprovado" e != "reprovado")
    candidatos_pendentes = [
        c for c in (candidatos_exame or []) 
        if c.get("status") not in ["aprovado", "reprovado"]
    ]
    
    if not candidatos_pendentes:
        return
    
    # Ordenar por data de criação (mais antigo primeiro)
    candidatos_pendentes.sort(key=lambda x: x.get("created_at", ""))
    
    # Atualizar o primeiro candidato pendente para "em_andamento"
    primeiro_pendente = candidatos_pendentes[0]
    tabela = "candidatos_exame" if "exame_id" in primeiro_pendente else "candidatos"
    
    # Atualizar o status para em_andamento
    SupabaseService.update(tabela, primeiro_pendente["id"], {
        "status": "em_andamento"
    })
