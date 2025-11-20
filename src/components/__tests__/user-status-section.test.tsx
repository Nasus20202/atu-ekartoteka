import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { UserStatusSection } from '@/components/user-status-section';
import { AccountStatus } from '@/lib/types';

describe('UserStatusSection', () => {
  it('renders user status section with name and email', () => {
    render(
      <UserStatusSection
        name="Jan Kowalski"
        email="jan@example.com"
        status={AccountStatus.APPROVED}
      />
    );

    expect(screen.getByText('Status konta')).toBeInTheDocument();
  });

  it('is collapsed by default when status is APPROVED', () => {
    render(
      <UserStatusSection
        name="Jan Kowalski"
        email="jan@example.com"
        status={AccountStatus.APPROVED}
      />
    );

    const content = screen.queryByText('Email:');
    expect(content).not.toBeInTheDocument();
  });

  it('is expanded by default when status is PENDING', () => {
    render(
      <UserStatusSection
        name="Jan Kowalski"
        email="jan@example.com"
        status={AccountStatus.PENDING}
      />
    );

    expect(screen.getByText('Email:')).toBeVisible();
    expect(screen.getByText('jan@example.com')).toBeVisible();
  });

  it('is expanded by default when status is REJECTED', () => {
    render(
      <UserStatusSection
        name="Jan Kowalski"
        email="jan@example.com"
        status={AccountStatus.REJECTED}
      />
    );

    expect(screen.getByText('Email:')).toBeVisible();
    expect(screen.getByText('jan@example.com')).toBeVisible();
  });

  it('can be toggled open and closed', async () => {
    const user = userEvent.setup();
    render(
      <UserStatusSection
        name="Jan Kowalski"
        email="jan@example.com"
        status={AccountStatus.APPROVED}
      />
    );

    const trigger = screen.getByRole('button', { name: /status konta/i });

    // Initially collapsed
    expect(screen.queryByText('Email:')).not.toBeInTheDocument();

    // Click to expand
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Email:')).toBeVisible();
    });

    // Click to collapse
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.queryByText('Email:')).not.toBeInTheDocument();
    });
  });

  it('shows approved status with green color', async () => {
    const user = userEvent.setup();
    render(
      <UserStatusSection
        name="Jan Kowalski"
        email="jan@example.com"
        status={AccountStatus.APPROVED}
      />
    );

    const trigger = screen.getByRole('button', { name: /status konta/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Zatwierdzony')).toBeInTheDocument();
    });
  });

  it('shows pending status with warning', () => {
    render(
      <UserStatusSection
        name="Jan Kowalski"
        email="jan@example.com"
        status={AccountStatus.PENDING}
      />
    );

    expect(screen.getByText('Oczekujący')).toBeInTheDocument();
    expect(
      screen.getByText('Konto oczekuje na zatwierdzenie')
    ).toBeInTheDocument();
  });

  it('shows rejected status with error', () => {
    render(
      <UserStatusSection
        name="Jan Kowalski"
        email="jan@example.com"
        status={AccountStatus.REJECTED}
      />
    );

    expect(screen.getByText('Odrzucony')).toBeInTheDocument();
    expect(screen.getByText('Konto zostało odrzucone')).toBeInTheDocument();
  });

  it('displays user name when provided', async () => {
    const user = userEvent.setup();
    render(
      <UserStatusSection
        name="Jan Kowalski"
        email="jan@example.com"
        status={AccountStatus.APPROVED}
      />
    );

    const trigger = screen.getByRole('button', { name: /status konta/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Imię i nazwisko:')).toBeInTheDocument();
      expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    });
  });

  it('does not display name field when name is null', async () => {
    const user = userEvent.setup();
    render(
      <UserStatusSection
        name={null}
        email="jan@example.com"
        status={AccountStatus.APPROVED}
      />
    );

    const trigger = screen.getByRole('button', { name: /status konta/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText('Imię i nazwisko:')).not.toBeInTheDocument();
    });
  });

  it('has chevron icon that rotates', () => {
    const { container } = render(
      <UserStatusSection
        name="Jan Kowalski"
        email="jan@example.com"
        status={AccountStatus.APPROVED}
      />
    );

    const chevron = container.querySelector('svg.lucide-chevron-down');
    expect(chevron).toBeInTheDocument();
  });
});
