import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

# Tenta importar a biblioteca do Gemini de forma segura para nao crashar o startup
has_gemini_sdk = False
try:
    import google.generativeai as genai
    has_gemini_sdk = True
except ImportError:
    genai = None

# Recupera a chave da API do Gemini das variáveis de ambiente
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

has_gemini = False
if has_gemini_sdk and GEMINI_API_KEY and "sua-chave-api" not in GEMINI_API_KEY and GEMINI_API_KEY.strip() != "":
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        has_gemini = True
        print("SDK do Gemini configurado com sucesso (Modelo gratuito).")
    except Exception as e:
        print(f"Erro ao configurar o SDK do Gemini: {e}")

# Carrega o glossário em português se disponível
GLOSSARY_PATH = os.path.join(os.path.dirname(__file__), "glossary_pt.json")
GLOSSARY = {}
if os.path.exists(GLOSSARY_PATH):
    try:
        with open(GLOSSARY_PATH, "r", encoding="utf-8") as f:
            GLOSSARY = json.load(f)
        print(f"Glossario carregado com sucesso ({len(GLOSSARY)} termos).")
    except Exception as e:
        print(f"Erro ao carregar glossario em portugues: {e}")

def save_glossary():
    """Salva o estado atual do glossário em memória de volta para o arquivo JSON"""
    try:
        with open(GLOSSARY_PATH, "w", encoding="utf-8") as f:
            json.dump(GLOSSARY, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Erro ao salvar o glossario: {e}")
        return False

def get_all_terms():
    """Retorna o glossário completo"""
    return GLOSSARY

def add_or_update_term(term, definition):
    """Adiciona ou atualiza um termo no glossário (em memória e no arquivo)"""
    term_key = term.strip().lower()
    GLOSSARY[term_key] = definition.strip()
    save_glossary()
    return {term_key: GLOSSARY[term_key]}

def remove_term(term):
    """Remove um termo do glossário (em memória e no arquivo)"""
    term_key = term.strip().lower()
    if term_key in GLOSSARY:
        del GLOSSARY[term_key]
        save_glossary()
        return True
    return False

# Base de conhecimento baseada em regras para fallback offline / sem chave
FALLBACK_RESPONSES = {
    "sanchin": "Sanchin (Três Batalhas) é o Kata fundamental do Goju-Ryu. Ele foca na respiração ibuki, postura estável (Sanchin-dachi) e fortalecimento corporal através de contração isométrica rígida (Go).",
    "tensho": "Tensho (Mãos Rotativas) é o Kata que complementa o Sanchin no Goju-Ryu. Criado pelo Mestre Chojun Miyagi, foca na suavidade (Ju), movimentos circulares de mão aberta e respiração profunda e suave.",
    "origem": "O Karate Goju-Ryu foi fundado pelo Mestre Chojun Miyagi em Okinawa, Japão, no início do século XX. Miyagi combinou técnicas tradicionais de Okinawa (Naha-te) com estilos chineses de Kung Fu (como o Estilo da Garça Branca).",
    "fundador": "O fundador do Karate Goju-Ryu foi o Sensei Chojun Miyagi (1888-1953). Ele herdou os ensinamentos do Sensei Kanryo Higaonna e batizou o estilo com base no poema chinês Kempo Hakku (Os Oito Preceitos do Boxe).",
    "criador": "O fundador do Karate Goju-Ryu foi o Sensei Chojun Miyagi (1888-1953). Ele herdou os ensinamentos do Sensei Kanryo Higaonna e batizou o estilo com base no poema chinês Kempo Hakku (Os Oito Preceitos do Boxe).",
    "goju": "Goju-Ryu significa estilo da força (Go) e da suavidade (Ju). 'Go' representa o ataque direto, a firmeza e o bloqueio rígido. 'Ju' representa o desvio circular, as esquivas, agarres e a flexibilidade.",
    "diferença de go e ju": "No Goju-Ryu, o 'Go' (força) e o 'Ju' (suavidade) são complementares. O 'Go' é visto no Kata Sanchin (força rígida, tensionada), enquanto o 'Ju' é visto no Kata Tensho (suavidade circular, flexibilidade). O praticante deve equilibrar ambos os aspectos.",
    "ibuki": "A respiração Ibuki é a respiração abdominal sonora e profunda característica do Goju-Ryu. Ela serve para canalizar a energia (Ki), estabilizar o core abdominal e absorver impactos no corpo durante o combate.",
    "saifa": "Saifa (Destruir e Esmagar) é o primeiro Kata Kaishugata (avançado de combate) do Goju-Ryu. Ele ensina técnicas rápidas de libertação de agarres, golpes circulares de punho (Uraken) e movimentação ágil.",
    "seiyunchin": "Seiyunchin (Controlar e Puxar) é um Kata longo focado em posturas baixas (Shiko-dachi) e combate de curta distância. Ele não possui chutes, focando inteiramente no equilíbrio, agarres e projeções."
}

def ask_sensei(message_text):
    """
    Função principal para interagir com o Sensei virtual.
    Utiliza o Gemini 1.5 Flash (Gratuito) caso configurado,
    caso contrário recorre à lógica local e ao glossário traduzido.
    """
    if not message_text or message_text.strip() == "":
        return "Olá! Sou o Sensei Virtual. Como posso ajudar você no seu caminho (Do) do Karate Goju-Ryu hoje?"

    # Busca por termos do glossário no texto da mensagem
    matched_terms = {}
    lower_text = message_text.lower()
    
    # Procura correspondências no glossário oficial
    for term, definition in GLOSSARY.items():
        pattern = r"\b" + re.escape(term) + r"\b"
        if re.search(pattern, lower_text) or (len(term) > 4 and term in lower_text):
            matched_terms[term] = definition

    # Se a chave do Gemini estiver configurada e funcional
    if has_gemini:
        try:
            # Prepara o prompt do sistema enriquecido caso tenhamos termos correspondentes
            matched_context = ""
            if matched_terms:
                matched_context = "\n".join([f"- {t.upper()}: {d}" for t, d in matched_terms.items()])

            # Configura o modelo gratuito gemini-1.5-flash
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=(
                    "Você é o Sensei Virtual da Federação de Karatê Goju-Ryu (GRKKK). "
                    "Sua personalidade é sábia, disciplinada, respeitosa e prestativa. "
                    "Responda a perguntas sobre a história, Katas (como Sanchin, Tensho, Saifa), "
                    "princípios (Go e Ju) e regras do Karatê Goju-Ryu tradicional de Okinawa. "
                    "Mantenha suas respostas claras, diretas e sempre em português do Brasil. "
                    "Se o usuário perguntar algo fora do contexto de Karatê ou artes marciais, "
                    "relembre-o cordialmente de manter o foco no Caminho (Dojo-Kun)."
                )
            )
            
            prompt = message_text
            if matched_context:
                prompt += f"\n\n[Referências oficiais da GRKK para guiar sua resposta:\n{matched_context}]"
                
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Erro ao chamar a API do Gemini: {e}. Usando fallback local.")
    
    # Fallback offline baseado no glossário carregado (mais dinâmico e rico)
    if matched_terms:
        res = "Como o Sensei Virtual (modo offline), consultei nosso glossário oficial e encontrei as seguintes definições:\n\n"
        for term, definition in matched_terms.items():
            res += f"• **{term.upper()}**: {definition}\n"
        res += "\nPosso ajudar com mais algum termo ou dúvida sobre os Katas?"
        return res

    # Fallback clássico baseado em palavras-chave se não houver correspondência direta no glossário
    for key, value in FALLBACK_RESPONSES.items():
        if key in lower_text:
            return value

    return (
        f"Interessante sua dúvida sobre '{message_text}'. Como o Sensei Virtual, busco sempre "
        "equilibrar o forte (Go) e o suave (Ju). Experimente me perguntar sobre os Katas "
        "'Sanchin' ou 'Tensho', sobre a 'origem' do estilo ou sobre o significado de 'Goju-Ryu'."
    )
