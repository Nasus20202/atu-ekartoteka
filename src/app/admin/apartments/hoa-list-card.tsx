import { Building2, Edit2 } from 'lucide-react';
import Link from 'next/link';

import { formatImportDate } from '@/app/admin/apartments/hoa-labels';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { HoaListItemDto } from '@/lib/types/dto/hoa-dto';
import { APARTMENT_FORMS, pluralizePl } from '@/lib/utils/pluralize';

interface HoaListCardProps {
  hoa: HoaListItemDto;
  editing: boolean;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function HoaListCard({
  hoa,
  editing,
  editingName,
  onEditingNameChange,
  onStartEdit,
  onSave,
  onCancel,
}: HoaListCardProps) {
  const aptDate = formatImportDate(hoa.apartmentsDataDate);
  const chgDate = formatImportDate(hoa.chargesDataDate);
  const notDate = formatImportDate(hoa.notificationsDataDate);
  const hasImportDates = aptDate || chgDate || notDate;

  return (
    <Card className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                className="h-8 mb-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSave();
                  else if (e.key === 'Escape') onCancel();
                }}
              />
            ) : (
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="truncate">{hoa.name}</span>
              </CardTitle>
            )}
            <CardDescription className="font-mono text-xs">
              {hoa.externalId}
            </CardDescription>
          </div>
          {editing ? (
            <div className="flex gap-1 shrink-0">
              <Button size="sm" onClick={onSave} className="h-8">
                Zapisz
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                className="h-8"
              >
                Anuluj
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={onStartEdit}
              className="h-8 shrink-0"
              aria-label={`Zmień nazwę wspólnoty ${hoa.name}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-3xl font-bold text-primary">
              {hoa.apartmentCount}
            </div>
            <p className="text-sm text-muted-foreground">
              {pluralizePl(hoa.apartmentCount, APARTMENT_FORMS)}
            </p>
          </div>
          {hasImportDates && (
            <div className="text-right space-y-0.5 text-xs text-muted-foreground">
              {aptDate && <p>Mieszkania: {aptDate}</p>}
              {chgDate && <p>Naliczenia: {chgDate}</p>}
              {notDate && <p>Powiadomienia: {notDate}</p>}
            </div>
          )}
        </div>
        <Link href={`/admin/apartments/${hoa.id}`}>
          <Button className="w-full">Zobacz mieszkania</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
