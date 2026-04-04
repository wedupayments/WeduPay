import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cardService } from "@/services/card.service";
import { createErrorResponse } from "@/lib/api-response";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

const updateCardSchema = z.object({
  status: z.enum(["ACTIVE", "FROZEN", "CANCELLED"]),
});

function mapValidationErrors(errors: z.ZodIssue[]) {
  return errors.map((error) => ({
    code: error.code,
    target: error.path.join(".") || "body",
    message: error.message,
  }));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(_request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }
    const userId = auth.userId!;

    const { id } = await params;
    const card = await cardService.getCard(id, userId);

    if (!card) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", "Card not found", undefined, 404).body,
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error("Get card error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", "Failed to load card", undefined, 500).body,
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }
    const userId = auth.userId!;

    const body = await request.json();
    const validation = updateCardSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Invalid card update request", mapValidationErrors(validation.error.errors), 400).body,
        { status: 400 }
      );
    }

    const { id } = await params;
    const updatedCard = await cardService.updateCardStatus(id, userId, validation.data.status);

    if (!updatedCard) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", "Card not found", undefined, 404).body,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      card: updatedCard,
      message: `Card ${validation.data.status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Update card error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", "Failed to update card", undefined, 500).body,
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(_request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }
    const userId = auth.userId!;

    const { id } = await params;
    const deleted = await cardService.deleteCard(id, userId);

    if (!deleted) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", "Card not found", undefined, 404).body,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Card cancelled successfully",
    });
  } catch (error) {
    console.error("Delete card error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", "Failed to cancel card", undefined, 500).body,
      { status: 500 }
    );
  }
}
