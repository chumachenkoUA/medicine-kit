"use client"

import { useQuery } from "@tanstack/react-query"
import {
  searchMedicines,
  type SearchMedicineResult,
} from "@/lib/client-api/medicines"
import { useDebouncedValue } from "@/components/medicines/hooks/use-debounced-value"

export function useMedicineSearch(query: string) {
  const normalizedQuery = query.trim()
  const debouncedQuery = useDebouncedValue(normalizedQuery, 350)
  const enabled = debouncedQuery.length >= 2

  return useQuery<SearchMedicineResult[]>({
    queryKey: ["medicine-search", debouncedQuery],
    queryFn: ({ signal }) => searchMedicines(debouncedQuery, { signal }),
    enabled,
    staleTime: 60_000,
    retry: 1,
    placeholderData: (previousData) => previousData ?? [],
  })
}
