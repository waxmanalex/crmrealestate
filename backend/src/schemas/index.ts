import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'AGENT']).optional(),
});

// Client
export const createClientSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal('')),
  leadSource: z.enum(['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'REFERRAL', 'PORTAL', 'OTHER']).optional(),
  status: z.enum(['NEW', 'ACTIVE', 'NOT_INTERESTED', 'CONVERTED', 'LOST']).optional(),
  assignedTo: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Property
export const createPropertySchema = z.object({
  title: z.string().min(2),
  address: z.string().min(5),
  price: z.number().positive(),
  currency: z.enum(['ILS', 'USD']).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'UNDER_OFFER', 'RENTED', 'SOLD', 'ARCHIVED']).optional(),
  rooms: z.number().int().positive().optional(),
  sizeSqm: z.number().int().positive().optional(),
  floor: z.number().int().optional(),
  ownerClientId: z.string().uuid().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

// Deal
export const createDealSchema = z.object({
  clientId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  stage: z.enum(['NEW_LEAD', 'NEGOTIATION', 'VIEWING', 'CONTRACT', 'CLOSED']).optional(),
  value: z.number().positive().optional(),
  probability: z.number().min(0).max(100).optional(),
  assignedTo: z.string().uuid().optional(),
  nextActionAt: z.string().datetime().optional(),
  lostReason: z.string().optional(),
});

export const updateDealSchema = createDealSchema.partial();

export const updateDealStageSchema = z.object({
  stage: z.enum(['NEW_LEAD', 'NEGOTIATION', 'VIEWING', 'CONTRACT', 'CLOSED']),
  lostReason: z.string().optional(),
});

// Task
export const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  dueAt: z.string().datetime(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  assignedTo: z.string().uuid().optional(),
  relatedClientId: z.string().uuid().optional(),
  relatedDealId: z.string().uuid().optional(),
  relatedPropertyId: z.string().uuid().optional(),
  reminderAt: z.string().datetime().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

// Activity
export const createActivitySchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'MEETING', 'EMAIL', 'STAGE_CHANGE', 'TASK_CREATED', 'DEAL_CREATED', 'STATUS_CHANGE']),
  content: z.string().min(1),
  clientId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
});
