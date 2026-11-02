'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ApartmentSearchForm({
  defaultSearch,
  onSearch,
}: {
  defaultSearch: string;
  onSearch: (search: string) => void;
}) {
  const [searchInput, setSearchInput] = useState(defaultSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Wyszukaj..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button type="submit">Szukaj</Button>
    </form>
  );
}
