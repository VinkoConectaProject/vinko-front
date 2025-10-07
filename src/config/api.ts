export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_HOST || 'http://localhost:8000/api/v1',
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
