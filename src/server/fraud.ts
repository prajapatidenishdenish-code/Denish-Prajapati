import { db } from './db.ts';

interface RateLimitEntry {
  count: number;
  firstSeen: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Periodic cleanup of rate limits
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstSeen > 3600000) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

export function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstSeen > windowMs) {
    rateLimitStore.set(key, { count: 1, firstSeen: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export function analyzeSessionAntiFraud(params: {
  userId: number;
  offerId: number;
  ipAddress: string;
  userAgent: string;
  trackingStartedAt: number;
  completionTime: number;
  minimumDurationSec: number;
}): { flagRaised: boolean; reason?: string } {
  const user = db.getUserById(params.userId);
  if (!user) return { flagRaised: false };

  // 1. Completion velocity check: Was the task marked complete impossibly fast?
  // (e.g., a 30s video claimed complete in 2 seconds)
  const durationSec = (params.completionTime - params.trackingStartedAt) / 1000;
  if (params.minimumDurationSec > 5 && durationSec < params.minimumDurationSec * 0.7) {
    db.logFraudFlag(
      params.userId,
      'Abnormally Fast Offer Completion',
      'HIGH',
      `Offer required ${params.minimumDurationSec}s, completed in ${durationSec.toFixed(1)}s from IP ${params.ipAddress}`
    );
    return { flagRaised: true, reason: 'Completed too fast for video/task duration' };
  }

  // 2. High-frequency conversions in short window:
  const recentSessions = db
    .getOfferSessionsByUser(params.userId)
    .filter((s) => s.status === 'COMPLETED' && Date.now() - new Date(s.started_at).getTime() < 300000); // last 5 min

  if (recentSessions.length > 8) {
    db.logFraudFlag(
      params.userId,
      'Rapid Offer Velocity',
      'MEDIUM',
      `User completed ${recentSessions.length} offers in under 5 minutes from IP ${params.ipAddress}`
    );
    return { flagRaised: true, reason: 'High velocity offer completions' };
  }

  // 3. User suspended check
  if (user.is_suspended) {
    return { flagRaised: true, reason: 'Account suspended' };
  }

  return { flagRaised: false };
}
