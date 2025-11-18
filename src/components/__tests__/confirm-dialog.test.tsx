import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmProvider, useConfirm } from '@/components/confirm-dialog';

function TestComponent() {
  const confirm = useConfirm();

  const handleDefaultConfirm = async () => {
    const result = await confirm({
      description: 'Are you sure you want to proceed?',
    });
    return result;
  };

  const handleCustomConfirm = async () => {
    const result = await confirm({
      title: 'Custom Title',
      description: 'Custom description text',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    return result;
  };

  const handleDestructiveConfirm = async () => {
    const result = await confirm({
      description: 'This action cannot be undone',
      variant: 'destructive',
    });
    return result;
  };

  return (
    <div>
      <button onClick={handleDefaultConfirm}>Default Confirm</button>
      <button onClick={handleCustomConfirm}>Custom Confirm</button>
      <button onClick={handleDestructiveConfirm}>Destructive Confirm</button>
    </div>
  );
}

describe('ConfirmDialog', () => {
  describe('ConfirmProvider', () => {
    it('should render children', () => {
      render(
        <ConfirmProvider>
          <div>Test Content</div>
        </ConfirmProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should not display dialog initially', () => {
      render(
        <ConfirmProvider>
          <div>Test Content</div>
        </ConfirmProvider>
      );

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('useConfirm hook', () => {
    it('should throw error when used outside ConfirmProvider', () => {
      // Suppress console.error for this test as it's expected to throw
      const originalError = console.error;
      console.error = vi.fn();

      const TestComponentWithoutProvider = () => {
        try {
          useConfirm();
          return <div>Should not reach here</div>;
        } catch (error) {
          return <div>Error: {(error as Error).message}</div>;
        }
      };

      render(<TestComponentWithoutProvider />);

      expect(
        screen.getByText(
          'Error: useConfirm must be used within ConfirmProvider'
        )
      ).toBeInTheDocument();

      console.error = originalError;
    });
  });

  describe('Dialog display', () => {
    it('should show dialog with default texts', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmProvider>
          <TestComponent />
        </ConfirmProvider>
      );

      await user.click(screen.getByText('Default Confirm'));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      expect(screen.getByText('Potwierdź akcję')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to proceed?')
      ).toBeInTheDocument();
      expect(screen.getByText('Anuluj')).toBeInTheDocument();
      expect(screen.getByText('Potwierdź')).toBeInTheDocument();
    });

    it('should show dialog with custom texts', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmProvider>
          <TestComponent />
        </ConfirmProvider>
      );

      await user.click(screen.getByText('Custom Confirm'));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('should show destructive variant styling', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmProvider>
          <TestComponent />
        </ConfirmProvider>
      );

      await user.click(screen.getByText('Destructive Confirm'));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Potwierdź');
      expect(confirmButton).toHaveClass('bg-destructive');
      expect(confirmButton).toHaveClass('text-destructive-foreground');
    });
  });

  describe('User interactions', () => {
    it('should resolve with true when confirm button is clicked', async () => {
      const user = userEvent.setup();
      let result: boolean | undefined;

      function TestWithResult() {
        const confirm = useConfirm();

        const handleClick = async () => {
          result = await confirm({
            description: 'Test description',
          });
        };

        return <button onClick={handleClick}>Open</button>;
      }

      render(
        <ConfirmProvider>
          <TestWithResult />
        </ConfirmProvider>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Potwierdź'));

      await waitFor(() => {
        expect(result).toBe(true);
      });
    });

    it('should resolve with false when cancel button is clicked', async () => {
      const user = userEvent.setup();
      let result: boolean | undefined;

      function TestWithResult() {
        const confirm = useConfirm();

        const handleClick = async () => {
          result = await confirm({
            description: 'Test description',
          });
        };

        return <button onClick={handleClick}>Open</button>;
      }

      render(
        <ConfirmProvider>
          <TestWithResult />
        </ConfirmProvider>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Anuluj'));

      await waitFor(() => {
        expect(result).toBe(false);
      });
    });

    it('should close dialog after confirm', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmProvider>
          <TestComponent />
        </ConfirmProvider>
      );

      await user.click(screen.getByText('Default Confirm'));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Potwierdź'));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('should close dialog after cancel', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmProvider>
          <TestComponent />
        </ConfirmProvider>
      );

      await user.click(screen.getByText('Default Confirm'));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Anuluj'));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multiple confirms', () => {
    it('should handle multiple sequential confirms', async () => {
      const user = userEvent.setup();
      const results: boolean[] = [];

      function TestMultiple() {
        const confirm = useConfirm();

        const handleClick = async () => {
          const result1 = await confirm({
            description: 'First confirm',
          });
          results.push(result1);

          const result2 = await confirm({
            description: 'Second confirm',
          });
          results.push(result2);
        };

        return <button onClick={handleClick}>Open</button>;
      }

      render(
        <ConfirmProvider>
          <TestMultiple />
        </ConfirmProvider>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('First confirm')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Potwierdź'));

      await waitFor(() => {
        expect(screen.getByText('Second confirm')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Anuluj'));

      await waitFor(() => {
        expect(results).toEqual([true, false]);
      });
    });
  });
});
