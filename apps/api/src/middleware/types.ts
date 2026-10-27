export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  xp: number;
  level: number;
  theme: string;
}

export interface AuthRequest {
  user?: AuthUser;
  [key: string]: any;
}

export class HttpError extends Error {
  statusCode: number;
  body: { error: { code: string; message: string; details?: unknown } };
  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.body = { error: { code, message, ...(details ? { details } : {}) } };
  }
}

export function requireAuth(request: AuthRequest): void {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Token de acesso necessario");
  }
}

export function assertOwnership(request: AuthRequest, resourceUserId: string): void {
  requireAuth(request);
  if (request.user!.id !== resourceUserId) {
    throw new HttpError(403, "FORBIDDEN", "Este recurso pertence a outro usuario");
  }
}
