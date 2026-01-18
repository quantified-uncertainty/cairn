import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TagsProps {
  tags: string[];
}

export function Tags({ tags }: TagsProps) {
  return (
    <div className="flex flex-wrap gap-2 my-2">
      {tags.map((tag, index) => (
        <Badge key={index} variant="secondary">
          {tag}
        </Badge>
      ))}
    </div>
  );
}

export default Tags;
