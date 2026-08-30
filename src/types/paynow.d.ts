declare module 'paynow' {
  export interface PaynowPayment {
    add(title: string, amount: number): void;
  }

  export interface PaynowSendResponse {
    success: boolean;
    redirectUrl?: string;
    pollUrl?: string;
    error?: string;
  }

  export interface PaynowPollResult {
    paid(): boolean;
    status: string;
    amount: string;
    reference: string;
  }

  export class Paynow {
    constructor(integrationId: string, integrationKey: string);
    resultUrl: string;
    returnUrl: string;
    createPayment(reference: string, authEmail: string): PaynowPayment;
    send(payment: PaynowPayment): Promise<PaynowSendResponse>;
    sendMobile(payment: PaynowPayment, phone: string, method: 'ecocash' | 'onemoney'): Promise<PaynowSendResponse>;
    pollTransaction(pollUrl: string): Promise<PaynowPollResult>;
  }
}