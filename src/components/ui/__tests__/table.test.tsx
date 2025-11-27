import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

describe('Table', () => {
  it('renders children', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Test table</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(screen.getByText('Test table')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(<Table />);
    const table = container.querySelector('table');
    expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
  });

  it('applies custom className', () => {
    const { container } = render(<Table className="custom" />);
    const table = container.querySelector('table');
    expect(table).toHaveClass('custom');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Table ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('wraps table in overflow container', () => {
    const { container } = render(<Table />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('relative', 'w-full', 'overflow-auto');
  });
});

describe('TableHeader', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(
      <Table>
        <TableHeader />
      </Table>
    );
    const thead = container.querySelector('thead');
    expect(thead).toHaveClass('[&_tr]:border-b');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table>
        <TableHeader className="custom" />
      </Table>
    );
    const thead = container.querySelector('thead');
    expect(thead).toHaveClass('custom');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(
      <Table>
        <TableHeader ref={ref} />
      </Table>
    );
    expect(ref).toHaveBeenCalled();
  });
});

describe('TableBody', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Body</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(
      <Table>
        <TableBody />
      </Table>
    );
    const tbody = container.querySelector('tbody');
    expect(tbody).toHaveClass('[&_tr:last-child]:border-0');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table>
        <TableBody className="custom" />
      </Table>
    );
    const tbody = container.querySelector('tbody');
    expect(tbody).toHaveClass('custom');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(
      <Table>
        <TableBody ref={ref} />
      </Table>
    );
    expect(ref).toHaveBeenCalled();
  });
});

describe('TableFooter', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableFooter>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(
      <Table>
        <TableFooter />
      </Table>
    );
    const tfoot = container.querySelector('tfoot');
    expect(tfoot).toHaveClass(
      'border-t',
      'bg-muted/50',
      'font-medium',
      '[&>tr]:last:border-b-0'
    );
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table>
        <TableFooter className="custom" />
      </Table>
    );
    const tfoot = container.querySelector('tfoot');
    expect(tfoot).toHaveClass('custom');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(
      <Table>
        <TableFooter ref={ref} />
      </Table>
    );
    expect(ref).toHaveBeenCalled();
  });
});

describe('TableRow', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Row')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow />
        </TableBody>
      </Table>
    );
    const tr = container.querySelector('tr');
    expect(tr).toHaveClass(
      'border-b',
      'transition-colors',
      'hover:bg-muted/50',
      'data-[state=selected]:bg-muted'
    );
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow className="custom" />
        </TableBody>
      </Table>
    );
    const tr = container.querySelector('tr');
    expect(tr).toHaveClass('custom');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(
      <Table>
        <TableBody>
          <TableRow ref={ref} />
        </TableBody>
      </Table>
    );
    expect(ref).toHaveBeenCalled();
  });
});

describe('TableHead', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Head</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByText('Head')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
          </TableRow>
        </TableHeader>
      </Table>
    );
    const th = container.querySelector('th');
    expect(th).toHaveClass(
      'h-10',
      'px-2',
      'text-left',
      'align-middle',
      'font-medium',
      'text-muted-foreground'
    );
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="custom" />
          </TableRow>
        </TableHeader>
      </Table>
    );
    const th = container.querySelector('th');
    expect(th).toHaveClass('custom');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead ref={ref} />
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(ref).toHaveBeenCalled();
  });
});

describe('TableCell', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Cell')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    );
    const td = container.querySelector('td');
    expect(td).toHaveClass('p-2', 'align-middle');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="custom" />
          </TableRow>
        </TableBody>
      </Table>
    );
    const td = container.querySelector('td');
    expect(td).toHaveClass('custom');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell ref={ref} />
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(ref).toHaveBeenCalled();
  });
});

describe('TableCaption', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableCaption>Caption</TableCaption>
      </Table>
    );
    expect(screen.getByText('Caption')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(
      <Table>
        <TableCaption />
      </Table>
    );
    const caption = container.querySelector('caption');
    expect(caption).toHaveClass('mt-4', 'text-sm', 'text-muted-foreground');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table>
        <TableCaption className="custom" />
      </Table>
    );
    const caption = container.querySelector('caption');
    expect(caption).toHaveClass('custom');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(
      <Table>
        <TableCaption ref={ref} />
      </Table>
    );
    expect(ref).toHaveBeenCalled();
  });
});
