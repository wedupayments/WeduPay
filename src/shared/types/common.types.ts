export type Currency = 'USD' | 'ZWL' | 'ZiG' | 'ZAR' | 'KES' | 'NGN' | 'GHS' | 'UGX' | 'TZS';

export type CountryCode = 'ZW' | 'ZA' | 'KE' | 'NG' | 'GH' | 'UG' | 'TZ';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export type TransactionType = 'PAYMENT' | 'TRANSFER' | 'WITHDRAWAL' | 'DEPOSIT';

export type UserRole = 'USER' | 'MERCHANT' | 'ADMIN';

export type KycStatus = 'pending' | 'verified' | 'rejected';

export type ProviderKey = 'ecocash' | 'mpesa' | 'mtn' | 'airtel' | 'ozow' | 'pawapay';
