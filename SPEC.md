# Trick - Privacy-First Crypto Transfers on TRON

## Project Overview
- **Name**: Trick
- **Type**: Full-stack decentralized application (dApp)
- **Core Functionality**: Enable ultra-simple, privacy-first crypto transfers on TRON using stealth addresses and shareable payment links
- **Target Users**: Cryptocurrency users seeking privacy, beginners wanting simple UX

## UI/UX Specification

### Layout Structure
- **Header**: Logo (left), Navigation links (center), User profile/auth button (right)
- **Main Content**: Centered container, max-width 1200px
- **Footer**: Minimal - copyright, links to docs

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Visual Design

#### Color Palette
- Primary Red: #FF3333 (brand accent)
- Secondary Red: #CC0000 (hover states)
- Background White: #FFFFFF
- Background Light: #FFF5F5 (subtle tinted sections)
- Text Primary: #1A1A1A
- Text Secondary: #666666
- Success Green: #00CC66
- Border Gray: #E5E5E5

#### Typography
- Font Family: "Space Grotesk" for headings, "DM Sans" for body
- Heading 1: 48px, bold
- Heading 2: 32px, semibold
- Heading 3: 24px, semibold
- Body: 16px, regular
- Small: 14px, regular
- Mono (addresses): "JetBrains Mono"

#### Spacing System
- Base unit: 8px
- Section padding: 64px vertical
- Card padding: 24px
- Component gaps: 16px

#### Visual Effects
- Card shadows: 0 4px 24px rgba(255, 51, 51, 0.08)
- Hover transitions: 200ms ease
- Button hover: darken 10%, scale(1.02)
- Page transitions: fade-in 300ms

### Pages & Components

#### 1. Landing Page
- Hero section with tagline
- Two CTA buttons: "Get Started" (Google OAuth), "Learn More"
- Features grid (3 cards)
- How it works section (3 steps)

#### 2. Dashboard (Authenticated)
- Sidebar navigation (links, addresses, settings)
- Main area:
  - Balance summary card
  - Payment link generation
  - Stealth addresses list
  - Recent transactions
- Quick actions bar

#### 3. Send Page
- Input: payment link or address
- Input: amount
- Review card with gas estimate
- Send button

#### 4. Receivers Link Page
- Display generated unique link
- Copy button
- QR code display
- Amount input for sender
- Confirm send button

#### 5. Settings Page
- Linked accounts (OAuth)
- Notification preferences
- Withdrawal addresses

### Components
- **Button**: Primary (red), Secondary (outline), Ghost
- **Input**: Floating labels, validation states
- **Card**: With optional header, body, actions
- **AddressDisplay**: Truncated with copy icon
- **BalanceDisplay**: Token icon + amount + USD value
- **TransactionRow**: Status, amount, address, time
- **LinkGenerator**: Button that creates new payment link

## Functionality Specification

### Core Features

#### 1. OAuth Authentication
- Google OAuth via NextAuth.js
- Apple OAuth via NextAuth.js
- Session management
- Protected routes

#### 2. Stealth Address Generation
- Deterministic key derivation from user master key
- One-time address per transaction
- Cryptographic link to receiver identity (not exposed)
- Algorithm:
  1. Generate random scalar r (blinding factor)
  2. Compute R = r * G (public point)
  3. Compute shared secret s = hash(r * P_receiver)
  4. Stealth address = P_receiver + s * G

#### 3. Payment Links
- Format: `https://trick.fi/pay/{unique_id}`
- Contains: encoded receiver identity, optional amount parameter
- Link validation and resolution
- QR code generation

#### 4. TRON Integration
- Connect to TRON network via @tronweb/tronweb
- TRX transfers (using TronLink wallet)
- TRC-20 token support (USDT)
- Balance fetching
- Transaction history

#### 5. Dashboard Features
- List all generated stealth addresses
- Show balance per address
- Transaction history
- Create new payment link
- Withdraw to external wallet

#### 6. Notifications
- Email notifications for incoming funds
- In-app notifications
- Webhook support for exchanges

### User Flows

#### Receiver Flow
1. Sign in with Google/Apple
2. Generate payment link
3. Share link
4. Receive notification on payment
5. View stealth address balance
6. Withdraw funds

#### Sender Flow
1. Open receiver's payment link
2. Connect wallet (TronLink)
3. Input amount
4. Review transaction
5. Confirm and send

### Data Handling
- User data: Stored in PostgreSQL (or SQLite for MVP)
- OAuth tokens: Managed by NextAuth.js
- Stealth addresses: Derived on-demand
- Transactions: Queried from TRON blockchain

### Edge Cases
- Wallet not connected: Show connect prompt
- Insufficient balance: Show error, suggest bridge
- Invalid payment link: Show error page
- Network issues: Retry with exponential backoff

## Technical Architecture

### Frontend Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- @tronweb/tronweb SDK

### Backend Stack
- Next.js API Routes
- NextAuth.js for OAuth
- Prisma ORM
- SQLite (for simplicity)

### Smart Contract (Optional)
- Simple vault contract for TRC-20
- Can integrate with existing bridges

### File Structure
```
/app
  /api          # API routes
  /(auth)       # Auth pages
  /(dashboard)  # Protected pages
  /pay/[id]     # Payment link page
/components     # Reusable UI components
/lib            # Utilities, TRON helpers
/prisma         # Database schema
/public         # Static assets
```

## Acceptance Criteria

### Visual Checkpoints
- [ ] Landing page loads with red/white theme
- [ ] Auth flow works with Google
- [ ] Dashboard shows balance and addresses
- [ ] Payment link generates correctly
- [ ] Send flow works with TronLink
- [ ] Responsive on mobile

### Functional Checkpoints
- [ ] User can sign in via OAuth
- [ ] User can generate payment link
- [ ] Stealth address created per transaction
- [ ] Balance updates after send
- [ ] Transaction history displays
- [ ] Email notifications sent

### Privacy Checkpoints
- [ ] Stealth address not linkable to main wallet
- [ ] Payment link reveals only receiver identity
- [ ] No public address exposure for receiver