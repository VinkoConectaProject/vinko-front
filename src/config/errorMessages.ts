// Configuração de mensagens de erro amigáveis para o usuário
export const ERROR_MESSAGES = {
  // Erros de comunicação
  API_INVALID_FORMAT: 'Erro de comunicação com o servidor. Tente novamente.',
  API_UNEXPECTED_STATUS: 'Erro inesperado. Tente novamente.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
  REQUEST_TIMEOUT: 'Tempo limite excedido. Tente novamente.',
  FETCH_FAILED: 'Erro de conexão. Verifique sua internet e tente novamente.',
  
  // Erros HTTP
  BAD_REQUEST: 'Dados inválidos. Verifique as informações fornecidas.',
  UNAUTHORIZED: 'Credenciais inválidas. Verifique seu email e senha.',
  FORBIDDEN: 'Acesso negado. Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  CONFLICT: 'Conflito. Este email já está em uso.',
  UNPROCESSABLE_ENTITY: 'Dados inválidos. Verifique as informações fornecidas.',
  TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
  INTERNAL_SERVER_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível. Tente novamente.',
  
  // Erros genéricos
  UNEXPECTED_ERROR: 'Erro inesperado. Tente novamente.',
  TECHNICAL_ERROR: 'Erro de comunicação. Tente novamente.',
  
  // Erros específicos de validação
  INVALID_EMAIL: 'Email inválido. Verifique o formato.',
  INVALID_PASSWORD: 'Senha inválida. Verifique os requisitos.',
  PASSWORDS_DONT_MATCH: 'As senhas não conferem.',
  PASSWORD_TOO_SHORT: 'A senha deve ter pelo menos 6 caracteres.',
  REQUIRED_FIELD: 'Este campo é obrigatório.',
  INVALID_CODE: 'Código inválido. Verifique e tente novamente.',
  
  // Erros de autenticação
  EMAIL_NOT_VERIFIED: 'Email não verificado. Verifique sua caixa de entrada.',
  INVALID_CREDENTIALS: 'Email ou senha incorretos.',
  ACCOUNT_LOCKED: 'Conta bloqueada. Entre em contato com o suporte.',
  SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
  
  // Erros de operação
  OPERATION_FAILED: 'Operação falhou. Tente novamente.',
  UPLOAD_FAILED: 'Falha no upload. Tente novamente.',
  DELETE_FAILED: 'Falha ao excluir. Tente novamente.',
  UPDATE_FAILED: 'Falha ao atualizar. Tente novamente.',
} as const;

// Mapeamento de mensagens técnicas para amigáveis
export const TECHNICAL_TO_FRIENDLY_MESSAGES: Record<string, string> = {
  'Resposta da API em formato inválido': ERROR_MESSAGES.API_INVALID_FORMAT,
  'Status de resposta inesperado da API': ERROR_MESSAGES.API_UNEXPECTED_STATUS,
  'Erro na requisição': ERROR_MESSAGES.NETWORK_ERROR,
  'Network Error': ERROR_MESSAGES.NETWORK_ERROR,
  'Failed to fetch': ERROR_MESSAGES.FETCH_FAILED,
  'Request timeout': ERROR_MESSAGES.REQUEST_TIMEOUT,
  'Internal Server Error': ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
  'Bad Request': ERROR_MESSAGES.BAD_REQUEST,
  'Unauthorized': ERROR_MESSAGES.UNAUTHORIZED,
  'Forbidden': ERROR_MESSAGES.FORBIDDEN,
  'Not Found': ERROR_MESSAGES.NOT_FOUND,
  'Conflict': ERROR_MESSAGES.CONFLICT,
  'Unprocessable Entity': ERROR_MESSAGES.UNPROCESSABLE_ENTITY,
  'Too Many Requests': ERROR_MESSAGES.TOO_MANY_REQUESTS,
  'Service Unavailable': ERROR_MESSAGES.SERVICE_UNAVAILABLE,
  '400': ERROR_MESSAGES.BAD_REQUEST,
  '401': ERROR_MESSAGES.UNAUTHORIZED,
  '403': ERROR_MESSAGES.FORBIDDEN,
  '404': ERROR_MESSAGES.NOT_FOUND,
  '409': ERROR_MESSAGES.CONFLICT,
  '422': ERROR_MESSAGES.UNPROCESSABLE_ENTITY,
  '429': ERROR_MESSAGES.TOO_MANY_REQUESTS,
  '500': ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
  '502': ERROR_MESSAGES.SERVICE_UNAVAILABLE,
  '503': ERROR_MESSAGES.SERVICE_UNAVAILABLE,
};

// Função para sanitizar mensagens de erro
export const sanitizeErrorMessage = (message: string): string => {
  // Verificar se a mensagem está no mapeamento
  for (const [technical, friendly] of Object.entries(TECHNICAL_TO_FRIENDLY_MESSAGES)) {
    if (message.toLowerCase().includes(technical.toLowerCase())) {
      return friendly;
    }
  }

  // Verificar se contém palavras técnicas
  const technicalKeywords = ['api', 'fetch', 'request', 'response', 'http', 'status', 'error'];
  const hasTechnicalKeywords = technicalKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  if (hasTechnicalKeywords) {
    return ERROR_MESSAGES.TECHNICAL_ERROR;
  }

  // Se não for técnica, retornar a mensagem original
  return message;
};
