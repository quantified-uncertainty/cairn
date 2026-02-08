import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import rehypeKatex from "rehype-katex";
import { mdxComponents } from "@/components/mdx-components";
import { getIdRegistry } from "@/data";
import remarkCallouts from "./remark-callouts";

const CONTENT_DIR = path.resolve(process.cwd(), "../longterm/src/content/docs");
const LONGTERM_DATA_DIR = path.resolve(process.cwd(), "../longterm/src/data");

/**
 * Preprocess MDX source to strip import statements and Astro directives
 * that are incompatible with next-mdx-remote.
 */
export function preprocessMdx(source: string): string {
  // Strip all import statements (default, named, namespace, and multi-line)
  let processed = source.replace(
    /^import\s+(?:[\s\S]*?\s+from\s+)?['"][^'"]*['"];?\s*$/gm,
    ""
  );

  // Strip Astro client directives (client:load, client:idle, etc.)
  processed = processed.replace(/\s+client:(load|idle|visible|only|media)(\s*=\s*"[^"]*")?/g, "");

  return processed;
}

/**
 * Load the pathRegistry from the longterm build output.
 * Maps entity slug → content path (e.g. "geoffrey-hinton" → "/knowledge-base/people/geoffrey-hinton")
 */
let _pathRegistry: Record<string, string> | null = null;
function getPathRegistry(): Record<string, string> {
  if (_pathRegistry) return _pathRegistry;
  const dbPath = path.join(LONGTERM_DATA_DIR, "database.json");
  try {
    const raw = fs.readFileSync(dbPath, "utf-8");
    const db = JSON.parse(raw);
    _pathRegistry = (db.pathRegistry || {}) as Record<string, string>;
  } catch (err) {
    console.error(`Failed to load path registry from ${dbPath}:`, err);
    _pathRegistry = {};
  }
  return _pathRegistry;
}

/**
 * Resolve a slug (entity string ID) to an MDX file path.
 * Uses the pathRegistry to find the correct content directory path,
 * then tries {path}.mdx and {path}/index.mdx
 */
/**
 * Guard against path traversal: ensure a resolved path stays within the base directory.
 */
function isSafePath(resolved: string, baseDir: string): boolean {
  return path.resolve(resolved).startsWith(baseDir + path.sep) || path.resolve(resolved) === baseDir;
}

function resolveContentPath(slug: string): string | null {
  const pathRegistry = getPathRegistry();

  // The pathRegistry maps slug → path like "/knowledge-base/people/geoffrey-hinton"
  // Strip leading slash to get relative path from CONTENT_DIR
  const registryPath = pathRegistry[slug];
  if (registryPath) {
    const relativePath = registryPath.replace(/^\//, "").replace(/\/$/, "");
    const directPath = path.join(CONTENT_DIR, `${relativePath}.mdx`);
    if (isSafePath(directPath, CONTENT_DIR) && fs.existsSync(directPath)) return directPath;

    const indexPath = path.join(CONTENT_DIR, relativePath, "index.mdx");
    if (isSafePath(indexPath, CONTENT_DIR) && fs.existsSync(indexPath)) return indexPath;
  }

  // Fallback: try direct slug match in content dir
  const directPath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!isSafePath(directPath, CONTENT_DIR)) return null;
  if (fs.existsSync(directPath)) return directPath;

  const indexPath = path.join(CONTENT_DIR, slug, "index.mdx");
  if (!isSafePath(indexPath, CONTENT_DIR)) return null;
  if (fs.existsSync(indexPath)) return indexPath;

  return null;
}

export interface MdxPage {
  content: React.ReactElement;
  frontmatter: Record<string, any>;
  slug: string;
}

/**
 * Compile an MDX/MD file at a given path into a renderable page.
 */
async function compileFromPath(filePath: string, slug: string): Promise<MdxPage | null> {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content: mdxSource, data: frontmatter } = matter(raw);
  const preprocessed = preprocessMdx(mdxSource);

  try {
    const { content } = await compileMDX({
      source: preprocessed,
      components: mdxComponents,
      options: {
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath, remarkDirective, remarkCallouts],
          rehypePlugins: [rehypeKatex as any],
        },
      },
    });

    return { content, frontmatter, slug };
  } catch (err) {
    console.error(`Failed to compile MDX for "${slug}" (${filePath}):`, err);
    return null;
  }
}

/**
 * Load and compile an MDX page from its entity slug.
 */
export async function renderMdxPage(slug: string): Promise<MdxPage | null> {
  const filePath = resolveContentPath(slug);
  if (!filePath) return null;
  return compileFromPath(filePath, slug);
}

/**
 * Get all entity numeric IDs for static generation.
 */
export function getAllNumericIds(): string[] {
  const registry = getIdRegistry();
  return Object.keys(registry.byNumericId);
}

/**
 * Resolve a numeric ID (e.g. "E42") to its entity slug.
 */
export function numericIdToSlug(numericId: string): string | null {
  const registry = getIdRegistry();
  return registry.byNumericId[numericId] || null;
}

/**
 * Resolve an entity slug to its numeric ID (e.g. "E42").
 */
export function slugToNumericId(slug: string): string | null {
  const registry = getIdRegistry();
  return registry.bySlug[slug] || null;
}

// ============================================================================
// INTERNAL PAGES
// ============================================================================

const INTERNAL_DIR = path.join(CONTENT_DIR, "internal");

/**
 * Resolve an internal page slug to its file path.
 * Tries .mdx, .md, then index variants.
 */
function resolveInternalPath(slug: string): string | null {
  const base = slug ? path.join(INTERNAL_DIR, slug) : INTERNAL_DIR;

  // Guard against path traversal
  if (!isSafePath(base, INTERNAL_DIR) && base !== INTERNAL_DIR) return null;

  for (const ext of [".mdx", ".md"]) {
    const directPath = base + ext;
    if (fs.existsSync(directPath)) return directPath;
  }

  for (const ext of [".mdx", ".md"]) {
    const indexPath = path.join(base, `index${ext}`);
    if (fs.existsSync(indexPath)) return indexPath;
  }

  return null;
}

/**
 * Load and compile an internal MDX/MD page.
 */
export async function renderInternalPage(slug: string): Promise<MdxPage | null> {
  const filePath = resolveInternalPath(slug);
  if (!filePath) return null;
  return compileFromPath(filePath, slug);
}

/**
 * Read frontmatter only from an internal page (no compilation).
 */
export function getInternalPageFrontmatter(slug: string): Record<string, any> | null {
  const filePath = resolveInternalPath(slug);
  if (!filePath) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);
  return data;
}

/**
 * Get all internal page slugs for static generation.
 * Walks the internal/ directory recursively.
 */
export function getAllInternalSlugs(): string[][] {
  const slugs: string[][] = [];

  function walk(dir: string, prefix: string[]) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), [...prefix, entry.name]);
      } else if (entry.name.match(/\.(mdx|md)$/)) {
        const name = entry.name.replace(/\.(mdx|md)$/, "");
        if (name === "index") {
          // index files map to the directory slug (or root)
          slugs.push(prefix.length > 0 ? prefix : []);
        } else {
          slugs.push([...prefix, name]);
        }
      }
    }
  }

  walk(INTERNAL_DIR, []);
  return slugs;
}
