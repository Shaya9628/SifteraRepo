
# Remove "Free Screening" from Navbar and Add Contextual CTA

## What Changes

### 1. Remove "Free Screening" Nav Link
Remove the dedicated "Free Screening" navigation link from the top navbar (both desktop and mobile). This declutters the navigation and keeps it focused on standard SaaS sections (Features, How It Works, Pricing, FAQ).

### 2. Upgrade "Get Started Free" Button with a Dropdown or Dual-Action
Replace the simple "Get Started Free" button in the navbar with a smart dropdown that gives users two clear paths:
- **Sign Up / Log In** -- goes to `/auth` (existing behavior)
- **Instant Resume Check** -- goes to `/free-screen` with a tagline like "Have a resume and JD? Check fitment instantly"

### 3. Add an Inline CTA Banner in the Hero Section
Below the existing Hero CTA buttons, add a subtle but eye-catching inline prompt:
> "Already have a candidate resume and JD? [Check fitment instantly -- no sign-up needed]"

This replaces the navbar link with a more contextual, conversion-friendly placement right where users are making decisions.

### 4. Update FreeTools Section Card
In the FreeTools section, keep the "AI Resume Screening" card but ensure it still links to `/free-screen` so users scrolling the landing page can still discover the free tool.

---

## Technical Details

### Files to Modify

**`src/components/landing/Navbar.tsx`**
- Remove the `{ label: 'Free Screening', href: '/free-screen', isRoute: true }` entry from `navLinks` array
- Remove the special emerald styling conditional for "Free Screening" in both desktop and mobile nav
- Replace the "Get Started Free" button with a dropdown menu containing two options:
  - "Create Account" linking to `/auth`
  - "Instant Resume Screen" linking to `/free-screen` with a short description
- Import `DropdownMenu` components from radix-ui

**`src/components/landing/Hero.tsx`**
- Add a new inline CTA row below the existing trust indicators (around line 122)
- Text: "Have a candidate resume and JD? Check fitment instantly -- no sign-up needed"
- Style: subtle glass card with a gradient accent border, linking to `/free-screen`
- Uses the Gen-Z theme styling (gradient text, glow effects)

### No Route Changes
- The `/free-screen` route stays in `App.tsx` -- we're only changing how users discover it
- The `FreeTools` and `FreeHighlight` landing sections remain unchanged
