import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CountrySelect from '@/components/ui/CountrySelect';
import { COUNTRIES, POPULAR_COUNTRY_CODES } from '@/lib/countries';

describe('CountrySelect', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    id: 'country-select',
    locale: 'en',
  };

  describe('rendering', () => {
    it('should render a select element', () => {
      render(<CountrySelect {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should render all country options', () => {
      render(<CountrySelect {...defaultProps} />);
      const options = screen.getAllByRole('option');
      // +1 for placeholder option, +1 for separator
      expect(options.length).toBeGreaterThanOrEqual(COUNTRIES.length + 1);
    });

    it('should display placeholder text', () => {
      render(<CountrySelect {...defaultProps} placeholder="Select a country" />);
      const placeholder = screen.getByText('Select a country');
      expect(placeholder).toBeInTheDocument();
    });

    it('should show Chinese names for zh locale', () => {
      render(<CountrySelect {...defaultProps} locale="zh" />);
      const chinaOption = screen.getByText('中国');
      expect(chinaOption).toBeInTheDocument();
    });

    it('should show English names for en locale', () => {
      render(<CountrySelect {...defaultProps} locale="en" />);
      const chinaOption = screen.getByText('China');
      expect(chinaOption).toBeInTheDocument();
    });
  });

  describe('popular countries', () => {
    it('should display popular countries before other countries', () => {
      render(<CountrySelect {...defaultProps} locale="en" />);
      const options = screen.getAllByRole('option');

      // Find China (popular) and Australia (not popular, but comes first alphabetically)
      const chinaIndex = options.findIndex((opt) => opt.textContent === 'China');
      const australiaIndex = options.findIndex((opt) => opt.textContent === 'Australia');

      // China should come before Australia since China is popular
      expect(chinaIndex).toBeLessThan(australiaIndex);
    });

    it('should include all popular countries in options', () => {
      render(<CountrySelect {...defaultProps} locale="en" />);

      const optionsText = screen
        .getAllByRole('option')
        .map((opt) => (opt as HTMLOptionElement).value);

      POPULAR_COUNTRY_CODES.forEach((code) => {
        expect(optionsText).toContain(code);
      });
    });
  });

  describe('interaction', () => {
    it('should call onChange when selection changes', () => {
      const onChange = vi.fn();
      render(<CountrySelect {...defaultProps} onChange={onChange} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'CN' } });

      expect(onChange).toHaveBeenCalledWith('CN');
    });

    it('should display selected value', () => {
      render(<CountrySelect {...defaultProps} value="US" />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('US');
    });
  });

  describe('loading state', () => {
    it('should show loading text when isLoading is true', () => {
      render(<CountrySelect {...defaultProps} isLoading loadingText="Detecting..." />);
      const loadingOption = screen.getByText('Detecting...');
      expect(loadingOption).toBeInTheDocument();
    });

    it('should disable select when loading', () => {
      render(<CountrySelect {...defaultProps} isLoading />);
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  describe('error state', () => {
    it('should apply error styles when hasError is true', () => {
      render(<CountrySelect {...defaultProps} hasError />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-500');
    });

    it('should have aria-invalid when hasError is true', () => {
      render(<CountrySelect {...defaultProps} hasError />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    it('should reference error message via aria-describedby', () => {
      render(<CountrySelect {...defaultProps} hasError errorId="country-error" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', 'country-error');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<CountrySelect {...defaultProps} disabled />);
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should have aria-required when required', () => {
      render(<CountrySelect {...defaultProps} required />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-required', 'true');
    });

    it('should have correct id attribute', () => {
      render(<CountrySelect {...defaultProps} id="test-country" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'test-country');
    });

    it('should not have aria-describedby when no error', () => {
      render(<CountrySelect {...defaultProps} hasError={false} />);
      const select = screen.getByRole('combobox');
      expect(select).not.toHaveAttribute('aria-describedby');
    });
  });
});
