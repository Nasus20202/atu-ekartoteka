import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FileInput } from '@/components/ui/file-input';

const pdf = (name: string) => new File(['x'], name);

function fileInFolder(path: string) {
  const file = new File(['x'], path.split('/')[1]);
  Object.defineProperty(file, 'webkitRelativePath', { value: path });
  return file;
}

function renderInput(files: File[] | null, directory = false) {
  render(
    <>
      <label htmlFor="picker">Pliki</label>
      <FileInput id="picker" files={files} directory={directory} />
    </>
  );
  return screen.getByLabelText('Pliki');
}

describe('FileInput', () => {
  it('asks for files in Polish and hides the browser tooltip', () => {
    const input = renderInput(null);

    expect(screen.getByText('Wybierz pliki')).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription('Nie wybrano plików');
    expect(input).toHaveAttribute('title', '');
    expect(input).toHaveClass('opacity-0');
    expect(input).not.toHaveAttribute('webkitdirectory');
  });

  it('asks for a folder', () => {
    const input = renderInput([], true);

    expect(screen.getByText('Wybierz folder')).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription('Nie wybrano folderu');
    expect(input).toHaveAttribute('webkitdirectory');
  });

  it('names a single chosen file, animated', () => {
    renderInput([pdf('media.pdf')]);

    expect(screen.getByText('media.pdf')).toHaveClass(
      'motion-safe:animate-fade-in'
    );
  });

  it('counts several chosen files', () => {
    const input = renderInput([pdf('a.pdf'), pdf('b.pdf')]);

    expect(input).toHaveAccessibleDescription('Wybrano plików: 2');
  });

  it('names the chosen folder and counts its files', () => {
    const input = renderInput(
      [fileInFolder('HOA01/lok.txt'), fileInFolder('HOA01/wplaty.txt')],
      true
    );

    expect(input).toHaveAccessibleDescription('HOA01 · plików: 2');
  });

  it('counts files that come without a folder path', () => {
    const input = renderInput([pdf('lok.txt')], true);

    expect(input).toHaveAccessibleDescription('Wybrano plików: 1');
  });

  it('passes the chosen files to the caller', async () => {
    const onChange = vi.fn();
    render(
      <FileInput
        id="picker"
        aria-label="Pliki"
        files={null}
        onChange={onChange}
      />
    );

    await userEvent.upload(screen.getByLabelText('Pliki'), pdf('a.pdf'));

    expect(onChange).toHaveBeenCalledOnce();
  });
});
