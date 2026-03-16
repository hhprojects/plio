import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground text-sm">
        Last updated: 17 February 2026. Please review with your legal advisor.
      </p>

      <h2>1. Service Description</h2>
      <p>
        Plio (&ldquo;the Service&rdquo;) is a cloud-based scheduling and
        business management platform designed for education businesses in
        Singapore, including tuition centres, enrichment centres, and similar
        organisations. The Service provides scheduling, attendance tracking,
        student management, invoicing, and related features.
      </p>

      <h2>2. Account Responsibilities</h2>
      <p>By creating an account, you agree to:</p>
      <ul>
        <li>Provide accurate and complete registration information</li>
        <li>
          Maintain the security of your account credentials and not share them
          with unauthorised persons
        </li>
        <li>
          Accept responsibility for all activities that occur under your account
        </li>
        <li>
          Notify us promptly of any unauthorised use of your account
        </li>
      </ul>

      <h2>3. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose</li>
        <li>
          Upload or transmit harmful code, malware, or any content that could
          compromise the security or integrity of the Service
        </li>
        <li>
          Attempt to gain unauthorised access to other accounts, systems, or
          networks connected to the Service
        </li>
        <li>
          Resell or redistribute access to the Service without our written
          consent
        </li>
        <li>
          Use the Service to store data unrelated to its intended purpose
        </li>
      </ul>

      <h2>4. Data Ownership</h2>
      <p>
        <strong>Your data belongs to you.</strong> Each tenant (education
        business) retains full ownership of the data they input into the
        Service. We do not claim any ownership over your data. You may export
        your data at any time.
      </p>

      <h2>5. Service Availability</h2>
      <p>
        We strive to maintain high availability of the Service but do not
        guarantee uninterrupted access. The Service may be temporarily
        unavailable due to maintenance, upgrades, or circumstances beyond our
        control. We will endeavour to provide advance notice of planned
        maintenance.
      </p>

      <h2>6. Fees and Payment</h2>
      <p>
        Certain features of the Service may be subject to fees as described in
        our pricing plans. We reserve the right to modify pricing with 30
        days&apos; notice. All fees are in Singapore Dollars (SGD) unless
        otherwise stated.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Plio shall not be liable for
        any indirect, incidental, special, consequential, or punitive damages,
        or any loss of profits or revenue, whether incurred directly or
        indirectly, or any loss of data, use, goodwill, or other intangible
        losses resulting from your use of the Service.
      </p>

      <h2>8. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the
        laws of the <strong>Republic of Singapore</strong>. Any disputes arising
        under these Terms shall be subject to the exclusive jurisdiction of the
        courts of Singapore.
      </p>

      <h2>9. Termination and Data Export</h2>
      <p>
        Either party may terminate the agreement at any time. Upon termination:
      </p>
      <ul>
        <li>
          You may request a full export of your data within 30 days of
          termination
        </li>
        <li>
          After 30 days, all your data will be permanently deleted from our
          systems
        </li>
        <li>
          We will not retain any copies of your data beyond what is required by
          law
        </li>
      </ul>

      <h2>10. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of
        material changes via email or through a notice on the Service.
        Continued use of the Service after changes take effect constitutes
        acceptance of the updated Terms.
      </p>

      <h2>11. Disclaimer</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; without warranties of any kind, either express or
        implied. We do not warrant that the Service will meet your specific
        requirements or be error-free.
      </p>

      <h2>12. Contact Us</h2>
      <p>
        For questions about these Terms, please contact us at{' '}
        <a href="mailto:legal@plio.app">legal@plio.app</a>.
      </p>

      <hr />

      <p className="text-muted-foreground text-sm">
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </p>
    </article>
  )
}
