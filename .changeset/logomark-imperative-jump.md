---
"@posthog/brand": minor
---

`Logo.Logomark` can now jump imperatively. Its `ref` is a new `LogomarkHandle` — call `ref.current.jump()` to trigger the jump from anywhere (a button, a timer, an event), no `jumpOnClick` / `autoJumpMs` required. Pass a magnitude (`jump(4)`) to jump higher, the same escalation successive clicks use; it returns `false` when the jump is suppressed (already airborne, no Web Animations API, or reduced motion).

**Breaking:** the `Logo.Logomark` `ref` no longer points at the `<svg>` element directly — the node now lives on `ref.current.svg`. (`Logo` and `Logo.Wordmark` refs are unchanged.)

```tsx
// before
const ref = useRef<SVGSVGElement>(null)
<Logo.Logomark ref={ref} />
ref.current?.getBoundingClientRect()

// after
const ref = useRef<LogomarkHandle>(null)
<Logo.Logomark ref={ref} />
ref.current?.svg?.getBoundingClientRect()
ref.current?.jump() // ...and now it can jump
```
