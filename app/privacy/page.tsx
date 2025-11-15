import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Pajaritos Contesta",
  description: "Privacy Policy for Pajaritos Contesta Facebook Group Auto-Response App",
  robots: "index, follow",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Privacy Policy
        </h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-sm text-gray-600 mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              1. Information We Collect
            </h2>
            <p className="text-gray-700 mb-2">
              Our application collects the following information from Facebook:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Your public profile information (name, email)</li>
              <li>Access to Facebook groups you administer</li>
              <li>Permission to post comments on your behalf in groups</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              2. How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-2">
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Authenticate you through Facebook Login</li>
              <li>Display groups you have access to</li>
              <li>Post automated responses in Facebook groups on your behalf</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              3. Data Storage
            </h2>
            <p className="text-gray-700">
              Your Facebook access token is stored securely in encrypted
              sessions (HTTP-only cookies) and is only used to make API calls on
              your behalf. We do not store your personal information in a
              database.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              4. Data Sharing
            </h2>
            <p className="text-gray-700">
              We do not share your personal information with third parties. Your
              data is only used within this application to provide the
              functionality you request.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              5. Your Rights
            </h2>
            <p className="text-gray-700 mb-2">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Access your personal information</li>
              <li>Revoke access at any time by signing out</li>
              <li>Request deletion of your data</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              6. Contact Us
            </h2>
            <p className="text-gray-700">
              If you have questions about this Privacy Policy, please contact us
              through the application.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

