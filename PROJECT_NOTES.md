# Debt Manager - Project Notes

## Development Summary

### Authentication System Setup
- Implemented dual authentication methods: Email/Password AND Phone (SMS/OTP)
- Integrated Twilio for SMS authentication with secure credential storage
- **Why SMS Authentication?** 
  - Provides users with a passwordless login option
  - More convenient for mobile users
  - Reduces password fatigue
  - Can improve security (phone number as second factor)
  - Better user experience for quick access
  - Common in financial apps for added verification

### Backend Infrastructure (Lovable Cloud)
- Set up Supabase backend with secure secrets management
- Stored Twilio credentials:
  - Account SID: `AC253ebc5eb1e397bb491ecc0796bddf17`
  - Auth Token: Stored in secrets
  - Verify Service SID: `VAb6751a969fa3dc1b001972329e2f4756`
- Created edge functions for SMS OTP sending and verification using Twilio Verify API
- **Note:** Twilio Verify API automatically handles phone number selection - no need to register a specific number

### Frontend Components
- Auth page (/auth) with tabbed interface for Email and Phone login
- Dashboard (/dashboard) showing connected bank accounts
- Plaid integration for linking bank accounts

### Plaid Banking Integration
- Set up Plaid API credentials for bank account connectivity
- Created edge functions: link token creation, token exchange, account fetching
- Allows users to securely connect their financial accounts

### Key Features Built
- User signup/signin flows with proper session management
- OTP verification system for phone authentication
- Bank account linking and display
- Responsive UI with proper loading states and error handling

---

**Note:** SMS authentication gives users flexibility - they can choose email OR phone based on their preference, which is especially useful for a financial app where quick, secure access matters.

---

## TODO: Production Build for App Store Submission

### Task: Generate Production Build for Capacitor/Xcode
**Date Added:** October 26, 2025  
**Priority:** High  
**Status:** Pending

#### Steps Required:
1. **Clone repository from GitHub**
   - Get repository URL from GitHub (green "Code" button)
   - In Terminal: `cd ~`
   - Clone: `git clone [ACTUAL_GITHUB_URL]`
   
2. **Install dependencies**
   - Navigate to project: `cd [repo-name]`
   - Install: `npm install`

3. **Build production version**
   - Run: `npm run build`
   - Output will be in `dist/` folder

4. **Sync with Capacitor for iOS**
   - Run: `npx cap sync ios`
   - Open in Xcode: `npx cap open ios`

5. **Submit to App Store**
   - Use production build from `dist/` folder
   - Configure in Xcode for submission

#### Notes:
- Project already configured for Capacitor (see capacitor.config.ts)
- Terminal error was due to using placeholder text instead of actual GitHub URL
- Make sure to use the REAL repository URL without `<>` brackets
