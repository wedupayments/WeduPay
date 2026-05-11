import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProviderSelector } from './ProviderSelector';

jest.mock('../api/payment.api', () => ({
  fetchFxRate: jest.fn().mockResolvedValue({
    from: 'USD',
    to: 'ZWL',
    rate: 8500,
    inverseRate: 0.000118,
    updatedAt: new Date().toISOString(),
  }),
}));

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const defaultProps = {
  amountUsd: 150,
  country: 'ZW' as const,
  onNext: jest.fn(),
  onBack: jest.fn(),
};

function submitForm() {
  // fireEvent.submit bypasses jsdom's native `required` validation so our
  // React handler runs regardless of empty fields — that's what we want to test.
  fireEvent.submit(screen.getByText('Continue').closest('form')!);
}

describe('ProviderSelector', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders available providers for Zimbabwe', () => {
    render(<ProviderSelector {...defaultProps} />, { wrapper: makeWrapper() });
    expect(screen.getByText('EcoCash')).toBeInTheDocument();
    expect(screen.getByText('PawaPay')).toBeInTheDocument();
  });

  it('calls onBack when Back is clicked', () => {
    render(<ProviderSelector {...defaultProps} />, { wrapper: makeWrapper() });
    fireEvent.click(screen.getByText('Back'));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('shows error if submitted without selecting a provider', async () => {
    render(<ProviderSelector {...defaultProps} />, { wrapper: makeWrapper() });
    await act(async () => { submitForm(); });
    expect(screen.getByText('Select a payment provider')).toBeInTheDocument();
  });

  it('shows error if submitted without a phone number', async () => {
    render(<ProviderSelector {...defaultProps} />, { wrapper: makeWrapper() });

    await act(async () => { fireEvent.click(screen.getByText('EcoCash')); });
    // Wait for the FX rate to load so the rate guard passes
    await waitFor(() => screen.getByText(/8,500/));

    await act(async () => { submitForm(); });
    expect(screen.getByText('Enter your mobile money number')).toBeInTheDocument();
  });

  it('calls onNext with provider, phone, currency, and rate once rate is loaded', async () => {
    render(<ProviderSelector {...defaultProps} />, { wrapper: makeWrapper() });

    await act(async () => { fireEvent.click(screen.getByText('EcoCash')); });
    await waitFor(() => screen.getByText(/8,500/));

    fireEvent.change(screen.getByPlaceholderText('+263771234567'), {
      target: { value: '+263771234567' },
    });

    await act(async () => { submitForm(); });

    await waitFor(() => {
      expect(defaultProps.onNext).toHaveBeenCalledWith(
        'ecocash',
        '+263771234567',
        'ZWL',
        8500
      );
    });
  });
});
