export type Role = 'ADMIN' | 'AGENT';
export type LeadSource = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'REFERRAL' | 'PORTAL' | 'OTHER';
export type ClientStatus = 'NEW' | 'ACTIVE' | 'NOT_INTERESTED' | 'CONVERTED' | 'LOST';
export type PropertyStatus = 'ACTIVE' | 'UNDER_OFFER' | 'RENTED' | 'SOLD' | 'ARCHIVED';
export type Currency = 'ILS' | 'USD';
export type DealStage = 'NEW_LEAD' | 'NEGOTIATION' | 'VIEWING' | 'CONTRACT' | 'CLOSED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type ActivityType = 'NOTE' | 'CALL' | 'MEETING' | 'EMAIL' | 'STAGE_CHANGE' | 'TASK_CREATED' | 'DEAL_CREATED' | 'STATUS_CHANGE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  leadSource?: LeadSource;
  status: ClientStatus;
  assignedTo?: string;
  agent?: User;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { deals: number; tasks: number };
  deals?: Deal[];
  tasks?: Task[];
  activities?: Activity[];
  ownedProperties?: Property[];
}

export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  currency: Currency;
  description?: string;
  status: PropertyStatus;
  rooms?: number;
  sizeSqm?: number;
  floor?: number;
  ownerClientId?: string;
  owner?: { id: string; fullName: string; phone: string };
  photos: PropertyPhoto[];
  createdAt: string;
  updatedAt: string;
  _count?: { deals: number };
}

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  url: string;
}

export interface Deal {
  id: string;
  clientId: string;
  client: { id: string; fullName: string; phone: string; email?: string };
  propertyId?: string;
  property?: { id: string; title: string; address: string; price: number; currency: Currency; photos: PropertyPhoto[] };
  stage: DealStage;
  value?: number;
  probability?: number;
  assignedTo?: string;
  agent?: User;
  nextActionAt?: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
  activities?: Activity[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueAt: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  agent?: User;
  relatedClientId?: string;
  client?: { id: string; fullName: string };
  relatedDealId?: string;
  deal?: { id: string; stage: DealStage };
  relatedPropertyId?: string;
  property?: { id: string; title: string };
  reminderAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  content: string;
  userId?: string;
  user?: { id: string; name: string };
  clientId?: string;
  dealId?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardMetrics {
  period: number;
  newLeads: number;
  dealsByStage: Record<DealStage, number>;
  conversionRate: number;
  overdueTasks: number;
  upcomingTasks: Task[];
  leadSources: { source: LeadSource; count: number }[];
  totalDeals: number;
  closedDeals: number;
  pipelineValue: number;
  recentActivities: Activity[];
}
