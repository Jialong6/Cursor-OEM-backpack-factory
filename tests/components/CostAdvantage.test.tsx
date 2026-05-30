import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CostAdvantage from '@/components/sections/CostAdvantage';

const messages = {
  costAdvantage: {
    title: 'Why Myanmar: The Cost-vs-Lead-Time Sweet Spot',
    subtitle: 'Same product, same destination (Japan).',
    countries: [
      {
        code: 'CN',
        name: 'China',
        priceLabel: 'Price',
        priceValue: 'Baseline',
        pricePercent: 100,
        leadTimeLabel: 'Lead Time',
        leadTimeValue: 'Baseline',
        leadTimePercent: 33,
      },
      {
        code: 'VN',
        name: 'Vietnam',
        priceLabel: 'Price',
        priceValue: 'Same as China',
        pricePercent: 100,
        leadTimeLabel: 'Lead Time',
        leadTimeValue: '+1 month',
        leadTimePercent: 66,
      },
      {
        code: 'MM',
        name: 'Myanmar (Better Bags)',
        priceLabel: 'Price',
        priceValue: '-10% vs China & Vietnam',
        pricePercent: 90,
        leadTimeLabel: 'Lead Time',
        leadTimeValue: '+2 months',
        leadTimePercent: 100,
        badge: 'Best Value',
      },
    ],
    takeaway: 'Trade 2 months for 10% savings.',
    cta: 'Get A Quote',
  },
};

function renderSection() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CostAdvantage />
    </NextIntlClientProvider>
  );
}

describe('CostAdvantage', () => {
  it('renders all three country cards', () => {
    renderSection();
    expect(screen.getByRole('heading', { name: 'China' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vietnam' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Myanmar (Better Bags)' })).toBeInTheDocument();
  });

  it('renders the Best Value badge only on the Myanmar card', () => {
    renderSection();
    const badges = screen.getAllByText('Best Value');
    expect(badges).toHaveLength(1);
    const mmCard = screen.getByRole('article', { name: 'Myanmar (Better Bags)' });
    expect(within(mmCard).getByText('Best Value')).toBeInTheDocument();
  });

  it('exposes accurate progressbar aria-valuenow per metric', () => {
    renderSection();
    const cnCard = screen.getByRole('article', { name: 'China' });
    const cnBars = within(cnCard).getAllByRole('progressbar');
    expect(cnBars[0]).toHaveAttribute('aria-valuenow', '100'); // price
    expect(cnBars[1]).toHaveAttribute('aria-valuenow', '33'); // lead time

    const vnCard = screen.getByRole('article', { name: 'Vietnam' });
    const vnBars = within(vnCard).getAllByRole('progressbar');
    expect(vnBars[0]).toHaveAttribute('aria-valuenow', '100');
    expect(vnBars[1]).toHaveAttribute('aria-valuenow', '66');

    const mmCard = screen.getByRole('article', { name: 'Myanmar (Better Bags)' });
    const mmBars = within(mmCard).getAllByRole('progressbar');
    expect(mmBars[0]).toHaveAttribute('aria-valuenow', '90');
    expect(mmBars[1]).toHaveAttribute('aria-valuenow', '100');
  });

  it('renders the takeaway text and CTA link to #contact', () => {
    renderSection();
    expect(screen.getByText('Trade 2 months for 10% savings.')).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: 'Get A Quote' });
    expect(cta).toHaveAttribute('href', '#contact');
  });

  it('progressbar aria-label combines label and value for screen readers', () => {
    renderSection();
    const mmCard = screen.getByRole('article', { name: 'Myanmar (Better Bags)' });
    const priceBar = within(mmCard).getAllByRole('progressbar')[0];
    expect(priceBar).toHaveAttribute('aria-label', 'Price: -10% vs China & Vietnam');
  });
});
