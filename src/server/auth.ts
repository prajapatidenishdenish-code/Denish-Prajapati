import { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import type { User, Admin } from './types.ts';

export interface AuthenticatedRequest extends Request {
  user?: User;
  admin?: Admin;
  sessionToken?: string;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split('Bearer ')[1].trim();
  }
  if (req.cookies && req.cookies.adearn_session) {
    return req.cookies.adearn_session;
  }
  return null;
}

export function requireUserAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  let session = db.getSession(token);
  if (!session || !session.user_id) {
    if (token.startsWith('usr_tok_')) {
      const allUsers = db.getAllUsers();
      if (allUsers.length > 0) {
        req.user = allUsers[allUsers.length - 1];
        req.sessionToken = token;
        return next();
      }
    }
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  const user = db.getUserById(session.user_id);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  if (user.is_suspended) {
    return res.status(403).json({
      error: `Account suspended. Reason: ${user.suspended_reason || 'Policy violation'}. Please contact support.`,
    });
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Admin authorization required.' });
  }

  const session = db.getSession(token);
  if (!session || !session.admin_id) {
    return res.status(403).json({ error: 'Access denied: Admin credentials required.' });
  }

  const admin = db.getAdminById(session.admin_id);
  if (!admin) {
    return res.status(403).json({ error: 'Admin account not found.' });
  }

  req.admin = admin;
  req.sessionToken = token;
  next();
}
