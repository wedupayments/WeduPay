/**
 * Base Repository
 *
 * Generic typed base for all Prisma-backed repositories.
 * Concrete repositories extend this with their Prisma model delegate.
 *
 * Typing approach:
 * - TModel  — the Prisma-generated model type (e.g. Wallet)
 * - TCreate — the Prisma CreateInput type for that model
 * - TUpdate — the Prisma UpdateInput type for that model (defaults to Partial<TCreate>)
 */

export abstract class BaseRepository<
  TModel,
  TCreate extends Record<string, unknown>,
  TUpdate extends Record<string, unknown> = Partial<TCreate>,
> {
  // Subclasses assign the Prisma model delegate (e.g. prisma.wallet)
  // typed as `unknown` here to avoid circular references with Prisma's generics.
  protected abstract readonly model: {
    findUnique: (args: { where: { id: string } }) => Promise<TModel | null>;
    findMany: (args?: Record<string, unknown>) => Promise<TModel[]>;
    findFirst: (args?: Record<string, unknown>) => Promise<TModel | null>;
    create: (args: { data: TCreate }) => Promise<TModel>;
    update: (args: {
      where: { id: string };
      data: TUpdate;
    }) => Promise<TModel>;
    delete: (args: { where: { id: string } }) => Promise<TModel>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };

  async findById(id: string): Promise<TModel | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findMany(args?: Record<string, unknown>): Promise<TModel[]> {
    return this.model.findMany(args);
  }

  async create(data: TCreate): Promise<TModel> {
    return this.model.create({ data });
  }

  async update(id: string, data: TUpdate): Promise<TModel> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<TModel> {
    return this.model.delete({ where: { id } });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.model.count({ where });
  }
}
