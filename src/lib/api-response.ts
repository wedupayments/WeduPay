export interface ApiResponse<T> {
  data: T;
  _links?: {
    self: { href: string };
    next?: { href: string };
    prev?: { href: string };
    first?: { href: string };
    last?: { href: string };
  };
  _meta?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      code: string;
      target: string;
      message: string;
    }>;
    traceId?: string;
    timestamp?: string;
  };
}

export interface ResourceResponse<T> {
  data: {
    id: string;
    type: string;
    attributes: T;
    _links?: {
      self: { href: string };
    };
  };
}

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  const baseUrl = `${path}`;
  if (!params) return baseUrl;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function createApiResponse<T>(
  data: T,
  request: Request,
  options?: {
    page?: number;
    perPage?: number;
    total?: number;
    resourceType?: string;
  }
): ApiResponse<T> {
  const url = new URL(request.url);
  const { page = 1, perPage = 20, total = 0 } = options || {};

  const totalPages = Math.ceil(total / perPage);
  const basePath = url.pathname.replace("/api/v1", "") || "/";

  const response: ApiResponse<T> = {
    data,
    _links: {
      self: { href: buildUrl(`/api/v1${basePath}`, { page, perPage }) },
      first: { href: buildUrl(`/api/v1${basePath}`, { page: 1, perPage }) },
      last: { href: buildUrl(`/api/v1${basePath}`, { page: totalPages, perPage }) },
    },
    _meta: {
      page,
      perPage,
      total,
      totalPages,
    },
  };

  if (page > 1) {
    response._links!.prev = { href: buildUrl(`/api/v1${basePath}`, { page: page - 1, perPage }) };
  }

  if (page < totalPages) {
    response._links!.next = { href: buildUrl(`/api/v1${basePath}`, { page: page + 1, perPage }) };
  }

  return response;
}

export function createResourceResponse<T>(
  data: T & { id?: string },
  request: Request,
  resourceType: string,
  options?: { includeLinks?: boolean }
): ResourceResponse<T> {
  const url = new URL(request.url);
  const resourcePath = data.id ? `/api/v1${url.pathname}/${data.id}` : `/api/v1${url.pathname}`;
  
  const response: ResourceResponse<T> = {
    data: {
      id: data.id || "",
      type: resourceType,
      attributes: data,
    },
  };

  if (options?.includeLinks !== false) {
    response.data._links = {
      self: { href: resourcePath },
    };
  }

  return response;
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: Array<{ code: string; target: string; message: string }>,
  statusCode = 400
): { body: ErrorResponse; status: number } {
  return {
    body: {
      error: {
        code,
        message,
        details,
        traceId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    },
    status: statusCode,
  };
}

export function buildLinkHeader(
  request: Request,
  options: { page: number; perPage: number; total: number }
): string {
  const url = new URL(request.url);
  const basePath = url.pathname.replace("/api/v1", "") || "/";
  const { page, perPage, total } = options;
  const totalPages = Math.ceil(total / perPage);

  const links: string[] = [
    `<${buildUrl(`/api/v1${basePath}`, { page, perPage })}>; rel="self"`,
    `<${buildUrl(`/api/v1${basePath}`, { page: 1, perPage })}>; rel="first"`,
    `<${buildUrl(`/api/v1${basePath}`, { page: totalPages, perPage })}>; rel="last"`,
  ];

  if (page > 1) {
    links.push(`<${buildUrl(`/api/v1${basePath}`, { page: page - 1, perPage })}>; rel="prev"`);
  }

  if (page < totalPages) {
    links.push(`<${buildUrl(`/api/v1${basePath}`, { page: page + 1, perPage })}>; rel="next"`);
  }

  return links.join(", ");
}

export const RESPONSE_HEADERS = {
  CACHE_CONTROL: "Cache-Control",
  ETAG: "ETag",
  LAST_MODIFIED: "Last-Modified",
  X_TOTAL_COUNT: "X-Total-Count",
  X_PAGE: "X-Page",
  X_PER_PAGE: "X-Per-Page",
  X_TOTAL_PAGES: "X-Total-Pages",
  X_REQUEST_ID: "X-Request-Id",
  RATE_LIMIT_LIMIT: "X-RateLimit-Limit",
  RATE_LIMIT_REMAINING: "X-RateLimit-Remaining",
  RATE_LIMIT_RESET: "X-RateLimit-Reset",
  CONTENT_TYPE: "Content-Type",
};

export function getCacheHeaders(isCollection = false, lastModified?: Date): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-Id": crypto.randomUUID(),
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": "99",
    "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
  };

  if (isCollection) {
    headers["Cache-Control"] = "private, max-age=60";
    headers["Vary"] = "Accept, Authorization";
  } else {
    headers["Cache-Control"] = "private, max-age=300, must-revalidate";
  }

  if (lastModified) {
    headers["Last-Modified"] = lastModified.toUTCString();
    headers["ETag"] = `"${Buffer.from(lastModified.toISOString()).toString("base64").slice(0, 16)}"`;
  }

  return headers;
}
