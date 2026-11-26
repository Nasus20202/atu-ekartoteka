import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

describe('TabsContent', () => {
  it('animates each panel in when its tab is selected', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First panel</TabsContent>
        <TabsContent value="two">Second panel</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('First panel').className).toContain(
      'motion-safe:animate-view-switch'
    );

    await user.click(screen.getByRole('tab', { name: 'Two' }));

    const second = screen.getByText('Second panel');
    expect(second.className).toContain('motion-safe:animate-view-switch');
    expect(second.className).toContain('motion-reduce:animate-none');
  });
});
