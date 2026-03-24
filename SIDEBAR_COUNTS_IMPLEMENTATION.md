# Admin Sidebar Count Badges - Implementation Summary

## Overview
Added real-time count badges to the admin sidebar showing pending items that require admin attention.

## What Was Implemented

### 1. Desktop Sidebar (`components/admin/Sidebar.tsx`)
Added count badges for:
- **Vendors**: Shows pending vendor approvals
- **Products**: Shows pending product approvals
- **Orders**: Shows pending orders
- **Returns**: Shows pending return requests
- **Payouts**: Shows pending payout requests
- **Influencer Videos**: Shows pending video approvals

### 2. Mobile Sidebar (`components/admin/MobileSidebar.tsx`)
Same count badges as desktop for consistent experience across devices.

## Features

### Real-time Updates
- Counts refresh automatically every 30 seconds
- Initial fetch on component mount
- No page refresh needed

### Visual Design
- **Active Page**: White badge with purple text
- **Inactive Page**: Red badge with white text
- **Badge Position**: Right side of menu item
- **Count Display**: Shows "99+" for counts over 99

### Performance
- Single fetch for all counts
- Efficient Firestore queries using `where` clauses
- Automatic cleanup on component unmount

## Count Queries

### Pending Vendors
```typescript
query(collection(db, 'vendors'), where('status', '==', 'pending'))
```

### Pending Products
```typescript
query(collection(db, 'products'), where('status', '==', 'pending'))
```

### Pending Orders
```typescript
query(collection(db, 'orders'), where('orderStatus', '==', 'pending'))
```

### Pending Returns
```typescript
query(collection(db, 'returns'), where('status', '==', 'pending'))
```

### Pending Payouts
```typescript
query(collection(db, 'payoutRequests'), where('status', '==', 'pending'))
```

### Pending Videos
```typescript
query(collection(db, 'influencerVideos'), where('status', '==', 'pending'))
```

## Badge Display Logic

```typescript
{count > 0 && (
  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
    isActive 
      ? 'bg-white text-purple-600'    // Active page
      : 'bg-red-500 text-white'        // Inactive page
  }`}>
    {count > 99 ? '99+' : count}
  </span>
)}
```

## Navigation Items with Counts

| Menu Item | Count Key | Shows |
|-----------|-----------|-------|
| Dashboard | - | No badge |
| Vendors | `pendingVendors` | Pending approvals |
| Products | `pendingProducts` | Pending approvals |
| Categories | - | No badge |
| Orders | `pendingOrders` | Pending orders |
| Returns | `pendingReturns` | Pending returns |
| Users | - | No badge |
| Coupons | - | No badge |
| Banners | - | No badge |
| Influencer Videos | `pendingVideos` | Pending approvals |
| Payouts | `pendingPayouts` | Pending payouts |
| Reports | - | No badge |
| Settings | - | No badge |

## Benefits

1. **Immediate Visibility**: Admins see pending items at a glance
2. **Better Workflow**: No need to check each page for pending items
3. **Real-time Updates**: Counts refresh automatically
4. **Mobile Support**: Works on all devices
5. **Visual Priority**: Red badges draw attention to pending items

## Testing

To test the count badges:

1. **Create Pending Items**:
   - Add a vendor (status: pending)
   - Add a product (status: pending)
   - Create an order (orderStatus: pending)
   - Create a return request (status: pending)
   - Create a payout request (status: pending)
   - Upload an influencer video (status: pending)

2. **Verify Badges**:
   - Check sidebar shows correct counts
   - Verify counts update when items are approved/rejected
   - Test on mobile devices
   - Verify 30-second auto-refresh

3. **Test Edge Cases**:
   - Zero pending items (no badge shown)
   - Over 99 items (shows "99+")
   - Active vs inactive page styling

## Future Enhancements

Possible improvements:
- Add sound/notification when count increases
- Add animation when count changes
- Add total pending count in header
- Add filter to show only pages with pending items
- Add click to filter by pending status
- Add hover tooltip with breakdown

## Files Modified

- `components/admin/Sidebar.tsx` - Added count badges
- `components/admin/MobileSidebar.tsx` - Added count badges

## Summary

The admin sidebar now displays real-time count badges for all pending items requiring admin attention. This improves admin workflow by providing immediate visibility into pending tasks without needing to navigate to each page.
