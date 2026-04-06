import type { AsyncTask, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export class AsyncTaskRepository extends BaseRepository<
  AsyncTask,
  Prisma.AsyncTaskCreateInput,
  Prisma.AsyncTaskUpdateInput
> {
  protected readonly model = prisma.asyncTask as unknown as {
    findUnique: (args: { where: { id: string } }) => Promise<AsyncTask | null>;
    findMany: (args?: Record<string, unknown>) => Promise<AsyncTask[]>;
    findFirst: (args?: Record<string, unknown>) => Promise<AsyncTask | null>;
    create: (args: { data: Prisma.AsyncTaskCreateInput }) => Promise<AsyncTask>;
    update: (args: { where: { id: string }; data: Prisma.AsyncTaskUpdateInput }) => Promise<AsyncTask>;
    delete: (args: { where: { id: string } }) => Promise<AsyncTask>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };

  async findPending(limit = 10): Promise<AsyncTask[]> {
    return prisma.asyncTask.findMany({
      where: { status: "PENDING", scheduledAt: { lte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: limit,
    });
  }

  async markStarted(id: string): Promise<AsyncTask> {
    return prisma.asyncTask.update({
      where: { id },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
  }

  async markCompleted(id: string, result: string): Promise<AsyncTask> {
    return prisma.asyncTask.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date(), result },
    });
  }

  async markFailed(id: string, error: string): Promise<AsyncTask> {
    const task = await prisma.asyncTask.findUnique({ where: { id } });
    const status =
      task && task.attempts >= task.maxAttempts ? "FAILED" : "PENDING";
    return prisma.asyncTask.update({ where: { id }, data: { status, error } });
  }
}
