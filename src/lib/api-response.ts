export interface ApiResponse<T> {
  data: T;
  links?: {
    self: string;
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
  };
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    traceId?: string;
  };
}

export interface CreatedResponse<T> {
  data: T;
  links: {
    self: string;
    resource: string;
  };
}

export interface DeletedResponse {
  deleted: boolean;
  id: string;
}

export interface UpdatedResponse<T> {
  data: T;
  updated: boolean;
}

export function createApiResponse<T>(
  data: T,
  request: Request,
  options?: {
    page?: number;
    perPage?: number;
    total?: number;
  }
): ApiResponse<T> {
  const url = new URL(request.url);
  const { page = 1, perPage = 20, total = 0 } = options || {};

  const totalPages = Math.ceil(total / perPage);
  const baseUrl = `${url.protocol}//${url.host}/api/v1${url.pathname.replace("/api/v1", "")}`;

  const links: ApiResponse<T>["links"] = {
    self: `${baseUrl}?page=${page}&perPage=${perPage}`,
    first: `${baseUrl}?page=1&perPage=${perPage}`,
    last: `${baseUrl}?page=${totalPages}&perPage=${perPage}`,
  };

  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&perPage=${perPage}`;
  }

  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&perPage=${perPage}`;
  }

  return {
    data,
    links,
    meta: {
      page,
      perPage,
      total,
      totalPages,
    },
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, string[]>,
  statusCode = 400
): { body: ErrorResponse; status: number } {
  return {
    body: {
      error: {
        code,
        message,
        details,
        traceId: crypto.randomUUID(),
      },
    },
    status: statusCode,
  };
}
