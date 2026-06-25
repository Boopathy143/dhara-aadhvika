'use client';
import ContentPage from '@/components/ContentPage';
export default function Terms() {
  return <ContentPage
    title="Terms and Conditions"
    subtitle="The terms governing use of the Dhara Aadhvika website and services."
    sections={[
      { heading: '1. Acceptance', content: 'By using dharaaadhvika.com you agree to these Terms. If you do not agree, please do not use the site.' },
      { heading: '2. Account', content: 'You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately of any unauthorised use.' },
      { heading: '3. Products and pricing', content: 'We try to display accurate product information and pricing. In case of an error, we reserve the right to correct it and cancel/refund affected orders.' },
      { heading: '4. Orders', content: 'An order is confirmed only after payment is received (or COD is approved). We reserve the right to decline any order at our discretion.' },
      { heading: '5. Shipping & delivery', content: 'Delivery timelines are estimates. We are not liable for delays caused by courier partners or force majeure events.' },
      { heading: '6. Intellectual property', content: 'All content on this site (logo, copy, photographs, design) is owned by Dhara Aadhvika Pvt. Ltd. and may not be reproduced without written consent.' },
      { heading: '7. Limitation of liability', content: 'Our maximum liability for any claim is limited to the value of the relevant order. We are not liable for indirect or consequential damages.' },
      { heading: '8. Governing law', content: 'These Terms are governed by Indian law. Any dispute is subject to the exclusive jurisdiction of the courts of Chennai, Tamil Nadu.' },
      { heading: '9. Updates', content: 'We may update these Terms from time to time. Continued use of the site constitutes acceptance of the updated Terms.' },
    ]}
  />;
}
