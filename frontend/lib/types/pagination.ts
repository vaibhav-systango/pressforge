import type { Draft } from './index';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DraftStatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
  published: number;
  generated?: number;
  generated_images?: number;
  all: number;
}

export interface PaginatedDraftListResponse {
  drafts: Draft[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  counts?: DraftStatusCounts;
}
