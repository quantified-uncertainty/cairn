import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div className="my-8">
      <div className="text-sm font-semibold text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

export default Section;
