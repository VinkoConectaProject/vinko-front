// Obter URL base da API das variáveis de ambiente
// No Vite, variáveis de ambiente devem começar com VITE_ para serem expostas ao cliente
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.API_BASE_URL;
  
  // Se não houver variável de ambiente, usar URL padrão de desenvolvimento
  if (!envUrl) {
    console.warn('⚠️ API_BASE_URL não definida! Usando URL padrão de desenvolvimento.');
    return 'http://localhost:8000/api/v1';
  }
  
  return envUrl;
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/user/login/',
      REGISTER: '/user/register/',
      TOKEN: '/token/',
      TOKEN_REFRESH: '/token/refresh/',
      VERIFY_EMAIL: '/user/email-verification-codes/verify/',
      RESEND_CODE: '/user/email-verification-codes/resend/',
      PASSWORD_RESET: '/user/password-reset/',
      PASSWORD_RESET_CONFIRM: '/user/password-reset-confirm/',
      PASSWORD_RESET_VALIDATE: '/user/password-reset-validate/',
    },
    USER: {
      USERS: '/user/users/',
      USER_BY_ID: '/user/users/me/', // Rota para obter usuário atual
    },
    DEMANDS: {
      DEMANDS: '/demand/demands/',
      DEMAND_FILES: '/demand/demand-files/',
    }
  }
};

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_ID_KEY: 'user_id',
  USER_TYPE_KEY: 'user_type',
  USER_KEY: 'user',
  ACCESS_TOKEN_LIFETIME: 60 * 60 * 1000, // 1 hora em milissegundos
  REFRESH_TOKEN_LIFETIME: 30 * 24 * 60 * 60 * 1000, // 30 dias em milissegundos
};
