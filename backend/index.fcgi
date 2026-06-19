#!/usr/bin/scl enable rh-python35 -- /home/CONTA/.virtualenv/bin/python
import os
import sys

# ----------------------------------------------------------------------
# CONFIGURAÇÃO DE CAMINHOS DO HOSTGATOR
# Substitua "CONTA" pelo seu usuário cPanel
# Substitua "PASTA_DO_SITE" pelo caminho da sua pasta (ex: public_html/api)
# ----------------------------------------------------------------------
CONTA = "CONTA"
PASTA_DO_SITE = "PASTA_DO_SITE"

# Adiciona o diretório do backend ao PATH do Python
sys.path.insert(0, f"/home/{CONTA}/{PASTA_DO_SITE}")

from flup.server.fcgi import WSGIServer
from app import app

if __name__ == '__main__':
    # Roda o Flask como um servidor WSGI sobre FastCGI (FCGI)
    WSGIServer(app).run()
