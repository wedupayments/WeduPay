import { prisma } from "@/lib/prisma";

const IDEMPOTENCY_TTL_HOURS = 24;

export interface IdempotencyRecord {
  id: string;
  idempotencyKey: string;
  method: string;
  path: string;
  statusCode: number;
  responseBody: string;
  createdAt: Date;
  expiresAt: Date;
}

export async function getIdempotencyRecord(
  key: string,
  method: string,
  path: string
): Promise<IdempotencyRecord | null> {
  try {
    const record = await prisma.idempotencyRecord.findFirst({
      where: {
        idempotencyKey: key,
        method,
        path,
        expiresAt: { gte: new Date() },
      },
    });
    return record as IdempotencyRecord | null;
  } catch {
    return null;
  }
}

export async function saveIdempotencyRecord(
  key: string,
  method: string,
  path: string,
  statusCode: number,
  responseBody: string
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_TTL_HOURS);

    await prisma.idempotencyRecord.upsert({
      where: {
        idempotencyKey_method_path: { idempotencyKey: key, method, path },
      },
      update: {
        statusCode,
        responseBody,
        createdAt: new Date(),
        expiresAt,
      },
      create: {
        id: crypto.randomUUID(),
        idempotencyKey: key,
        method,
        path,
        statusCode,
        responseBody,
        createdAt: new Date(),
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Failed to save idempotency record:", error);
  }
}

export function extractIdempotencyKey(request: Request): string | null {
  const key = request.headers.get("Idempotency-Key") || 
              request.headers.get("X-Idempotency-Key");
  
  if (!key) return null;

  if (key.length < 16 || key.length > 255) {
    return null;
  }

  return key;
}
