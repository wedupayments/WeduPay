import fc from 'fast-check';
import { exportService } from './export.service';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    exportJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    asyncTask: {
      create: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
    settlement: {
      findMany: jest.fn(),
    },
    paymentLink: {
        findMany: jest.fn(),
    }
  },
}));

// Mock ExcelJS and json2csv
jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    addWorksheet: jest.fn().mockReturnValue({
      columns: [],
      addRows: jest.fn(),
      addRow: jest.fn(),
    }),
    xlsx: {
      writeFile: jest.fn().mockResolvedValue(true),
    },
  })),
}));

jest.mock('json2csv', () => ({
  Parser: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockReturnValue('mock,csv,data'),
  })),
}));

// Mock fs
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    statSync: jest.fn().mockReturnValue({ size: 1024 }),
    unlinkSync: jest.fn(),
  };
});

const mockPrisma = prisma as any;

describe('ExportService Property-based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an export job and an associated async task', async () => {
    mockPrisma.exportJob.create.mockResolvedValue({ id: 'job-1' } as any);
    mockPrisma.asyncTask.create.mockResolvedValue({ id: 'task-1' } as any);

    await exportService.createExportJob('tenant-1', 'user-1', 'TRANSACTIONS', 'CSV', {});

    expect(mockPrisma.exportJob.create).toHaveBeenCalled();
    expect(mockPrisma.asyncTask.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            type: 'EXPORT_GENERATION',
            payload: JSON.stringify({ jobId: 'job-1' }),
        })
    }));
  });

  it('should apply filters correctly when fetching data for export', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          status: fc.option(fc.constantFrom('SUCCESS', 'FAILED')),
          dateFrom: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })),
        }),
        async (filters) => {
          mockPrisma.exportJob.findUnique.mockReset();
          mockPrisma.transaction.findMany.mockReset();
          
          mockPrisma.exportJob.findUnique.mockResolvedValue({
            id: 'job-1',
            type: 'TRANSACTIONS',
            format: 'CSV',
            tenantId: 'tenant-1',
            filters: filters
          } as any);
          
          mockPrisma.exportJob.update.mockResolvedValue({} as any);
          mockPrisma.transaction.findMany.mockResolvedValue([]);

          await exportService.processExportJob('job-1');

          expect(mockPrisma.transaction.findMany).toHaveBeenCalled();
          const call = mockPrisma.transaction.findMany.mock.calls[0][0];
          
          if (filters.status) {
              expect(call.where.status).toBe(filters.status);
          }
          if (filters.dateFrom) {
              const expectedTime = new Date(filters.dateFrom).getTime();
              const receivedTime = new Date(call.where.createdAt.gte).getTime();
              expect(receivedTime).toBe(expectedTime);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
