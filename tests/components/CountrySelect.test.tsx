import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CountrySelect from '@/components/ui/CountrySelect';
import { POPULAR_COUNTRY_CODES } from '@/lib/countries';

/**
 * 新版 CountrySelect 是一个自实现 ARIA combobox:
 * - 触发按钮 role="combobox",关闭态不渲染 options
 * - 点击按钮打开弹层,内部含搜索框 + listbox + role=option 列表
 * - 通过 click 选项触发 onChange(传国家 ISO code)
 */
describe('CountrySelect (combobox)', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    id: 'country-select',
    locale: 'en',
    placeholder: 'Select a country',
  };

  describe('trigger button', () => {
    it('renders a combobox trigger with given placeholder when no value', () => {
      render(<CountrySelect {...defaultProps} />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Select a country');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows localized country label when value is set (en)', () => {
      render(<CountrySelect {...defaultProps} value="CN" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger.textContent).toContain('China');
      expect(trigger.textContent).toContain('+86');
    });

    it('shows Chinese label when locale=zh', () => {
      render(<CountrySelect {...defaultProps} value="CN" locale="zh" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger.textContent).toContain('中国');
    });
  });

  describe('open state and options', () => {
    it('does not render listbox when closed', () => {
      render(<CountrySelect {...defaultProps} />);
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('opens the listbox on trigger click and renders options', () => {
      render(<CountrySelect {...defaultProps} />);
      fireEvent.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThanOrEqual(POPULAR_COUNTRY_CODES.length);
    });

    it('lists every popular country code as an option when open', () => {
      render(<CountrySelect {...defaultProps} />);
      fireEvent.click(screen.getByRole('combobox'));
      const dataValues = screen
        .getAllByRole('option')
        .map((opt) => opt.getAttribute('data-value'));
      POPULAR_COUNTRY_CODES.forEach((code) => {
        expect(dataValues).toContain(code);
      });
    });

    it('places popular countries before alphabetical ones', () => {
      render(<CountrySelect {...defaultProps} />);
      fireEvent.click(screen.getByRole('combobox'));
      const options = screen.getAllByRole('option');
      const chinaIdx = options.findIndex((o) => o.getAttribute('data-value') === 'CN');
      const argentinaIdx = options.findIndex((o) => o.getAttribute('data-value') === 'AR');
      expect(chinaIdx).toBeGreaterThanOrEqual(0);
      expect(argentinaIdx).toBeGreaterThanOrEqual(0);
      expect(chinaIdx).toBeLessThan(argentinaIdx);
    });
  });

  describe('search filtering', () => {
    it('filters options by name substring (en)', () => {
      render(<CountrySelect {...defaultProps} />);
      fireEvent.click(screen.getByRole('combobox'));
      const search = screen.getByRole('searchbox') as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'japa' } });
      const dataValues = screen
        .getAllByRole('option')
        .map((opt) => opt.getAttribute('data-value'));
      expect(dataValues).toContain('JP');
      expect(dataValues).not.toContain('AR');
    });

    it('filters options by dial code', () => {
      render(<CountrySelect {...defaultProps} />);
      fireEvent.click(screen.getByRole('combobox'));
      const search = screen.getByRole('searchbox') as HTMLInputElement;
      fireEvent.change(search, { target: { value: '+44' } });
      const dataValues = screen
        .getAllByRole('option')
        .map((opt) => opt.getAttribute('data-value'));
      expect(dataValues).toContain('GB');
    });

    it('shows noResults text when nothing matches', () => {
      render(<CountrySelect {...defaultProps} noResultsText="Nothing found" />);
      fireEvent.click(screen.getByRole('combobox'));
      const search = screen.getByRole('searchbox') as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'qzqzqz' } });
      expect(screen.getByText('Nothing found')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onChange with country code when an option is clicked', () => {
      const onChange = vi.fn();
      render(<CountrySelect {...defaultProps} onChange={onChange} />);
      fireEvent.click(screen.getByRole('combobox'));
      const option = screen.getAllByRole('option').find(
        (o) => o.getAttribute('data-value') === 'CN'
      );
      expect(option).toBeDefined();
      fireEvent.mouseDown(option!);
      expect(onChange).toHaveBeenCalledWith('CN');
    });
  });

  describe('loading state', () => {
    it('shows loading text on the trigger when isLoading', () => {
      render(<CountrySelect {...defaultProps} isLoading loadingText="Detecting..." />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveTextContent('Detecting...');
    });

    it('disables the trigger when loading', () => {
      render(<CountrySelect {...defaultProps} isLoading />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });
  });

  describe('error state', () => {
    it('applies error border class when hasError', () => {
      render(<CountrySelect {...defaultProps} hasError />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('border-red-500');
    });

    it('sets aria-invalid="true" when hasError', () => {
      render(<CountrySelect {...defaultProps} hasError />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-describedby when hasError and errorId provided', () => {
      render(<CountrySelect {...defaultProps} hasError errorId="country-error" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-describedby', 'country-error');
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<CountrySelect {...defaultProps} disabled />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('marks aria-required="true" when required', () => {
      render(<CountrySelect {...defaultProps} required />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-required', 'true');
    });

    it('uses the given id on the trigger', () => {
      render(<CountrySelect {...defaultProps} id="test-country" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('id', 'test-country');
    });

    it('exposes aria-haspopup="listbox"', () => {
      render(<CountrySelect {...defaultProps} />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('reflects open state via aria-expanded', () => {
      render(<CountrySelect {...defaultProps} />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
