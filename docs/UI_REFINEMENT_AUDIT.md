# ALS Atlas UI refinement audit

Audit date: 2026-11-07. Reviewed the shared shell, landing, survey, overview, check-in, progress, referral, research, care-team, and assistant compositions in `apps/web/src/App.tsx` and `apps/web/src/app-overhaul.css`.

| Route | Main issue | Refinement applied / queued |
|---|---|---|
| Landing | Hero is still larger than the product needs and the three paths carry equal weight | Tighten hero scale, keep paths as a compact entry index |
| Survey | Functional flow is clear but the form reads as a generic card | Use compact field rhythm, stronger step state, and explicit evidence language |
| Overview | Good information architecture; chart and metric row need stronger date/context hierarchy | Tighten metric proportions and make primary action/record status dominant |
| Check-in | Low-effort path exists, but media capture and save states need more visual authority | Keep the workflow short; give capture, review, and saved states one consistent surface |
| Progress | Table and chart are useful but still visually template-like | Reduce card ornament, improve number hierarchy, preserve uncertainty note |
| Referral support | Report workspace is functional-looking but export state is not prominent enough | Make report status, evidence, missing information, and export the main hierarchy |
| Research | Consent and catalogue exist; research controls need clearer status and less panel repetition | Keep consent first, make dataset access secondary, avoid decorative network visuals |
| Care team | Contact rows are clear but action hierarchy is weak | Make access level and next action scannable |
| AI assistant | Drawer is compact, but voice state and actions are not yet fully connected | Preserve text fallback; avoid implying listening/speaking until media state is real |

Cross-route issues addressed: inconsistent surface contrast, overly generous heading scale, mobile title disappearance, weak focus visibility, and status text that looked like decorative badges. The remaining functional gaps are documented separately in `docs/DEMO_VERIFICATION.md`.
