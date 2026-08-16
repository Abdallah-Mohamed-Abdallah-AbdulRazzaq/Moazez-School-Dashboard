import type { Pagination } from "@/features/teachers/types/index";

export function derivePagination(pagination: Pagination) {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return {
    totalPages,
    hasNext: pagination.page < totalPages,
    hasPrevious: pagination.page > 1,
  };
}
