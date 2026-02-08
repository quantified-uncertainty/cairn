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
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TableOfContents } from "@/components/TableOfContents";
import { RelatedPages } from "@/components/RelatedPages";
import { Github } from "lucide-react";
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
  const title = entity?.title || pageData?.title || slug;
  const description = entity?.description || pageData?.description || undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(pageData?.lastUpdated && { modifiedTime: pageData.lastUpdated }),
    },
  };
}

function JsonLd({ pageData, title, slug }: { pageData?: Page; title?: string; slug: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title || slug,
    ...(pageData?.description && { description: pageData.description }),
    ...(pageData?.llmSummary && { abstract: pageData.llmSummary }),
    ...(pageData?.lastUpdated && { dateModified: pageData.lastUpdated }),
    isPartOf: {
      "@type": "WebSite",
      name: "Cairn Wiki",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function ArticleView({
  page,
  pageData,
  entityPath,
  slug,
}: {
  page: MdxPage;
  pageData: Page | undefined;
  entityPath: string;
  slug: string;
}) {
  const lastUpdated = pageData?.lastUpdated;
  const githubUrl = pageData?.filePath
    ? `${GITHUB_HISTORY_BASE}/${pageData.filePath}`
    : null;
  const entity = getEntityById(slug);

  return (
    <>
      <Breadcrumbs
        category={pageData?.category}
        title={page.frontmatter.title || entity?.title}
      />
      <div className="flex gap-8">
        <article className="prose min-w-0 flex-1">
          <JsonLd pageData={pageData} title={page.frontmatter.title} slug={slug} />
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
                <Github size={14} />
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
          <RelatedPages entityId={slug} entity={entity} />
        </article>
        <TableOfContents headings={page.headings} />
      </div>
    </>
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
        slug={slug}
      />
    );
  } else {
    // String slug like "geoffrey-hinton"
    // If it has a numeric ID, redirect to canonical URL
    const numericId = slugToNumericId(id);
    if (numericId) {
      redirect(`/wiki/${numericId}`);
    }

    // No numeric ID — render directly by slug (page-only content without entity)
    const page = await renderMdxPage(id);
    if (!page) notFound();

    return (
      <ArticleView
        page={page}
        pageData={getPageById(id)}
        entityPath={getEntityPath(id) || ""}
        slug={id}
      />
    );
  }
}
