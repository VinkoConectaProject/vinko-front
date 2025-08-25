export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api/v1',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/user/login/',
      REGISTER: '/user/register/',
      TOKEN_REFRESH: '/token/refresh/',
      VERIFY_EMAIL: '/user/email-verification-codes/verify/',
      RESEND_CODE: '/user/email-verification-codes/resend/',
      PASSWORD_RESET: '/user/password-reset/',
      PASSWORD_RESET_CONFIRM: '/user/password-reset-confirm/',
      PASSWORD_RESET_VALIDATE: '/user/password-reset-validate/',
    }
  }
};

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'vinko_access_token',
  REFRESH_TOKEN_KEY: 'vinko_refresh_token',
  ACCESS_TOKEN_LIFETIME: 60 * 60 * 1000, // 1 hora em milissegundos
  REFRESH_TOKEN_LIFETIME: 30 * 24 * 60 * 60 * 1000, // 30 dias em milissegundos
};
