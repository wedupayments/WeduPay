import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('DashboardErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => { console.error = jest.fn(); });
  afterAll(() => { console.error = originalError; });

  it('renders children when no error occurs', () => {
    render(
      <DashboardErrorBoundary>
        <div>Smooth sailing</div>
      </DashboardErrorBoundary>
    );
    expect(screen.getByText('Smooth sailing')).toBeInTheDocument();
  });

  it('renders fallback UI when an error occurs', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <DashboardErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('resets error state when Try again is clicked', () => {
    const { rerender } = render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    rerender(
      <DashboardErrorBoundary>
        <div>Recovered</div>
      </DashboardErrorBoundary>
    );

    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
