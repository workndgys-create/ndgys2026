import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
export const metadata: Metadata = { title: "Privacy Policy — NDGYS 4.0" };
export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="June 2026">
      <h2>1. Introduction</h2>
      <p>Welcome to the New Delhi Global Youth Summit (NDGYS) 2026. We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and safeguard your information when you visit our website, register for our events, or interact with our services.</p>
      <p>By using our website and services, you consent to the practices described in this Privacy Policy.</p>

      <h2>2. Information We Collect</h2>
      <p>We may collect the following information:</p>
      <h3>Personal Information</h3>
      <ul>
        <li>Full Name</li>
        <li>Email Address</li>
        <li>Phone Number</li>
        <li>Institution/Organization Name</li>
        <li>City, State, and Country</li>
        <li>Date of Birth (where required)</li>
        <li>Emergency Contact Information</li>
        <li>Committee and Portfolio Preferences</li>
        <li>Payment and Registration Details</li>
      </ul>
      <h3>Technical Information</h3>
      <ul>
        <li>IP Address</li>
        <li>Browser Type and Version</li>
        <li>Device Information</li>
        <li>Operating System</li>
        <li>Pages Visited and Usage Analytics</li>
        <li>Cookies and Similar Technologies</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Process registrations and event participation.</li>
        <li>Allocate committees, portfolios, and summit tracks.</li>
        <li>Send important event updates and announcements.</li>
        <li>Provide customer support and respond to inquiries.</li>
        <li>Manage certificates, awards, and participation records.</li>
        <li>Improve website performance and user experience.</li>
        <li>Maintain security and prevent fraud or misuse.</li>
        <li>Comply with legal and regulatory requirements.</li>
      </ul>

      <h2>4. Communications</h2>
      <p>By registering for NDGYS 2026, you agree to receive:</p>
      <ul>
        <li>Registration confirmations</li>
        <li>Event-related announcements</li>
        <li>Delegate briefings</li>
        <li>Schedule updates</li>
        <li>Certificates and post-event communications</li>
      </ul>
      <p>You may opt out of non-essential promotional communications at any time.</p>

      <h2>5. Payment Information</h2>
      <p>Payments are processed through secure third-party payment providers. NDGYS does not store complete debit card, credit card, banking, or UPI credentials on its servers.</p>
      <p>Payment information is handled according to the security standards of the respective payment service providers.</p>

      <h2>6. Data Sharing</h2>
      <p>We do not sell, rent, or trade personal information.</p>
      <p>Information may be shared only with:</p>
      <ul>
        <li>Authorized organizing team members</li>
        <li>Event partners and service providers directly involved in summit operations</li>
        <li>Payment processing providers</li>
        <li>Government or legal authorities when required by law</li>
      </ul>
      <p>All third-party service providers are expected to maintain appropriate confidentiality and security standards.</p>

      <h2>7. Cookies and Analytics</h2>
      <p>Our website may use cookies and analytics tools to:</p>
      <ul>
        <li>Improve website functionality</li>
        <li>Understand visitor behavior</li>
        <li>Enhance user experience</li>
        <li>Monitor website performance</li>
      </ul>
      <p>You may disable cookies through your browser settings; however, some website features may not function properly.</p>

      <h2>8. Data Security</h2>
      <p>We implement reasonable administrative, technical, and organizational safeguards to protect personal information against unauthorized access, disclosure, alteration, or destruction.</p>
      <p>While we strive to protect your information, no online transmission or storage system can be guaranteed to be 100% secure.</p>

      <h2>9. Data Retention</h2>
      <p>We retain personal information only for as long as necessary to:</p>
      <ul>
        <li>Conduct the event</li>
        <li>Maintain participant records</li>
        <li>Issue certificates</li>
        <li>Fulfill legal and administrative obligations</li>
      </ul>
      <p>After this period, information may be securely deleted or anonymized.</p>

      <h2>10. Photography and Media Consent</h2>
      <p>NDGYS 2026 may capture photographs, videos, recordings, and other media during the event.</p>
      <p>By participating in the summit, attendees grant permission for such content to be used for:</p>
      <ul>
        <li>Event promotion</li>
        <li>Social media content</li>
        <li>Marketing materials</li>
        <li>Educational and archival purposes</li>
      </ul>
      <p>Participants may contact the organizing team regarding specific concerns related to media usage.</p>

      <h2>11. Children&apos;s Privacy</h2>
      <p>NDGYS 2026 is intended for students and young professionals. Participants below the age of 18 may be required to obtain parental or guardian consent where applicable under local laws.</p>

      <h2>12. Third-Party Links</h2>
      <p>Our website may contain links to external websites and platforms. We are not responsible for the privacy practices or content of third-party websites.</p>
      <p>Users are encouraged to review the privacy policies of external services they access.</p>

      <h2>13. Changes to This Policy</h2>
      <p>NDGYS reserves the right to update this Privacy Policy at any time.</p>
      <p>Changes will be published on this page along with an updated revision date. Continued use of our website and services after updates constitutes acceptance of the revised policy.</p>

      <h2>14. Contact Us</h2>
      <p>For questions regarding this Privacy Policy or the handling of your personal information, please contact:</p>
      <p><strong>New Delhi Global Youth Summit (NDGYS) 2026</strong></p>
      <p>
        Email: <a href="mailto:info@globalyouthsummit.com">info@globalyouthsummit.com</a><br />
        Website: <a href="https://www.globalyouthsummit.in/" target="_blank" rel="noreferrer">https://www.globalyouthsummit.in</a>
      </p>
      <p>By using our website and participating in NDGYS 2026, you acknowledge that you have read and understood this Privacy Policy.</p>
    </LegalPage>
  );
}
