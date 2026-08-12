# Diploma Collaboration Strategy

How Planify is split between the two co-authors for university diploma defense without compromising the codebase's velocity or coherence.

## Context

- Planify is joint diploma work for two co-authors at a CS university.
- Roles are framed as **CTO** (primary developer, owns Planify core) and **CPO** (product side).
- The university requires **both** co-authors to demonstrate hard technical skills — product/management-only work is not sufficient for defense. Partner needs code on paper.
- Partner's actual development skill: single course on React and Angular, weak at completion, decayed further with no practice since. Treat as a rusty junior frontend developer; backend (Node, DB, auth from zero) is out of reach inside the diploma timeline.

## The core concern

Splitting off a second project for the partner risks pulling the primary developer's focus away from Planify itself — the project that is currently shipping well, technically rich, and genuinely enjoyable to work on. Focus is the single most valuable resource a solo developer has, and the mentoring tax of bringing a rusty junior up to speed comes directly out of the primary developer's coding time, not from anywhere else.

A naive split can easily consume 30–40% of weekly throughput on Planify. That cost has to be designed out, not absorbed.

## Recommended approach

**Don't pause or restructure Planify to accommodate the partner. Don't split Planify itself into microservices.**

Instead, pick a partner-owned scope that **piggybacks on infrastructure the primary developer is already building for Planify's own sake**, so no extra backend surface needs to be designed, deployed, or maintained on the partner's behalf.

### Current leading example: Amplitude-backed analytics dashboard

The primary developer is already planning to integrate Amplitude into Planify (see `amplitude-integration.md`). Once the instrumentation lands:

- The **partner builds a separate React SPA** that consumes the **Amplitude REST API directly**.
- The boundary between the two artifacts is **Amplitude's documented API**, not a custom Planify endpoint.
- The primary developer's integration cost drops to roughly: explain the Amplitude SDK once, occasionally review React PRs. No bespoke backend, no schema coordination, no deploy entanglement.
- The partner's diploma artifact is fully standalone: own repo, own deploy, own roadmap, defendable end-to-end without referencing Planify's internals.

This pattern can be reused for any second partner-scope feature: pick something the primary developer was going to instrument or expose anyway, and let the partner build the visible surface on top.

### Independence rules

Regardless of which feature the partner ends up owning, enforce these from day one:

1. **Separate repository.** Not a workspace package, not a Nuxt layer, not a monorepo subfolder. Different repo, different `git remote`.
2. **Separate deployment.** Different host, different domain or subdomain. The two artifacts must be independently launchable.
3. **One-page API contract.** Agreed in writing in week one. After that, both sides develop against the contract without daily coordination.
4. **No shared in-memory state.** No shared Pinia store, no shared types package imported across the boundary. The HTTP boundary is the only contract.
5. **Mentoring time is bounded.** Block one fixed slot per week for partner pairing. Outside that slot, partner is blocked on their own learning, not on the primary developer's attention.

### Anti-patterns to avoid

- **Splitting Planify itself into microservices for the diploma.** Premature, dilutes the codebase, looks impressive on a slide and is regretted six months later. Modular monolith with strict FSD layering is enough — see `app/`'s existing `shared/entities/features` structure.
- **Co-working a half-finished module inside Planify's repo with the partner.** This is the worst possible outcome. It shreds focus, blurs ownership at defense time, and makes both artifacts harder to defend independently. If the partner cannot work fully in their own repo, the scope is wrong.
- **Inventing a custom backend endpoint just so the partner has something to consume.** Every endpoint you build for them is a maintenance burden on Planify that doesn't serve Planify's users. Prefer third-party APIs (Amplitude, Google Calendar, public-link tokens) as the data source whenever possible.
- **Letting the partner's stack creep into Planify.** No React inside the Nuxt repo. The two artifacts share zero code and zero build tooling.

## Open questions

- **Second partner-owned feature.** Whether to layer a second feature on top of the primary one is undecided. A possible direction is a lightweight AI integration (e.g. a simple chat assistant, an "ask my calendar" Q&A widget, an AI-generated weekly summary). Anything chosen must respect the same independence rules and ideally piggyback on existing infrastructure (e.g. hit a hosted LLM API from the partner's frontend directly, no backend orchestration on Planify's side).
- **Defense narrative.** Worth deciding whether the partner gains read-only access to a curated Planify Amplitude dashboard during defense — adds product-side weight to the CPO framing without adding scope to either codebase. Independent of which technical artifact they own.

## Decision summary

| Question | Decision |
| --- | --- |
| Split Planify itself into microservices? | **No.** |
| Give partner a slice inside Planify's repo? | **No.** |
| Give partner a separate, independent project? | **Yes.** |
| What kind of project? | A standalone React SPA that consumes infrastructure the primary developer is building anyway (current leading example: Amplitude analytics dashboard). |
| Does the primary developer pause Planify for the split? | **No.** Planify development continues at full pace; the partner's work is parallel and decoupled. |
