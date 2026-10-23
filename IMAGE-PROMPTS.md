# Lendy – banner & stock photo list

The logo, user-uploaded listing photos and avatars are not covered here.
Today these slots use Unsplash links in `src/app/components/data.ts` (`IMAGES.authHero`, `IMAGES.campus`).

## Shared style (append to every prompt)

> Bright natural daylight, clean and airy, modern Hong Kong apartment, soft palette of white, light grey, soft teal (#1A7A86), sky blue (#3F94CA) and fresh green (#5AB98F) accents, realistic photography, shallow depth of field, no text, no logos, no visible brand names, no watermarks.

Export as WebP (or high-quality JPG), under ~300 KB each.

---

## 1. Auth banner: `authHero`

- **Used on:** Log In, Sign Up, Verify Email, Reset Password (top banner)
- **Size:** 2400 × 600 px (4:1)
- **Display:** full width, 208 px tall, cropped from the centre. It sits under a 70–85% white wash with the Lendy logo centred on top, so the image is mostly a soft texture.
- **Needs:** light, low contrast, calm centre with no strong subject behind the logo, and detail towards the left and right edges.

**Prompt:**
> Wide panoramic banner of a bright, minimal Hong Kong apartment living area in soft morning light, a few small home appliances (electric kettle, desk fan, compact speaker) arranged on a light wooden shelf towards the left and right edges, empty soft-focus wall in the centre, high-key exposure, pale airy tones with subtle teal and green accents, lots of negative space in the middle, 4:1 aspect ratio.

---

## 2. Home banner: currently `campus` (split into `homeBanner`)

- **Used on:** Home page hero, with the text "Rent Smarter in Hong Kong" (white, left side)
- **Size:** 2400 × 700 px
- **Display:** 160 px tall on mobile (about 2:1 crop), 224 px tall and up to about 1150 px wide on desktop (about 5:1). A teal gradient covers the left side behind white text.
- **Needs:** main subject in the **right-centre** (55–75% of the width), with the left 40% simple and darker so the white headline stays readable.

**Prompt:**
> Wide lifestyle photo of a young Hong Kong university student happily unboxing a borrowed rice cooker in a compact, sunlit flat, subject positioned on the right-centre of the frame, left side of the image a simple softly blurred wall in muted teal tones, Hong Kong high-rise windows faintly visible in the background, warm and optimistic mood, wide 24:7 aspect ratio.

---

## 3. Onboarding slides: currently one `campus` image for all 3 slides

- **Used on:** the first screen (`/`), a rounded card above the slide headline
- **Size:** 1200 × 520 px (about 2.3:1)
- **Display:** about 400 × 176 px, cropped from the centre, no overlay
- **Recommended:** one image per slide. Wiring 3 images in is a small code change.

### 3a. Slide 1: "Rent what you need. Leave what you don't."
> Two young adults in a bright Hong Kong flat handing over a compact desk fan to each other with a friendly smile, neighbour-to-neighbour sharing moment, clean minimal interior, subject centred, 2.3:1 aspect ratio.

### 3b. Slide 2: "List your idle appliances in under 3 minutes."
> Close-up of a hand holding a smartphone taking a photo of an unused microwave on a tidy kitchen counter in a small Hong Kong apartment, quick and effortless feeling, phone and appliance centred, soft daylight, 2.3:1 aspect ratio.

### 3c. Slide 3: "Recycle responsibly. Give your items a second life."
> A neatly refurbished small appliance (vacuum cleaner or kettle) placed beside a reusable cardboard box with a few green leaves, bright clean workspace, sustainable and circular-economy feeling, gentle green and teal tones, subject centred, 2.3:1 aspect ratio.

---

## Not needed

- **Product listing photos** (`IMAGES.kettle`, `fan`, `riceCooker`, …): these are demo listings shown only when the database is empty, and are replaced by real user uploads.
- **Listings with no photo:** these already use the branded `src/assets/listing-placeholder.svg`.

## Where to put them

Save the files to `src/assets/banners/` as `auth-hero.webp`, `home-banner.webp`, `onboarding-1.webp`, `onboarding-2.webp` and `onboarding-3.webp`. Then point `IMAGES` in `src/app/components/data.ts` at these imports instead of the Unsplash URLs.
