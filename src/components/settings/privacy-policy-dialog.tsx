'use client';

import { PolicyText } from '@/components/privacy/policy-text';
import type { PrivacyPolicyEditor } from '@/components/settings/use-privacy-policy-editor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PRIVACY_POLICY_MAX_LENGTH } from '@/lib/settings/constants';

const TEXTAREA_ID = 'privacy-policy-text';
const SYNTAX_HINT =
  'Obsługiwane: nagłówki (#, ##, ###), listy (- oraz 1.), **pogrubienie** i [tekst](https://adres). Pola do uzupełnienia zapisuj jako [[opis]].';
// On a phone the dialog fills the screen, with the tabs on top and the buttons at the bottom.
const FULL_SCREEN_ON_PHONE =
  'max-sm:left-0 max-sm:top-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none';

interface PrivacyPolicyDialogProps {
  editor: PrivacyPolicyEditor;
}

function EmptyPreview({ onLoadTemplate }: { onLoadTemplate: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-dashed p-6">
      <p className="text-sm text-muted-foreground">
        Nie napisano jeszcze polityki prywatności.
      </p>
      <Button type="button" variant="outline" onClick={onLoadTemplate}>
        Zacznij od szablonu
      </Button>
    </div>
  );
}

export function PrivacyPolicyDialog({ editor }: PrivacyPolicyDialogProps) {
  const { draft, remainingPlaceholders, status, saving } = editor;

  return (
    <Dialog
      open={editor.open}
      onOpenChange={(open) => {
        if (!open) void editor.requestClose();
      }}
    >
      <DialogContent
        className={`flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl ${FULL_SCREEN_ON_PHONE}`}
      >
        <DialogHeader className="px-5 pb-3 pr-12 pt-5 text-left sm:px-6 sm:pt-6">
          <DialogTitle>Polityka prywatności</DialogTitle>
          <DialogDescription>
            Tak zobaczą ją odwiedzający serwis.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={editor.tab}
          onValueChange={(tab) => editor.setTab(tab as 'preview' | 'edit')}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-5 self-start sm:mx-6">
            <TabsTrigger value="preview">Podgląd</TabsTrigger>
            <TabsTrigger value="edit">Edycja</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <TabsContent value="preview" className="mt-0">
              {draft.trim() ? (
                <PolicyText text={draft} highlightPlaceholders />
              ) : (
                <EmptyPreview onLoadTemplate={editor.loadTemplate} />
              )}
            </TabsContent>
            <TabsContent value="edit" className="mt-0 space-y-2">
              <Label htmlFor={TEXTAREA_ID}>Tekst polityki (Markdown)</Label>
              <Textarea
                id={TEXTAREA_ID}
                value={draft}
                onChange={(event) => {
                  editor.setDraft(event.target.value);
                  editor.setStatus({ kind: 'idle' });
                }}
                className="min-h-[50dvh] font-mono text-sm"
                spellCheck
              />
              <p className="text-xs text-muted-foreground">
                {SYNTAX_HINT} Najwyżej {PRIVACY_POLICY_MAX_LENGTH} znaków (
                {draft.length}).
              </p>
            </TabsContent>
          </div>
        </Tabs>

        {status.kind === 'error' && (
          <Alert variant="destructive" className="mx-5 mb-3 w-auto sm:mx-6">
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={editor.loadTemplate}
            >
              Wczytaj szablon
            </Button>
            {remainingPlaceholders > 0 && (
              <span className="text-sm text-muted-foreground">
                Pola do uzupełnienia: {remainingPlaceholders}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => void editor.requestClose()}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              disabled={saving || !editor.isDirty}
              onClick={() => void editor.save()}
            >
              {saving ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
