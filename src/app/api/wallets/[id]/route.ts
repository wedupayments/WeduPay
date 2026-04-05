import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { walletService } from "@/services";
import { createErrorResponse } from "@/lib/api-response";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

const updateWalletSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
});

function mapValidationErrors(errors: z.ZodIssue[]) {
  return errors.map((error) => ({
    code: error.code,
    target: error.path.join(".") || "body",
    message: error.message,
  }));
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
    const validation = updateWalletSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Invalid wallet update request", mapValidationErrors(validation.error.errors), 400).body,
        { status: 400 }
      );
    }

    const { id } = await params;
    const updatedWallet = await walletService.updateWallet(id, userId, validation.data);

    return NextResponse.json({
      success: true,
      wallet: updatedWallet,
      message: "Wallet updated successfully",
    });
  } catch (error: any) {
    console.error("Update wallet error:", error);
    return NextResponse.json(
      createErrorResponse(
        error.message === "Wallet not found or access denied" ? "NOT_FOUND" : "INTERNAL_ERROR",
        error.message,
        undefined,
        error.message === "Wallet not found or access denied" ? 404 : 500
      ).body,
      { status: error.message === "Wallet not found or access denied" ? 404 : 500 }
    );
  }
}
