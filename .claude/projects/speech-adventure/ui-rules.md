# UI / UX Rules

## Design Philosophy
- Premium, clean, warm-professional tone — not a toy app, not clinical
- Designed for Thai families: therapists, parents, children
- Minimal chrome; content-first

## Color System
- All colors via CSS custom properties in `globals.css`
- Semantic palette: primary, secondary, success, error, info, bg, surface, text, text-muted, border
- Level accent colors: pretest (#A29BFE), oral (#FD79A8), sound-fam (#00CEC9), sound-prod (#FDCB6E), word (#E17055), sentence (#6C5CE7)
- Dark mode: override the same CSS vars under `.dark` — Tailwind utilities auto-update

## Layout Rules
- **Desktop**: collapsible sidebar-first, no top bar — `lg:pl-[240px]` or `lg:pl-[72px]`
- **Mobile**: thin `AppTopBar` (44px) + `MobileNav` bottom bar — `pt-11 pb-16`
- Max content width: `max-w-6xl mx-auto` (pages) or `max-w-xl mx-auto` (forms/wizards)
- Grid spacing: `gap-4` standard, `gap-6` for section separation

## Typography
- Font: **Kanit** (primary Thai font), fallback Noto Sans Thai, sans-serif
- Headings: `font-bold text-text`; body: `text-text`; muted: `text-text-muted`
- Labels: `text-sm font-semibold text-text`
- Helper text: `text-xs text-text-muted`

## Component Patterns
- Cards: `bg-surface border border-border rounded-xl` — standard card shell
- Inputs: `bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/40`
- Primary buttons: `bg-primary text-white font-semibold rounded-xl hover:bg-primary/90`
- Secondary buttons: `border border-border text-text-muted hover:text-text`
- Danger actions: `border border-error/30 text-error hover:bg-error/8`
- Info banners: `bg-info/8 border border-info/20 rounded-xl`
- Hover effects: `hover:-translate-y-0.5 hover:shadow-md` for interactive cards

## Interaction
- Active scale feedback: `active:scale-[0.98]` or `active:scale-[0.99]` on buttons
- Transitions: `transition-all` for most interactive elements
- Disabled state: `disabled:opacity-40 disabled:cursor-not-allowed`

## Sidebar
- Desktop expanded: 240px wide, icon + label
- Desktop collapsed: 72px wide, icon only
- Collapse toggle persisted in localStorage (`speech-adventure-sidebar-collapsed`)
- Use `SidebarContext` to read `collapsed` and `mounted` states

## Dark Mode
- Toggle via `ThemeToggle` component
- Theme class applied to `<html>` by `ThemeProvider`
- FOUC prevented by inline script in layout `<head>`
- Never use Tailwind `dark:` prefix — use CSS vars instead (already done globally)

## Emoji Usage
- Limited and purposeful — avoid heavy decoration
- Emoji used for: stage icons in data, avatar selection
- UI chrome: use SVG icons, not emoji

## Print Support
- `@media print`: white bg, remove padding overrides
- Report page (`/report`) has dedicated print CSS
- Components with print variants: `print:hidden`, `print:!pl-0`

## Responsive Breakpoints
- Single breakpoint in use: `lg` (1024px)
- Mobile-first: default styles = mobile, `lg:` = desktop
- `sm:` used sparingly for intermediate adjustments (e.g. hide some nav items)
