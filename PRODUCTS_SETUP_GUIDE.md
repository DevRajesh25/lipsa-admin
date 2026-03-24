# Products Page Setup Guide

## Issue Fixed: Products Not Showing

The products page was not showing products due to inconsistency in vendor data storage. This has been resolved.

## What Was Fixed:

1. **Vendor Collection Consistency**: Updated all services to use the `vendors` collection instead of filtering `users` by role
2. **Product Service**: Fixed vendor lookup to use correct collection
3. **Initialization Script**: Updated to create vendors in both `users` and `vendors` collections
4. **Error Handling**: Added better debugging and empty state handling

## To See Products:

### Option 1: Run Initialization Script (Recommended)
1. Open browser console on your admin dashboard
2. Run: `initializeCompleteDemo()` (if available)
3. This will create sample vendors, products, and other data

### Option 2: Manual Data Creation
1. Create vendors through the admin interface
2. Ensure vendors are approved
3. Create products through vendor interface or admin

### Option 3: Migrate Existing Data
If you have vendors in the `users` collection but not in `vendors`:
1. Open browser console
2. Run: `migrateVendors()` (if available)
3. This will copy vendor data to the correct collection

## Debugging:
- Check browser console for helpful debug messages
- The products page now shows detailed information about data availability
- Empty state message will guide you on next steps

## Files Modified:
- `app/(admin)/admin/products/page.tsx` - Fixed vendor lookup and added debugging
- `lib/services/productService.ts` - Updated to use vendors collection
- `lib/services/vendorService.ts` - Standardized vendor operations
- `lib/services/analyticsService.ts` - Updated vendor queries
- `lib/setup/initializeFirebase.ts` - Fixed vendor creation
- `scripts/migrateVendors.ts` - New migration utility

The products page should now work correctly and show products when data exists in the database.