# Order Breakdown Calculation Guide

## How It Works

The order details modal now automatically calculates and displays the payment breakdown for all orders, even if they were created before this feature was added.

## Automatic Calculation

When you view the orders page, the system:

1. **Fetches Settings**: Gets the current tax rate and commission percentage from your settings
2. **Calculates Breakdown**: For any order missing breakdown data, it calculates:
   - Product Price = Total Amount ÷ (1 + Tax Rate %)
   - Tax Amount = Product Price × Tax Rate %
   - Commission = Product Price × Commission %
   - Vendor Amount = Product Price - Commission

3. **Saves to Database**: When you click the eye icon to view details, it automatically saves the calculated breakdown to the database for faster future loads

## Example Calculation

For an order with Total Amount = ₹1,062:

```
Settings:
- Tax Rate: 18%
- Commission: 10%

Calculation:
- Product Price = ₹1,062 ÷ 1.18 = ₹900
- Tax Amount = ₹900 × 18% = ₹162
- Commission = ₹900 × 10% = ₹90
- Vendor Amount = ₹900 - ₹90 = ₹810

Display:
✓ Product Price: ₹900
✓ Tax (18%): ₹162
✓ Total Paid: ₹1,062
✓ Platform Commission (10%): ₹90
✓ Vendor Receives: ₹810
```

## What You See

The order details modal shows:

1. **Product Price** - Base price before tax
2. **Tax (18%)** - Tax amount calculated on product price
3. **Total Paid** - What the customer paid (highlighted in purple)
4. **Platform Commission** - Your platform's earnings (10% of product price)
5. **Vendor Receives** - What the vendor gets (highlighted in green)

## No Action Required

- All calculations happen automatically
- Old orders are calculated on-the-fly
- New orders will have breakdown saved immediately
- Just refresh your orders page and click the eye icon to see details

## Changing Settings

If you change the tax rate or commission percentage in Settings:
- New orders will use the new rates
- Old orders will keep their original calculations
- The system uses the settings that were active when the order was placed
