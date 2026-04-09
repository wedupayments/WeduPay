# Implementation Plan: Merchant Dashboard Enhancements

## Overview

This implementation plan breaks down the merchant dashboard enhancements into discrete coding tasks. The feature replaces mock data with real database-backed functionality including transaction queries, payment link generation, real-time analytics, settlement/payout workflows, webhook management, and export functionality.

The implementation follows a layered architecture: database schema → services → API endpoints → React components → testing. Each task builds incrementally to ensure continuous integration and early validation.

## Tasks

- [x] 1. Database schema setup and migrations
  - [x] 1.1 Create PaymentLink table schema
  - [x] 1.2 Create Settlement table schema
  - [x] 1.3 Create WebhookEndpoint and WebhookDelivery tables
  - [x] 1.4 Create ExportJob table schema
  - [x] 1.5 Create AnalyticsCache table schema
  - [x] 1.6 Run Prisma migrations

- [x] 2. Implement core service layer
  - [x] 2.1 Create TransactionService
  - [x] 2.2 Write property tests for TransactionService
  - [x] 2.3 Create PaymentLinkService
  - [x] 2.4 Write property tests for PaymentLinkService
  - [x] 2.5 Create AnalyticsService with caching
  - [x] 2.6 Write property tests for AnalyticsService
  - [x] 2.7 Create CacheService

- [x] 3. Checkpoint - Ensure all tests pass
  - [x] 3.1 Verify all service logic with property-based tests

- [x] 4. Implement settlement and webhook services
  - [x] 4.1 Create SettlementService
  - [x] 4.2 Write property tests for SettlementService
  - [x] 4.3 Create WebhookService
  - [x] 4.4 Write property tests for WebhookService
  - [x] 4.5 Create ExportService
  - [x] 4.6 Write property tests for ExportService
  - [x] 4.7 Create PaymentLinkParser and PaymentLinkFormatter utilities
  - [x] 4.8 Write property tests for payment link utilities

- [x] 5. Checkpoint - Ensure all tests pass

- [x] 6. Implement API endpoints
  - [x] 6.1 Create merchant-scoped transaction API (`GET /api/v1/transactions`, `GET /api/v1/transactions/stats`)
  - [x] 6.2 Create individual transaction retrieval API (`GET /api/v1/transactions/:id`)
  - [x] 6.3 Create transaction refund/cancellation API (`POST /api/v1/transactions/:id/refund`)
  - [x] 6.4 Create individual payment link API (`GET /api/v1/payment-links/:id`)
  - [x] 6.5 Create payment link management API (`POST /api/v1/payment-links`, `PATCH /api/v1/payment-links/:id`)
  - [x] 6.6 Create settlement balance API (`GET /api/v1/settlements/balance`)
  - [x] 6.7 Create settlement history and request API (`GET /api/v1/settlements`, `POST /api/v1/settlements/request-payout`)
  - [x] 6.8 Create detailed analytics aggregation API (`GET /api/v1/analytics/overview`, `GET /api/v1/analytics/revenue`)
  - [x] 6.9 Create webhook endpoint management API (`POST /api/v1/webhooks/endpoints`, `GET /api/v1/webhooks/endpoints`)
  - [x] 6.10 Create webhook delivery logs API (`GET /api/v1/webhooks/deliveries`)
  - [x] 6.11 Create export job management API (`POST /api/v1/exports`, `GET /api/v1/exports`)
  - [x] 6.12 Create export download API (`GET /api/v1/exports/:id/download`)

- [x] 7. Checkpoint - API Layer Verification
  - [x] 7.1 Verify all merchant API endpoints
  - [x] 7.2 Ensure proper tenant isolation
  - [x] 7.3 Document API response schemas

- [x] 8. Implement React components
  - [x] 8.1 Create MerchantDashboard component (Overview stats integrated)
  - [x] 8.2 Create TransactionList component (Payments page integrated)
  - [x] 8.3 Create AnalyticsCharts component (Analytics page integrated)
  - [x] 8.4 Create PaymentLinkManager component (Payment links page integrated)
  - [x] 8.5 Create SettlementPanel component (Settlements page integrated)
  - [x] 8.6 Create WebhookManager component (Webhooks page integrated)
  - [x] 8.7 Create ExportPanel component (Exports page integrated)
  - [x] 8.8 Create public payment link page

- [x] 9. Implement background job processing
  - [x] 9.1 Create async task processor for export jobs
  - [x] 9.2 Create webhook delivery queue processor
  - [x] 9.3 Create cache cleanup job
  - [x] 9.4 Create export file cleanup job

- [x] 10. Final integration and testing
  - [x] 10.1 Wire all components together (Using useAuthenticatedFetch hook)
  - [x] 10.2 Verify integrated workflows manually
  - [x] 10.3 Write unit tests for React components (DashboardErrorBoundary tests)
  - [x] 10.4 Add error boundaries and fallback UI

- [x] 11. Final checkpoint - Ensure all tests pass

## Notes

- All database queries are automatically scoped by tenantId through authentication middleware
- Analytics aggregations use database indexes on createdAt, status, and tenantId for performance
- Webhook delivery is handled asynchronously to avoid blocking payment processing
- Export files are stored temporarily and cleaned up after 7 days
- Payment link identifiers use cryptographically secure random generation (crypto.randomBytes)
- All monetary calculations use precise decimal arithmetic to avoid floating-point errors
- Property-based tests use fast-check library with minimum 100 iterations per test
- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
