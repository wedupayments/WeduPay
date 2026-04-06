import type { User, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  protected readonly model = prisma.user;

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findBySupabaseId(supabaseUserId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { supabaseUserId } });
  }

  async createWithSupabase(data: {
    email: string;
    phoneNumber: string;
    country: string;
    supabaseUserId: string;
  }): Promise<User> {
    return prisma.user.create({
      data: { ...data, kycStatus: "pending" },
    });
  }
}
