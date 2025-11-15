# Pajaritos Contesta

A Next.js application for managing automated responses in Facebook groups. Supports multiple admin users with individual Facebook authentication.

## Features

- 🔐 Multi-user Facebook OAuth authentication
- 👥 Session-based user identification
- 📱 Facebook Groups API integration
- 💬 Post comments on group posts
- 🎨 Modern UI with Tailwind CSS
- 🚀 Ready for Vercel deployment

## Tech Stack

- **Next.js 14** (App Router)
- **NextAuth.js v5** (Authentication)
- **TypeScript**
- **Tailwind CSS**
- **Facebook Graph API**

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `FACEBOOK_APP_ID` - Your Facebook App ID
- `FACEBOOK_APP_SECRET` - Your Facebook App Secret
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` - Random secret (generate with `openssl rand -base64 32`)

### 3. Facebook App Setup

**See `MANUAL_SETUP.md` for detailed Facebook configuration steps.**

Quick checklist:
- [ ] Create Facebook App at developers.facebook.com
- [ ] Add Facebook Login product
- [ ] Configure OAuth redirect URIs
- [ ] Request required permissions
- [ ] Add test users (for development)
- [ ] Submit for App Review (for production)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How Multi-User Authentication Works

1. **User Login**: Each admin logs in with their Facebook account via OAuth
2. **Session Creation**: NextAuth creates a JWT session with the user's access token
3. **Token Storage**: Access token is stored in an HTTP-only cookie (secure)
4. **API Calls**: When making Facebook API calls, the session is read to get the current user's token
5. **User Identification**: The session contains the user's ID, so each request knows which user is making it

## API Routes

- `GET /api/auth/[...nextauth]` - NextAuth authentication endpoints
- `GET /api/facebook/groups` - Get user's Facebook groups
- `GET /api/facebook/posts?groupId={id}` - Get posts from a group
- `POST /api/facebook/comment` - Post a comment on a post

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Update Facebook OAuth redirect URIs with your Vercel domain
5. Deploy!

## Important Notes

⚠️ **Facebook Groups API Limitations:**
- Some Groups API endpoints were deprecated in 2024
- Posting new posts to groups may not work
- Commenting on existing posts may still work
- Check Facebook's current API documentation

⚠️ **Permissions:**
- Advanced permissions require App Review
- Development mode allows testing with your own account
- Add test users in Facebook App settings

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth routes
│   │   └── facebook/            # Facebook API routes
│   ├── auth/
│   │   └── signin/              # Sign in page
│   ├── auth.ts                  # NextAuth configuration
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/
│   └── Dashboard.tsx            # Main dashboard component
├── types/
│   └── next-auth.d.ts          # TypeScript definitions
├── MANUAL_SETUP.md             # Facebook setup guide
└── README.md                   # This file
```

## License

ISC

