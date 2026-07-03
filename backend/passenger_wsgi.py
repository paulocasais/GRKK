import sys
import os

# Adiciona o diretório atual ao path de busca do Python
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ----------------------------------------------------------------------
# AUTO-CORRETOR DE DEPLOY (HostGator Environment Fixer)
# Como o Passenger WSGI roda direto pelo Python do cPanel, ele não sofre
# com shebang quebrado (CRLF). Usamos isso para limpar automaticamente
# as quebras de linha CRLF (\r\n) dos scripts CGI que rodam via Apache.
# ----------------------------------------------------------------------
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    scripts_to_fix = ['index.fcgi', 'diagnostico.fcgi']
    
    for script_name in scripts_to_fix:
        script_path = os.path.join(current_dir, script_name)
        if os.path.exists(script_path):
            # 1. Corrige as quebras de linha CRLF (\r\n -> \n)
            with open(script_path, 'rb') as f:
                raw_data = f.read()
            
            if b'\r\n' in raw_data:
                clean_data = raw_data.replace(b'\r\n', b'\n')
                with open(script_path, 'wb') as f:
                    f.write(clean_data)
                
            # 2. Garante a permissão exata 755 (rwxr-xr-x) exigida pelo Apache
            os.chmod(script_path, 0o755)
except Exception as fixer_error:
    # Registra o erro silenciosamente para não quebrar a inicialização do app
    pass

# Importa o app Flask como 'application' que é o padrão exigido pelo Passenger WSGI na HostGator
from app import app as application
