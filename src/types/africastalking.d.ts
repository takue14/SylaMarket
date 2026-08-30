declare module 'africastalking' {
  interface SmsResponse {
    SMSMessageData: {
      Message: string;
      Recipients: Array<{
        statusCode: number;
        number: string;
        status: string;
        cost: string;
        messageId: string;
      }>;
    };
  }

  interface SmsService {
    send(options: { to: string[]; message: string; from?: string }): Promise<SmsResponse>;
  }

  interface AfricasTalkingInstance {
    SMS: SmsService;
  }

  function AfricasTalking(options: { apiKey: string; username: string }): AfricasTalkingInstance;

  export = AfricasTalking;
}