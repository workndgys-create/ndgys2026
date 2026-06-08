import "@testing-library/jest-dom/vitest";

// Minimal env so modules importing src/lib/env don't throw under test.
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET ||= "test-secret-key-please-change-1234567890";
process.env.NEXT_PUBLIC_BASE_URL ||= "http://localhost:3000";
// RESEND_API_KEY intentionally unset so email.ts no-ops.
process.env.NEXT_PUBLIC_HOME_PUBLISHED ||= "true";
process.env.NEXT_PUBLIC_ALLOCATIONS_LIVE ||= "false";
process.env.NEXT_PUBLIC_REGISTRATION_OPEN ||= "true";
process.env.PORTFOLIO_HOLD_MINUTES ||= "10";
