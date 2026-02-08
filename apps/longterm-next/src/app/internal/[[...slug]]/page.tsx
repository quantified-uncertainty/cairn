import { notFound } from "next/navigation";
import { renderInternalPage, getAllInternalSlugs, getInternalPageFrontmatter } from "@/lib/mdx";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateStaticParams() {
  const slugs = getAllInternalSlugs();
  return [{ slug: undefined }, ...slugs.map((slug) => ({ slug }))];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug ? slug.join("/") : "";
  const frontmatter = getInternalPageFrontmatter(slugPath);
  const title = frontmatter?.title || "Internal";
  return {
    title: `${title} | Cairn Internal`,
  };
}

export default async function InternalPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug ? slug.join("/") : "";

  const page = await renderInternalPage(slugPath);
  if (!page) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
    <article className="prose max-w-none">
      {page.frontmatter.title && <h1>{page.frontmatter.title}</h1>}
      {page.content}
    </article>
    </div>
  );
}
