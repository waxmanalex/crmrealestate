import { api } from './axios';
import { Client, Property, Deal, Task, DashboardMetrics, PaginatedResponse, DealStage } from '../types';

// --- Auth ---
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  getUsers: () => api.get<{ id: string; name: string; email: string; role: string }[]>('/auth/users'),
};

// --- Clients ---
export interface ClientFilters {
  search?: string;
  status?: string;
  leadSource?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export const clientsApi = {
  getAll: (filters?: ClientFilters) =>
    api.get<PaginatedResponse<Client>>('/clients', { params: filters }),
  getOne: (id: string) => api.get<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => api.post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => api.put<Client>(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  getActivities: (id: string) => api.get(`/clients/${id}/activities`),
  addActivity: (id: string, data: { type: string; content: string }) =>
    api.post(`/clients/${id}/activities`, data),
};

// --- Properties ---
export interface PropertyFilters {
  search?: string;
  status?: string;
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
  page?: number;
  limit?: number;
}

export const propertiesApi = {
  getAll: (filters?: PropertyFilters) =>
    api.get<PaginatedResponse<Property>>('/properties', { params: filters }),
  getOne: (id: string) => api.get<Property>(`/properties/${id}`),
  create: (data: Partial<Property>) => api.post<Property>('/properties', data),
  update: (id: string, data: Partial<Property>) => api.put<Property>(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  uploadPhotos: (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    return api.post(`/properties/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletePhoto: (propertyId: string, photoId: string) =>
    api.delete(`/properties/${propertyId}/photos/${photoId}`),
};

// --- Deals ---
export interface DealFilters {
  stage?: DealStage;
  assignedTo?: string;
  clientId?: string;
  groupBy?: 'stage';
  page?: number;
  limit?: number;
}

export const dealsApi = {
  getAll: (filters?: DealFilters) => api.get<any>('/deals', { params: filters }),
  getKanban: () => api.get<Record<DealStage, Deal[]>>('/deals', { params: { groupBy: 'stage' } }),
  getOne: (id: string) => api.get<Deal>(`/deals/${id}`),
  create: (data: Partial<Deal>) => api.post<Deal>('/deals', data),
  update: (id: string, data: Partial<Deal>) => api.put<Deal>(`/deals/${id}`, data),
  updateStage: (id: string, data: { stage: DealStage; lostReason?: string }) =>
    api.patch<Deal>(`/deals/${id}/stage`, data),
  delete: (id: string) => api.delete(`/deals/${id}`),
};

// --- Tasks ---
export interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  due?: 'today' | 'overdue' | 'upcoming';
  relatedClientId?: string;
  relatedDealId?: string;
  page?: number;
  limit?: number;
}

export const tasksApi = {
  getAll: (filters?: TaskFilters) =>
    api.get<PaginatedResponse<Task>>('/tasks', { params: filters }),
  getOne: (id: string) => api.get<Task>(`/tasks/${id}`),
  create: (data: Partial<Task>) => api.post<Task>('/tasks', data),
  update: (id: string, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// --- Dashboard ---
export const dashboardApi = {
  getMetrics: (period?: number) =>
    api.get<DashboardMetrics>('/dashboard/metrics', { params: { period } }),
};
