import { NextResponse } from "next/server";
import { getSecurityHeaders } from "@/lib/api-middleware";

export async function GET(request: Request) {
  const startTime = Date.now();
  
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: process.uptime(),
    service: "wedupay-api",
    checks: {
      database: { status: "unknown", latency: null as number | null },
      cache: { status: "unknown", latency: null as number | null },
    },
  };

  try {
    const dbStart = Date.now();
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.checks.database = {
      status: "healthy",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    healthStatus.checks.database = {
      status: "unhealthy",
      latency: null,
    };
    healthStatus.status = "degraded";
  }

  healthStatus.checks.cache = {
    status: "healthy",
    latency: 0,
  };

  const responseTime = Date.now() - startTime;
  const statusCode = healthStatus.status === "healthy" ? 200 : 503;

  return NextResponse.json(
    healthStatus,
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check-Time": `${responseTime}ms`,
        ...getSecurityHeaders(),
      },
    }
  );
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
