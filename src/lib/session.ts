import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'frontier_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export class SessionConfigurationError extends Error {
  constructor() {
    super('Session security is not configured. Set SESSION_SECRET before using private APIs.');
    this.name = 'SessionConfigurationError';
  }
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new SessionConfigurationError();
  }
  return secret;
}

function sign(sessionId: string): string {
  return createHmac('sha256', getSecret()).update(sessionId).digest('base64url');
}

function isValidCookie(value: string): boolean {
  const separator = value.lastIndexOf('.');
  if (separator <= 0) return false;
  const sessionId = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = sign(sessionId);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export interface SessionContext {
  id: string;
  isNew: boolean;
}

export function getSession(req: NextRequest): SessionContext {
  const value = req.cookies.get(SESSION_COOKIE)?.value;
  if (value && isValidCookie(value)) {
    return { id: value.slice(0, value.lastIndexOf('.')), isNew: false };
  }

  return { id: randomUUID(), isNew: true };
}

export function attachSessionCookie(response: NextResponse | Response, session: SessionContext): void {
  if (!session.isNew) return;
  const cookie = `${SESSION_COOKIE}=${session.id}.${sign(session.id)}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
  response.headers.append('Set-Cookie', cookie);
}
