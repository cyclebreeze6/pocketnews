import Link from 'next/link';
import { SiteHeader } from '../../components/site-header';

export const metadata = {
  title: 'Privacy Policy | Pocketnews TV',
  description: 'Privacy policy for Pocketnews TV — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  const effectiveDate = 'May 1, 2026';

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader hideCategoryNav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Effective date: {effectiveDate}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
            <p>
              Pocketnews TV (&quot;Platform&quot;, &quot;we&quot;, &quot;our&quot;) is committed to protecting your privacy. This
              Privacy Policy explains what information we collect, how we use it, and your rights regarding
              your data when you use the Platform — including our News, Podcast, and Shorts features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>

            <h3 className="text-base font-semibold mt-4 mb-1">2.1 Information you provide</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account registration details (name, email address) when you sign in via Google or email.</li>
              <li>Creator application details (NIN/tax number, content type, channel information).</li>
              <li>Notification preferences and push notification tokens.</li>
              <li>Reports or feedback you submit through the Platform.</li>
            </ul>

            <h3 className="text-base font-semibold mt-4 mb-1">2.2 Information collected automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Watch history</strong> — videos and podcast episodes you play, used to personalise your feed.</li>
              <li><strong>Device &amp; browser information</strong> — browser type, operating system, and device identifiers.</li>
              <li><strong>Usage data</strong> — pages visited, interactions with content, and session duration.</li>
              <li><strong>Location (region)</strong> — coarse region data you select to filter relevant news content. We do not collect precise GPS location.</li>
              <li><strong>Cookies &amp; local storage</strong> — used for authentication, preferences, and anonymous session tracking. See Section 6.</li>
            </ul>

            <h3 className="text-base font-semibold mt-4 mb-1">2.3 Anonymous users</h3>
            <p>
              If you use the Platform without creating an account, we assign you an anonymous Firebase
              Authentication ID to enable basic features (history, preferences). This ID is not linked to
              any personally identifiable information unless you later sign in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and improve the Platform, including News, Podcast, and Shorts features.</li>
              <li>To personalise your content feed based on watch history and region.</li>
              <li>To send push notifications about breaking news and new podcast episodes (only if you opt in).</li>
              <li>To process creator applications and manage creator accounts.</li>
              <li>To display relevant advertisements on content across the Platform.</li>
              <li>To detect abuse, enforce our Terms &amp; Conditions, and ensure platform security.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Advertising &amp; No Revenue Sharing</h2>
            <p>
              Pocketnews TV is a <strong>free platform</strong>. We may display third-party or
              first-party advertisements alongside news and podcast content. We do not sell your personal
              data to advertisers. Advertisers may receive aggregated, anonymised performance data
              (e.g. impressions, click-through rates) but never your personally identifiable information
              without your explicit consent.
            </p>
            <p className="mt-2">
              No advertising revenue is shared with creators or viewers. The Platform generates advertising
              income solely to fund operations and development. If you are interested in advertising on
              Pocketnews TV, contact{' '}
              <a href="mailto:ads@pocketnewstv.com" className="text-primary hover:underline">
                ads@pocketnewstv.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Sharing of Information</h2>
            <p>We do not sell your personal data. We may share data with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Firebase / Google Cloud</strong> — our infrastructure provider (authentication,
                database, storage, hosting). Data is processed under Google&apos;s privacy standards.
              </li>
              <li>
                <strong>YouTube</strong> — video content is embedded via the YouTube API. YouTube&apos;s own{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>{' '}
                applies to embedded player interactions.
              </li>
              <li>
                <strong>Legal authorities</strong> — where required by law, court order, or to protect the
                rights and safety of users and the Platform.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Cookies</h2>
            <p>
              We use cookies and similar technologies for authentication, session management, and analytics.
              You can manage cookie preferences through the cookie consent banner shown on your first visit.
              Disabling certain cookies may affect Platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Push Notifications</h2>
            <p>
              With your permission, we send push notifications about breaking news and new podcast content
              via Firebase Cloud Messaging. You can revoke notification permission at any time through your
              browser or device settings, or in the Platform Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Watch history is retained
              to improve your experience and can be cleared in Settings. If you delete your account, your
              personal data is deleted within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Object to or restrict certain processing of your data.</li>
              <li>Data portability.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@pocketnewstv.com" className="text-primary hover:underline">
                privacy@pocketnewstv.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">10. Children&apos;s Privacy</h2>
            <p>
              The Platform is not directed at children under the age of 13. We do not knowingly collect
              personal data from children. If you believe a child has provided us with personal data, please
              contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              via an in-app notice or email (where applicable). The effective date at the top of this page
              will always reflect the latest revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">12. Contact</h2>
            <p>
              For privacy-related questions or requests, contact us at{' '}
              <a href="mailto:privacy@pocketnewstv.com" className="text-primary hover:underline">
                privacy@pocketnewstv.com
              </a>.
            </p>
          </section>

        </div>
      </main>
      <footer className="py-8 border-t border-border/40 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Pocketnews TV. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/terms" className="hover:text-foreground hover:underline">Terms &amp; Conditions</Link>
          <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
