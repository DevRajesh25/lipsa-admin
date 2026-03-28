# Vendor Earnings Field Rename

## Summary
Renamed `vendorAmount` to `vendorEarnings` throughout the entire codebase for better clarity.

## Changes Made

### 1. Type Definitions (`types/index.ts`)
```typescript
export interface Order {
  vendorEarnings?: number;  // ✅ Changed from vendorAmount
}
```

### 2. Order Calculations (`lib/utils/orderCalculations.ts`)
```typescript
export interface OrderCalculation {
  vendorEarnings: number;  // ✅ Changed from vendorAmount
}

const vendorEarnings = productPrice - commissionAmount;
```

### 3. Orders Page (`app/(admin)/admin/orders/page.tsx`)
- Updated state variable: `vendorEarnings`
- Updated Firestore save: `vendorEarnings`
- Updated modal display: `selectedOrder.vendorEarnings`

### 4. Scripts
- `scripts/updateOrderBreakdown.ts` - Updated field name
- `update-order-breakdown.js` - Updated field name

## Firestore Structure

Orders now store:
```javascript
{
  productPrice: 900,
  taxAmount: 162,
  commissionAmount: 90,
  vendorEarnings: 810,  // ✅ New field name
  totalAmount: 1062
}
```

## Display in Admin Panel

Order Details Modal shows:
```
Product Price:           ₹900
Tax (18%):              ₹162
Total Paid:             ₹1,062
Platform Commission:     ₹90
Vendor Receives:        ₹810  ← Uses vendorEarnings field
```

## Migration Notes

- New orders will automatically use `vendorEarnings`
- When the orders page loads, it will calculate and save `vendorEarnings` for existing orders
- Old `vendorAmount` fields (if any exist) will remain but won't be used
- The system only checks for `vendorEarnings` now

## Benefits

✅ More descriptive field name
✅ Clearer business logic (earnings vs amount)
✅ Better alignment with financial terminology
✅ Consistent across all files

## No Action Required

The rename is complete and will work automatically when you:
1. Load the orders page
2. System calculates breakdown
3. Saves as `vendorEarnings` in Firestore
4. Displays correctly in the modal
