/**
 * Order calculation utilities
 * Calculates breakdown of order amounts including tax, commission, and vendor amounts
 */

export interface OrderCalculation {
  productPrice: number;
  taxAmount: number;
  totalAmount: number;
  commissionAmount: number;
  vendorEarnings: number;
}

/**
 * Calculate order breakdown based on product price, tax rate, and commission percentage
 * 
 * Example:
 * Product Price: ₹900
 * Tax Rate: 18%
 * Commission: 10%
 * 
 * Result:
 * - Product Price: ₹900
 * - Tax: ₹162 (18% of ₹900)
 * - Total Paid: ₹1062
 * - Commission: ₹90 (10% of ₹900)
 * - Vendor Earnings: ₹810 (₹900 - ₹90)
 */
export function calculateOrderBreakdown(
  productPrice: number,
  taxRate: number,
  commissionPercentage: number
): OrderCalculation {
  // Calculate tax on product price
  const taxAmount = Math.round((productPrice * taxRate) / 100);
  
  // Total amount customer pays (product + tax)
  const totalAmount = productPrice + taxAmount;
  
  // Commission is calculated on product price (not including tax)
  const commissionAmount = Math.round((productPrice * commissionPercentage) / 100);
  
  // Vendor receives product price minus commission
  const vendorEarnings = productPrice - commissionAmount;
  
  return {
    productPrice,
    taxAmount,
    totalAmount,
    commissionAmount,
    vendorEarnings,
  };
}

/**
 * Calculate order breakdown from total amount (reverse calculation)
 * Useful when you have the total amount and need to break it down
 */
export function calculateFromTotal(
  totalAmount: number,
  taxRate: number,
  commissionPercentage: number
): OrderCalculation {
  // Product price = Total / (1 + taxRate/100)
  const productPrice = Math.round(totalAmount / (1 + taxRate / 100));
  
  return calculateOrderBreakdown(productPrice, taxRate, commissionPercentage);
}
