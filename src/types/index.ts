export interface User {
  id: string;
  email: string;
  password: string;
  type: 'professional' | 'client';
  createdAt: Date;
  isActive: boolean;
}

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
  type: 'new_demand' | 'new_interest' | 'selected' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  professionalProfiles: ProfessionalProfile[];
  clientProfiles: ClientProfile[];
  demands: Demand[];
  notifications: Notification[];
  conversations: Conversation[];
  messages: Message[];
  isLoading: boolean;
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