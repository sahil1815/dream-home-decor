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

/**
 * Steadfast Courier API Integration
 * Documentation: https://portal.steadfast.com.bd/api/v1
 */
export async function createSteadfastParcel(
  req: CourierParcelRequest
): Promise<CourierParcelResponse> {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;
  const baseUrl = process.env.STEADFAST_BASE_URL || 'https://portal.steadfast.com.bd/api/v1';

  // Fallback if Steadfast credentials are not provided in environment
  if (!apiKey || !secretKey) {
    const mockTrackingCode = `STF-${req.invoice.replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000)}`;
    console.info(`[Steadfast Simulated] Created parcel for ${req.invoice} -> ${mockTrackingCode}`);
    return {
      success: true,
      consignmentId: `cid_${Date.now()}`,
      trackingCode: mockTrackingCode,
      courierName: 'Steadfast',
      status: 'in_review',
      simulated: true,
    };
  }

  try {
    const payload = {
      invoice: req.invoice,
      recipient_name: req.recipientName,
      recipient_phone: req.recipientPhone,
      recipient_address: req.recipientAddress,
      cod_amount: req.codAmount,
      note: req.note || 'হাতল ও কাচ সাবধানে হ্যান্ডেল করুন',
    };

    const res = await fetch(`${baseUrl}/create_order`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Steadfast Error] HTTP ${res.status}: ${errText}`);
      return { success: false, courierName: 'Steadfast', error: errText };
    }

    const data = await res.json();
    if (data.status === 200 && data.consignment) {
      return {
        success: true,
        consignmentId: String(data.consignment.consignment_id || data.consignment.id),
        trackingCode: data.consignment.tracking_code,
        courierName: 'Steadfast',
        status: data.consignment.status,
      };
    }

    return {
      success: false,
      courierName: 'Steadfast',
      error: data.message || 'কুরিয়ারে পার্সেল বুকিং ব্যর্থ হয়েছে',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Steadfast Exception] ${errorMsg}`);
    return { success: false, courierName: 'Steadfast', error: errorMsg };
  }
}

/**
 * Maps Steadfast courier status to Bengali status
 */
export function mapSteadfastStatusToBengali(status: string): string {
  const map: Record<string, string> = {
    in_review: 'রিভিউ প্রক্রিয়াধীন',
    pending: 'পেন্ডিং',
    delivered_approval_pending: 'ডেলিভারি অনুমোদনের অপেক্ষায়',
    delivered: 'সফলভাবে ডেলিভারি সম্পন্ন',
    partial_delivered: 'আংশিক ডেলিভারি',
    cancelled: 'ডেলিভারি বাতিল',
    hold: 'হোল্ড করা হয়েছে',
    in_transit: 'পথে রয়েছে (ইন-ট্রানজিট)',
  };
  return map[status] || status;
}

/**
 * Checks live delivery status from Steadfast
 */
export async function getSteadfastTrackingStatus(
  trackingCodeOrCid: string
): Promise<CourierTrackingStatus | null> {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;
  const baseUrl = process.env.STEADFAST_BASE_URL || 'https://portal.steadfast.com.bd/api/v1';

  if (!apiKey || !secretKey) {
    return {
      consignmentId: 'sim_cid',
      trackingCode: trackingCodeOrCid,
      status: 'in_transit',
      statusBn: 'কুরিয়ার ডেলিভারিম্যানের কাছে হস্তান্তর করা হয়েছে (পথে আছে)',
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(`${baseUrl}/status_by_trackingcode/${trackingCodeOrCid}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 200 && data.delivery_status) {
      return {
        consignmentId: String(data.consignment_id || trackingCodeOrCid),
        trackingCode: trackingCodeOrCid,
        status: data.delivery_status,
        statusBn: mapSteadfastStatusToBengali(data.delivery_status),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}
