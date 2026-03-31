export type FilterOperator = 
  | "eq" 
  | "ne" 
  | "gt" 
  | "ge" 
  | "lt" 
  | "le" 
  | "in" 
  | "nin" 
  | "contains" 
  | "startsWith" 
  | "endsWith";

export interface FilterExpression {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export function parseFilterExpression(filter: string): FilterExpression | null {
  const match = filter.match(/^(\w+)\s+(eq|ne|gt|ge|lt|le|in|nin|contains|startsWith|endsWith)\s+(.+)$/);
  
  if (!match) {
    return null;
  }

  const [, field, operator, rawValue] = match;
  let value: string | string[] | number | boolean | null = rawValue.trim();

  if (value.startsWith("[") && value.endsWith("]")) {
    value = value.slice(1, -1).split(",").map((v: string) => v.trim().replace(/^["']|["']$/g, ""));
  } else if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
  } else if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  } else if (!isNaN(Number(value))) {
    value = Number(value);
  } else if (value === "true") {
    value = true;
  } else if (value === "false") {
    value = false;
  } else if (value === "null") {
    value = null;
  }

  return {
    field,
    operator: operator as FilterOperator,
    value,
  };
}

export function applyFilter<T extends Record<string, unknown>>(
  data: T[],
  filters: FilterExpression[]
): T[] {
  return data.filter((item) => {
    return filters.every((filter) => {
      const fieldValue = getNestedValue(item, filter.field);
      return compareValues(fieldValue, filter.operator, filter.value);
    });
  });
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function compareValues(fieldValue: unknown, operator: FilterOperator, filterValue: unknown): boolean {
  switch (operator) {
    case "eq":
      return fieldValue === filterValue;
    case "ne":
      return fieldValue !== filterValue;
    case "gt":
      return typeof fieldValue === "number" && typeof filterValue === "number" && fieldValue > filterValue;
    case "ge":
      return typeof fieldValue === "number" && typeof filterValue === "number" && fieldValue >= filterValue;
    case "lt":
      return typeof fieldValue === "number" && typeof filterValue === "number" && fieldValue < filterValue;
    case "le":
      return typeof fieldValue === "number" && typeof filterValue === "number" && fieldValue <= filterValue;
    case "in":
      return Array.isArray(filterValue) && filterValue.includes(fieldValue);
    case "nin":
      return Array.isArray(filterValue) && !filterValue.includes(fieldValue);
    case "contains":
      return typeof fieldValue === "string" && typeof filterValue === "string" && fieldValue.includes(filterValue);
    case "startsWith":
      return typeof fieldValue === "string" && typeof filterValue === "string" && fieldValue.startsWith(filterValue);
    case "endsWith":
      return typeof fieldValue === "string" && typeof filterValue === "string" && fieldValue.endsWith(filterValue);
    default:
      return true;
  }
}

export function parseFilterParams(searchParams: URLSearchParams): FilterExpression[] {
  const filterParam = searchParams.get("filter");
  
  if (!filterParam) {
    return [];
  }

  const filters: FilterExpression[] = [];
  const filterParts = filterParam.split(";");

  for (const part of filterParts) {
    const parsed = parseFilterExpression(part.trim());
    if (parsed) {
      filters.push(parsed);
    }
  }

  return filters;
}

export function buildPrismaWhere(
  filters: FilterExpression[]
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  for (const filter of filters) {
    let condition: unknown;

    switch (filter.operator) {
      case "eq":
        condition = filter.value;
        break;
      case "ne":
        condition = { not: filter.value };
        break;
      case "gt":
        condition = { gt: filter.value };
        break;
      case "ge":
        condition = { gte: filter.value };
        break;
      case "lt":
        condition = { lt: filter.value };
        break;
      case "le":
        condition = { lte: filter.value };
        break;
      case "in":
        condition = { in: filter.value };
        break;
      case "nin":
        condition = { notIn: filter.value };
        break;
      case "contains":
        condition = { contains: filter.value };
        break;
      case "startsWith":
        condition = { startsWith: filter.value };
        break;
      case "endsWith":
        condition = { endsWith: filter.value };
        break;
      default:
        condition = filter.value;
    }

    where[filter.field] = condition;
  }

  return where;
}
