from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_relatorio_routes(app: Flask):
    """Cria e registra as rotas de relatórios gerenciais (exclusivo para administradores)"""

    @app.route("/api/relatorios/geral", methods=["GET"])
    def relatorio_geral():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        # 1. Obter Atletas
        atletas, _ = SupabaseService.get_all("atletas")
        atletas = atletas or []
        total_atletas = len(atletas)
        atletas_ativos = len([a for a in atletas if a.get("status") not in ["pendente", "cancelado"]])

        # 2. Obter Filiais
        filiais, _ = SupabaseService.get_all("filiais")
        total_filiais = len(filiais or [])

        # 3. Financeiro
        faturas, _ = SupabaseService.get_all("financeiro")
        faturas = faturas or []
        faturamento_total = sum(float(f.get("valor", 0)) for f in faturas if f.get("status") == "pago")
        faturamento_pendente = sum(float(f.get("valor", 0)) for f in faturas if f.get("status") in ["pendente", "atrasado"])

        # 4. Exames
        candidatos, _ = SupabaseService.get_all("candidatos_exame")
        if not candidatos:
            candidatos, _ = SupabaseService.get_all("candidatos")
        candidatos = candidatos or []
        
        aprovados = len([c for c in candidatos if c.get("status") == "aprovado"])
        avaliados = len([c for c in candidatos if c.get("status") in ["aprovado", "reprovado"]])
        taxa_aprovacao = (aprovados / avaliados * 100) if avaliados > 0 else 100.0

        return jsonify({
            "total_atletas": total_atletas,
            "atletas_ativos": atletas_ativos,
            "total_filiais": total_filiais,
            "faturamento_total": faturamento_total,
            "faturamento_pendente": faturamento_pendente,
            "taxa_aprovacao_exames": round(taxa_aprovacao, 2)
        }), 200

    @app.route("/api/relatorios/financeiro", methods=["GET"])
    def relatorio_financeiro():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        faturas, _ = SupabaseService.get_all("financeiro")
        faturas = faturas or []

        # Filtro de data
        data_inicio = request.args.get("data_inicio")
        data_fim = request.args.get("data_fim")
        if data_inicio:
            faturas = [f for f in faturas if f.get("data_vencimento") >= data_inicio]
        if data_fim:
            faturas = [f for f in faturas if f.get("data_vencimento") <= data_fim]

        receita_por_tipo = {}
        cobrancas_por_status = {}

        for f in faturas:
            tipo = f.get("tipo", "outro")
            status = f.get("status", "pendente")
            valor = float(f.get("valor", 0))

            # Faturamento por tipo (somente se pago)
            if status == "pago":
                receita_por_tipo[tipo] = receita_por_tipo.get(tipo, 0) + valor

            # Cobranças por status
            if status not in cobrancas_por_status:
                cobrancas_por_status[status] = {"quantidade": 0, "total": 0.0}
            cobrancas_por_status[status]["quantidade"] += 1
            cobrancas_por_status[status]["total"] += valor

        # Ordena faturas recentes por vencimento decrescente e pega as 10 últimas
        faturas_recentes = sorted(faturas, key=lambda x: x.get("data_vencimento", ""), reverse=True)[:10]

        return jsonify({
            "receita_por_tipo": receita_por_tipo,
            "cobrancas_por_status": cobrancas_por_status,
            "receitas_recentes": faturas_recentes
        }), 200

    @app.route("/api/relatorios/atletas", methods=["GET"])
    def relatorio_atletas():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        atletas, _ = SupabaseService.get_all("atletas")
        atletas = atletas or []

        # Carregar nomes de filiais para mapeamento
        filiais, _ = SupabaseService.get_all("filiais")
        profiles, _ = SupabaseService.get_all("profiles")
        
        nome_filial_map = {}
        for f in (filiais or []):
            prof = next((p for p in (profiles or []) if p["id"] == f["id"]), None)
            if prof:
                nome_filial_map[f["id"]] = prof.get("nome_fantasia") or prof.get("nome") or "Dojo"

        por_faixa = {}
        por_filial = {}

        for a in atletas:
            faixa = a.get("faixa", "Branca")
            profile = next((p for p in (profiles or []) if p["id"] == a["id"]), None)
            filial_id = profile.get("filial_id") if profile else None
            filial_nome = nome_filial_map.get(filial_id, "Sem Filial / Dojo Central") if filial_id else "Dojo Central"

            por_faixa[faixa] = por_faixa.get(faixa, 0) + 1
            por_filial[filial_nome] = por_filial.get(filial_nome, 0) + 1

        return jsonify({
            "por_faixa": por_faixa,
            "por_filial": por_filial
        }), 200

    @app.route("/api/relatorios/exames", methods=["GET"])
    def relatorio_exames():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        exames, _ = SupabaseService.get_all("exames")
        candidatos, _ = SupabaseService.get_all("candidatos_exame")
        if not candidatos:
            candidatos, _ = SupabaseService.get_all("candidatos")

        exames = exames or []
        candidatos = candidatos or []

        total_exames = len(exames)
        exames_por_status = {}
        for ex in exames:
            status = ex.get("status", "rascunho")
            exames_por_status[status] = exames_por_status.get(status, 0) + 1

        # Agrupar aprovações por faixa-alvo
        aprovacoes_por_faixa = {}
        for c in candidatos:
            faixa_alvo = c.get("graduacao_pretendida", "Amarela")
            status = c.get("status", "pendente")

            if faixa_alvo not in aprovacoes_por_faixa:
                aprovacoes_por_faixa[faixa_alvo] = {"aprovados": 0, "total": 0}
            
            if status in ["aprovado", "reprovado"]:
                aprovacoes_por_faixa[faixa_alvo]["total"] += 1
                if status == "aprovado":
                    aprovacoes_por_faixa[faixa_alvo]["aprovados"] += 1

        taxa_por_faixa = {}
        for faixa, dados in aprovacoes_por_faixa.items():
            total = dados["total"]
            aprovados = dados["aprovados"]
            taxa_por_faixa[faixa] = round((aprovados / total * 100), 2) if total > 0 else 100.0

        return jsonify({
            "total_exames": total_exames,
            "exames_por_status": exames_por_status,
            "taxa_aprovacao_por_faixa": taxa_por_faixa,
            "total_inscricoes_exames": len(candidatos)
        }), 200
