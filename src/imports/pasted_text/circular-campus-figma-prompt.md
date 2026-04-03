Here's a comprehensive Figma prompt you can paste directly into a Figma AI tool, FigJam, or hand to a designer:

---

## Figma Prototype Prompt — Circular Campus

---

### Project Context

Design a complete interactive prototype for **Circular Campus**, a C2C appliance rental marketplace targeting university students. The product solves the "student exit problem" — when students leave, their appliances circulate to arriving students instead of going to landfill.

**Tone:** Trustworthy, clean, slightly warm. Not corporate. Not too playful. Think Airbnb meets Notion meets a student union noticeboard.

**Users:** Exchange students, short-term residents, budget-conscious renters aged 18–28. Mobile-first but also functional on desktop.

---

### Design System — Define Before Screens

**Typography:**
- Heading font: `Inter` or `DM Sans` — bold, readable
- Body font: `Inter` — 14–16px base
- Use a clear type scale: Display / H1 / H2 / Body / Caption / Label

**Color Palette:**
- Primary: Deep teal `#0D7377` — trust, sustainability
- Accent: Warm amber `#F4A261` — energy, student warmth
- Success: `#22C55E`
- Danger: `#EF4444`
- Background: Off-white `#F9FAFB`
- Card surface: `#FFFFFF`
- Muted text: `#6B7280`
- Border: `#E5E7EB`

**Component Library to build first:**
- Buttons: Primary / Secondary / Ghost / Destructive — all with hover + disabled states
- Input fields: Default / Focused / Error / Filled
- Cards: Listing card (image, title, price, distance, badge) — with skeleton loading variant
- Badges: Category tag / Verified student / Available / Unavailable
- iOS-style elastic toggle (Available now / Notifications / Condition)
- Bottom navigation bar (mobile)
- Top navigation bar (desktop)
- Avatar + user chip
- Stepper component (for multi-step forms)
- Modal / bottom sheet
- Toast notification
- Empty state illustration placeholder

---

### Screen List — Build All of These

#### 🔐 Auth Flow
**Screen 1 — Splash / Onboarding (3 slides)**
- Slide 1: "Rent what you need. Leave what you don't." — hero illustration of campus items
- Slide 2: "List your idle appliances in under 3 minutes."
- Slide 3: "Recycle responsibly. Help the next cohort."
- CTA: "Get Started" + "I already have an account"

**Screen 2 — Sign Up**
- University email field (with `.edu` or local university domain hint)
- Password field
- "Verify your student status" micro-copy
- Google OAuth option
- Link to Log In

**Screen 3 — Log In**
- Email + password
- "Forgot password" link
- Google OAuth
- Link to Sign Up

**Screen 4 — Email Verification Pending**
- Illustration: envelope with checkmark
- "We sent a link to your university email"
- Resend button with countdown timer

---

#### 🏠 Home (Demand Side)
**Screen 5 — Home Feed**
- Sticky top bar: search bar + location chip ("Near TU Berlin") + avatar
- Hero banner: "Move-in Season — Items Near You"
- Horizontal scroll row: Categories (Kitchen / Electronics / Furniture / Camera / Cooling / Other)
- Section: "Within 10 min walk" — bento grid of listing cards (2 large + 3 small)
- Section: "Recently Added"
- Section: "Last Minute — Available Today"
- Bottom nav: Home / Browse / List Item / Requests / Profile

**Screen 6 — Browse / Search**
- Search bar (active state with cursor)
- Filter chips: Category / Price / Distance / Condition
- Filter drawer (bottom sheet): price range slider, category checkboxes, distance radius
- Grid of listing cards (2-column)
- Empty state: "No items found near you — try widening your search"

**Screen 7 — Listing Detail Page**
- Full-width image carousel (swipeable, 3–5 images, dot indicators)
- Back arrow + share icon
- Item title + category badge
- Price display: daily / weekly / monthly options (toggle between them)
- Deposit chip: "€20 deposit required"
- Distance: "8 min walk · Mitte, Berlin"
- Owner card: avatar, first name, university badge ("Verified TU Berlin"), member since
- Description section (expandable)
- Availability calendar (simple month view, greyed-out dates)
- Condition rating: visual icons (Working perfectly / Minor wear / Functional)
- Sticky bottom bar: "Request to Rent" primary button + "Save" icon

---

#### 📋 Rental Request Flow
**Screen 8 — Request to Rent (Step 1 of 3)**
- Stepper at top: Dates → Message → Confirm
- Date range picker: Start date / End date
- Duration auto-calculated: "14 days"
- Price breakdown: Daily rate × days + deposit
- "Next" button

**Screen 9 — Request to Rent (Step 2 of 3)**
- Message to owner text area
- Suggested prompts: "I'm an exchange student arriving in October…"
- Pickup preference: "I can collect" / "Can you drop off?" toggle
- "Next" button

**Screen 10 — Request to Rent (Step 3 of 3) — Confirmation**
- Summary card: item image thumbnail, dates, total cost, deposit
- Disclaimer: "This is a manual agreement. Payment and deposit are handled at pickup."
- Checkbox: "I have read and agree to the rental terms"
- "Send Request" primary button
- Back link

**Screen 11 — Request Sent**
- Success illustration (checkmark animation placeholder)
- "Request sent to [Owner name]"
- "You'll receive an email when they respond — usually within 24 hours"
- "View My Requests" CTA
- "Back to Browse" secondary

---

#### 📦 Supply Side — Create Listing
**Screen 12 — Create Listing (Step 1 — Item Details)**
- Stepper: Details → Pricing → Availability → Review
- Photo upload grid: 3–5 slots, first slot = "Add cover photo"
- Title input
- Category selector (icon grid: Kitchen, Electronics, Camera, Cooling, Furniture, Other)
- Condition selector: 3 cards — "Works perfectly" / "Minor issues" / "For parts"
- Description textarea with character count

**Screen 13 — Create Listing (Step 2 — Pricing)**
- Daily price input (€ field)
- Weekly price (auto-suggested as daily × 6, editable)
- Monthly price (auto-suggested, editable)
- Deposit amount input
- Helper text: "Most similar items are listed at €2–4/day"
- "Available now" iOS toggle

**Screen 14 — Create Listing (Step 3 — Availability & Location)**
- Availability date range picker: "From / Until"
- Location: area picker (dropdown of campus zones / neighbourhoods — not exact address)
- "Show item on map as area only" info chip

**Screen 15 — Create Listing (Step 4 — Review & Publish)**
- Preview of listing card as renters will see it
- All details summarised
- Edit links per section
- "Publish Listing" primary button
- "Save as Draft" secondary

---

#### ♻️ Recycling Intake
**Screen 16 — Dispose / Recycle Your Appliance**
- Hero: "Leaving the city? Don't bin it."
- Sub-copy: "Submit your appliance and we'll collect it, refurbish if needed, and rent it to the next student."
- CTA: "Submit an Appliance"

**Screen 17 — Recycling Form**
- Item type (dropdown)
- Condition: 3-option toggle (Working / Partially Working / Broken)
- Photo upload (2–3 images)
- Pickup location (area + building name/dorm)
- Preferred pickup date picker
- Expected price (optional field with "Leave blank to donate")
- "Submit for Collection" button

**Screen 18 — Recycling Submitted**
- Confirmation illustration
- "We'll be in touch within 48 hours to arrange collection"
- What happens next: 3-step visual (Collection → Assessment → Listed or Recycled)

---

#### 👤 User Dashboard
**Screen 19 — My Requests (Renter View)**
- Tabs: Active / Pending / Past
- Request card: item thumbnail, owner name, dates, status chip (Pending / Accepted / Rejected)
- Tap to expand: see full details + owner contact on acceptance

**Screen 20 — My Listings (Owner View)**
- "Create new listing" button at top
- Listing cards with status: Active / Draft / Unavailable
- Each card: quick actions — Edit / Mark Unavailable / Delete
- Incoming request badge count on active listings

**Screen 21 — Incoming Requests (Owner View)**
- Request card: renter name, university badge, message preview, dates requested
- Actions: "Accept" (green) / "Decline" (ghost red)
- Accepted state: shows renter contact info revealed

**Screen 22 — Profile**
- Avatar + name + university badge
- Member since date
- Stats: Items listed / Rentals completed
- Edit profile
- Settings: Notifications toggle, Email preferences
- Log out

---

#### ⚙️ Admin Panel (Separate View)
**Screen 23 — Admin Dashboard**
- Summary cards: Total listings / Pending approvals / Open requests / Recycling submissions
- Quick action table: Recent listings needing approval (Approve / Reject inline)
- Recycling queue with status chips
- Flag system for reported listings

---

### Prototype Interactions to Wire Up

Connect these flows as clickable prototypes:

1. Onboarding → Sign Up → Email Verification → Home
2. Home → Browse → Listing Detail → Request Flow (3 steps) → Confirmation
3. Home → Create Listing (4 steps) → Published
4. Home → Recycling page → Form → Confirmation
5. Bottom nav → My Requests → expand a request
6. Bottom nav → My Listings → Incoming Requests → Accept

---

### Figma-Specific Instructions

- Use **Auto Layout** on every frame — nothing should be manually positioned
- Build all screens at **390 × 844px** (iPhone 14 base) with desktop variants at **1440px** for Home and Browse
- Use **components with variants** for all cards, buttons, toggles, and status chips
- Apply **8pt grid spacing** throughout
- Create a **Styles panel** with all colors, text styles, and effects defined before building screens
- All images: use **Unsplash placeholder fills** (search: appliances, kettle, fan, rice cooker)
- Add **micro-interaction notes** in sticky notes on each screen explaining intended animation behavior
- Group all screens into **pages**: `🎨 Design System` / `📱 Mobile Flows` / `🖥 Desktop` / `⚙️ Admin`

---

### Tone Reference

- Airbnb: listing clarity and trust signals
- Notion: clean information hierarchy
- Depop: youthful card layout energy
- Monzo: clear financial micro-copy
- Not: corporate SaaS, dark mode heavy, overly minimal

---

This prompt gives a Figma AI tool or a human designer everything they need to produce a production-ready prototype from scratch, with zero ambiguity.