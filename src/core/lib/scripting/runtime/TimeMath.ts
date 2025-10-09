/**
 * Time Math utilities for numeric expression evaluation
 */

/**
 * Parse numeric expressions that may include deltaTime
 */
export function parseNumericExpression(expr: string, deltaTime?: number): number {
  const trimmed = expr.trim();

  // Direct deltaTime reference
  if (trimmed === 'deltaTime' && typeof deltaTime === 'number') {
    return deltaTime;
  }

  // deltaTime * K
  const mulMatch = trimmed.match(/^(?:time\.)?deltaTime\s*\*\s*([\d.+-]+)$/);
  if (mulMatch && typeof deltaTime === 'number') {
    return deltaTime * parseFloat(mulMatch[1]);
  }

  // K * deltaTime
  const mulMatchRev = trimmed.match(/^([\d.+-]+)\s*\*\s*(?:time\.)?deltaTime$/);
  if (mulMatchRev && typeof deltaTime === 'number') {
    return parseFloat(mulMatchRev[1]) * deltaTime;
  }

  // deltaTime / K
  const divMatch = trimmed.match(/^(?:time\.)?deltaTime\s*\/\s*([\d.+-]+)$/);
  if (divMatch && typeof deltaTime === 'number') {
    return deltaTime / parseFloat(divMatch[1]);
  }

  // K / deltaTime (guard against division by zero)
  const divMatchRev = trimmed.match(/^([\d.+-]+)\s*\/\s*(?:time\.)?deltaTime$/);
  if (divMatchRev && typeof deltaTime === 'number' && deltaTime !== 0) {
    return parseFloat(divMatchRev[1]) / deltaTime;
  }

  // Plain number
  const num = parseFloat(trimmed);
  return isNaN(num) ? 0 : num;
}

/**
 * Evaluate a simple numeric expression
 */
export function evaluateExpression(expr: string, context: Record<string, number> = {}): number {
  const trimmed = expr.trim();

  // Check if it's a variable from context
  if (context[trimmed] !== undefined) {
    return context[trimmed];
  }

  // Try to parse as number
  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    return num;
  }

  // Default to 0 for unparseable expressions
  return 0;
}
