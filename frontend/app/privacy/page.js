'use client';
import ContentPage from '@/components/ContentPage';
export default function Privacy() {
  return <ContentPage
    cmsKey="privacyPolicy"
    title="Privacy Policy"
    subtitle="How Dhara Aadhvika collects, uses and protects your information."
    sections={[
      { heading: '1. Information we collect', content: 'When you create an account or place an order, we collect your name, email, phone number, shipping address and payment method. We also log basic usage analytics (page visits, device type) to improve the site.' },
      { heading: '2. How we use your data', content: 'Your data is used only to fulfil orders, provide customer support, send order updates, and — with your explicit consent — occasional offers and recipes. We never sell your data.' },
      { heading: '3. Payment information', content: 'We do not store credit-card or bank details on our servers. All online payments are processed through PCI-DSS compliant payment gateways (Razorpay).' },
      { heading: '4. Cookies', content: 'We use essential cookies for cart, login and preferences. Analytics cookies (anonymised) help us improve the experience. You can disable cookies in your browser, though some features may not work.' },
      { heading: '5. Data sharing', content: 'We share data only with: (a) our shipping partners (name, address, phone) to deliver your order, (b) payment gateways to process payments, (c) tax authorities when required by law. That’s it.' },
      { heading: '6. Data security', content: 'All data is stored on secure servers. Passwords are hashed using strong cryptography (scrypt). Sessions use httpOnly secure cookies.' },
      { heading: '7. Your rights', content: 'You can request a copy of your data, ask us to update it, or delete your account at any time by emailing privacy@dharaaadhvika.com.' },
      { heading: '8. Contact', content: 'For privacy questions: privacy@dharaaadhvika.com. Last updated: June 2025.' },
    ]}
  />;
}
