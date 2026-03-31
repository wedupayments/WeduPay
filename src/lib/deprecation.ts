export interface DeprecationInfo {
  deprecated: boolean;
  sunset?: string;
  link?: string;
  version?: string;
}

export function getDeprecationHeaders(
  deprecatedAt: Date,
  sunsetDate: Date,
  migrationGuide?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "Deprecation": `Fri, ${deprecatedAt.toUTCString()} GMT`,
    "Sunset": sunsetDate.toUTCString(),
  };

  if (migrationGuide) {
    headers["Link"] = `<${migrationGuide}>; rel="deprecation"; type="text/html"`;
  }

  return headers;
}

export function isDeprecated(sunsetDate: Date): boolean {
  return new Date() > sunsetDate;
}

export function getSunsetDate(majorVersion: number, minorVersion: number): Date {
  const sunset = new Date();
  sunset.setMonth(sunset.getMonth() + (minorVersion === 0 ? 12 : 3));
  sunset.setFullYear(sunset.getFullYear() + majorVersion);
  return sunset;
}

export const API_VERSIONS = {
  current: "1.0",
  supported: ["1.0"],
  deprecated: [] as string[],
};

export function getVersionDeprecation(version: string): DeprecationInfo {
  const deprecated = API_VERSIONS.deprecated.includes(version);
  const sunsetDate = getSunsetDate(1, 0);

  return {
    deprecated,
    sunset: deprecated ? sunsetDate.toUTCString() : undefined,
    link: deprecated ? "/api/docs/v1/migration" : undefined,
    version: version,
  };
}

export function addDeprecationToResponse(
  response: Response,
  version: string
): Response {
  const deprecation = getVersionDeprecation(version);
  
  if (deprecation.deprecated || version !== API_VERSIONS.current) {
    const headers = new Headers(response.headers);
    
    if (deprecation.deprecated) {
      headers.set("Deprecation", `true`);
      headers.set("Sunset", deprecation.sunset || "");
      if (deprecation.link) {
        headers.set("Link", `<${deprecation.link}>; rel="deprecation"`);
      }
    }

    if (version !== API_VERSIONS.current) {
      headers.set("X-API-Warning", `API version ${version} is deprecated. Current: ${API_VERSIONS.current}`);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}
