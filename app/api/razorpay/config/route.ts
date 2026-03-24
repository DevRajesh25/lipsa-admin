import { NextRequest, NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/services/razorpayService';

/**
 * GET /api/razorpay/config
 * Returns only the public Key ID for frontend usage
 * Key Secret is never exposed to the frontend
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await RazorpayService.getRazorpaySettings();
    
    if (!settings || !settings.isActive) {
      return NextResponse.json(
        { error: 'Razorpay is not configured or disabled' },
        { status: 404 }
      );
    }

    // Only return public Key ID, never the secret
    return NextResponse.json({
      keyId: settings.keyId,
      isActive: settings.isActive,
    });
  } catch (error) {
    console.error('Error fetching Razorpay config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Razorpay configuration' },
      { status: 500 }
    );
  }
}