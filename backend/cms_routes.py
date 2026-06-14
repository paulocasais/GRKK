from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_cms_routes(app: Flask):
    """Cria e registra as rotas do CMS (conteúdos do site)"""

    @app.route("/api/noticias", methods=["GET", "POST"])
    def manage_noticias():
        from backend.app import get_current_user

        if request.method == "GET":
            publicado = request.args.get("publicado")
            categoria = request.args.get("categoria")

            filter_dict = {}
            if publicado is not None:
                filter_dict["publicado"] = publicado == "true"
            if categoria:
                filter_dict["categoria"] = categoria

            noticias, error = SupabaseService.get_all("noticias", order_by="created_at", ascending=False, filter_dict=filter_dict)
            if error:
                return jsonify({"error": error}), 500

            return jsonify({
                "noticias": noticias,
                "total": len(noticias)
            }), 200

        elif request.method == "POST":
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Acesso não autorizado"}), 403

            body = request.json or {}
            body["autor_id"] = user["id"]

            noticia, error = SupabaseService.insert("noticias", body)
            if error:
                return jsonify({"error": error}), 500

            return jsonify({"noticia": noticia}), 201

    @app.route("/api/noticias/<id>", methods=["PATCH", "DELETE"])
    def gerenciar_noticias_id(id):
        from backend.app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        if request.method == "PATCH":
            data = request.json or {}
            res, error = SupabaseService.update("noticias", id, data)
            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 200

        elif request.method == "DELETE":
            res, error = SupabaseService.delete("noticias", id)
            if error:
                return jsonify({"error": error}), 500
            return jsonify({"sucesso": True}), 200

    @app.route("/api/galeria", methods=["GET"])
    def get_galeria():
        categoria = request.args.get("categoria")
        filter_dict = {}
        if categoria:
            filter_dict["category"] = categoria

        items, error = SupabaseService.get_all("gallery_items", order_by="order", ascending=True, filter_dict=filter_dict)
        if error:
            return jsonify({"error": error}), 500

        return jsonify({"items": items}), 200

    @app.route("/api/equipe", methods=["GET"])
    def get_equipe():
        members, error = SupabaseService.get_all("team_members", order_by="order", ascending=True)
        if error:
            return jsonify({"error": error}), 500

        return jsonify({"members": members}), 200

    @app.route("/api/cms", methods=["GET", "POST"])
    def manage_cms():
        if request.method == "GET":
            banners, _ = SupabaseService.get_all("cms_banners")
            equipe, _ = SupabaseService.get_all("team_members", order_by="order", ascending=True)
            galeria, _ = SupabaseService.get_all("gallery_items", order_by="order", ascending=True)

            return jsonify({
                "banners": banners or [],
                "equipe": equipe or [],
                "galeria": galeria or []
            }), 200

        elif request.method == "POST":
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            tipo_item = data.get("tipo")
            payload = data.get("payload")

            if not tipo_item or not payload:
                return jsonify({"error": "Parâmetros tipo e payload são obrigatórios"}), 400

            tabela = ""
            if tipo_item == "banner":
                tabela = "cms_banners"
            elif tipo_item == "equipe":
                tabela = "team_members"
            elif tipo_item == "galeria":
                tabela = "gallery_items"
            else:
                return jsonify({"error": "Tipo inválido"}), 400

            item_id = payload.get("id")
            if item_id:
                res, error = SupabaseService.update(tabela, item_id, payload)
            else:
                res, error = SupabaseService.insert(tabela, payload)

            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 200

    @app.route("/api/cms/<tipo>/<id>", methods=["DELETE"])
    def delete_cms_item(tipo, id):
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        tabela = ""
        if tipo == "banner":
            tabela = "cms_banners"
        elif tipo == "equipe":
            tabela = "team_members"
        elif tipo == "galeria":
            tabela = "gallery_items"
        else:
            return jsonify({"error": "Tipo inválido"}), 400

        res, error = SupabaseService.delete(tabela, id)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"sucesso": True}), 200
