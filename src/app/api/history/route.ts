import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attachSessionCookie, getSession, SessionConfigurationError } from '@/lib/session';
import { consumeRateLimit, getClientAddress } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    const rateLimit = consumeRateLimit(`history:${getClientAddress(req)}`, 120, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many history requests. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const model = searchParams.get('model')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') || '15', 10)));
    const skip = (page - 1) * limit;

    const where: {
      ownerId: string;
      OR?: Array<Record<string, { contains: string }>>;
      modelId?: string;
      status?: string;
    } = { ownerId: session.id };

    if (search) {
      where.OR = [
        { prompt: { contains: search } },
        { response: { contains: search } },
        { modelName: { contains: search } },
      ];
    }

    if (model && model !== 'all') {
      where.modelId = model;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const [logs, total] = await Promise.all([
      prisma.usageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.usageLog.count({ where }),
    ]);

    const response = NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
    attachSessionCookie(response, session);
    return response;
  } catch (error: any) {
    if (error instanceof SessionConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('Failed to retrieve history logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve usage history logs.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSession(req);
    const rateLimit = consumeRateLimit(`history-delete:${getClientAddress(req)}`, 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many delete requests. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const record = await prisma.usageLog.findFirst({
        where: { id, ownerId: session.id },
        select: { id: true },
      });
      if (!record) {
        return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
      }
      await prisma.usageLog.delete({ where: { id: record.id } });
      const response = NextResponse.json({ success: true, message: 'Record deleted.' });
      attachSessionCookie(response, session);
      return response;
    }

    const deleteCount = await prisma.usageLog.deleteMany({ where: { ownerId: session.id } });
    const response = NextResponse.json({
      success: true,
      message: `Cleared ${deleteCount.count} history entries.`,
    });
    attachSessionCookie(response, session);
    return response;
  } catch (error: any) {
    if (error instanceof SessionConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('Failed to delete history log:', error);
    return NextResponse.json(
      { error: 'Failed to delete record.' },
      { status: 500 }
    );
  }
}
