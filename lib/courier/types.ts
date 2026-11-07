export interface CourierParcelRequest {
  invoice: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number;
  note?: string;
}

export interface CourierParcelResponse {
  success: boolean;
  consignmentId?: string;
  trackingCode?: string;
  courierName: 'Steadfast' | 'Pathao' | 'Paperfly';
  status?: string;
  simulated?: boolean;
  error?: string;
}

export interface CourierTrackingStatus {
  consignmentId: string;
  trackingCode: string;
  status: string;
  statusBn: string;
  updatedAt?: string;
}
