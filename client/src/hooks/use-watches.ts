import { useQuery } from "@tanstack/react-query";
import type { Watch } from "@shared/schema";

export function useWatches(collectionId?: number) {
  return useQuery<Watch[]>({
    queryKey: ["/api/watches", collectionId],
    queryFn: async () => {
      const url = collectionId 
        ? `/api/watches?collectionId=${collectionId}`
        : "/api/watches";
      
      const response = await fetch(url, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch watches");
      }
      
      return response.json();
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["/api/brands"],
  });
}
