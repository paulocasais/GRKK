import sys
import os

# Adiciona o diretório atual ao path de busca do Python
sys.path.insert(0, os.path.dirname(__file__))

# Importa o app Flask como 'application' que é o padrão exigido pelo Passenger WSGI na HostGator
from app import app as application
