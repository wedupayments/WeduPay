declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS?: string;
    NEXT_PUBLIC_DEMO_CUSTOMER_EMAIL?: string;
    NEXT_PUBLIC_DEMO_MERCHANT_EMAIL?: string;
    NEXT_PUBLIC_DEMO_ACCOUNT_PASSWORD?: string;
  }
}
