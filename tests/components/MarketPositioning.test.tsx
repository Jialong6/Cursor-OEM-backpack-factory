import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import MarketPositioning from '@/components/sections/MarketPositioning';

const messages = {
  marketPositioning: {
    title: 'Where Better Bags Stands',
    subtitle: 'Map factories on a profit × quality grid.',
    axes: {
      profit: {
        low: 'Thin margins',
        high: 'Healthy margins',
      },
      quality: {
        low: 'Unstable quality',
        high: 'Reliable quality',
      },
    },
    quadrants: [
      {
        position: 'topRight',
        title: 'Better Bags',
        description: 'Cost-efficient with Japanese QC.',
        badge: 'Best Position',
      },
      {
        position: 'topLeft',
        title: 'Large-Scale Chinese Factories',
        description: 'Stable quality but thin margins.',
      },
      {
        position: 'bottomRight',
        title: 'Low-End Southeast Asian Shops',
        description: 'Cheap but risky.',
      },
      {
        position: 'bottomLeft',
        title: 'Under-Resourced Workshops',
        description: 'No scale, no audits.',
      },
    ],
  },
};

function renderSection() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MarketPositioning />
    </NextIntlClientProvider>
  );
}

describe('MarketPositioning', () => {
  it('renders the section title and subtitle', () => {
    renderSection();
    expect(screen.getByRole('heading', { name: 'Where Better Bags Stands' })).toBeInTheDocument();
    expect(screen.getByText('Map factories on a profit × quality grid.')).toBeInTheDocument();
  });

  it('renders all four quadrant titles', () => {
    renderSection();
    expect(screen.getByRole('heading', { name: 'Better Bags' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Large-Scale Chinese Factories' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Low-End Southeast Asian Shops' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Under-Resourced Workshops' })).toBeInTheDocument();
  });

  it('renders the Best Position badge only on the Better Bags quadrant', () => {
    renderSection();
    const badges = screen.getAllByText('Best Position');
    expect(badges).toHaveLength(1);
    const bbCard = screen.getByRole('article', { name: 'Better Bags' });
    expect(within(bbCard).getByText('Best Position')).toBeInTheDocument();
  });

  it('applies a muted background to the bottom-left quadrant (workshops)', () => {
    renderSection();
    const workshopsCard = screen.getByRole('article', { name: 'Under-Resourced Workshops' });
    expect(workshopsCard.className).toContain('bg-neutral-100');
  });

  it('renders all four axis labels', () => {
    renderSection();
    expect(screen.getByText('Thin margins')).toBeInTheDocument();
    expect(screen.getByText('Healthy margins')).toBeInTheDocument();
    expect(screen.getByText('Unstable quality')).toBeInTheDocument();
    expect(screen.getByText('Reliable quality')).toBeInTheDocument();
  });

  it('axis arrow SVGs are decorative (aria-hidden)', () => {
    const { container } = renderSection();
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
    for (const svg of Array.from(svgs)) {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
