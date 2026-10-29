# Lendy: banner image prompts

This list covers the 6 banner images the app uses. The logo, listing photos (uploaded by users) and avatars are not included.

## How to add them

1. Generate each image with the prompt below, using the size given.
2. Export as **WebP** (or a high-quality JPG) and keep each file **under ~300 KB**.
3. Save it to `src/assets/banners/` with the exact filename shown. The app finds the file by name, with no code change needed.
4. If a file is missing, that slot shows its old Unsplash stock photo, so you can add the images one at a time.

| # | File | Size (px) | Where it shows |
|---|------|-----------|----------------|
| 1 | `auth-hero.webp` | 2400 × 800 | Log in, Sign up, Verify email, Reset password |
| 2 | `home-banner.webp` | 2400 × 560 | Home hero, tablet and desktop |
| 3 | `home-banner-mobile.webp` | 1200 × 540 | Home hero, phones (optional, falls back to #2) |
| 4 | `onboarding-1.webp` | 1200 × 520 | Intro slide 1 |
| 5 | `onboarding-2.webp` | 1200 × 520 | Intro slide 2 |
| 6 | `onboarding-3.webp` | 1200 × 520 | Intro slide 3 |

## Shared style (add to the end of every prompt)

> Bright natural daylight, clean and airy modern Hong Kong home, palette of warm white, light oak wood and pale grey with soft teal (#1A7A86), sky blue (#3F94CA) and fresh green (#5AB98F) accents, realistic editorial lifestyle photography, 35mm lens, gentle shallow depth of field, calm and uncluttered, no text, no logos, no brand names on products, no watermarks, no cameras.

**Negative prompt** (if your tool supports one): text, letters, logo, watermark, brand label, camera, DSLR, clutter, dark shadows, harsh contrast, distorted hands, extra fingers, fisheye.

---

## 1. Auth banner: `auth-hero.webp`

- **Size:** 2400 × 800 (3:1)
- **How it's displayed:** full width and 208 px tall, under a light white wash, with the Lendy logo centred on top. On phones only the **middle ~45%** of the width is visible. On wide desktops the top and bottom are cropped.
- **Composition:** a soft, low-contrast scene across the whole width. The centre stays plain and bright because the logo sits there. The colour and detail come from the left and right thirds.

**Prompt:**
> Wide panoramic interior of a bright, minimal Hong Kong apartment in soft morning light, a long light-oak shelf running across the frame holding a few small home appliances spaced apart: a white electric kettle and a compact rice cooker on the left third, a small desk fan and a table lamp on the right third, a single green potted plant, the centre of the frame a plain pale wall gently lit by window light, high-key exposure, pastel teal and green accents, lots of calm negative space in the middle, 3:1 aspect ratio.

---

## 2. Home banner (desktop): `home-banner.webp`

- **Size:** 2400 × 560 (about 4.3:1)
- **How it's displayed:** 224 px tall and up to ~1120 px wide. A teal gradient fades from the left edge to about the middle, under the white headline "Rent Smarter in Hong Kong" / 在香港租得更快更好.
- **Composition:** put the subject in the **right 55–80%** of the frame. Keep the left 40% simple and mid-to-dark (a plain wall or window in muted teal) so the white text stays readable.

**Prompt:**
> Wide lifestyle photograph of a young Hong Kong resident in a compact, sunlit flat happily setting down a borrowed rice cooker and a small desk fan on a light wooden counter, person and appliances positioned in the right third of the frame, the left half a simple softly blurred wall in muted deep-teal tones, Hong Kong high-rise towers faintly visible through a window in the background, warm optimistic mood, 4.3:1 ultra-wide aspect ratio.

## 3. Home banner (phone): `home-banner-mobile.webp` (optional)

- **Size:** 1200 × 540 (about 2.2:1)
- **How it's displayed:** about 360 × 160 px on phones, with the same teal gradient and white headline on the left.
- **Composition:** use the same scene as #2, framed tighter. The subject sits in the **right half** and the left 45% stays plain and darker.

**Prompt:**
> Lifestyle photograph of a young Hong Kong resident smiling while placing a borrowed rice cooker on a light wooden kitchen counter in a compact sunlit flat, person and appliance on the right half of the frame, left half a plain softly blurred muted deep-teal wall, warm optimistic mood, 2.2:1 aspect ratio.

---

## 4–6. Onboarding slides

- **Size:** 1200 × 520 (about 2.3:1)
- **How it's displayed:** a rounded card about 400 × 176 px, cropped from the centre with no overlay, placed above the slide headline. The page background is a pale teal, so the images should feel bright and soft.
- **Composition:** keep the subject centred, with a little breathing room on all sides. Keep the lighting and colour grading the same across all three so they read as a set.

### 4. `onboarding-1.webp` ("Rent what you need. Leave what you don't.")
> Two young neighbours in a bright Hong Kong apartment corridor handing a compact white desk fan from one to the other with friendly smiles, neighbour-to-neighbour sharing moment, hands and fan in the centre of the frame, clean minimal background with a hint of teal door paint, 2.3:1 aspect ratio.

### 5. `onboarding-2.webp` ("List your idle appliances in under 3 minutes.")
> Close-up of a hand holding a smartphone, photographing an unused white microwave on a tidy light-wood kitchen counter in a small Hong Kong apartment, phone screen blank and glowing softly, phone and microwave centred, quick and effortless feeling, soft daylight from a side window, 2.3:1 aspect ratio.

### 6. `onboarding-3.webp` ("Recycle responsibly. Give your items a second life.")
> A freshly cleaned and refurbished white electric kettle and a compact vacuum cleaner standing beside an open recycled-cardboard box with a few fresh green leaves, on a bright clean workbench, sustainable circular-economy feeling, gentle green and teal tones, subjects centred, 2.3:1 aspect ratio.

---

## Not needed

- **Listing photos:** these come from user uploads. Listings without a photo already use `src/assets/listing-placeholder.svg`.
- **Recycle banner on Browse:** this one is an icon card, not a photo.
