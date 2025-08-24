# Sistema de Autenticação JWT - Vinko

## Visão Geral

O sistema de autenticação do Vinko utiliza JWT (JSON Web Tokens) para gerenciar sessões de usuário de forma segura e eficiente.

## Componentes Principais

### 1. AuthService (`src/services/authService.ts`)
- Gerencia tokens de acesso e refresh
- Implementa login, registro e verificação de email
- Controla expiração de tokens
- Fornece métodos para salvar e limpar tokens

### 2. useAuth Hook (`src/hooks/useAuth.ts`)
- Hook React para gerenciar estado de autenticação
- Implementa verificação automática de tokens
- Gerencia renovação automática de tokens
- Controla logout e limpeza de dados

### 3. BaseApiService (`src/services/baseApiService.ts`)
- Intercepta requisições HTTP
- Renova tokens automaticamente quando expiram
- Gerencia fila de requisições durante renovação
- Faz logout automático quando refresh falha

## Fluxo de Autenticação

### Login
1. Usuário fornece email e senha
2. Sistema valida credenciais na API
3. API retorna access token e refresh token
4. Tokens são salvos no localStorage
5. Usuário é redirecionado para dashboard

### Renovação Automática
1. Sistema verifica expiração a cada 5 minutos
2. Quando access token expira, refresh token é usado
3. Novo access token é obtido automaticamente
4. Usuário permanece logado sem interrupção

### Logout
1. Usuário clica em "Sair"
2. Todos os tokens são removidos
3. Dados locais são limpos
4. Usuário é redirecionado para página inicial

## Segurança

### Tokens
- **Access Token**: Vida útil curta (configurável)
- **Refresh Token**: Vida útil longa para renovação
- Tokens são armazenados em localStorage (HTTPS obrigatório)

### Verificações
- Validação de email obrigatória
- Verificação de expiração automática
- Logout automático em caso de falha

## Configuração

### Variáveis de Ambiente
```typescript
// src/config/api.ts
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'vinko_access_token',
  REFRESH_TOKEN_KEY: 'vinko_refresh_token',
  ACCESS_TOKEN_LIFETIME: 15 * 60 * 1000, // 15 minutos
};
```

### Endpoints da API
```typescript
export const API_CONFIG = {
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login/',
      REGISTER: '/auth/register/',
      VERIFY_EMAIL: '/auth/verify-email/',
      TOKEN_REFRESH: '/auth/token/refresh/',
      // ... outros endpoints
    }
  }
};
```

## Uso

### Componente de Logout
```tsx
import { LogoutButton } from '../UI/LogoutButton';

// Variações disponíveis
<LogoutButton variant="default" />     // Botão completo
<LogoutButton variant="minimal" />     // Botão minimalista
<LogoutButton variant="text" />        // Apenas texto
```

### Hook useAuth
```tsx
import { useAuth } from '../hooks/useAuth';

const { user, login, logout, isAuthenticated } = useAuth();

// Verificar se está logado
if (isAuthenticated) {
  // Usuário autenticado
}

// Fazer logout
const handleLogout = () => {
  logout();
};
```

## Tratamento de Erros

### Token Expirado
1. Sistema detecta expiração
2. Tenta renovar automaticamente
3. Se falhar, faz logout automático
4. Usuário é redirecionado para login

### Refresh Token Expirado
1. Sistema detecta falha na renovação
2. Limpa todos os dados de sessão
3. Redireciona para página inicial
4. Exibe mensagem de sessão expirada

## Monitoramento

### Logs
- Renovação automática de tokens
- Falhas na renovação
- Logouts automáticos
- Erros de autenticação

### Métricas
- Tempo de vida dos tokens
- Taxa de renovação bem-sucedida
- Frequência de logouts automáticos

## Boas Práticas

1. **Sempre usar HTTPS** em produção
2. **Configurar tempo de vida** apropriado para tokens
3. **Implementar rate limiting** na API
4. **Monitorar** tentativas de renovação
5. **Logar** eventos de segurança importantes

## Troubleshooting

### Problema: Usuário é deslogado frequentemente
**Solução**: Verificar configuração de tempo de vida dos tokens

### Problema: Tokens não são renovados
**Solução**: Verificar endpoint de refresh e configuração da API

### Problema: Logout não funciona
**Solução**: Verificar se todos os dados estão sendo limpos corretamente
