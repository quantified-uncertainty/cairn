import React from "react";
import { InfoBox, type ModelRatingsData } from "./InfoBox";
import { HideableInfoBox } from "./InfoBoxVisibility";
import { getExpertInfoBoxData, getOrgInfoBoxData, getEntityInfoBoxData, getPageById, getExternalLinks, getFactsForEntity } from "@data";

interface DataInfoBoxProps {
  entityId?: string;
  expertId?: string;
  orgId?: string;
  type?: string;
  [key: string]: any;
}

function formatFactLabel(factId: string): string {
  return factId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function DataInfoBox({ entityId, expertId, orgId, type: inlineType, ...inlineProps }: DataInfoBoxProps) {
  if (entityId) {
    const data = getEntityInfoBoxData(entityId);
    if (!data) return <div className="text-muted-foreground text-sm italic">No entity found: {entityId}</div>;

    const pageData = getPageById(entityId);
    const externalLinks = getExternalLinks(entityId);

    // Get top facts for entity (first 5)
    const allFacts = getFactsForEntity(entityId);
    const topFacts = Object.entries(allFacts)
      .slice(0, 5)
      .map(([factId, fact]) => ({
        label: formatFactLabel(factId),
        value: fact.value || String(fact.numeric ?? ""),
        asOf: fact.asOf,
      }))
      .filter((f) => f.value);

    const description = pageData?.llmSummary || pageData?.description || undefined;
    const clusters: string[] | undefined = pageData?.clusters?.length ? pageData.clusters : undefined;
    const wordCount: number | undefined = pageData?.wordCount ?? undefined;
    const backlinkCount: number | undefined = pageData?.backlinkCount ?? undefined;

    return (
      <HideableInfoBox>
        <InfoBox
          type={data.type}
          title={data.title}
          severity={data.severity}
          likelihood={data.likelihood}
          timeframe={data.timeframe}
          category={data.category}
          maturity={data.maturity}
          relatedSolutions={data.relatedSolutions}
          website={data.website}
          customFields={data.customFields}
          relatedTopics={data.relatedTopics}
          relatedEntries={data.relatedEntries}
          importance={pageData?.importance ?? undefined}
          tractability={pageData?.tractability ?? undefined}
          neglectedness={pageData?.neglectedness ?? undefined}
          uncertainty={pageData?.uncertainty ?? undefined}
          description={description}
          externalLinks={externalLinks}
          topFacts={topFacts.length > 0 ? topFacts : undefined}
          clusters={clusters}
          wordCount={wordCount}
          backlinkCount={backlinkCount}
          {...inlineProps}
        />
      </HideableInfoBox>
    );
  }

  if (expertId) {
    const data = getExpertInfoBoxData(expertId);
    if (!data) return <div className="text-muted-foreground text-sm italic">No expert found: {expertId}</div>;
    return (
      <HideableInfoBox>
        <InfoBox
          type={data.type}
          title={data.title}
          affiliation={data.affiliation}
          role={data.role}
          website={data.website}
          knownFor={data.knownFor}
          {...inlineProps}
        />
      </HideableInfoBox>
    );
  }

  if (orgId) {
    const data = getOrgInfoBoxData(orgId);
    if (!data) return <div className="text-muted-foreground text-sm italic">No org found: {orgId}</div>;
    return (
      <HideableInfoBox>
        <InfoBox
          type={data.type}
          title={data.title}
          founded={data.founded}
          location={data.location}
          headcount={data.headcount}
          funding={data.funding}
          website={data.website}
          {...inlineProps}
        />
      </HideableInfoBox>
    );
  }

  if (!inlineType) {
    return <div className="text-muted-foreground text-sm italic">InfoBox requires type or entityId/expertId/orgId</div>;
  }
  return (
    <HideableInfoBox>
      <InfoBox type={inlineType} {...inlineProps} />
    </HideableInfoBox>
  );
}

export default DataInfoBox;
