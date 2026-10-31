import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attachSessionCookie, getSession, SessionConfigurationError } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    const where = { ownerId: session.id };
    const totalRequests = await prisma.usageLog.count({ where });

    if (totalRequests === 0) {
      const response = NextResponse.json({
        totalRequests: 0,
        totalTokens: 0,
        avgLatencyMs: 0,
        successRate: 0,
        successfulRequests: 0,
        failedRequests: 0,
        cancelledRequests: 0,
        liveRequests: 0,
        simulatedRequests: 0,
        mostUsedModel: 'None yet',
        modelDistribution: [],
      });
      attachSessionCookie(response, session);
      return response;
    }

    const [aggregateData, successCount, failedCount, cancelledCount, liveCount, simulationCount, logs] = await Promise.all([
      prisma.usageLog.aggregate({
        where: { ...where, status: 'success' },
        _sum: { totalTokens: true },
        _avg: { latencyMs: true },
      }),
      prisma.usageLog.count({ where: { ...where, status: 'success' } }),
      prisma.usageLog.count({ where: { ...where, status: 'error' } }),
      prisma.usageLog.count({ where: { ...where, status: 'cancelled' } }),
      prisma.usageLog.count({ where: { ...where, executionMode: 'live' } }),
      prisma.usageLog.count({ where: { ...where, executionMode: 'simulation' } }),
      prisma.usageLog.findMany({
        where,
        select: { modelName: true },
      }),
    ]);

    // Calculate most used model
    const modelCounts: Record<string, number> = {};
    for (const log of logs) {
      modelCounts[log.modelName] = (modelCounts[log.modelName] || 0) + 1;
    }

    const sortedModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]);
    const mostUsedModel = sortedModels[0] ? sortedModels[0][0] : 'None';

    const modelDistribution = sortedModels.slice(0, 5).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalRequests) * 100),
    }));

    const response = NextResponse.json({
      totalRequests,
      totalTokens: aggregateData._sum.totalTokens || 0,
      avgLatencyMs: Math.round(aggregateData._avg.latencyMs || 0),
      successRate: Math.round((successCount / totalRequests) * 100),
      successfulRequests: successCount,
      failedRequests: failedCount,
      cancelledRequests: cancelledCount,
      liveRequests: liveCount,
      simulatedRequests: simulationCount,
      mostUsedModel,
      modelDistribution,
    });
    attachSessionCookie(response, session);
    return response;
  } catch (error: any) {
    if (error instanceof SessionConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('Failed to calculate stats:', error);
    return NextResponse.json(
      { error: 'Failed to compute usage stats.' },
      { status: 500 }
    );
  }
}
