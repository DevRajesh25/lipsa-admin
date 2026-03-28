# Payout Vendor Name Fix

## Issue
Vendor names were showing as "Unknown" in the payouts page because the code was looking in the wrong Firestore collection.

## Root Cause
The code was fetching vendor data from the `users` collection, but vendors are actually stored in the `vendors` collection.

## Solution

### Changed Collection References

**Before (Incorrect):**
```javascript
const vendorDoc = await getDoc(doc(db, 'users', vendorId));
```

**After (Correct):**
```javascript
const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
```

### Files Updated

1. **app/(admin)/admin/payouts/page.tsx**
   - `fetchPayouts()` - Now fetches from `vendors` collection
   - `viewPayoutDetails()` - Now fetches from `vendors` collection

2. **lib/services/payoutService.ts**
   - `getAllPayoutRequests()` - Updated vendor lookup
   - `getPayoutRequestsByStatus()` - Updated vendor lookup

3. **test-payouts.js**
   - Updated test script to check `vendors` collection

## Firestore Collections Structure

### vendors Collection
```javascript
vendors/{vendorId}
  ├── name: "John Doe"
  ├── email: "john@example.com"
  ├── status: "approved"
  ├── bankDetails: {
  │     accountHolderName: "John Doe",
  │     accountNumber: "1234567890",
  │     bankName: "State Bank of India",
  │     ifscCode: "SBIN0001234",
  │     branch: "Main Branch"
  │   }
  └── createdAt: Timestamp
```

### payoutRequests Collection
```javascript
payoutRequests/{payoutId}
  ├── vendorId: "vendor123"  ← References vendors collection
  ├── amount: 5000
  ├── status: "pending"
  └── requestDate: Timestamp
```

## Testing

1. **Refresh the payouts page**
   - Vendor names should now display correctly
   - No more "Unknown" vendors

2. **Click the eye icon**
   - Modal should open with vendor details
   - Bank details should display if available

3. **Run test script** (optional):
   ```bash
   node test-payouts.js
   ```
   - Verifies vendor data is accessible
   - Shows bank details status

## Expected Behavior

### Payouts Table
```
REQUEST ID          VENDOR          AMOUNT    STATUS
abc123xyz          John Doe         ₹400      paid
def456uvw          Jane Smith       ₹500      pending
```

### Details Modal
When clicking eye icon:
- ✅ Vendor name displays correctly
- ✅ Email and phone show
- ✅ Bank details display (if provided)
- ✅ Payout amount and status

## Notes

- Vendors are stored in the `vendors` collection, NOT `users`
- The `users` collection may contain admin and customer accounts
- Vendor authentication and profiles are managed separately
- Bank details are optional and may not be present for all vendors
