# Payout Vendor Details & Bank Information

## Overview
Enhanced the payouts page to display complete vendor information and bank details for processing payments.

## Features Added

### 1. Vendor Type Enhancement
Added bank details to the Vendor interface:
```typescript
interface Vendor {
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branch?: string;
  };
}
```

### 2. Eye Icon Button
- Added "View Details" button with eye icon
- Gradient purple-to-blue styling
- Positioned before Approve/Reject buttons
- Fetches vendor details on click

### 3. Payout Details Modal

#### Header Section
- Gradient purple-to-blue background
- "Payout Details" title with subtitle
- Close button with hover effect

#### Content Sections

**Payout Request Info**
- Request ID with monospace font
- Gray gradient background with purple accent

**Amount Card**
- Large green gradient card
- Payout amount in large text
- Request date below amount

**Vendor Information Section**
- Blue gradient container with building icon
- Displays:
  - Vendor Name
  - Store Name (if available)
  - Email
  - Phone (if available)
- Loading spinner while fetching data

**Bank Details Section**
- Orange gradient container with credit card icon
- Displays:
  - Account Holder Name
  - Account Number (monospace font)
  - Bank Name
  - IFSC Code (monospace font)
  - Branch (if available)
- Warning message if bank details not provided
- Loading spinner while fetching data

**Status Badge**
- Color-coded status display
- Paid: Green
- Approved: Blue
- Rejected: Red
- Pending: Yellow

### 4. Data Flow

```
1. User clicks eye icon
   ↓
2. Fetch vendor from Firestore users collection
   ↓
3. Display vendor info and bank details
   ↓
4. Admin can process payout with complete information
```

## Firestore Structure

### Vendor Document (users collection)
```javascript
{
  id: "vendor123",
  name: "John Doe",
  storeName: "John's Store",
  email: "john@example.com",
  phone: "+91 9876543210",
  bankDetails: {
    accountHolderName: "John Doe",
    accountNumber: "1234567890",
    bankName: "State Bank of India",
    ifscCode: "SBIN0001234",
    branch: "Main Branch"
  }
}
```

### Payout Request Document
```javascript
{
  id: "payout123",
  vendorId: "vendor123",
  vendorName: "John Doe",
  amount: 5000,
  status: "pending",
  requestDate: Timestamp
}
```

## Usage

1. Navigate to Payouts page
2. Click the eye icon (👁️) on any payout request
3. Modal opens showing:
   - Payout amount and request date
   - Complete vendor information
   - Bank account details for transfer
4. Process the payout with confidence

## Benefits

✅ Complete vendor information at a glance
✅ Bank details readily available for payment processing
✅ No need to contact vendor for payment info
✅ Secure display of sensitive banking information
✅ Professional UI with clear information hierarchy
✅ Warning when bank details are missing

## Security Notes

- Bank details are only visible to admin users
- Data is fetched securely from Firestore
- Sensitive information displayed in secure modal
- Modal closes on outside click or close button

## Next Steps for Vendors

Vendors should be able to add/update their bank details in their profile. This can be implemented in the vendor dashboard with fields for:
- Account Holder Name
- Account Number
- Bank Name
- IFSC Code
- Branch (optional)
