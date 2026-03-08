import { describe, it, expect } from 'vitest';
import { calculateGST, formatCurrency } from '../gst-calculator';

describe('calculateGST', () => {
  it('calculates 9% GST correctly', () => {
    const result = calculateGST(100, 9);
    expect(result).toEqual({
      subtotal: 100,
      gstAmount: 9,
      total: 109,
    });
  });

  it('calculates GST with decimal amounts', () => {
    const result = calculateGST(99.99, 9);
    expect(result.subtotal).toBe(99.99);
    expect(result.gstAmount).toBe(9);
    expect(result.total).toBe(108.99);
  });

  it('handles zero subtotal', () => {
    const result = calculateGST(0, 9);
    expect(result).toEqual({
      subtotal: 0,
      gstAmount: 0,
      total: 0,
    });
  });

  it('handles zero GST rate', () => {
    const result = calculateGST(100, 0);
    expect(result).toEqual({
      subtotal: 100,
      gstAmount: 0,
      total: 100,
    });
  });

  it('handles large amounts', () => {
    const result = calculateGST(10000, 9);
    expect(result).toEqual({
      subtotal: 10000,
      gstAmount: 900,
      total: 10900,
    });
  });

  it('rounds GST amount to 2 decimal places', () => {
    // 33.33 * 0.09 = 2.9997 -> should round to 3.00
    const result = calculateGST(33.33, 9);
    expect(result.gstAmount).toBe(3);
    expect(result.total).toBe(36.33);
  });

  it('handles fractional cent rounding', () => {
    // 10.01 * 0.09 = 0.9009 -> rounds to 0.90
    const result = calculateGST(10.01, 9);
    expect(result.gstAmount).toBe(0.9);
    expect(result.total).toBe(10.91);
  });

  it('handles different GST rates', () => {
    const result = calculateGST(100, 7);
    expect(result).toEqual({
      subtotal: 100,
      gstAmount: 7,
      total: 107,
    });
  });

  it('handles small amounts', () => {
    const result = calculateGST(0.01, 9);
    expect(result.gstAmount).toBe(0);
    expect(result.total).toBe(0.01);
  });
});

describe('formatCurrency', () => {
  it('formats SGD amounts with S$ prefix', () => {
    expect(formatCurrency(123.45)).toBe('S$123.45');
  });

  it('formats SGD with explicit currency parameter', () => {
    expect(formatCurrency(123.45, 'SGD')).toBe('S$123.45');
  });

  it('formats zero amount', () => {
    expect(formatCurrency(0)).toBe('S$0.00');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-50.00)).toBe('S$-50.00');
  });

  it('formats large amounts', () => {
    expect(formatCurrency(12345.67)).toBe('S$12345.67');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(10.999)).toBe('S$11.00');
  });

  it('pads to 2 decimal places', () => {
    expect(formatCurrency(10)).toBe('S$10.00');
  });

  it('handles USD currency', () => {
    const result = formatCurrency(100, 'USD');
    // Should use Intl.NumberFormat — result varies by locale but should contain 100.00
    expect(result).toContain('100.00');
  });

  it('handles invalid currency code gracefully', () => {
    const result = formatCurrency(100, 'INVALID');
    // Should fallback to "INVALID 100.00"
    expect(result).toBe('INVALID 100.00');
  });
});
