import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cardService } from "@/services/card.service";
import { createErrorResponse } from "@/lib/api-response";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

const fundCardSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be 3 letters"),
});

function mapValidationErrors(errors: z.ZodIssue[]) {
  return errors.map((error) => ({
    code: error.code,
    target: error.path.join(".") || "body",
    message: error.message,
  }));
}

export async function POST(
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
    const validation = fundCardSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Invalid funding request", mapValidationErrors(validation.error.errors), 400).body,
        { status: 400 }
      );
    }

    const { id } = await params;
    const fundedCard = await cardService.fundCardFromWallet({
      cardId: id,
      userId,
      amount: validation.data.amount,
      currency: validation.data.currency.toUpperCase(),
    });

    if (!fundedCard) {
      return NextResponse.json(
        createErrorResponse(
          "BAD_REQUEST",
          "Unable to fund card. Check your card, balance, and wallet currency.",
          undefined,
          400
        ).body,
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      card: fundedCard,
      message: "Virtual card funded successfully",
    });
  } catch (error) {
    console.error("Fund card error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", "Failed to fund card", undefined, 500).body,
      { status: 500 }
    );
  }
}
