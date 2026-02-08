import { notFound, redirect } from "next/navigation";
import {
  renderMdxPage,
  getAllNumericIds,
  numericIdToSlug,
  slugToNumericId,
} from "@/lib/mdx";
import type { MdxPage } from "@/lib/mdx";
import { getEntityById, getPageById, getEntityPath } from "@/data";
import type { Page } from "@/data";
import { PageStatus } from "@/components/PageStatus";
import type { Metadata } from "next";

const GITHUB_HISTORY_BASE =
  "https://github.com/quantified-uncertainty/cairn/commits/main/apps/longterm/src/content/docs";

interface PageProps {
  params: Promise<{ id: string }>;
}

function isNumericId(id: string): boolean {
  return /^E\d+$/i.test(id);
}

export async function generateStaticParams() {
  return getAllNumericIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  let slug: string | null;
  if (isNumericId(id)) {
    slug = numericIdToSlug(id.toUpperCase());
  } else {
    slug = id;
  }

  if (!slug) return { title: "Not Found" };

  const entity = getEntityById(slug);
  const pageData = getPageById(slug);
  return {
    title: entity?.title || pageData?.title || slug,
    description: entity?.description || pageData?.description || undefined,
  };
}

function ArticleView({
  page,
  pageData,
  entityPath,
}: {
  page: MdxPage;
  pageData: Page | undefined;
  entityPath: string;
}) {
  const lastUpdated = pageData?.lastUpdated;
  const githubUrl = pageData?.filePath
    ? `${GITHUB_HISTORY_BASE}/${pageData.filePath}`
    : null;

  return (
    <article className="prose">
      <div className="page-meta">
        {lastUpdated && (
          <span className="page-meta-updated">
            Updated {lastUpdated}
          </span>
        )}
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="page-meta-github"
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            History
          </a>
        )}
      </div>
      <PageStatus
        quality={pageData?.quality ?? undefined}
        importance={pageData?.importance ?? undefined}
        llmSummary={pageData?.llmSummary ?? undefined}
        lastEdited={pageData?.lastUpdated ?? undefined}
        todo={page.frontmatter.todo}
        todos={page.frontmatter.todos}
        wordCount={pageData?.wordCount}
        backlinkCount={pageData?.backlinkCount}
        metrics={pageData?.metrics}
        suggestedQuality={pageData?.suggestedQuality}
        issues={{
          unconvertedLinkCount: pageData?.unconvertedLinkCount,
          redundancy: pageData?.redundancy,
        }}
        pageType={page.frontmatter.pageType}
        pathname={entityPath}
      />
      {page.frontmatter.title && <h1>{page.frontmatter.title}</h1>}
      {page.content}
    </article>
  );
}

export default async function WikiPage({ params }: PageProps) {
  const { id } = await params;

  if (isNumericId(id)) {
    // Numeric ID like E42 — look up slug and render
    const slug = numericIdToSlug(id.toUpperCase());
    if (!slug) notFound();

    const page = await renderMdxPage(slug);
    if (!page) notFound();

    return (
      <ArticleView
        page={page}
        pageData={getPageById(slug)}
        entityPath={getEntityPath(slug) || ""}
      />
    );
  } else {
    // String slug like "geoffrey-hinton"
    // If it has a numeric ID, redirect to canonical URL
    const numericId = slugToNumericId(id);
    if (numericId) {
      redirect(`/explore/${numericId}`);
    }

    // No numeric ID — render directly by slug (page-only content without entity)
    const page = await renderMdxPage(id);
    if (!page) notFound();

    return (
      <ArticleView
        page={page}
        pageData={getPageById(id)}
        entityPath={getEntityPath(id) || ""}
      />
    );
  }
}
