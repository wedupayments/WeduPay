import React from 'react';
import { render, screen } from '@testing-library/react';
import { CustomerSidebar } from './CustomerSidebar';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('@/features/fx/components/QuickFXCalculator', () => ({
  QuickFXCalculator: () => <div>FX Calculator</div>,
}));

describe('CustomerSidebar', () => {
  it('renders the Pay Tuition nav item', () => {
    render(<CustomerSidebar />);
    expect(screen.getByText('Pay Tuition')).toBeInTheDocument();
  });

  it('links Pay Tuition to /dashboard/customer/pay', () => {
    render(<CustomerSidebar />);
    const link = screen.getByText('Pay Tuition').closest('a');
    expect(link).toHaveAttribute('href', '/dashboard/customer/pay');
  });

  it('renders core nav items', () => {
    render(<CustomerSidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Send Money')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('displays the user name', () => {
    render(<CustomerSidebar userName="Sanele Krakra" />);
    expect(screen.getByText('Sanele Krakra')).toBeInTheDocument();
  });
});
