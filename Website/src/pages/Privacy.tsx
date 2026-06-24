export default function Privacy() {
  return (
    <div className="legal-page container">
      <h1>Privacy Policy</h1>
      <p className="legal-meta">Effective date: June 24, 2026 · localhost314.com / HTMLedger</p>

      <h2>1. Overview</h2>
      <p>
        localhost314 ("we," "us," or "our") respects your privacy. This policy explains what information we
        collect when you use the HTMLedger desktop application ("the App") or visit localhost314.com ("the
        Site"), how we use it, and your rights regarding that information.
      </p>

      <h2>2. What We Collect</h2>
      <p>
        <strong>HTMLedger App — No data collected.</strong> The App runs entirely on your local machine.
        It does not connect to any server, does not transmit your files, and does not collect telemetry,
        analytics, crash reports, or usage statistics of any kind.
      </p>
      <p>
        <strong>Contact Form.</strong> If you submit a message through the contact form on this Site, we
        collect:
      </p>
      <ul>
        <li>Your name</li>
        <li>Your email address</li>
        <li>The subject and body of your message</li>
      </ul>
      <p>
        This information is used solely to respond to your inquiry. We do not add you to any mailing list,
        share your information with third parties for marketing, or sell your data.
      </p>

      <h2>3. How We Use Your Information</h2>
      <p>Contact form submissions are used only to:</p>
      <ul>
        <li>Read and respond to your message.</li>
        <li>Diagnose bugs or issues you report.</li>
      </ul>

      <h2>4. Email Delivery</h2>
      <p>
        Contact form submissions are processed through Mailgun (mailgun.com), a third-party email delivery
        service. Your message is transmitted to Mailgun's servers solely for the purpose of delivering it
        to our inbox. Mailgun's privacy policy is available at mailgun.com/privacy.
      </p>

      <h2>5. Website Hosting</h2>
      <p>
        This Site is hosted on Cloudflare Pages (cloudflare.com). Cloudflare may log standard web server
        data such as IP addresses and request timestamps for security and performance purposes. We do not
        install tracking cookies or analytics scripts on this Site.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        Contact form submissions are retained in our email inbox for up to one year, after which they
        are deleted. We do not maintain a separate database of contact submissions.
      </p>

      <h2>7. Children's Privacy</h2>
      <p>
        The App and Site are not directed at children under 13. We do not knowingly collect personal
        information from children under 13. If you believe a child has provided us personal information,
        please contact us and we will delete it promptly.
      </p>

      <h2>8. Your Rights</h2>
      <p>
        You may request deletion of any personal information we hold about you (contact form submissions)
        by emailing us at <a href="mailto:htmledger@localhost314.com">htmledger@localhost314.com</a>. We will
        fulfill deletion requests within 30 days.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be posted on this page with an
        updated effective date. Your continued use of the Site after changes constitutes acceptance.
      </p>

      <h2>10. Contact</h2>
      <p>
        Privacy questions? <a href="/contact">Contact us</a> or email{' '}
        <a href="mailto:htmledger@localhost314.com">htmledger@localhost314.com</a>.
      </p>
    </div>
  );
}
