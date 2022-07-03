import * as interfaces from '../grpc/interfaces';

export abstract class AbstractLightningApi {
  abstract payInvoice(invoice: string): Promise<interfaces.SendPaymentResponse>;
}
