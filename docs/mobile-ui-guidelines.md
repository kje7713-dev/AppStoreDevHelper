# Mobile UI Guidelines

These rules apply to all new UI pages and components added to AppOps Agent. They exist to ensure the product is usable from an iPhone without friction.

---

## Core Rules

### 1. Single-column layout on small screens

- Default to a single-column layout. Use `max-w-2xl mx-auto` as the page container.
- Multi-column grids (`grid-cols-2` or wider) are allowed on `sm:` breakpoint and above, but must collapse to one column on mobile.
- Never rely on `md:` or `lg:` breakpoints alone to make content readable — the content must be readable at `320px` width.

### 2. Large tap targets

- All interactive elements (buttons, links, checkboxes, list items) must have a minimum tap target height of `44px` (equivalent to `py-3` on most button elements).
- Navigation links should include extra vertical padding: use `py-1` or `py-2` on `<Link>` elements.
- Avoid placing two tappable elements closer than `8px` apart.

### 3. No hover-only interactions

- Every action that is currently triggered by hover must also be triggerable by tap (touch).
- Do not use `hover:` Tailwind classes as the **only** way to reveal critical UI (e.g., action buttons, tooltips).
- Hover classes may enhance desktop UX (e.g., highlight color changes) but must not gate functionality.

### 4. No horizontal table overflow

- Never use `<table>` for layout that may overflow on small screens.
- If you need a table-like structure, use cards or stacked rows with `flex-col`.
- If a `<table>` is necessary (e.g., for data grids), wrap it in `overflow-x-auto` so users can scroll horizontally rather than the layout breaking.

### 5. Cards stack vertically

- Feature cards and list cards must use `space-y-4` or `flex-col gap-4` on mobile.
- `grid-cols-2` is fine on `sm:` but the grid must collapse: `grid grid-cols-1 sm:grid-cols-2`.

### 6. Long code/JSON/cURL examples must scroll safely

- Wrap all `<pre>` and `<code>` blocks in `overflow-x-auto` or `whitespace-pre-wrap break-all`.
- On mobile, prefer `whitespace-pre-wrap break-all` so content wraps within the viewport rather than creating a horizontal scroll.
- Never let a code block push the page layout beyond the viewport width.

### 7. Navigation must work on iPhone screens

- Back navigation links must be visible at the top of every sub-page.
- Back links must use full text (e.g., "← Back to App"), not icon-only navigation.
- Primary action buttons should appear above the fold on mobile when possible.
- Avoid top navigation bars that are too narrow to tap reliably at 320px width.

---

## Layout Template

Use this pattern for all new pages:

```tsx
<main className="min-h-screen bg-gray-950 text-white">
  <div className="max-w-2xl mx-auto px-4 py-8">
    <Link href="/parent" className="text-gray-400 text-sm mb-6 block py-1">
      ← Back to Parent
    </Link>
    <h1 className="text-2xl font-bold mb-2">Page Title</h1>
    <p className="text-gray-400 text-sm mb-8">Page description.</p>

    {/* Content */}
  </div>
</main>
```

### Why `max-w-2xl` not `max-w-4xl`

- `max-w-4xl` (896px) creates wide lines that are comfortable on desktop but require the user to scroll horizontally or zoom in on an iPhone.
- `max-w-2xl` (672px) produces readable line lengths at all screen sizes.
- Use `max-w-4xl` only for pages that are inherently desktop-first (e.g., complex data tables), and always provide a mobile fallback.

---

## Color and Contrast

- Use `text-gray-300` or lighter for body text on `bg-gray-900` backgrounds. Do not use `text-gray-500` for paragraph text.
- Use `text-gray-400` for secondary/meta text only.
- Error messages must use `text-red-400` or brighter.
- Success states must use `text-green-400` or brighter.

---

## Form Fields

- All `<input>` and `<textarea>` elements must have `w-full` width.
- Minimum font size for inputs: `text-base` (16px). iOS Safari automatically zooms in on form fields with a font size below 16px, disrupting the layout. Use `text-sm` only for non-interactive text, never for `<input>` or `<textarea>` elements.
- Labels must always be visible above the field, not only as placeholder text.
- Required fields must be marked visually (e.g., `<span className="text-red-400">*</span>`).

---

## Buttons

- Primary actions: `bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium`
- Secondary actions: `bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg`
- Full-width on mobile: use `w-full` for primary CTA buttons at the bottom of forms.
- Disabled state: always add `disabled:opacity-50` so the button is visually distinguishable.

---

## Copy Buttons

- Where code examples or long strings need to be copied, provide a `Copy` button adjacent to the block.
- The button must update its label to `Copied!` for ~2 seconds after a successful copy to confirm the action.
- Position the copy button above or to the right of the code block, never below (it may be off-screen).

---

## Accessibility

- All images must have `alt` text.
- Interactive elements that are not `<button>` or `<a>` must have `role` and `aria-*` attributes.
- Use `aria-label` on icon-only buttons.
- Use `aria-pressed` on toggle buttons.

---

## Checklist for New Pages

Before merging any new UI page, confirm:

- [ ] Single-column on mobile (`max-w-2xl`, `px-4`)
- [ ] Back navigation link at top with adequate tap target
- [ ] No `hover:`-only functionality
- [ ] All interactive elements ≥ 44px tap target height
- [ ] Code blocks use `overflow-x-auto` or `break-all`
- [ ] No fixed-width elements that overflow at 320px
- [ ] Primary CTA button is `w-full` on mobile
- [ ] Forms use `w-full` inputs with visible labels
