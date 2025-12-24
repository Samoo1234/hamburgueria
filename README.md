# Sistema de Hamburgueria

## Visão Geral
Este é um sistema completo para gerenciamento de uma hamburgueria, que inclui tanto pedidos online quanto atendimento presencial com garçons utilizando dispositivos portáteis.

## Funcionalidades

### Módulo Online
- Cardápio digital
- Carrinho de compras
- Finalização de pedidos
- Acompanhamento de status

### Módulo de Atendimento Presencial
- Interface para dispositivos portáteis (tablets/smartphones)
- Seleção de mesa
- Registro de pedidos pelo garçom
- Envio direto para a cozinha
- Controle de status dos pedidos
- Fechamento de conta

## Tecnologias Utilizadas
- Frontend: React.js
- Backend: Node.js com Express
- Banco de Dados: MongoDB
- Comunicação em tempo real: Socket.io

## Instalação

```bash
# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install

# Instalar dependências do módulo de garçom
cd ../garcom-app
npm install
```

## Executando o Projeto

```bash
# Iniciar o backend
cd backend
npm start

# Iniciar o frontend (em outro terminal)
cd frontend
npm start

# Iniciar o módulo de garçom (em outro terminal)
cd garcom-app
npm start
```

## Acesso
- Aplicação Web: http://localhost:3000
- Aplicação do Garçom: http://localhost:3001
- API Backend: http://localhost:5000