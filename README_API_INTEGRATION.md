# Integração com API Django REST - VINKO

Este documento descreve a implementação da integração com a API Django REST para o projeto VINKO.

## Configuração

### Endpoints da API
- **Base URL**: `http://localhost:8000/api/v1`
- **Autenticação**: JWT (JSON Web Tokens)
- **Lifetime dos tokens**:
  - Access Token: 1 hora
  - Refresh Token: 30 dias

### Endpoints Disponíveis

#### Autenticação
- `POST /user/register/` - Registro de usuário
- `POST /user/login/` - Login de usuário
- `POST /token/refresh/` - Refresh do access token
- `POST /user/email-verification-codes/verify/` - Verificar código de email
- `POST /user/email-verification-codes/resend/` - Reenviar código de verificação

#### Usuários
- `GET /user/user-types/` - Obter tipos de usuário (cliente/profissional)

## Funcionalidades Implementadas

### 1. Sistema de Autenticação
- ✅ Registro de usuário com seleção de tipo (cliente/profissional)
- ✅ Login com verificação de email
- ✅ Verificação de código de email
- ✅ Reenvio de código de verificação
- ✅ Gerenciamento automático de tokens JWT
- ✅ Refresh automático de tokens expirados

### 2. Componentes Criados
- `EmailVerification` - Tela para verificar código de email
- `MessageBox` - Componente reutilizável para mensagens
- `authService` - Serviço para comunicação com a API
- `useAuth` - Hook personalizado para gerenciar autenticação

### 3. Fluxo de Registro
1. Usuário escolhe tipo (cliente ou profissional)
2. Preenche dados de cadastro
3. Sistema envia dados para API Django
4. API retorna mensagem de sucesso
5. Usuário é redirecionado para tela de verificação
6. Usuário insere código recebido por email
7. Sistema valida código e faz login automático

### 4. Fluxo de Login
1. Usuário insere email e senha
2. Sistema verifica credenciais na API
3. Se email não verificado, redireciona para verificação
4. Se tudo correto, salva tokens e faz login

### 5. Tratamento de Mensagens
- ✅ Prioriza mensagens específicas da API (`message` field)
- ✅ Mensagens genéricas baseadas no status HTTP
- ✅ Mensagens de erro para casos inesperados
- ✅ Componente MessageBox responsivo e consistente
- ✅ Suporte a mensagens longas com quebra automática

## Como Usar

### 1. Registro de Usuário
```typescript
import { useAuth } from './hooks/useAuth';

const { register } = useAuth();

try {
  await register('email@exemplo.com', 'senha123', 'senha123', 'cliente');
  // Redirecionar para verificação de email
} catch (error) {
  // Tratar erro
}
```

### 2. Login
```typescript
import { useAuth } from './hooks/useAuth';

const { login } = useAuth();

try {
  await login('email@exemplo.com', 'senha123');
  // Login bem-sucedido
} catch (error) {
  // Tratar erro
}
```

### 3. Verificação de Email
```typescript
import { useAuth } from './hooks/useAuth';

const { verifyEmail } = useAuth();

try {
  await verifyEmail('email@exemplo.com', '12345');
  // Email verificado, usuário logado
} catch (error) {
  // Tratar erro
}
```

## Estrutura de Arquivos

```
src/
├── components/
│   ├── Auth/
│   │   ├── EmailVerification.tsx    # Tela de verificação
│   │   ├── LoginForm.tsx            # Formulário de login (atualizado)
│   │   └── RegisterForm.tsx         # Formulário de registro (atualizado)
│   └── UI/
│       └── MessageBox.tsx           # Componente de mensagens
├── config/
│   └── api.ts                       # Configuração da API
├── contexts/
│   └── AppContext.tsx               # Contexto da aplicação (atualizado)
├── hooks/
│   └── useAuth.ts                   # Hook de autenticação
├── services/
│   └── authService.ts               # Serviço de autenticação
└── types/
    └── index.ts                     # Tipos TypeScript (atualizado)
```

## Tratamento de Erros

O sistema inclui tratamento robusto de erros:

### Priorização de Mensagens
1. **Mensagem da API**: Se a API retornar um campo `message`, ele é usado
2. **Mensagens Genéricas**: Baseadas no status HTTP (400, 401, 403, etc.)
3. **Mensagens de Fallback**: Para erros inesperados ou de rede

### Mensagens Genéricas por Status
- `400`: Dados inválidos. Verifique as informações fornecidas.
- `401`: Credenciais inválidas. Verifique seu email e senha.
- `403`: Acesso negado. Você não tem permissão para esta ação.
- `404`: Recurso não encontrado.
- `409`: Conflito. Este email já está em uso.
- `422`: Dados inválidos. Verifique as informações fornecidas.
- `429`: Muitas tentativas. Aguarde um momento antes de tentar novamente.
- `500`: Erro interno do servidor. Tente novamente mais tarde.

### Componente MessageBox
- **Responsivo**: Suporte a mensagens longas com quebra automática
- **Consistente**: Visual uniforme em toda a aplicação
- **Tipos**: Success, Error, Info, Warning
- **Ícones**: Ícones visuais para cada tipo de mensagem

## Segurança

- Tokens JWT armazenados no localStorage
- Verificação automática de expiração
- Refresh automático de tokens
- Limpeza automática de dados ao logout
- Validação de entrada em todos os formulários

## Design e Cores

O sistema usa as cores padrão do projeto VINKO:
- **Primária**: Pink (rosa) - `bg-pink-500`, `text-pink-600`
- **Secundária**: Gray (cinza) - `bg-gray-100`, `text-gray-700`
- **Sucesso**: Green (verde) - `bg-green-50`, `text-green-800`
- **Erro**: Red (vermelho) - `bg-red-50`, `text-red-800`
- **Info**: Blue (azul) - `bg-blue-50`, `text-blue-800`
- **Aviso**: Yellow (amarelo) - `bg-yellow-50`, `text-yellow-800`

## Fluxo de Email Não Verificado

### Cenário 1: Login com Email Não Verificado
1. Usuário tenta fazer login
2. API retorna erro: "E-mail não verificado. Por favor, verifique sua caixa de entrada e ative sua conta."
3. Sistema automaticamente redireciona para tela de verificação
4. Usuário pode inserir código ou reenviar

### Cenário 2: Verificação Direta
1. Usuário acessa tela de verificação após registro
2. Insere código recebido por email
3. Sistema valida e faz login automático

## Próximos Passos

Para completar a integração, considere implementar:

1. **Middleware de autenticação** para rotas protegidas
2. **Interceptor HTTP** para incluir tokens automaticamente
3. **Persistência de dados** do usuário logado
4. **Sincronização** com o estado local da aplicação
5. **Tratamento de erros de rede** mais robusto
6. **Testes unitários** para os serviços de autenticação

## Notas Importantes

- A API deve estar rodando em `http://localhost:8000`
- Certifique-se de que o CORS está configurado corretamente no Django
- Os tokens JWT devem seguir o padrão especificado
- A verificação de email é obrigatória para login
- O sistema suporta dois tipos de usuário: cliente e profissional
- Todas as mensagens são responsivas e suportam quebra automática
- O sistema prioriza mensagens específicas da API sobre mensagens genéricas
