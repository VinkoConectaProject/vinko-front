export interface User {
  id: string;
  email: string;
  password: string;
  type: 'professional' | 'client';
  createdAt: Date;
  isActive: boolean;
}

// Tipos genéricos para respostas da API
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  error: string;
  data: T;
}

export interface ApiError {
  status: 'error';
  message: string;
  error: string;
  data: null;
}

// Novos tipos para a API Django REST
export interface DjangoUser {
  id: number;
  password: string;
  last_login: string | null;
  is_superuser: boolean;
  username: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  created_at: string;
  updated_at: string;
  email: string;
  is_email_verified: boolean;
  full_name: string | null;
  birth_date: string | null;
  telephone: string | null;
  cellphone: string | null;
  business_email: string | null;
  postal_code: string | null;
  cep: string | null;
  city: string | null;
  uf: string | null;
  neighborhood: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  company_size: string | null;
  cnpj: string | null;
  cpf: string | null;
  corporate_name: string | null;
  trade_name: string | null;
  corporate_cep: string | null;
  company_cep: string | null;
  corporate_street: string | null;
  corporate_number: string | null;
  corporate_complement: string | null;
  company_neighborhood: string | null;
  company_city: string | null;
  company_uf: string | null;
  company_street: string | null;
  company_number: string | null;
  company_complement: string | null;
  corporate_city: string | null;
  corporate_uf: string | null;
  company_email: string | null;
  professional_description: string | null;
  user_type: string; // Agora é uma string: 'CLIENTE' ou 'PROFISSIONAL'
  professional_experience: string | null;
  specialty: string | null;
  availability: number | null;
  availability_id: number | null;
  services: number[];
  services_ids: number[];
  services_areas: number[];
  areas: number[];
  areas_ids: number[];
  specialties: number[];
  specialtie_ids: number[];
  machines: number[];
  machines_ids: number[];
  tecid_type: string | null;
  year_experience: string | null;
  daily_production_capacity: string | null;
  min_required_production: string | null;
  max_required_production: string | null;
  groups: any[];
  user_permissions: any[];
  offered_services: any[];
}

export interface JWTToken {
  refresh: string;
  access: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: DjangoUser;
  token: JWTToken;
}

export interface LoginResponse {
  status: string;
  message: string;
  error: string;
  data: {
    user: DjangoUser;
    token: JWTToken;
  };
}

export interface TokenApiResponse extends ApiResponse<TokenResponse> {}
export interface AuthApiResponse extends ApiResponse<AuthResponse> {}
export interface LoginApiResponse extends ApiResponse<LoginResponse> {}

export interface UserType {
  id: number;
  name: string;
}

export interface UserTypesApiResponse extends ApiResponse<UserType[]> {}

export interface RegisterRequest {
  email: string;
  password: string;
  password2: string;
  user_type: string; // Agora é uma string: 'CLIENTE' ou 'PROFISSIONAL'
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface EmailVerificationRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  code: string;
  password: string;
  password2: string;
}

export interface PasswordResetValidateRequest {
  code: string;
}

export interface RegisterResponse {
  message: string;
}

export interface RegisterApiResponse extends ApiResponse<{ user: DjangoUser }> {}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  name: string;
  services: string[];
  specialty: string;
  city: string;
  uf: string;
  portfolio: string[];
  availability: 'available' | 'busy' | 'unavailable';
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
  };
  description: string;
  experience: string;
  rating: number;
  completedJobs: number;
  createdAt: Date;
  isApproved: boolean;
}

export interface ClientProfile {
  id: string;
  userId: string;
  name: string;
  company?: string;
  city: string;
  uf: string;
  contact: {
    phone: string;
    email: string;
  };
  createdAt: Date;
}

// Tipos para profissionais interessados
export interface InterestedProfessional {
  id: number;
  services: number[];
  areas: number[];
  work_count: number;
  password: string;
  last_login: string | null;
  is_superuser: boolean;
  username: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  created_at: string;
  updated_at: string;
  user_type: string;
  email: string;
  full_name: string;
  is_email_verified: boolean;
  is_user_test: boolean;
  birth_date: string;
  cellphone: string | null;
  postal_code: string;
  city: string;
  uf: string;
  neighborhood: string;
  street: string;
  number: string;
  complement: string;
  company_size: string;
  cnpj: string;
  cpf: string;
  corporate_name: string;
  trade_name: string;
  company_cep: string;
  company_city: string;
  company_uf: string;
  company_neighborhood: string;
  company_street: string;
  company_number: string;
  company_complement: string | null;
  company_cellphone: string | null;
  company_email: string;
  tecid_type: string | null;
  year_experience: number | null;
  daily_production_capacity: number | null;
  min_required_production: number | null;
  max_required_production: number | null;
  rating_avg: number;
  rating_count: number;
  about_me: string | null;
  availability: number | null;
  groups: any[];
  user_permissions: any[];
  specialties: number[];
  machines: number[];
}

// Tipos para demandas do backend
export interface BackendDemand {
  id: number;
  user_cellphone?: string;
  user_full_name?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  title: string;
  description: string;
  amount: number;
  tecid_type: "AMBOS" | "MALHA" | "PLANO";
  deadline: string;
  city: string;
  uf: string;
  min_budget: string;
  max_budget: string;
  remote_work_accepted: boolean;
  status: "ABERTA" | "EM ANDAMENTO" | "CONCLUIDA";
  user_created: number;
  availability: number;
  service: number;
  area: number;
  specialty: number;
  chosen_professional: number | null;
  interested_professionals: InterestedProfessional[];
  service_name?: string;
  specialty_name?: string;
  area_name?: string;
  availability_name?: string;
}

export interface DemandsApiResponse {
  status: 'success' | 'error';
  message: string;
  error: string;
  data: {
    total: number;
    abertas: number;
    em_andamento: number;
    concluidas: number;
    results: BackendDemand[];
  };
}

// Tipos para criação de demandas
export interface CreateDemandRequest {
  title: string;
  description: string;
  amount: number;
  availability: number;
  service: number;
  area: number;
  specialty: number;
  tecid_type: "AMBOS" | "MALHA" | "PLANO";
  deadline: string | null;
  city: string;
  uf: string;
  min_budget: number;
  max_budget: number;
  remote_work_accepted: boolean;
}

export interface UpdateDemandRequest {
  title?: string;
  description?: string;
  amount?: number;
  availability?: number;
  service?: number;
  area?: number;
  specialty?: number;
  tecid_type?: "AMBOS" | "MALHA" | "PLANO";
  deadline?: string | null;
  city?: string;
  uf?: string;
  min_budget?: number;
  max_budget?: number;
  remote_work_accepted?: boolean;
  chosen_professional?: number | null;
  status?: "ABERTA" | "EM ANDAMENTO" | "CONCLUIDA";
}

export interface CreateDemandApiResponse extends ApiResponse<BackendDemand> {}
export interface UpdateDemandApiResponse extends ApiResponse<BackendDemand> {}
export interface DeleteDemandApiResponse extends ApiResponse<null> {}

// Interface para compatibilidade com o frontend atual
export interface Demand {
  id: string;
  clientId: string;
  title: string;
  description: string;
  serviceType: string;
  deadline: Date | null;
  budget: {
    min: number;
    max: number;
  };
  location: {
    city: string;
    state: string;
    isRemote: boolean;
  };
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  attachments: string[];
  interestedProfessionals: InterestedProfessional[];
  selectedProfessional?: string;
  createdAt: Date;
  updatedAt: Date;
  // Novos campos adicionados
  area?: string;
  specialty?: string;
  tecidType?: "AMBOS" | "MALHA" | "PLANO";
  amount?: number;
  availability?: string;
  // Campos do backend preservados
  user_cellphone?: string;
  user_full_name?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_demand' | 'new_interest' | 'selected' | 'removed' | 'completed' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  demandId?: string;
}

export interface Rating {
  id: string;
  demandId: string;
  clientId: string;
  professionalId: string;
  stars: number; // 1-5
  comment: string;
  createdAt: Date;
}

export interface AppState {
  currentUser: User | null;
  djangoUser: DjangoUser | null;
  users: User[];
  professionalProfiles: ProfessionalProfile[];
  clientProfiles: ClientProfile[];
  demands: Demand[];
  notifications: Notification[];
  conversations: Conversation[];
  messages: Message[];
  ratings: Rating[];
  isLoading: boolean;
  authLoading: boolean;
  authError: string | null;
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
  demandId?: string; // Optional: if conversation started from a demand
  isArchived?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
}

// Tipos para a API de busca de profissionais
export interface ProfessionalSearchResult {
  id: number;
  full_name: string;
  services: string[];
  areas: string[];
  specialties: string[];
  tecid_type: string;
  availability: number;
  uf: string;
  city: string;
  email: string;
  cellphone?: string;
  telephone?: string;
  company_cellphone?: string;
  about_me?: string;
  year_experience?: string;
  rating_avg: number;
  rating_count: number;
}