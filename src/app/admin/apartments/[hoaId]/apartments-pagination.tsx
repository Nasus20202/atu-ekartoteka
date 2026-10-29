import { ChevronLeft, ChevronRight } from 'lucide-react';

import { getPageItems } from '@/app/admin/apartments/[hoaId]/apartment-list-utils';
import { Button } from '@/components/ui/button';

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function ApartmentsPagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        Poprzednia
      </Button>

      <div className="flex items-center gap-1">
        {getPageItems(pagination.page, pagination.totalPages).map(
          (item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={item}
                variant={item === pagination.page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page === pagination.totalPages}
      >
        Następna
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
