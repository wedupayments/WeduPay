# 🚀 Internal Update: WeduPay API Documentation & Security Overhaul

Team, we have just finalized the production-ready API documentation and security infrastructure. Please review the changes below to streamline our internal development and partner onboarding.

## 📍 Where to find it
*   **Interactive Docs (Live)**: [wedupay.com/api/docs](https://wedupay.com/api/docs)
    *   *Note: Requires authentication in production. Open to all on localhost.*
*   **Static Reference**: See `API Design.md` in the root folder.
*   **JSON Schema**: `/api/docs.json` (OpenAPI 3.0).

## 🏢 Role-Based Organization
The documentation is now strictly categorized by the target audience to reduce noise:
1.  **Consumer API**: Endpoints for personal wallet management, P2P transfers, and card issuance.
2.  **Merchant API**: Tools for businesses to collect payments, manage revenue analytics, and handle settlements.
3.  **Platform API**: Restricted endpoints for admin operations, compliance auditing, and routing management.

## 🛡️ Key Security Features
*   **Production Guard**: The API viewer is now hidden behind authentication in the production environment.
*   **Proxy-First Routing**: We have activated `src/proxy.ts` as our primary security layer for bot detection, rate limiting, and IP filtering.
*   **SEO Stealth**: Documentation is now configured with `noindex, nofollow` to prevent accidental indexing by search engines.

## 🌓 Developer Experience (DX)
*   **Theme Toggle**: The docs now include a built-in Dark/Light mode switcher.
*   **Full End-to-End Mapping**: All 80+ endpoints in the repository are now fully documented and synced.

**Next Steps**: If you are adding a new route to `src/app/api`, please ensure you define its spec in `src/lib/swagger.ts` so it appears in the documentation automatically.

---
*Maintained by the WeduPay Core Infrastructure Team*
