export interface PreconditionResult {
  passed: boolean;
  error?: string;
  statusCode?: number;
}

export function checkIfMatch(
  request: Request,
  etag: string
): PreconditionResult {
  const ifMatch = request.headers.get("If-Match");

  if (!ifMatch) {
    return { passed: true };
  }

  if (ifMatch === "*") {
    return { passed: true };
  }

  const etags = ifMatch.split(",").map((e) => e.trim().replace(/^"/, "").replace(/"$/, ""));

  if (etags.includes(etag.replace(/"/g, ""))) {
    return { passed: true };
  }

  return {
    passed: false,
    error: `If-Match header does not match current ETag. Expected one of: ${etags.join(", ")}`,
    statusCode: 412,
  };
}

export function checkIfUnmodifiedSince(
  request: Request,
  lastModified: Date
): PreconditionResult {
  const ifUnmodifiedSince = request.headers.get("If-Unmodified-Since");

  if (!ifUnmodifiedSince) {
    return { passed: true };
  }

  const clientDate = new Date(ifUnmodifiedSince);

  if (isNaN(clientDate.getTime())) {
    return { passed: true };
  }

  if (lastModified <= clientDate) {
    return { passed: true };
  }

  return {
    passed: false,
    error: "Resource has been modified since the requested date",
    statusCode: 412,
  };
}

export function checkIfNoneMatch(
  request: Request,
  etag: string
): PreconditionResult {
  const ifNoneMatch = request.headers.get("If-None-Match");

  if (!ifNoneMatch) {
    return { passed: true };
  }

  if (ifNoneMatch === "*") {
    return {
      passed: false,
      error: "Resource exists and should not be returned",
      statusCode: 304,
    };
  }

  const etags = ifNoneMatch.split(",").map((e) => e.trim().replace(/^"/, "").replace(/"$/, ""));

  if (etags.includes(etag.replace(/"/g, ""))) {
    return {
      passed: false,
      error: "ETag matches, returning 304 Not Modified",
      statusCode: 304,
    };
  }

  return { passed: true };
}

export function checkIfModifiedSince(
  request: Request,
  lastModified: Date
): PreconditionResult {
  const ifModifiedSince = request.headers.get("If-Modified-Since");

  if (!ifModifiedSince) {
    return { passed: true };
  }

  const clientDate = new Date(ifModifiedSince);

  if (isNaN(clientDate.getTime())) {
    return { passed: true };
  }

  if (lastModified > clientDate) {
    return { passed: true };
  }

  return {
    passed: false,
    error: "Resource has not been modified since the requested date",
    statusCode: 304,
  };
}

export function checkPreconditions(
  request: Request,
  options: {
    etag?: string;
    lastModified?: Date;
    requirePrecondition?: boolean;
  }
): PreconditionResult {
  const { etag, lastModified, requirePrecondition } = options;

  if (requirePrecondition && !etag && !lastModified) {
    return {
      passed: false,
      error: "This request requires a precondition header (If-Match or If-Unmodified-Since)",
      statusCode: 428,
    };
  }

  if (etag) {
    const etagResult = checkIfMatch(request, etag);
    if (!etagResult.passed) return etagResult;
  }

  if (lastModified) {
    const modifiedResult = checkIfUnmodifiedSince(request, lastModified);
    if (!modifiedResult.passed) return modifiedResult;
  }

  return { passed: true };
}

export function requirePreconditionHeaders(
  request: Request,
  options: {
    etag?: string;
    lastModified?: Date;
  }
): Response | null {
  const result = checkPreconditions(request, {
    ...options,
    requirePrecondition: true,
  });

  if (!result.passed && result.statusCode) {
    return new Response(
      JSON.stringify({
        error: {
          code: result.statusCode === 428 ? "PRECONDITION_REQUIRED" : "PRECONDITION_FAILED",
          message: result.error,
        },
      }),
      {
        status: result.statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return null;
}
