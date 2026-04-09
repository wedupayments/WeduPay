# Fintech Platform – System Design

## Overview

This document describes the high-level architecture of the fintech web platform built with:

- Next.js 16
- TypeScript
- PostgreSQL
- Prisma ORM
- MVC + Service Layer Architecture

The platform provides:

- mobile wallet payments
- cross-wallet transfers
- transaction ledger
- webhook processing
- virtual card funding

Wallet integrations include:

- M-Pesa
- EcoCash
- MTN MoMo
- Airtel Money

---

# High Level Architecture

User interacts with the web app which communicates with backend services.

Frontend, API routes, and backend logic run in the same Next.js application.

Architecture layers:

View → Controller → Service → Repository → Database

---

# System Architecture Diagram

User Browser
    ↓
Next.js Frontend (App Router)
    ↓
API Routes
    ↓
Controllers
    ↓
Services
    ↓
Wallet Adapters
    ↓
External Wallet APIs

Database operations are handled through repositories.

---

# Application Layers

## View Layer

Responsible for UI rendering.

Location:

src/app/

Example pages:

- dashboard
- send-money
- wallets
- transactions

Example file:

app/send-money/page.tsx

Responsibilities:

- render forms
- display wallet balances
- show transaction history

---

## Controller Layer

Handles HTTP requests.

Location:

src/controllers/

Examples:

payment.controller.ts  
transfer.controller.ts  
wallet.controller.ts  

Responsibilities:

- validate request
- call service layer
- return responses

Example flow:

API Route → Controller → Service

---

## Service Layer

Contains business logic.

Location:

src/services/

Examples:

payment.service.ts  
transfer.service.ts  
wallet.service.ts  
ledger.service.ts  

Responsibilities:

- wallet orchestration
- transaction validation
- payment processing
- ledger recording

Services should not depend on HTTP logic.

---

## Wallet Adapter Layer

External APIs are isolated via adapters.

Location:

src/services/wallets/

Adapters:

mpesa.adapter.ts  
ecocash.adapter.ts  
mtn.adapter.ts  
airtel.adapter.ts  

Responsibilities:

- call wallet APIs
- normalize responses
- handle retries

Example responsibilities:

initiatePayment()  
verifyPayment()  
sendPayout()

---

## Repository Layer

Handles database operations.

Location:

src/repositories/

Examples:

user.repository.ts  
transaction.repository.ts  
ledger.repository.ts  

Responsibilities:

- database queries
- persistence
- transaction safety

Uses Prisma ORM.

---

# Database

Database used:

PostgreSQL

ORM:

Prisma

Main tables:

users  
wallets  
transactions  
ledger_entries  
cards  

Ledger table acts as the financial source of truth.

---

# Request Flow Example

Send Money Flow:

User opens send-money page  
↓  
Form submitted  
↓  
API Route triggered  
↓  
Transfer Controller  
↓  
Transfer Service  
↓  
Wallet Adapter  
↓  
External Wallet API  
↓  
Webhook confirmation  
↓  
Ledger updated

---

# Webhooks

External wallet providers send payment confirmations.

Webhook endpoints:

/api/webhooks/mpesa  
/api/webhooks/ecocash  

Webhook responsibilities:

- verify signature
- update transaction status
- record ledger entries

---

# Authentication

Authentication handled with JWT sessions.

Protected routes are enforced through:

proxy.ts

Example protections:

- authenticated users only
- API rate limiting
- fraud protection rules

---

# Security

Security features include:

HTTPS encryption  
JWT authentication  
API rate limiting  
Webhook signature verification  
Fraud detection rules  

Sensitive data must never be stored in plain text.

---

# Error Handling

System must handle:

wallet API failures  
network timeouts  
duplicate transactions  
webhook retries  

Strategies include:

retry logic  
idempotency keys  
transaction rollback

---

# Logging

All critical events must be logged.

Examples:

payment requests  
wallet responses  
webhook payloads  
errors

Logs stored via centralized logger.

---

# Monitoring

Monitoring tools track:

API performance  
error rates  
payment success rates  

Monitoring dashboards are recommended for production environments.

---

# Scalability

System designed for horizontal scaling.

Key design choices:

stateless API routes  
separate service layers  
database indexing  
message queues for async processing (future)

---

# Future Architecture Enhancements

Future improvements may include:

message queues (Kafka / RabbitMQ)  
microservice separation  
fraud detection engine  
developer SDK APIs  

---

# Summary

This architecture enables:

secure wallet integrations  
scalable payment infrastructure  
clear separation of concerns  
maintainable fintech codebase

---

# Deployment

This project uses a standardized deployment workflow involving Docker for local development, Terraform for infrastructure as code, and Vercel for production hosting.

## Local Development (Docker)

To run the application locally using Docker:

1.  **Build and Start**:
    ```bash
    docker compose up --build
    ```
2.  **Access the App**:
    The application will be available at [http://localhost:3000](http://localhost:3000).
3.  **Hot Reloading**:
    Changes to the source code will trigger an automatic reload within the container.

## Infrastructure as Code (Terraform)

Infrastructure on Vercel is managed via Terraform located in the `/terraform` directory.

### Prerequisites
- [Terraform CLI](https://developer.hashicorp.com/terraform/downloads) installed.
- A Vercel API Token.

### Setup
1.  Navigate to the terraform directory: `cd terraform`
2.  Initialize Terraform: `terraform init`
3.  Create a `terraform.tfvars` file based on `terraform.tfvars.example`.
4.  Plan changes: `terraform plan`
5.  **Import Existing Project** (First time only):
    ```bash
    terraform import vercel_project.app prj_ZWs8nKjRh1V6dcjRm0i2b1qfm47O
    ```
6.  Apply changes: `terraform apply`

## Continuous Deployment (GitHub Actions)

The project includes a GitHub Actions workflow (`.github/workflows/infra.yml`) that:
- Runs `terraform plan` on Pull Requests to the `main` branch.
- Runs `terraform apply` when changes are merged into `main`.

Ensure the `VERCEL_API_TOKEN` secret is configured in your GitHub repository secrets.

## Production (Vercel)

The application is configured to use Next.js's **standalone output** for optimal performance and size.
- Production Domain: `wedupay.com`
- Infrastructure: Managed by Terraform.
- Deployment: Automatic via GitHub integration with Vercel.
