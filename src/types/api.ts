import type { OrdemServico } from '@/lib/types';

export type Pagination = {
  page: number;
  size: number;
  total: number | null;
  pages: number;
};

export type OSListResponse = {
  items: OrdemServico[];
  pagination: Pagination;
};
