import { useQuery } from "@tanstack/react-query";
import type { Brand } from "@shared/schema";

export function useBrands() {
  return useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });
}