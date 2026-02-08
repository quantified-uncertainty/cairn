import { Suspense } from "react";
import { getExploreItems } from "@/data";
import { ExploreGrid } from "@/components/explore/ExploreGrid";

export default function WikiIndex() {
  const items = getExploreItems();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Explore</h1>
      <p className="text-muted-foreground mb-8">
        Browse all entities in the AI safety knowledge base.
      </p>
      <Suspense>
        <ExploreGrid items={items} />
      </Suspense>
    </div>
  );
}
