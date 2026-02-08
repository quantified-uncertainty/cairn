import React from "react";
import { InfoBox, type ModelRatingsData } from "./InfoBox";
import { getExpertInfoBoxData, getOrgInfoBoxData, getEntityInfoBoxData, getPageById } from "@data";

interface DataInfoBoxProps {
  entityId?: string;
  expertId?: string;
  orgId?: string;
  type?: string;
  [key: string]: any;
}

export function DataInfoBox({ entityId, expertId, orgId, type: inlineType, ...inlineProps }: DataInfoBoxProps) {
  if (entityId) {
    const data = getEntityInfoBoxData(entityId);
    if (!data) return <div className="text-muted-foreground text-sm italic">No entity found: {entityId}</div>;

    const pageData = getPageById(entityId);
    return (
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
        {...inlineProps}
      />
    );
  }

  if (expertId) {
    const data = getExpertInfoBoxData(expertId);
    if (!data) return <div className="text-muted-foreground text-sm italic">No expert found: {expertId}</div>;
    return (
      <InfoBox
        type={data.type}
        title={data.title}
        affiliation={data.affiliation}
        role={data.role}
        website={data.website}
        knownFor={data.knownFor}
        {...inlineProps}
      />
    );
  }

  if (orgId) {
    const data = getOrgInfoBoxData(orgId);
    if (!data) return <div className="text-muted-foreground text-sm italic">No org found: {orgId}</div>;
    return (
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
    );
  }

  if (!inlineType) {
    return <div className="text-muted-foreground text-sm italic">InfoBox requires type or entityId/expertId/orgId</div>;
  }
  return <InfoBox type={inlineType} {...inlineProps} />;
}

export default DataInfoBox;
