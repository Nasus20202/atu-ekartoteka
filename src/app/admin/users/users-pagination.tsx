import { Button } from '@/components/ui/button';

interface UsersPaginationProps {
  page: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}

export function UsersPagination({
  page,
  totalPages,
  disabled,
  onPageChange,
}: UsersPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1 || disabled}
      >
        Poprzednia
      </Button>
      <span className="text-sm text-muted-foreground">
        Strona {page} z {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages || disabled}
      >
        Następna
      </Button>
    </div>
  );
}
