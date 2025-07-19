function toCamelCase(str: string) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Recursively converts all object keys to camelCase, but preserves Buffer and ArrayBufferLike values.
 * @param obj - The object to convert.
 * @returns The object with camelCased keys, preserving Buffer/ArrayBufferLike values.
 */
export function keysToCamelCase(obj: any): any {
  // Guard: preserve Buffer (Node.js) or ArrayBuffer/TypedArray values
  if (
    obj &&
    typeof obj === 'object' &&
    ((typeof Buffer !== 'undefined' &&
      typeof Buffer.isBuffer === 'function' &&
      Buffer.isBuffer(obj)) ||
      obj instanceof ArrayBuffer ||
      ArrayBuffer.isView?.(obj))
  ) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(keysToCamelCase);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamelCase(k), keysToCamelCase(v)])
    );
  }

  return obj;
}
