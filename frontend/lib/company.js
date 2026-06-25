// Central source of truth for company / brand details — used by footer, header,
// PDF invoices, contact pages, email templates etc.
export const COMPANY = {
  name: 'Dhara Aadhvika',
  legalName: 'DHARA AADHVIKA',
  tagline: 'Pure • Honest • Rooted',
  owner: 'Boopathy.K',
  address: {
    line1: '40, Puthumanjalanaicanur',
    line2: 'Nagalur, Anthiyur',
    city: 'Erode',
    state: 'Tamil Nadu',
    pincode: '638502',
    country: 'India',
  },
  // Single-line address used in PDFs, headers etc.
  addressLine: '40, Puthumanjalanaicanur, Nagalur, Anthiyur, Erode, Tamil Nadu - 638502',
  whatsapp: '9384948663',
  phoneDisplay: '+91 93849 48663',
  supportEmail: 'boopathyboopathy298@gmail.com',
  // Compliance numbers — replace with real ones when issued
  fssai: '12345678901234',
  gstin: '33ABCDE1234F1Z5',
  socials: {
    instagram: 'https://www.instagram.com/dhara_aadhvika',
    facebook: 'https://www.facebook.com/share/1918RX2NQd/',
    youtube: 'https://youtube.com/@dharaaadhvika',
    twitter: 'https://x.com/DharaAadhvika',
  },
};

export const WHATSAPP_LINK = `https://wa.me/91${COMPANY.whatsapp}`;
