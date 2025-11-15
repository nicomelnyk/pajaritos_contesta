import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Deletion Instructions - Pajaritos Contesta</title>
    <meta name="description" content="Data Deletion Instructions for Pajaritos Contesta Facebook Group Auto-Response App">
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
        ul, ol {
            margin: 10px 0;
            padding-left: 30px;
        }
        .last-updated {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
        }
        .contact-info {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h1>Data Deletion Instructions</h1>
    <p class="last-updated">Last updated: November 15, 2025</p>

    <section>
        <h2>How to Request Data Deletion</h2>
        <p>If you wish to delete your data from our application, please follow these steps:</p>
        <ol>
            <li><strong>Sign Out:</strong> The easiest way to stop data collection is to sign out of the application. This will immediately stop any new data from being collected.</li>
            <li><strong>Revoke Facebook Permissions:</strong> Go to your Facebook account settings and revoke permissions for this app. This will prevent the app from accessing your Facebook data.</li>
            <li><strong>Contact Us:</strong> If you want to ensure all stored data is deleted, please contact us using the information below.</li>
        </ol>
    </section>

    <section>
        <h2>What Data is Stored</h2>
        <p>Our application stores the following data:</p>
        <ul>
            <li><strong>Facebook Access Token:</strong> Stored in encrypted HTTP-only cookies (session-based, expires automatically)</li>
            <li><strong>User Session Information:</strong> Your Facebook user ID and basic profile information (name, email) stored temporarily in session cookies</li>
        </ul>
        <p><strong>Important:</strong> We do NOT store your data in a permanent database. All data is stored in session cookies that expire automatically when you sign out or after 30 days of inactivity.</p>
    </section>

    <section>
        <h2>Automatic Data Deletion</h2>
        <p>Your data is automatically deleted when:</p>
        <ul>
            <li>You sign out of the application</li>
            <li>Your session expires (after 30 days of inactivity)</li>
            <li>You revoke Facebook app permissions</li>
        </ul>
    </section>

    <section>
        <h2>Manual Data Deletion Request</h2>
        <p>If you want to ensure immediate deletion of any stored session data, you can:</p>
        <ol>
            <li>Sign out from the application</li>
            <li>Clear your browser cookies for this website</li>
            <li>Revoke the app's permissions in your Facebook account settings</li>
        </ol>
        <p>After completing these steps, all your data will be removed from our system.</p>
    </section>

    <section>
        <h2>Facebook Data</h2>
        <p>This application accesses your Facebook data through the Facebook Graph API. We do not store copies of your Facebook data. To completely remove access:</p>
        <ol>
            <li>Go to <a href="https://www.facebook.com/settings?tab=applications" target="_blank">Facebook App Settings</a></li>
            <li>Find "Pajaritos Contesta" in your authorized apps</li>
            <li>Click "Remove" to revoke all permissions</li>
        </ol>
    </section>

    <section>
        <h2>Contact Information</h2>
        <div class="contact-info">
            <p><strong>For data deletion requests or questions:</strong></p>
            <p>Email: nicoomelnyk@gmail.com</p>
            <p>Or contact us through the application interface.</p>
        </div>
    </section>

    <section>
        <h2>Verification</h2>
        <p>After you sign out and revoke permissions, you can verify that your data has been deleted by:</p>
        <ul>
            <li>Attempting to sign in again - you will need to re-authorize the app</li>
            <li>Checking that no session cookies exist for this application in your browser</li>
        </ul>
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

