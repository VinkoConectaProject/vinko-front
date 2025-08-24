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
  birth_date: string | null;
  telephone: string | null;
  cellphone: string | null;
  business_email: string | null;
  postal_code: string | null;
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
  professional_description: string | null;
  user_type: number;
  professional_experience: string | null;
  specialty: string | null;
  availability: string | null;
  groups: any[];
  user_permissions: any[];
  offered_services: any[];
}

export interface JWTToken {
  refresh: string;
  access: string;
}

export interface AuthResponse {
  user: DjangoUser;
  token: JWTToken;
}

export interface AuthApiResponse extends ApiResponse<AuthResponse> {}

export interface UserType {
  id: number;
  name: string;
}

export interface UserTypesApiResponse extends ApiResponse<UserType[]> {}

export interface RegisterRequest {
  email: string;
  password: string;
  password2: string;
  user_type_id: number;
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
  state: string;
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
  state: string;
  contact: {
    phone: string;
    email: string;
  };
  createdAt: Date;
}

export interface Demand {
  id: string;
  clientId: string;
  title: string;
  description: string;
  serviceType: string;
  deadline: Date;
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
  interestedProfessionals: string[];
  selectedProfessional?: string;
  createdAt: Date;
  updatedAt: Date;
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