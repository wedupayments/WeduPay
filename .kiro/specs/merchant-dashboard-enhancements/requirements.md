# Requirements Document

## Introduction

This document specifies requirements for enhancing the WeduPay merchant dashboard to replace mock data with real database-backed functionality. The enhancements include connecting actual payment data from Prisma, implementing payment link generation, adding real-time analytics charts, connecting settlement/payout functionality, implementing webhook management, and adding export functionality for reports.

## Glossary

- **Dashboard**: The merchant-facing web interface for managing payments and business operations
- **Payment_Link**: A unique URL that allows customers to make payments without integration
- **Transaction**: A payment record stored in the database with amount, currency, status, and metadata
- **Settlement**: The process of transferring collected payment funds to the merchant's bank account
- **Payout**: A transfer of funds from the merchant's WeduPay balance to their external account
- **Webhook**: An HTTP callback that notifies merchant systems of payment events in real-time
- **Analytics_Engine**: The system component that aggregates and visualizes payment data
- **Export_Service**: The system component that generates downloadable reports in various formats
- **Prisma_Client**: The database ORM used to query and manipulate data
- **Payment_Reference**: A unique identifier for tracking payments
- **Wallet**: An account that holds funds in a specific currency
- **Virtual_Card**: A digital payment card stored in the system

## Requirements

### Requirement 1: Connect Real Payment Data

**User Story:** As a merchant, I want to view my actual transaction data from the database, so that I can monitor real payment activity instead of mock data.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL query Transaction records from Prisma_Client filtered by the merchant's tenantId
2. THE Dashboard SHALL display transaction amount, currency, status, type, reference, and createdAt for each Transaction
3. WHEN a merchant applies filters (status, date range, currency), THE Dashboard SHALL query filtered Transaction records
4. THE Dashboard SHALL implement pagination with configurable page size (10, 25, 50, 100 records)
5. WHEN querying transactions, THE Dashboard SHALL include related user information via Prisma relations
6. THE Dashboard SHALL calculate and display total transaction count, successful payment count, and total revenue
7. FOR ALL transaction queries, THE Dashboard SHALL order results by createdAt in descending order by default

### Requirement 2: Implement Payment Link Generation

**User Story:** As a merchant, I want to create payment links with unique URLs, so that I can share payment requests with customers without requiring technical integration.

#### Acceptance Criteria

1. WHEN a merchant creates a payment link, THE Dashboard SHALL generate a unique URL with a cryptographically secure identifier
2. THE Dashboard SHALL store payment link metadata including amount, currency, expiry date, and usage limits in the database
3. WHEN a payment link is created, THE Dashboard SHALL return a shareable URL in the format `/pay/{linkId}`
4. THE Dashboard SHALL track payment link usage count and conversion status for each link
5. WHEN a payment link reaches its usage limit, THE Dashboard SHALL mark it as inactive
6. WHEN a payment link expires, THE Dashboard SHALL prevent new payments and display expiry status
7. THE Dashboard SHALL allow merchants to view all payment links with their status, usage, and conversion metrics
8. WHEN a customer accesses a payment link URL, THE Dashboard SHALL validate the link is active and not expired before displaying the payment form

### Requirement 3: Add Real-Time Analytics Charts

**User Story:** As a merchant, I want to view visual analytics of my payment data, so that I can understand revenue trends and payment patterns.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL generate a revenue over time chart showing daily, weekly, or monthly aggregated transaction amounts
2. THE Analytics_Engine SHALL generate a payment method distribution chart showing the percentage breakdown of payment types
3. THE Analytics_Engine SHALL generate a geographic distribution chart showing transaction volume by country
4. THE Analytics_Engine SHALL generate a success rate trend chart showing the percentage of successful vs failed transactions over time
5. WHEN the merchant selects a date range, THE Analytics_Engine SHALL recalculate and display charts for the selected period
6. THE Dashboard SHALL use a charting library (Recharts or Chart.js) to render interactive visualizations
7. WHEN hovering over chart data points, THE Dashboard SHALL display detailed tooltips with exact values and percentages
8. THE Analytics_Engine SHALL cache aggregated metrics for performance optimization

### Requirement 4: Connect Settlement and Payout Functionality

**User Story:** As a merchant, I want to request payouts of my available balance, so that I can transfer collected funds to my bank account.

#### Acceptance Criteria

1. THE Dashboard SHALL calculate available balance by summing completed Transaction amounts minus pending settlements
2. THE Dashboard SHALL display settlement periods (daily, weekly, monthly) and next scheduled settlement date
3. WHEN a merchant requests a payout, THE Dashboard SHALL validate the requested amount does not exceed available balance
4. THE Dashboard SHALL create a payout record with status, amount, currency, and requested timestamp
5. THE Dashboard SHALL display settlement history showing all past payouts with transaction details
6. WHEN a settlement is processed, THE Dashboard SHALL update the Wallet balance and mark associated transactions as settled
7. THE Dashboard SHALL prevent duplicate payout requests for the same settlement period
8. THE Dashboard SHALL display pending, completed, and failed settlement statuses with failure reasons

### Requirement 5: Implement Webhook Management

**User Story:** As a merchant, I want to configure webhook endpoints for payment events, so that my system can receive real-time notifications.

#### Acceptance Criteria

1. THE Dashboard SHALL allow merchants to create webhook endpoints with URL, description, and event subscriptions
2. THE Dashboard SHALL support webhook event types including payment.success, payment.failed, payment.pending, refund.completed, and settlement.completed
3. WHEN a webhook is created, THE Dashboard SHALL validate the URL format and test endpoint reachability
4. THE Dashboard SHALL allow merchants to edit webhook URLs and event subscriptions
5. THE Dashboard SHALL allow merchants to delete webhook endpoints
6. THE Dashboard SHALL display webhook delivery logs showing timestamp, event type, HTTP status, and response time
7. WHEN a webhook delivery fails, THE Dashboard SHALL implement exponential backoff retry mechanism (3 attempts)
8. THE Dashboard SHALL generate HMAC-SHA256 signatures for webhook payloads using a merchant-specific secret key
9. THE Dashboard SHALL display webhook signature verification instructions and secret key
10. THE Dashboard SHALL allow merchants to regenerate webhook secret keys

### Requirement 6: Add Export Functionality for Reports

**User Story:** As a merchant, I want to export payment data and analytics reports, so that I can perform offline analysis and record keeping.

#### Acceptance Criteria

1. THE Export_Service SHALL generate CSV exports of payment transactions with all transaction fields
2. THE Export_Service SHALL generate Excel exports with formatted columns and summary statistics
3. WHEN exporting data, THE Dashboard SHALL apply the same filters (date range, status, currency) as the current view
4. THE Export_Service SHALL generate analytics reports including revenue summaries, payment method breakdowns, and success rates
5. THE Dashboard SHALL allow merchants to schedule recurring report generation (daily, weekly, monthly)
6. WHEN a scheduled report is generated, THE Export_Service SHALL send the report via email or store it for download
7. THE Export_Service SHALL include export metadata (generation timestamp, filter criteria, record count) in exported files
8. THE Dashboard SHALL display export history showing past exports with download links and expiry dates
9. WHEN generating large exports (>10,000 records), THE Export_Service SHALL process the export asynchronously and notify when complete

### Requirement 7: Payment Link Parser and Formatter

**User Story:** As a developer, I want a parser and formatter for payment link configurations, so that payment links can be reliably created and validated.

#### Acceptance Criteria

1. THE Payment_Link_Parser SHALL parse payment link configuration objects into validated PaymentLink database records
2. WHEN invalid payment link data is provided, THE Payment_Link_Parser SHALL return descriptive validation errors
3. THE Payment_Link_Formatter SHALL format PaymentLink database records into shareable URL strings
4. FOR ALL valid PaymentLink objects, parsing the configuration, formatting to URL, and parsing the URL parameters SHALL produce an equivalent object (round-trip property)
5. THE Payment_Link_Parser SHALL validate required fields (amount, currency) and optional fields (expiry, usage limits)
6. THE Payment_Link_Formatter SHALL encode payment link parameters securely to prevent tampering

## Notes

- All database queries must be scoped to the authenticated merchant's tenantId for multi-tenant security
- Analytics aggregations should use database indexes on createdAt, status, and tenantId for performance
- Webhook delivery should be handled asynchronously to avoid blocking payment processing
- Export files should be stored temporarily and cleaned up after 7 days
- Payment link identifiers should use cryptographically secure random generation (crypto.randomBytes)
- All monetary calculations must use precise decimal arithmetic to avoid floating-point errors
