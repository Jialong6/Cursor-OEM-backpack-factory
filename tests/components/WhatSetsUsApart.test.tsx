import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import WhatSetsUsApart from '@/components/sections/WhatSetsUsApart';

const messages = {
  whatSetsUsApart: {
    title: 'What Sets Us Apart',
    subtitle: 'Three operational disciplines.',
    items: [
      {
        key: 'qc',
        title: 'Japanese-Grade Quality Control',
        description: 'Strict broken-needle logs and 100% X-ray screening.',
      },
      {
        key: 'cost',
        title: 'China-Myanmar Cost Engineering',
        description: 'Chinese supply-chain orchestration with Yangon labor.',
      },
      {
        key: 'leadTime',
        title: 'Capacity-Locked 4-Month Lead Time',
        description: 'Never over-booked, 4-month windows guaranteed.',
      },
    ],
  },
};

function renderSection() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <WhatSetsUsApart />
    </NextIntlClientProvider>
  );
}

describe('WhatSetsUsApart', () => {
  it('renders the section title and subtitle', () => {
    renderSection();
    expect(screen.getByRole('heading', { name: 'What Sets Us Apart' })).toBeInTheDocument();
    expect(screen.getByText('Three operational disciplines.')).toBeInTheDocument();
  });

  it('renders all three differentiator cards with titles and descriptions', () => {
    renderSection();
    const titles = [
      'Japanese-Grade Quality Control',
      'China-Myanmar Cost Engineering',
      'Capacity-Locked 4-Month Lead Time',
    ];
    for (const title of titles) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.getByText('Strict broken-needle logs and 100% X-ray screening.')).toBeInTheDocument();
    expect(screen.getByText('Chinese supply-chain orchestration with Yangon labor.')).toBeInTheDocument();
    expect(screen.getByText('Never over-booked, 4-month windows guaranteed.')).toBeInTheDocument();
  });

  it('each card embeds a decorative SVG icon with aria-hidden', () => {
    const { container } = renderSection();
    const articles = container.querySelectorAll('article');
    expect(articles).toHaveLength(3);
    for (const article of Array.from(articles)) {
      const svg = article.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('each card uses its title as accessible name', () => {
    renderSection();
    const qcCard = screen.getByRole('article', { name: 'Japanese-Grade Quality Control' });
    expect(within(qcCard).getByRole('heading', { name: 'Japanese-Grade Quality Control' })).toBeInTheDocument();
  });
});
