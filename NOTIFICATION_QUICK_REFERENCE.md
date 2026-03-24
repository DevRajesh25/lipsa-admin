# Vendor Notification System - Quick Reference

## Admin Actions That Trigger Notifications

| Admin Action | Notification Type | Vendor Receives |
|-------------|------------------|-----------------|
| Approve Product | `approved` | "Your product '[name]' has been approved" |
| Reject Product | `rejected` | "Your product '[name]' has been rejected" |
| Approve Payout | `payout` | "Your payout of ₹[amount] has been processed" |
| Reject Payout | `payout` | "Your payout of ₹[amount] has been rejected" |
| Mark Payout as Paid | `payout` | "Your payout of ₹[amount] has been processed" |
| Approve Return | `return` | "Customer requested return for '[product]'" |

## Service Functions

### Create Notifications (Admin Only)
```typescript
import { 
  createProductApprovalNotification,
  createProductRejectionNotification,
  createPayoutApprovalNotification,
  createPayoutRejectionNotification,
  createReturnRequestNotification
} from '@/lib/services/notificationService';

// Product approval
await createProductApprovalNotification(vendorId, productName);

// Product rejection
await createProductRejectionNotification(vendorId, productName, reason?);

// Payout approval
await createPayoutApprovalNotification(vendorId, amount);

// Payout rejection
await createPayoutRejectionNotification(vendorId, amount, reason?);

// Return request
await createReturnRequestNotification(vendorId, productName, orderId);
```

### Read Notifications (Vendor)
```typescript
import { 
  getVendorNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount
} from '@/lib/services/notificationService';

// Get all notifications
const notifications = await getVendorNotifications(vendorId);

// Mark as read
await markNotificationAsRead(notificationId);

// Mark all as read
await markAllNotificationsAsRead(vendorId);

// Get unread count
const count = await getUnreadNotificationCount(vendorId);
```

## Notification Object Structure

```typescript
{
  id: string;
  vendorId: string;        // Vendor who receives this
  type: 'approved' | 'rejected' | 'payout' | 'return';
  title: string;           // Short title
  message: string;         // Detailed message
  isRead: boolean;         // Read status
  createdAt: Date;         // When created
}
```

## Security Rules Summary

| Action | Who Can Do It |
|--------|---------------|
| Create notification | Admin only |
| Read own notifications | Vendor (where vendorId matches) |
| Mark as read | Vendor (own notifications only) |
| Delete notification | Admin only |

## Integration in Admin Pages

### Products Page
```typescript
import { approveProduct, rejectProduct } from '@/lib/services/productService';

// Approve (creates notification automatically)
await approveProduct(productId);

// Reject (creates notification automatically)
await rejectProduct(productId, reason?);
```

### Payouts Page
```typescript
import { 
  approvePayoutRequest, 
  rejectPayoutRequest, 
  markPayoutAsPaid 
} from '@/lib/services/payoutService';

// Approve (creates notification)
await approvePayoutRequest(payoutId);

// Reject (creates notification)
await rejectPayoutRequest(payoutId, reason?);

// Mark as paid (creates notification)
await markPayoutAsPaid(payoutId);
```

### Returns Page
```typescript
import { approveReturn } from '@/lib/services/returnService';

// Approve return (creates notification for vendor)
await approveReturn(returnId);
```

## Vendor Dashboard Integration

### Basic Notification Display
```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);

useEffect(() => {
  const fetchNotifications = async () => {
    const data = await getVendorNotifications(vendorId);
    setNotifications(data);
  };
  fetchNotifications();
}, [vendorId]);
```

### Unread Badge
```typescript
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  const fetchCount = async () => {
    const count = await getUnreadNotificationCount(vendorId);
    setUnreadCount(count);
  };
  fetchCount();
}, [vendorId]);
```

### Real-time Updates
```typescript
import { collection, query, where, onSnapshot } from 'firebase/firestore';

useEffect(() => {
  const q = query(
    collection(db, 'notifications'),
    where('vendorId', '==', vendorId)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    setNotifications(data);
  });
  
  return () => unsubscribe();
}, [vendorId]);
```

## Testing Commands

### Check Notifications in Firestore
```javascript
// In Firebase Console or using Firebase CLI
db.collection('notifications')
  .where('vendorId', '==', 'VENDOR_ID')
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => console.log(doc.data()));
  });
```

### Create Test Notification (Admin)
```typescript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'notifications'), {
  vendorId: 'test-vendor-id',
  type: 'approved',
  title: 'Test Notification',
  message: 'This is a test notification',
  isRead: false,
  createdAt: serverTimestamp()
});
```

## Common Issues & Solutions

### Issue: Vendor not receiving notifications
**Solution:** Check that vendorId is correctly set in the notification document

### Issue: Notification not showing in vendor dashboard
**Solution:** Verify Firestore security rules allow vendor to read their notifications

### Issue: Cannot mark notification as read
**Solution:** Ensure security rules allow update of `isRead` field

### Issue: Duplicate notifications
**Solution:** Check that service functions are not called multiple times

## File Locations

- Service: `lib/services/notificationService.ts`
- Types: `types/index.ts`
- Security Rules: `firestore.rules` (notifications section)
- Documentation: `docs/VENDOR_NOTIFICATIONS.md`
- Usage Guide: `docs/VENDOR_NOTIFICATION_USAGE.md`

## Next Steps

1. Implement notification panel in vendor dashboard
2. Add notification bell icon with unread count
3. Add real-time notification updates
4. Consider email/SMS notifications
5. Add notification preferences
