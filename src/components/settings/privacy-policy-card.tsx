'use client';

import Link from 'next/link';

import { PRIVACY_PATH } from '@/components/privacy/privacy-link';
import { PrivacyPolicyDialog } from '@/components/settings/privacy-policy-dialog';
import { usePrivacyPolicyEditor } from '@/components/settings/use-privacy-policy-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SuccessMessage } from '@/components/ui/success-message';

interface PrivacyPolicyCardProps {
  initialPolicy: string | null;
}

export function PrivacyPolicyCard({ initialPolicy }: PrivacyPolicyCardProps) {
  const editor = usePrivacyPolicyEditor(initialPolicy);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>Polityka prywatności</CardTitle>
          <Badge variant={editor.isPublished ? 'default' : 'outline'}>
            {editor.isPublished ? 'Opublikowana' : 'Nieopublikowana'}
          </Badge>
        </div>
        <CardDescription>
          Tekst dostępny publicznie przez link w stopce każdej strony i w
          wiadomościach e-mail. Gdy zmieni się sposób przetwarzania danych,
          sprawdź, czy polityka jest nadal aktualna.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {editor.status.kind === 'saved' && (
          <SuccessMessage>Zapisano ustawienia</SuccessMessage>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={editor.openEditor}>
            {editor.isPublished ? 'Edytuj' : 'Napisz politykę'}
          </Button>
          <Button asChild variant="outline">
            <Link href={PRIVACY_PATH}>Zobacz stronę</Link>
          </Button>
        </div>
      </CardContent>
      <PrivacyPolicyDialog editor={editor} />
    </Card>
  );
}
