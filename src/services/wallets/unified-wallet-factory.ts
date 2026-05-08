/**
 * Unified African Wallet Factory
 * 
 * Provides a single interface to access all African mobile money providers.
 * Automatically selects the correct adapter based on wallet type and country.
 */

import {
  // Existing adapters
  MpesaAPI,
  EcoCashAPI,
  MTNAPI,
  AirtelAPI,
  // New adapters
  OrangeMoneyAPI,
  WaveAPI,
  MpesaTanzaniaAPI,
  TigoPesaAPI,
  FlutterwaveAPI,
  PaystackAPI,
  HalopesaAPI,
  ZamtelAPI,
  TelecelAPI,
  MoovMoneyAPI,
  OPayAPI,
  PalmPayAPI,
  AfricasTalkingAPI,
  PawaPayAPI,
  WalletType,
  COUNTRY_WALLETS,
  WALLET_METADATA,
} from './index';

export interface WalletConfig {
  type: WalletType;
  country?: string;
  environment?: 'sandbox' | 'live';
}

export interface UnifiedPaymentRequest {
  phoneNumber: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  callbackUrl: string;
  email?: string;
}

export interface UnifiedPaymentResponse {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionId?: string;
  providerReference?: string;
  message?: string;
  paymentUrl?: string;
}

export interface UnifiedTransactionStatus {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';
  transactionId: string;
  amount?: number;
  currency?: string;
  phoneNumber?: string;
  transactionDate?: string;
}

export interface UnifiedRefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
}

export interface UnifiedRefundResponse {
  success: boolean;
  status: string;
  refundId?: string;
  message?: string;
}

export class UnifiedWalletAdapter {
  private config: WalletConfig;
  private adapter: any;

  constructor(config: WalletConfig) {
    this.config = config;
    this.adapter = this.initializeAdapter();
  }

  private initializeAdapter(): any {
    const env = this.config.environment || (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');

    switch (this.config.type) {
      // East Africa
      case WalletType.MPESA:
        return new MpesaAPI({
          consumerKey: process.env.MPESA_CONSUMER_KEY || '',
          consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
          shortCode: process.env.MPESA_SHORT_CODE || '',
          passkey: process.env.MPESA_PASSKEY || '',
          environment: env,
        });

      case WalletType.MPESA_TANZANIA:
        return new MpesaTanzaniaAPI({
          apiKey: process.env.MPESA_TZ_API_KEY || '',
          securityToken: process.env.MPESA_TZ_SECURITY_TOKEN || '',
          shortCode: process.env.MPESA_TZ_SHORT_CODE || '',
          environment: env,
          currency: 'TZS',
        });

      case WalletType.TIGO_PESA:
        return new TigoPesaAPI({
          apiKey: process.env.TIGO_PESA_API_KEY || '',
          merchantCode: process.env.TIGO_PESA_MERCHANT_CODE || '',
          environment: env,
          currency: 'TZS',
        });

      case WalletType.AIRTEL:
        return new AirtelAPI({
          apiKey: process.env.AIRTEL_API_KEY || '',
          merchantCode: process.env.AIRTEL_MERCHANT_CODE || '',
          environment: env,
          countryCode: this.config.country || 'ZMB',
          currency: 'USD',
        });

      case WalletType.MTN:
        return new MTNAPI({
          apiKey: process.env.MTN_API_KEY || '',
          subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY || '',
          primaryKey: process.env.MTN_PRIMARY_KEY || '',
          referenceId: process.env.MTN_REFERENCE_ID || '',
          environment: env,
          countryCode: this.config.country || '256',
          currency: 'USD',
        });

      // Southern Africa
      case WalletType.ECOCASH:
        return new EcoCashAPI({
          apiKey: process.env.ECOCASH_API_KEY || '',
          merchantCode: process.env.ECOCASH_MERCHANT_CODE || '',
          mode: env,
        });

      case WalletType.TELECEL:
        return new TelecelAPI({
          apiKey: process.env.TELECEL_API_KEY || '',
          merchantCode: process.env.TELECEL_MERCHANT_CODE || '',
          environment: env,
          currency: 'USD',
        });

      case WalletType.ZAMTEL:
        return new ZamtelAPI({
          apiKey: process.env.ZAMTEL_API_KEY || '',
          merchantCode: process.env.ZAMTEL_MERCHANT_CODE || '',
          environment: env,
          currency: 'ZMW',
        });

      case WalletType.HALOPESA:
        return new HalopesaAPI({
          apiKey: process.env.HALOPESA_API_KEY || '',
          merchantCode: process.env.HALOPESA_MERCHANT_CODE || '',
          environment: env,
          currency: 'MZN',
        });

      // West Africa - Francophone
      case WalletType.ORANGE_MONEY:
        return new OrangeMoneyAPI({
          clientId: process.env.ORANGE_MONEY_CLIENT_ID || '',
          clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET || '',
          merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY || '',
          environment: env,
          countryCode: this.config.country || 'SN',
          currency: 'XOF',
        });

      case WalletType.WAVE:
        return new WaveAPI({
          apiKey: process.env.WAVE_API_KEY || '',
          secretKey: process.env.WAVE_SECRET_KEY || '',
          environment: env,
          countryCode: this.config.country || 'SN',
          currency: 'XOF',
        });

      case WalletType.MOOV_MONEY:
        return new MoovMoneyAPI({
          apiKey: process.env.MOOV_MONEY_API_KEY || '',
          merchantCode: process.env.MOOV_MONEY_MERCHANT_CODE || '',
          environment: env,
          countryCode: this.config.country || 'BJ',
          currency: 'XOF',
        });

      // West Africa - Anglophone
      case WalletType.PAYSTACK:
        return new PaystackAPI({
          secretKey: process.env.PAYSTACK_SECRET_KEY || '',
          publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
          environment: env,
        });

      case WalletType.FLUTTERWAVE:
        return new FlutterwaveAPI({
          publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
          secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
          environment: env,
        });

      case WalletType.OPAY:
        return new OPayAPI({
          merchantId: process.env.OPAY_MERCHANT_ID || '',
          publicKey: process.env.OPAY_PUBLIC_KEY || '',
          privateKey: process.env.OPAY_PRIVATE_KEY || '',
          environment: env,
          currency: 'NGN',
        });

      case WalletType.PALMPAY:
        return new PalmPayAPI({
          merchantId: process.env.PALMPAY_MERCHANT_ID || '',
          apiKey: process.env.PALMPAY_API_KEY || '',
          secretKey: process.env.PALMPAY_SECRET_KEY || '',
          environment: env,
          currency: 'NGN',
        });

      // Pan-African
      case WalletType.AFRICAS_TALKING:
        return new AfricasTalkingAPI({
          apiKey: process.env.AFRICAS_TALKING_API_KEY || '',
          username: process.env.AFRICAS_TALKING_USERNAME || '',
          environment: env,
        });

      case WalletType.PAWAPAY:
        return new PawaPayAPI({
          apiToken: process.env.PAWAPAY_API_TOKEN || '',
          baseUrl: process.env.PAWAPAY_BASE_URL,
          environment: env,
        });

      default:
        throw new Error(`Unsupported wallet type: ${this.config.type}`);
    }
  }

  async initiatePayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    try {
      let result: any;

      switch (this.config.type) {
        // M-Pesa Kenya
        case WalletType.MPESA:
          result = await this.adapter.initiateSTKPush({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.responseCode === '0',
            status: result.responseCode === '0' ? 'SUCCESS' : 'PENDING',
            transactionId: result.checkoutRequestId,
            providerReference: result.merchantRequestId,
            message: result.customerMessage,
          };

        // M-Pesa Tanzania
        case WalletType.MPESA_TANZANIA:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            message: result.message,
          };

        // Tigo Pesa
        case WalletType.TIGO_PESA:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            message: result.message,
          };

        // EcoCash
        case WalletType.ECOCASH:
          result = await this.adapter.initPayment(
            request.phoneNumber,
            request.amount,
            request.description,
            request.reference
          );
          return {
            success: result.status !== 'FAILED',
            status: result.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
            transactionId: result.sourceReference,
            message: result.message,
          };

        // MTN
        case WalletType.MTN:
          result = await this.adapter.requestToPay({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.referenceId,
            message: result.message,
          };

        // Airtel
        case WalletType.AIRTEL:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.referenceId,
            message: result.message,
          };

        // Orange Money
        case WalletType.ORANGE_MONEY:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.sessionId,
            paymentUrl: result.paymentUrl,
            message: result.message,
          };

        // Wave
        case WalletType.WAVE:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            message: result.message,
          };

        // Moov Money
        case WalletType.MOOV_MONEY:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            message: result.message,
          };

        // Paystack
        case WalletType.PAYSTACK:
          if (request.email) {
            result = await this.adapter.initiatePayment({
              email: request.email,
              phoneNumber: request.phoneNumber,
              amount: request.amount,
              currency: request.currency,
              reference: request.reference,
              description: request.description,
              callbackUrl: request.callbackUrl,
            });
          } else {
            result = await this.adapter.initiateMobileMoneyPayment({
              phoneNumber: request.phoneNumber,
              amount: request.amount,
              currency: request.currency,
              reference: request.reference,
              network: 'mtn',
              country: 'GH',
            });
          }
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            paymentUrl: result.authorizationUrl,
            message: result.message,
          };

        // Flutterwave
        case WalletType.FLUTTERWAVE:
          result = await this.adapter.initiatePayment({
            email: request.email,
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            currency: request.currency,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            paymentUrl: result.link,
            message: result.message,
          };

        // OPay
        case WalletType.OPAY:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            message: result.message,
          };

        // PalmPay
        case WalletType.PALMPAY:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            message: result.message,
          };

        // Halopesa
        case WalletType.HALOPESA:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            message: result.message,
          };

        // Zamtel
        case WalletType.ZAMTEL:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            message: result.message,
          };

        // Telecel
        case WalletType.TELECEL:
          result = await this.adapter.initiatePayment({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            message: result.message,
          };

        // Africa's Talking
        case WalletType.AFRICAS_TALKING:
          result = await this.adapter.initiateMobileCheckout({
            productName: 'WeduPay',
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            currency: request.currency,
            reference: request.reference,
            description: request.description,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            providerReference: result.providerRef,
            message: result.message,
          };

        // PawaPay
        case WalletType.PAWAPAY:
          result = await this.adapter.initiateDeposit({
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            currency: request.currency,
            reference: request.reference,
            description: request.description,
            callbackUrl: request.callbackUrl,
            country: this.config.country,
          });
          return {
            success: result.status !== 'FAILED',
            status: result.status,
            transactionId: result.transactionId,
            providerReference: result.providerReference,
            message: result.message,
          };

        default:
          return {
            success: false,
            status: 'FAILED',
            message: `Unsupported wallet type: ${this.config.type}`,
          };
      }
    } catch (error) {
      console.error('Unified wallet payment error:', error);
      return {
        success: false,
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getTransactionStatus(reference: string): Promise<UnifiedTransactionStatus> {
    try {
      let result: any;

      switch (this.config.type) {
        case WalletType.MPESA:
          result = await this.adapter.querySTKStatus(reference);
          return {
            success: result.responseCode === '0',
            status: result.responseCode === '0' ? 'SUCCESS' : 'PENDING',
            transactionId: reference,
          };

        case WalletType.MPESA_TANZANIA:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.TIGO_PESA:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.ECOCASH:
          result = await this.adapter.lookupTransaction('', reference);
          return {
            success: result.paymentSuccess,
            status: result.status,
            transactionId: reference,
            amount: result.amount?.amount,
            currency: result.amount?.currency,
          };

        case WalletType.MTN:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.AIRTEL:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.ORANGE_MONEY:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.WAVE:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.MOOV_MONEY:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.PAYSTACK:
          result = await this.adapter.verifyTransaction(reference);
          return result;

        case WalletType.FLUTTERWAVE:
          result = await this.adapter.verifyTransactionByReference(reference);
          return result;

        case WalletType.OPAY:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.PALMPAY:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.HALOPESA:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.ZAMTEL:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.TELECEL:
          result = await this.adapter.getTransactionStatus(reference);
          return result;

        case WalletType.AFRICAS_TALKING:
          result = await this.adapter.fetchTransactionStatus(reference);
          return result;

        case WalletType.PAWAPAY:
          result = await this.adapter.getDepositStatus(reference);
          return result;

        default:
          return {
            success: false,
            status: 'FAILED',
            transactionId: reference,
          };
      }
    } catch (error) {
      console.error('Unified wallet status error:', error);
      return {
        success: false,
        status: 'FAILED',
        transactionId: reference,
      };
    }
  }

  async refundPayment(request: UnifiedRefundRequest): Promise<UnifiedRefundResponse> {
    try {
      let result: any;

      switch (this.config.type) {
        case WalletType.MPESA:
          result = await this.adapter.reverseTransaction({
            transactionId: request.transactionId,
            amount: request.amount,
            receiverParty: '',
            remarks: request.reason,
          });
          return {
            success: result.responseCode === '0',
            status: result.responseCode === '0' ? 'SUCCESS' : 'FAILED',
            refundId: result.conversationID,
            message: result.responseDescription,
          };

        case WalletType.ECOCASH:
          result = await this.adapter.refundPayment({
            reference: request.transactionId,
            phone: '',
            amount: request.amount,
            clientName: 'Refund',
            reason: request.reason,
          });
          return {
            success: result.status === 'SUCCESS',
            status: result.status,
            refundId: result.refundId,
            message: result.message,
          };

        case WalletType.PAWAPAY:
          result = await this.adapter.refundDeposit({
            depositId: request.transactionId,
            amount: request.amount,
            reason: request.reason,
          });
          return {
            success: result.status === 'SUCCESS',
            status: result.status,
            refundId: result.transactionId,
            message: result.message,
          };

        default:
          return {
            success: false,
            status: 'FAILED',
            message: 'Refund not supported for this wallet type',
          };
      }
    } catch (error) {
      console.error('Unified wallet refund error:', error);
      return {
        success: false,
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  validatePhoneNumber(phone: string): boolean {
    if (this.adapter.validatePhoneNumber) {
      return this.adapter.validatePhoneNumber(phone);
    }
    return true;
  }

  getWalletMetadata() {
    return WALLET_METADATA[this.config.type];
  }
}

export class AfricanWalletFactory {
  static createWallet(config: WalletConfig): UnifiedWalletAdapter {
    return new UnifiedWalletAdapter(config);
  }

  static getSupportedWallets(countryCode?: string): WalletType[] {
    if (countryCode) {
      return COUNTRY_WALLETS[countryCode.toUpperCase()] || [];
    }
    return Object.values(WalletType);
  }

  static isWalletSupported(walletType: WalletType): boolean {
    return Object.values(WalletType).includes(walletType);
  }

  static getWalletInfo(walletType: WalletType) {
    return WALLET_METADATA[walletType];
  }

  static getWalletsByRegion(): Record<string, WalletType[]> {
    const regions: Record<string, WalletType[]> = {};
    
    for (const [walletType, metadata] of Object.entries(WALLET_METADATA)) {
      const region = metadata.region;
      if (!regions[region]) {
        regions[region] = [];
      }
      regions[region].push(walletType as WalletType);
    }
    
    return regions;
  }
}

export { WalletType, COUNTRY_WALLETS, WALLET_METADATA };
