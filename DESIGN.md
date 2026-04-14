# Design Brief

## Overview
420 Social Platform: Cannabis-culture social network with Snapchat-style ephemeral stories, age verification gate, and community features. Dark immersive UI with vibrant lime-green accents. Counter-culture aesthetic executed with clean modernism.

## Tone & Aesthetic
Dark, modern, playful counter-culture. Smooth Snapchat/Instagram interaction patterns. Not corporate. Authentic cannabis community with premium execution. Immersive dark backgrounds, generous whitespace, fast micro-interactions.

## Color Palette

| Token | OKLCH | Hex | Purpose |
| --- | --- | --- | --- |
| Primary (Green) | 0.65 0.19 142 | #22c55e | Cannabis culture, trust, CTAs |
| Secondary (Lime) | 0.72 0.23 102 | #84cc16 | Highlights, active states, emphasis |
| Background (Black) | 0.05 0 0 | #0a0a0a | Deep, immersive main background |
| Card (Charcoal) | 0.12 0 0 | #1a1a1a | Elevated surfaces, feed cards |
| Foreground (Off-white) | 0.96 0 0 | #f5f5f5 | Text, readability on dark |
| Muted (Grey) | 0.28 0 0 | #464646 | Secondary text, borders, dividers |
| Destructive (Red) | 0.55 0.22 25 | #dc2626 | Delete, warning, report actions |

## Typography
Display: **General Sans** (600–700 wt). Bold, modern, distinctive. Used for headers, modal titles, profile names.
Body: **DM Sans** (400–500 wt). Clean, highly readable. All body text, posts, comments, descriptions.
Mono: **JetBrains Mono** (400 wt). Technical clarity for timestamps, @mentions, usernames, debug info.

## Elevation & Depth
Minimal layering. Three levels: background (0.05), cards (0.12), elevated (0.16). Borders replace shadows. Transparent overlays for modals/overlays.

## Structural Zones

| Zone | Background | Treatment | Purpose |
| --- | --- | --- | --- |
| Header | Primary (0.65 0.19 142) | Sticky, cannabis leaf SVG icon, white text | App identity, navigation anchor |
| Main Content | Background (0.05 0 0) | Dark immersive | Feed, stories, explore, groups, messages |
| Cards | Card (0.12 0 0) | Subtle border (0.18 0 0), 12px radius | Posts, user profiles, group tiles |
| Navigation | Card (0.12 0 0) + border | Bottom tabs (mobile) / left sidebar (desktop) | Feed, Stories, Explore, Groups, Messages |
| Age Verification | Popover (0.16 0 0) + overlay | Full-screen centered modal, date input form | Legal barrier, legal disclaimer |
| Stories (Full-screen) | Background (0.05 0 0) | Full viewport, progress bar top | Snapchat-style ephemeral content |

## Spacing & Rhythm
Mobile-first: 1rem margins, 0.75rem cards padding. Desktop: 2rem container padding. Generous whitespace in feed. Compact group/message lists for density.

## Component Patterns
**Posts:** Avatar + username (mono timestamp) + content + like/comment footer. Green like button, lime-green when active.
**Stories:** Full-screen image viewer, progress bar (primary → secondary gradient), swipe/tap navigation.
**Age Gate:** Centered form, "Date of Birth" label, date input with validation, submit button (lime-green), legal disclaimer text.
**Buttons:** Lime-green (secondary) for primary CTA, muted for secondary, red for destructive. All 12px radius.
**Avatars:** Circular (full radius), 2.5rem default, 4rem profile pages.

## Motion & Interaction
Smooth cubic-bezier (0.4, 0, 0.2, 1) 0.3s transitions on all interactive elements. Like button: scale + color pop (no bounce). Story progress: linear 5-10s per story. Modal entrance: fade-in + slight scale up.

## Constraints
- No email notifications (messaging/comments done in-app only)
- No Stripe (no payment features)
- Mobile-responsive: stack vertically on <640px, horizontal nav on ≥640px
- Age verification required before app access (localStorage cache)
- Canvas/WebGL for future 420-themed animations uses literal colors, not CSS vars

## Signature Detail
Cannabis leaf SVG integrated into header logo. Green (#22c55e) / lime (#84cc16) color blocking on dark background creates immediate, unforgettable visual identity. Counter-culture authenticity meets clean design execution.
