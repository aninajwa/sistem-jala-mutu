# Provider/PIC package workspace — scoped design decisions

- **Reference direction:** quiet enterprise application frame inspired by the SAP entry in VoltAgent's Awesome DESIGN.md collection. Adapt the pattern only: white/light-neutral surfaces, restrained blue and teal, flat section bands, compact hierarchy. Keep Jala Mutu's existing identity and components; do not copy SAP branding or typography.
- **Scope:** authenticated Provider/PIC package workspace only. No Admin pages, global reset, new dependency, or global token migration.
- **Hierarchy:** compact package identity and role; collapsible contract metadata; secondary package actions; one accessible stage rail; one stage heading and a concise, truthful status/action area; then working content.
- **Status semantics:** selected page is not completion. Only explicit server facts receive complete/pending/blocked/loading/error states. Unknown aggregate workflow status stays an unobtrusive “Status keseluruhan belum tersedia”; known Tahap 0 approval remains visible independently.
- **Stage rail:** preserve 0, 1, 2, 3A, 3B, 4, 5, 6 and the parallel 3A/3B note. Keep code, short Indonesian label, text status, `aria-current`, keyboard focus, and horizontally scrollable narrow layouts.
- **Read-only boundary:** unavailable Stage 5/6 screens remain visible as previews, but controls are semantically disabled and the preview limitation is stated in plain Indonesian.
- **Responsive/accessibility:** reflow header/actions, avoid page-level horizontal overflow, use visible focus, text alongside semantic color, and touch-sized controls on narrow screens.
