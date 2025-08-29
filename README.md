# Vinko

Plataforma de conexão entre clientes e profissionais.

## 🚀 Como usar

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm

### Instalação

1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd vinko
```

2. Instale as dependências
```bash
npm install
```

### Executar o projeto

**Desenvolvimento:**
```bash
npm run dev
```
Acesse: http://localhost:5173

**Produção:**
```bash
npm run build
npm run preview
```

### Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Cria build de produção |
| `npm run preview` | Visualiza build de produção |
| `npm run lint` | Verifica qualidade do código |

## 🔧 Configuração

Crie um arquivo `.env` na raiz:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Vinko
``` 
