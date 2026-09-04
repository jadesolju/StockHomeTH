import { z } from 'zod';

export const UserRoleSchema = z.enum(['member', 'developer', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const SubscriptionPlanSchema = z.enum(['free', 'pro', 'team']);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export const UserAuthDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema.default('member'),
  plan: SubscriptionPlanSchema.default('free'),
  subscriptionStatus: z.enum(['active', 'trial', 'inactive', 'canceled']).default('active'),
  createdAt: z.string(),
  provider: z.string().default('password'),
});
export type UserAuthData = z.infer<typeof UserAuthDataSchema>;

export const ApiKeyItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  key: z.string().min(10),
  tier: z.enum(['Starter', 'Pro', 'Enterprise']),
  rateLimit: z.string(),
  requestsThisMonth: z.number(),
  maxMonthlyRequests: z.number(),
  createdAt: z.string(),
  status: z.enum(['active', 'revoked']),
});
export type ApiKeyItem = z.infer<typeof ApiKeyItemSchema>;
