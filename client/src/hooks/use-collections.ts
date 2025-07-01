import { useQuery } from "@tanstack/react-query";
import type { Collection } from "@shared/schema";

export function useCollections() {
  return useQuery<Collection[]>({
    queryKey: ["/api/collections"],
  });
}
