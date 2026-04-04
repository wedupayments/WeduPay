import { NextResponse } from "next/server";
import { cardService } from "@/services/card.service";
import { createErrorResponse } from "@/lib/api-response";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

export async function GET(request: Request) {
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

    const cards = await cardService.getUserCards(userId);

    return NextResponse.json({
      data: cards.map((card) => ({
        id: card.id,
        type: "card",
        attributes: {
          provider: card.provider,
          lastFourDigits: card.lastFourDigits,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
          status: card.status,
          currency: card.currency,
          balance: card.balance,
          limit: card.limit,
          isVirtual: card.isVirtual,
          createdAt: card.createdAt,
        },
      })),
    });
  } catch (error) {
    console.error("List cards error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", "Failed to list cards", undefined, 500).body,
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const { provider, currency, limit } = body;

    if (!provider) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Provider is required", undefined, 400).body,
        { status: 400 }
      );
    }

    const card = await cardService.createCard({
      userId,
      provider,
      currency,
      limit,
    });

    const response = {
      data: {
        id: card.id,
        type: "card",
        attributes: {
          provider: card.provider,
          lastFourDigits: card.lastFourDigits,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
          status: card.status,
          currency: card.currency,
          balance: card.balance,
          limit: card.limit,
          isVirtual: card.isVirtual,
          createdAt: card.createdAt,
        },
        _links: {
          self: { href: `/api/cards/${card.id}` },
        },
      },
      meta: {
        message: "Virtual card created successfully. Card details have been securely stored.",
        warning: "Store card details securely. Full card number is not stored.",
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Create card error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", "Failed to create card", undefined, 500).body,
      { status: 500 }
    );
  }
}
