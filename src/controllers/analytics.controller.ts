import { NextResponse } from "next/server";
import { analyticsService } from "@/services/analytics.service";
import { createErrorResponse } from "@/lib/api-response";

export class AnalyticsController {
  async getSummary(request: Request, tenantId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get("period") || "30d";

      const summary = await analyticsService.getDashboardSummary(tenantId, period);

      return NextResponse.json({ success: true, data: summary });
    } catch (error: any) {
      console.error("[AnalyticsController] getSummary error:", error);
      return NextResponse.json(createErrorResponse("INTERNAL_ERROR", error.message).body, { status: 500 });
    }
  }

  async getRevenue(request: Request, tenantId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get("period") || "30d";

      const revenue = await analyticsService.getRevenueStats(tenantId, period);

      return NextResponse.json({ success: true, data: revenue });
    } catch (error: any) {
      console.error("[AnalyticsController] getRevenue error:", error);
      return NextResponse.json(createErrorResponse("INTERNAL_ERROR", error.message).body, { status: 500 });
    }
  }

  async getTransactionVolume(request: Request, tenantId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get("period") || "30d";

      const volume = await analyticsService.getTransactionVolume(tenantId, period);

      return NextResponse.json({ success: true, data: volume });
    } catch (error: any) {
      console.error("[AnalyticsController] getTransactionVolume error:", error);
      return NextResponse.json(createErrorResponse("INTERNAL_ERROR", error.message).body, { status: 500 });
    }
  }

  async getPaymentMethods(request: Request, tenantId: string) {
    try {
      const distribution = await analyticsService.getPaymentMethodDistribution(tenantId);

      return NextResponse.json({ success: true, distribution }, {
        headers: { "Cache-Control": "private, max-age=300" },
      });
    } catch (error: any) {
      console.error("[AnalyticsController] getPaymentMethods error:", error);
      return NextResponse.json(createErrorResponse("INTERNAL_ERROR", error.message).body, { status: 500 });
    }
  }

  async getRevenueOverTime(request: Request, tenantId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const timeframe = (searchParams.get("timeframe") || "DAILY") as "DAILY" | "WEEKLY" | "MONTHLY";

      const revenue = await analyticsService.getRevenueOverTime(tenantId, timeframe);

      return NextResponse.json({ success: true, revenue }, {
        headers: { "Cache-Control": "private, max-age=300" },
      });
    } catch (error: any) {
      console.error("[AnalyticsController] getRevenueOverTime error:", error);
      return NextResponse.json(createErrorResponse("INTERNAL_ERROR", error.message).body, { status: 500 });
    }
  }

  async getGeography(request: Request, tenantId: string) {
    try {
      const distribution = await analyticsService.getGeographicDistribution(tenantId);

      return NextResponse.json({ success: true, distribution }, {
        headers: { "Cache-Control": "private, max-age=300" },
      });
    } catch (error: any) {
      console.error("[AnalyticsController] getGeography error:", error);
      return NextResponse.json(createErrorResponse("INTERNAL_ERROR", error.message).body, { status: 500 });
    }
  }

  async getSuccessRate(request: Request, tenantId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const timeframe = (searchParams.get("timeframe") || "DAILY") as "DAILY" | "WEEKLY" | "MONTHLY";

      const trend = await analyticsService.getSuccessRateTrend(tenantId, timeframe);

      return NextResponse.json({ success: true, trend }, {
        headers: { "Cache-Control": "private, max-age=300" },
      });
    } catch (error: any) {
      console.error("[AnalyticsController] getSuccessRate error:", error);
      return NextResponse.json(createErrorResponse("INTERNAL_ERROR", error.message).body, { status: 500 });
    }
  }
}

export const analyticsController = new AnalyticsController();
