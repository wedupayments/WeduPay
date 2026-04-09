import { NextResponse } from "next/server";
import { webhookService } from "@/services/webhook.service";
import { createErrorResponse } from "@/lib/api-response";

export class WebhookController {
  async listEndpoints(request: Request, tenantId: string) {
    try {
      const endpoints = await webhookService.listEndpoints(tenantId);
      return NextResponse.json({
        success: true,
        data: endpoints,
      });
    } catch (error: any) {
      console.error("[WebhookController] listEndpoints error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }

  async getEndpoint(request: Request, id: string, tenantId: string) {
    try {
      const endpoint = await webhookService.getEndpoint(id);
      if (!endpoint || endpoint.tenantId !== tenantId) {
        return NextResponse.json(
          createErrorResponse("NOT_FOUND", "Webhook endpoint not found").body,
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: endpoint,
      });
    } catch (error: any) {
      console.error("[WebhookController] getEndpoint error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }

  async createEndpoint(request: Request, tenantId: string, userId: string) {
    try {
      const body = await request.json();
      const { url, events, description } = body;

      if (!url || !events || !events.length) {
        return NextResponse.json(
          createErrorResponse("VALIDATION_ERROR", "URL and events are required").body,
          { status: 400 }
        );
      }

      const endpoint = await webhookService.createEndpoint(
        tenantId,
        userId,
        url,
        description,
        events
      );

      return NextResponse.json({
        success: true,
        endpoint,
      }, { status: 201 });
    } catch (error: any) {
      console.error("[WebhookController] createEndpoint error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }

  async updateEndpoint(request: Request, id: string, tenantId: string) {
    try {
      const body = await request.json();
      const endpoint = await webhookService.updateEndpoint(id, tenantId, body);

      return NextResponse.json({
        success: true,
        data: endpoint,
      });
    } catch (error: any) {
      console.error("[WebhookController] updateEndpoint error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }

  async deleteEndpoint(request: Request, id: string, tenantId: string) {
    try {
      await webhookService.deleteEndpoint(id, tenantId);
      return NextResponse.json({
        success: true,
        message: "Webhook endpoint deleted",
      });
    } catch (error: any) {
      console.error("[WebhookController] deleteEndpoint error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }

  async regenerateSecret(request: Request, id: string, tenantId: string) {
    try {
      const result = await webhookService.regenerateSecret(id, tenantId);
      return NextResponse.json({
        success: true,
        secret: result.secretKey,
      });
    } catch (error: any) {
      console.error("[WebhookController] regenerateSecret error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }
}

export const webhookController = new WebhookController();
