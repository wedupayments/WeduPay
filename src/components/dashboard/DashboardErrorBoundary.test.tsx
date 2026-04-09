import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardErrorBoundary } from "./DashboardErrorBoundary";
import "@testing-library/jest-dom";

const ThrowError = () => {
  throw new Error("Test error");
};

describe("DashboardErrorBoundary", () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it("renders children when no error occurs", () => {
    render(
      <DashboardErrorBoundary>
        <div>Smooth sailing</div>
      </DashboardErrorBoundary>
    );
    expect(screen.getByText("Smooth sailing")).toBeInTheDocument();
  });

  it("renders fallback UI when an error occurs", () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("resets state when 'Try again' is clicked", () => {
    const { rerender } = render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    
    // Rerender with working component
    rerender(
      <DashboardErrorBoundary>
        <div>Recovered</div>
      </DashboardErrorBoundary>
    );
    
    fireEvent.click(screen.getByText("Try again"));
    expect(screen.getByText("Recovered")).toBeInTheDocument();
  });
});
