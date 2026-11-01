import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function renderDialog(open: boolean, onOpenChange = vi.fn()) {
  render(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Title</DialogTitle>
          <DialogDescription>Test Description</DialogDescription>
        </DialogHeader>
        <DialogFooter data-testid="dialog-footer">
          <DialogClose asChild>
            <Button variant="outline">Anuluj</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return onOpenChange;
}

describe('Dialog', () => {
  describe('Rendering', () => {
    it('renders title and description when open', () => {
      renderDialog(true);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('renders nothing when closed', () => {
      renderDialog(false);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('applies the footer layout classes', () => {
      renderDialog(true);

      expect(screen.getByTestId('dialog-footer')).toHaveClass(
        'flex',
        'flex-col-reverse'
      );
    });
  });

  describe('Closing', () => {
    it('calls onOpenChange(false) when the close button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = renderDialog(true);

      await user.click(screen.getByRole('button', { name: 'Zamknij okno' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange(false) when Escape is pressed', async () => {
      const user = userEvent.setup();
      const onOpenChange = renderDialog(true);

      await user.keyboard('{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange(false) when clicking outside the dialog', async () => {
      const onOpenChange = renderDialog(true);

      // Radix attaches its outside-press listener after a timer tick
      await new Promise((resolve) => setTimeout(resolve, 0));
      // Radix ignores the press until the click completes, and disables pointer
      // events outside the open modal, so dispatch both events on the page directly
      fireEvent.pointerDown(document.body, { button: 0 });
      fireEvent.click(document.body);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes through a footer DialogClose button', async () => {
      const user = userEvent.setup();
      const onOpenChange = renderDialog(true);

      await user.click(screen.getByRole('button', { name: 'Anuluj' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not close when clicking inside the dialog', async () => {
      const user = userEvent.setup();
      const onOpenChange = renderDialog(true);

      await user.click(screen.getByText('Test Title'));

      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });
});
