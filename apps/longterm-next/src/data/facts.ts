/**
 * Fact processing module for longterm-next.
 *
 * Reads canonical fact YAML files from src/data/facts/, parses numeric values,
 * resolves computed expressions, and exports the processed fact store.
 *
 * This runs at build time / server-component level only (uses fs).
 * Ported from apps/longterm/scripts/build-data.mjs.
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { Fact } from "./index";

// ============================================================================
// YAML LOADING
// ============================================================================

const FACTS_DIR = path.resolve(process.cwd(), "src/data/facts");

interface RawFactFile {
  entity: string;
  facts: Record<
    string,
    {
      value?: string;
      numeric?: number;
      asOf?: string;
      source?: string;
      note?: string;
      noCompute?: boolean;
      compute?: string;
      format?: string;
      formatDivisor?: number;
    }
  >;
}

// ============================================================================
// NUMERIC PARSING
// ============================================================================

/**
 * Auto-parse a numeric value from a human-readable string.
 * Returns null if the string can't be reliably parsed.
 *
 * Examples:
 *   "$350 billion" -> 350_000_000_000
 *   "$13 billion"  -> 13_000_000_000
 *   "100 million"  -> 100_000_000
 *   "$76,001/year" -> 76001
 *   "40%"          -> 0.4
 *   "83%"          -> 0.83
 */
function parseNumericValue(value: string): number | null {
  if (!value || typeof value !== "string") return null;

  // Skip ranges and ambiguous values
  if (value.includes(" to ") || (value.includes("-") && value.match(/\d+-\d/)))
    return null;
  if (value.includes("+") && !value.startsWith("+")) return null;

  const s = value.trim();

  // Percentage: "40%" -> 0.4
  const pctMatch = s.match(/^(\d+(?:\.\d+)?)%$/);
  if (pctMatch) return parseFloat(pctMatch[1]) / 100;

  // Dollar + number + unit: "$13 billion", "$3.4 million"
  const dollarUnitMatch = s.match(
    /^\$?([\d,.]+)\s*(billion|million|trillion|thousand)?\s*(?:\/\w+)?$/i
  );
  if (dollarUnitMatch) {
    const num = parseFloat(dollarUnitMatch[1].replace(/,/g, ""));
    if (isNaN(num)) return null;
    const unit = (dollarUnitMatch[2] || "").toLowerCase();
    const multipliers: Record<string, number> = {
      trillion: 1e12,
      billion: 1e9,
      million: 1e6,
      thousand: 1e3,
      "": 1,
    };
    return num * (multipliers[unit] || 1);
  }

  // Plain number with possible commas: "1,900"
  const plainMatch = s.match(/^[\d,]+(?:\.\d+)?$/);
  if (plainMatch) {
    return parseFloat(s.replace(/,/g, ""));
  }

  return null;
}

// ============================================================================
// EXPRESSION EVALUATION (recursive descent, no eval)
// ============================================================================

interface Token {
  type: "op" | "num";
  value: string | number;
}

/**
 * Safe expression evaluator for computed facts.
 * Supports: numbers, +, -, *, /, parentheses, and {entity.factId} references.
 */
function evaluateExpression(
  expression: string,
  facts: Record<string, Fact>
): number {
  // Replace {entity.factId} references with numeric values
  const resolved = expression.replace(/\{([^}]+)\}/g, (_match, ref) => {
    const fact = facts[ref];
    if (!fact) throw new Error(`Unknown fact reference: ${ref}`);
    if (fact.noCompute)
      throw new Error(
        `Fact ${ref} is marked noCompute (not a computable quantity)`
      );
    if (fact.numeric == null)
      throw new Error(`Fact ${ref} has no numeric value`);
    return String(fact.numeric);
  });

  // Tokenize
  const tokens: Token[] = [];
  let i = 0;
  while (i < resolved.length) {
    if (/\s/.test(resolved[i])) {
      i++;
      continue;
    }
    if ("+-*/()".includes(resolved[i])) {
      tokens.push({ type: "op", value: resolved[i] });
      i++;
    } else if (/[\d.]/.test(resolved[i])) {
      let num = "";
      while (i < resolved.length && /[\d.eE]/.test(resolved[i])) {
        num += resolved[i];
        i++;
      }
      // Handle signed exponent (e.g., 3.5e+12)
      if (
        /[eE]$/.test(num) &&
        i < resolved.length &&
        (resolved[i] === "+" || resolved[i] === "-")
      ) {
        num += resolved[i];
        i++;
        while (i < resolved.length && /\d/.test(resolved[i])) {
          num += resolved[i];
          i++;
        }
      }
      tokens.push({ type: "num", value: parseFloat(num) });
    } else {
      throw new Error(
        `Unexpected character in expression: "${resolved[i]}" at position ${i}`
      );
    }
  }

  // Recursive descent parser
  let pos = 0;
  function peek(): Token | undefined {
    return tokens[pos];
  }
  function consume(expected?: string): Token {
    const t = tokens[pos++];
    if (expected && (t?.type !== "op" || t?.value !== expected)) {
      throw new Error(`Expected "${expected}" but got "${t?.value}"`);
    }
    return t;
  }

  function parseExpr(): number {
    let left = parseTerm();
    while (
      peek()?.type === "op" &&
      (peek()!.value === "+" || peek()!.value === "-")
    ) {
      const op = consume().value;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (
      peek()?.type === "op" &&
      (peek()!.value === "*" || peek()!.value === "/")
    ) {
      const op = consume().value;
      const right = parseFactor();
      if (op === "/") {
        if (right === 0) throw new Error("Division by zero");
        left = left / right;
      } else {
        left = left * right;
      }
    }
    return left;
  }

  function parseFactor(): number {
    const t = peek();
    if (!t) throw new Error("Unexpected end of expression");
    if (t.type === "num") {
      pos++;
      return t.value as number;
    }
    if (t.type === "op" && t.value === "(") {
      consume("(");
      const val = parseExpr();
      consume(")");
      return val;
    }
    if (t.type === "op" && t.value === "-") {
      consume();
      return -parseFactor();
    }
    throw new Error(`Unexpected token: ${JSON.stringify(t)}`);
  }

  const result = parseExpr();
  if (pos < tokens.length) {
    throw new Error(
      `Unexpected tokens after expression: ${tokens
        .slice(pos)
        .map((t) => t.value)
        .join(" ")}`
    );
  }
  return result;
}

// ============================================================================
// COMPUTED FACT FORMATTING
// ============================================================================

/**
 * Check if a compute expression references any currency-denominated facts.
 */
function isCurrencyExpression(
  expression: string,
  facts: Record<string, Fact>
): boolean {
  const refRegex = /\{([^}]+)\}/g;
  let m;
  while ((m = refRegex.exec(expression)) !== null) {
    const fact = facts[m[1]];
    if (fact?.value && fact.value.trim().startsWith("$")) return true;
  }
  return false;
}

/**
 * Format a computed numeric value for display.
 */
function formatComputedValue(
  numeric: number,
  format?: string,
  formatDivisor?: number,
  isCurrency = false
): string {
  if (!isFinite(numeric))
    throw new Error(
      `Computed value is ${numeric} (expected a finite number)`
    );
  const displayNum = formatDivisor ? numeric / formatDivisor : numeric;

  if (!format) {
    const prefix = isCurrency ? "$" : "";
    const n = displayNum;
    if (Math.abs(n) >= 1e12) return `${prefix}${(n / 1e12).toFixed(1)} trillion`;
    if (Math.abs(n) >= 1e9) return `${prefix}${(n / 1e9).toFixed(1)} billion`;
    if (Math.abs(n) >= 1e6) return `${prefix}${(n / 1e6).toFixed(1)} million`;
    return isCurrency
      ? `${prefix}${n.toLocaleString("en-US")}`
      : n.toLocaleString("en-US");
  }

  // Simple printf-style: replace %.Nf with the formatted number
  return format.replace(/%(?:\.(\d+))?f/, (_, decimals) => {
    const d = decimals ? parseInt(decimals) : 0;
    return displayNum.toFixed(d);
  });
}

// ============================================================================
// RESOLVE COMPUTED FACTS (topological order)
// ============================================================================

function resolveComputedFacts(facts: Record<string, Fact>): number {
  const computed = Object.entries(facts).filter(([, f]) => f.compute);
  if (computed.length === 0) return 0;

  // Extract dependencies
  const deps = new Map<string, string[]>();
  for (const [key, fact] of computed) {
    const refs: string[] = [];
    const refRegex = /\{([^}]+)\}/g;
    let m;
    while ((m = refRegex.exec(fact.compute!)) !== null) {
      refs.push(m[1]);
    }
    deps.set(key, refs);
  }

  // Topological sort (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();
  for (const [key] of deps) {
    inDegree.set(key, 0);
    graph.set(key, []);
  }
  for (const [key, refKeys] of deps) {
    for (const ref of refKeys) {
      if (deps.has(ref)) {
        graph.get(ref)!.push(key);
        inDegree.set(key, (inDegree.get(key) || 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [key, deg] of inDegree) {
    if (deg === 0) queue.push(key);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const dependent of graph.get(current) || []) {
      inDegree.set(dependent, inDegree.get(dependent)! - 1);
      if (inDegree.get(dependent) === 0) queue.push(dependent);
    }
  }

  if (order.length !== computed.length) {
    const missing = computed
      .map(([k]) => k)
      .filter((k) => !order.includes(k));
    throw new Error(
      `Circular dependency in computed facts: ${missing.join(", ")}`
    );
  }

  // Evaluate in order
  let resolved = 0;
  for (const key of order) {
    const fact = facts[key];
    try {
      const numeric = evaluateExpression(fact.compute!, facts);
      fact.numeric = numeric;
      const currency = isCurrencyExpression(fact.compute!, facts);
      fact.value = formatComputedValue(
        numeric,
        fact.format,
        fact.formatDivisor,
        currency
      );
      fact.computed = true;
      resolved++;
    } catch (err) {
      console.warn(
        `[facts] Failed to compute ${key}: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  return resolved;
}

// ============================================================================
// LOAD ALL FACTS
// ============================================================================

let _factsStore: Record<string, Fact> | null = null;

/**
 * Load and process all canonical facts from YAML files.
 * Results are cached in memory for the lifetime of the process.
 */
export function loadFacts(): Record<string, Fact> {
  if (_factsStore) return _factsStore;

  const facts: Record<string, Fact> = {};

  if (!fs.existsSync(FACTS_DIR)) {
    console.warn(`[facts] Facts directory not found: ${FACTS_DIR}`);
    _factsStore = facts;
    return facts;
  }

  const factFiles = fs
    .readdirSync(FACTS_DIR)
    .filter((f) => f.endsWith(".yaml"));

  for (const file of factFiles) {
    const filepath = path.join(FACTS_DIR, file);
    const content = fs.readFileSync(filepath, "utf-8");
    const parsed = yaml.load(content) as RawFactFile | null;

    if (parsed?.entity && parsed?.facts) {
      for (const [factId, factData] of Object.entries(parsed.facts)) {
        const key = `${parsed.entity}.${factId}`;
        facts[key] = {
          ...factData,
          entity: parsed.entity,
          factId,
        };
      }
    }
  }

  // Auto-parse numeric values from value strings where not explicitly set
  for (const [, fact] of Object.entries(facts)) {
    if (fact.numeric == null && fact.value && !fact.compute) {
      const parsed = parseNumericValue(fact.value);
      if (parsed !== null) {
        fact.numeric = parsed;
      }
    }
  }

  // Evaluate computed facts in topological order
  const computedCount = resolveComputedFacts(facts);
  if (computedCount > 0) {
    console.log(
      `[facts] Loaded ${Object.keys(facts).length} facts (${computedCount} computed) from ${factFiles.length} files`
    );
  }

  _factsStore = facts;
  return facts;
}

// Re-export parseNumericValue for testing
export { parseNumericValue };
