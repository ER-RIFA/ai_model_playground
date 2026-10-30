import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const model = searchParams.get('model')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') || '15', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

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

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Failed to retrieve history logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve usage history logs.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await prisma.usageLog.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: 'Record deleted.' });
    }

    // Clear all history
    const deleteCount = await prisma.usageLog.deleteMany({});
    return NextResponse.json({
      success: true,
      message: `Cleared ${deleteCount.count} history entries.`,
    });
  } catch (error: any) {
    console.error('Failed to delete history log:', error);
    return NextResponse.json(
      { error: 'Failed to delete record.' },
      { status: 500 }
    );
  }
}
