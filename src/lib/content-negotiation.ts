export type ContentType = "application/json" | "application/xml" | "text/csv";

export interface ContentNegotiation {
  contentType: ContentType;
  quality: number;
}

export function parseAcceptHeader(acceptHeader: string | null): ContentNegotiation[] {
  if (!acceptHeader) {
    return [{ contentType: "application/json", quality: 1 }];
  }

  const parts = acceptHeader.split(",").map((part) => {
    const [type, qPart] = part.trim().split(";");
    const quality = qPart?.includes("q=") 
      ? parseFloat(qPart.split("=")[1]) 
      : 1;
    
    return {
      contentType: (type.trim() as ContentType) || "application/json",
      quality: isNaN(quality) ? 1 : quality,
    };
  });

  return parts.sort((a, b) => b.quality - a.quality);
}

export function getPreferredContentType(acceptHeader: string | null): ContentType {
  const types = parseAcceptHeader(acceptHeader);
  
  for (const type of types) {
    if (type.contentType === "application/json" || 
        type.contentType === "application/xml" ||
        type.contentType === "text/csv") {
      return type.contentType;
    }
    
    if (type.contentType === "*/*") {
      return "application/json";
    }
  }
  
  return "application/json";
}

export function selectFields<T extends Record<string, unknown>>(
  data: T,
  fields?: string[]
): Partial<T> {
  if (!fields || fields.length === 0) {
    return data;
  }

  const result: Partial<T> = {};
  
  for (const field of fields) {
    if (field in data) {
      (result as Record<string, unknown>)[field] = data[field];
    }
  }
  
  return result;
}

export function selectNestedFields<T extends Record<string, unknown>>(
  data: T,
  fields?: string[]
): Partial<T> {
  if (!fields || fields.length === 0) {
    return data;
  }

  const result: Partial<T> = {};
  
  for (const field of fields) {
    const parts = field.split(".");
    let current: unknown = data;
    
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        current = undefined;
        break;
      }
    }
    
    if (current !== undefined) {
      let target: Record<string, unknown> = result as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!(p in target)) {
          target[p] = {};
        }
        target = target[p] as Record<string, unknown>;
      }
      target[parts[parts.length - 1]] = current;
    }
  }
  
  return result;
}

export function expandResources<T extends Record<string, unknown>>(
  data: T,
  expand?: string[]
): T {
  if (!expand || expand.length === 0) {
    return data;
  }
  
  const result = { ...data };
  
  if (expand.includes("_all")) {
    return result;
  }
  
  return result;
}

export function checkConditionalRequest(
  request: Request,
  etag?: string,
  lastModified?: Date
): { shouldReturn304: boolean; etag?: string } {
  const ifNoneMatch = request.headers.get("If-None-Match");
  const ifModifiedSince = request.headers.get("If-Modified-Since");

  if (ifNoneMatch && etag) {
    const etags = ifNoneMatch.split(",").map((e) => e.trim());
    if (etags.includes(etag) || etags.includes("*")) {
      return { shouldReturn304: true, etag };
    }
  }

  if (ifModifiedSince && lastModified) {
    const clientDate = new Date(ifModifiedSince);
    if (!isNaN(clientDate.getTime()) && lastModified <= clientDate) {
      return { shouldReturn304: true };
    }
  }

  return { shouldReturn304: false, etag };
}

export function generateETag(data: unknown): string {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

export function parseFieldsParam(fieldsParam?: string | null): string[] {
  if (!fieldsParam) return [];
  return fieldsParam.split(",").map((f) => f.trim()).filter(Boolean);
}

export function parseExpandParam(expandParam?: string | null): string[] {
  if (!expandParam) return [];
  return expandParam.split(",").map((e) => e.trim()).filter(Boolean);
}

export function parseSortParam(sortParam?: string | null): { field: string; direction: "asc" | "desc" }[] {
  if (!sortParam) return [];
  
  return sortParam.split(",").map((s) => {
    const trimmed = s.trim();
    if (trimmed.startsWith("-")) {
      return { field: trimmed.slice(1), direction: "desc" as const };
    }
    return { field: trimmed, direction: "asc" as const };
  });
}

export function buildCsvResponse(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => 
    headers.map((h) => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n") 
        ? `"${str.replace(/"/g, '""')}"` 
        : str;
    }).join(",")
  );
  
  return [headers.join(","), ...rows].join("\n");
}
