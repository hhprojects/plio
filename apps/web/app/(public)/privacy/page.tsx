import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">
        Last updated: 17 February 2026. Please review with your legal advisor.
      </p>

      <h2>1. Introduction</h2>
      <p>
        Plio (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a
        scheduling and business management platform for education businesses in
        Singapore. This Privacy Policy describes how we collect, use, and
        protect your personal data in compliance with the Personal Data
        Protection Act 2012 (&ldquo;PDPA&rdquo;) of Singapore.
      </p>

      <h2>2. Data We Collect</h2>
      <p>We collect the following categories of personal data:</p>
      <ul>
        <li>
          <strong>Account information:</strong> Name, email address, phone
          number, and role (admin, tutor, or parent).
        </li>
        <li>
          <strong>Student information:</strong> Student name, date of birth,
          school, level, and any notes provided by the parent or administrator.
        </li>
        <li>
          <strong>Scheduling data:</strong> Class schedules, attendance records,
          enrolment history, and cancellation records.
        </li>
        <li>
          <strong>Financial data:</strong> Invoice amounts, payment status, and
          payment method (e.g. PayNow, cash, bank transfer). We do not store
          credit card numbers or bank account details.
        </li>
        <li>
          <strong>Usage data:</strong> Log-in timestamps, browser type, and IP
          address for security and troubleshooting purposes.
        </li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <p>Your personal data is used for the following purposes:</p>
      <ul>
        <li>Operating and improving the Plio platform</li>
        <li>Scheduling classes, managing attendance, and tracking enrolments</li>
        <li>Generating and managing invoices and payment records</li>
        <li>Sending notifications related to class changes and payments</li>
        <li>Providing customer support</li>
        <li>Complying with legal obligations</li>
      </ul>

      <h2>4. PDPA Compliance</h2>
      <p>
        Plio acts as a <strong>Data Intermediary</strong> under the PDPA. Each
        education business using Plio is the Data Controller responsible for
        obtaining consent from parents, students, and staff. We process personal
        data only on behalf of and in accordance with the instructions of the
        Data Controller.
      </p>

      <h2>5. Cookies</h2>
      <p>
        Plio uses <strong>session cookies only</strong> to maintain your
        authenticated session. We do not use tracking cookies, advertising
        cookies, or any third-party analytics cookies.
      </p>

      <h2>6. Third-Party Data Sharing</h2>
      <p>
        We do <strong>not</strong> sell, rent, or share your personal data with
        third parties for marketing purposes. Data may be shared with:
      </p>
      <ul>
        <li>
          <strong>Infrastructure providers:</strong> Our hosting and database
          services (Vercel, Supabase) process data on our behalf under strict
          data processing agreements.
        </li>
        <li>
          <strong>Legal authorities:</strong> If required by law or legal
          process.
        </li>
      </ul>

      <h2>7. Data Retention</h2>
      <p>
        We retain your personal data for as long as your account is active or as
        needed to provide services. When a tenant account is terminated, all
        associated data is permanently deleted within 30 days.
      </p>

      <h2>8. Your Rights</h2>
      <p>Under the PDPA, you have the right to:</p>
      <ul>
        <li>Request access to your personal data</li>
        <li>Request correction of inaccurate data</li>
        <li>
          Request deletion of your data (subject to legal retention
          requirements)
        </li>
        <li>Withdraw consent for data processing</li>
      </ul>
      <p>
        To exercise these rights, please contact your education centre
        administrator, who will coordinate with us.
      </p>

      <h2>9. Data Security</h2>
      <p>
        We implement industry-standard security measures including encryption in
        transit (TLS), encryption at rest, row-level security policies, and
        regular security audits to protect your data.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        For questions about this Privacy Policy or our data practices, please
        contact us at{' '}
        <a href="mailto:privacy@plio.app">privacy@plio.app</a>.
      </p>

      <hr />

      <p className="text-muted-foreground text-sm">
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
      </p>
    </article>
  )
}
