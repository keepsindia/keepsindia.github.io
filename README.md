# KEEPS ♡ — GitHub Pages website

## What is included
- Responsive cream / burgundy KEEPS website
- Local image assets (no broken remote photo links)
- ₹14,999 / 3-hour public pricing and ₹2,500 extra hour
- December 4, 2026 booking launch date
- Calendar with Dec 6 and Dec 12 shown as demo booked dates
- Inquiry form that DOES NOT reserve a date
- Google Apps Script backend template for a private Google Sheet
- Only rows with Booking Status = Confirmed block a public date

## Publish the website
Upload the CONTENTS of this folder to the root of your GitHub repository. In GitHub Pages settings, deploy from the main branch / root.

## Connect the private Google Sheet
1. Upload KEEPS_Bookings.xlsx to Google Drive and open it with Google Sheets (or create a Sheet with the same `Bookings` tab/columns).
2. In that Google Sheet: Extensions → Apps Script.
3. Replace the editor contents with `google-apps-script/Code.gs` from this package.
4. Set the Apps Script project timezone to your India business timezone (for example Asia/Kolkata).
5. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
6. Copy the deployed Web App URL.
7. Paste it into `config.js` as `API_URL`.
8. Commit/push `config.js` to GitHub. The public site will now submit inquiries to the private Sheet and read ONLY confirmed dates.

## Your daily workflow
New website inquiry → row appears as `New Inquiry` → contact customer on WhatsApp → set `Contacted` → send payment details → set payment to `Payment Sent` → verify money received → set payment to `Paid` → change Booking Status to `Confirmed`.

Only `Confirmed` blocks the date. `New Inquiry` and `Contacted` do not block it. If you set a confirmed booking to `Cancelled`, the date becomes available again on the website on its next availability refresh/page load.

The script includes a duplicate-confirmation guard: if you accidentally try to confirm a second row for the same date, it reverts that edit.

## Demo booked dates
The supplied Excel workbook has two clearly labeled demo/launch-hold rows for Dec 6 and Dec 12, 2026. They are `Confirmed`, so after you connect the live Sheet they will continue to appear booked. Delete/change those rows before launch if you do not want to block those dates.

## Important privacy note
Do NOT upload the Excel/Google Sheet customer data to your public GitHub repository. The website endpoint returns only confirmed date strings; it does not expose customer names, phone numbers, emails or notes.
