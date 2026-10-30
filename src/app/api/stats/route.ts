import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalRequests = await prisma.usageLog.count();

    if (totalRequests === 0) {
      return NextResponse.json({
        totalRequests: 0,
        totalTokens: 0,
        avgLatencyMs: 0,
        successRate: 100,
        mostUsedModel: 'None yet',
        modelDistribution: [],
      });
    }

    const [aggregateData, successCount, logs] = await Promise.all([
      prisma.usageLog.aggregate({
        _sum: { totalTokens: true },
        _avg: { latencyMs: true },
      }),
      prisma.usageLog.count({
        where: { status: 'success' },
      }),
      prisma.usageLog.findMany({
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

    return NextResponse.json({
      totalRequests,
      totalTokens: aggregateData._sum.totalTokens || 0,
      avgLatencyMs: Math.round(aggregateData._avg.latencyMs || 0),
      successRate: Math.round((successCount / totalRequests) * 100),
      mostUsedModel,
      modelDistribution,
    });
  } catch (error: any) {
    console.error('Failed to calculate stats:', error);
    return NextResponse.json(
      { error: 'Failed to compute usage stats.' },
      { status: 500 }
    );
  }
}
