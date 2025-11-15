import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Pajaritos Contesta</title>
    <meta name="description" content="Privacy Policy for Pajaritos Contesta Facebook Group Auto-Response App">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #000;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
        }
        h2 {
            color: #444;
            margin-top: 30px;
        }
        ul {
            margin: 10px 0;
        }
        .last-updated {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p class="last-updated">Last updated: November 15, 2025</p>

    <section>
        <h2>1. Information We Collect</h2>
        <p>Our application collects the following information from Facebook:</p>
        <ul>
            <li>Your public profile information (name, email)</li>
            <li>Access to Facebook groups you administer</li>
            <li>Permission to post comments on your behalf in groups</li>
        </ul>
    </section>

    <section>
        <h2>2. How We Use Your Information</h2>
        <p>We use the collected information to:</p>
        <ul>
            <li>Authenticate you through Facebook Login</li>
            <li>Display groups you have access to</li>
            <li>Post automated responses in Facebook groups on your behalf</li>
        </ul>
    </section>

    <section>
        <h2>3. Data Storage</h2>
        <p>Your Facebook access token is stored securely in encrypted sessions (HTTP-only cookies) and is only used to make API calls on your behalf. We do not store your personal information in a database.</p>
    </section>

    <section>
        <h2>4. Data Sharing</h2>
        <p>We do not share your personal information with third parties. Your data is only used within this application to provide the functionality you request.</p>
    </section>

    <section>
        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
            <li>Access your personal information</li>
            <li>Revoke access at any time by signing out</li>
            <li>Request deletion of your data</li>
        </ul>
    </section>

    <section>
        <h2>6. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, please contact us through the application.</p>
    </section>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

