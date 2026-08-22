# Product Requirements Document

## 1. Summary

`feedbacks.dev` is a lightweight, developer-first feedback collection product made of:
- an embeddable widget
- a feedback inbox and triage dashboard
- optional notifications and workflow integrations

The rebuild should focus on a much clearer onboarding path than the archived implementation.

## 2. Product goal

Help software teams collect meaningful feedback inside their product and act on it quickly.

## 3. Jobs to be done

### JTBD 1

When I launch a product, I want to add feedback collection quickly so I can learn what users are struggling with before churn compounds.

### JTBD 2

When feedback starts coming in, I want it organized and contextualized so I can decide what matters without reading everything manually.

### JTBD 3

When a message is important, I want to move it into my existing workflow so feedback does not die in another dashboard.

## 4. Primary user outcomes

- I can install the widget without reading dense documentation.
- I can trust the install code to work.
- I can collect feedback that includes enough context to be actionable.
- I can quickly distinguish bugs, ideas, praise, and noise.
- I can route important items to Slack, GitHub, generic webhooks, or email workflows. Linear can be supported through a generic webhook recipe until it is promoted as a first-class integration.

## 5. Launch scope

### In scope for the paid launch

- project creation
- widget installation
- quick widget customization
- feedback submission with context
- dashboard inbox
- tagging and status workflow
- basic filtering
- public boards and directory
- webhook integrations
- billing, plan enforcement, and usage visibility
- AI / MCP access on paid plans
- basic team notifications

### Still out of scope

- complex collaboration permissions
- native mobile SDKs
- heavy analytics suites
- AI summaries as a core dependency
- enterprise role management

## 6. Core product surfaces

### A. Marketing and onboarding

Must answer:
- what is this
- why should I care
- how fast can I install it
- first-time standard accounts are offered the same complete product tour as Early Adopters, but can dismiss and replay it without any Pro reward language
- only Early Adopter claimants receive mandatory-tour and Pro-activation messaging

### B. Project setup

Must optimize for first-run success:
- create project
- show install snippet immediately
- default to recommended configuration
- move advanced settings out of the critical path

### C. Widget

Must feel:
- light
- trustworthy
- visually clean
- configurable without being complicated

### D. Dashboard

Must support:
- inbox triage
- state changes
- filtering
- routing important items

## 7. Functional requirements

### Project management

- User can create a project with a name and generated project key.
- User can archive or delete a project.
- User can view install instructions per project.

### Installation experience

- User sees a recommended install snippet immediately after project creation.
- User can switch platform examples between at least Website, React, and Vue.
- User can copy code with one click.
- User can preview the widget before customizing.
- The installed embed stays stable; saved widget configuration is resolved remotely on page load.
- Changing placement, fields, copy, styling, or captcha does not require replacing the snippet.
- Placement settings explain the remaining page-level action: inline mode may require moving the stable host, and custom-trigger mode requires a matching selector on the customer button.

### Widget behavior

- Support floating modal as the default mode.
- Support inline embed as a secondary mode.
- Support attaching to an existing trigger element.
- Capture message, page URL, and user agent.
- Support optional email capture.
- Support optional screenshot and category fields.
- Handle success and error states clearly.

### Widget customization

- User can change button label, position, and main color.
- User can toggle optional fields.
- User can configure simple anti-spam controls.
- Advanced options exist, but are collapsed or separated from the quick path.
- Saved customization is delivered to installed embeds through a strict browser-safe public configuration contract.

### Feedback inbox

- Show newest feedback first.
- Support status states such as `new`, `reviewed`, `planned`, `closed`.
- Support tags.
- Support filtering by project, status, type, and date.
- Support viewing full feedback context.

### Integrations

- Basic outbound notifications for new feedback.
- Initial targets include webhook routing and opt-in owner email alerts.
- Integration setup should be secondary to the core install flow.

### Growth and referrals

- Provide a focused lead-capture page with explicit email consent and clear distinction from account creation.
- Provide a separate, deliberately limited 100-seat Early Adopter Programme. Email submission creates a claim-ready record but does not consume capacity or guarantee a place.
- Link the claim to the account with the same verified email and automatically launch a persisted product tour.
- Make the guided tour mandatory for programme claimants and atomically allocate one of the 100 places only when the tour completes and Pro activates. The same locked operation must prevent concurrent completions from overfilling the cohort. The tour must teach project scope, workspace themes, form placement and customization, optional fields and spam protection, preview and remote configuration, installation and verification, feedback use cases, inbox triage, product updates, public boards, and integrations. Then extend Pro by one month for each structured monthly feedback submission, up to 12 total months.
- Open monthly feedback seven days before its due date, show an authenticated dashboard banner, send deduplicated lifecycle emails, and allow a two-month grace period inside a maximum 14-month programme window before automatic removal.
- Keep programme feedback private, mirror it into the internal product inbox, and preserve every customer project and feedback item when the programme completes or ends.
- Protect each member's enrolment-date Pro list price as their maximum Pro list price for at least five years from enrolment, excluding taxes and optional add-ons.
- Support consent-gated Google Ads, Meta Pixel + Conversions API, and Reddit Pixel + Conversions API measurement.
- Browser and server conversion events must share a stable event identifier for provider deduplication.
- Do not load advertising tags before consent or on customer widgets and public feedback boards.
- Give each account one personal invite link with five verified new-account slots.
- Count an invite only after verified email ownership, a 24-hour maturation period, and real first-project activation.
- Treat short-lived hashed device and network signals as review inputs, not as a single IP-address ban; shared networks must not be rejected automatically.
- Atomically grant one complimentary Pro month after the fifth eligible signup; self-referrals, duplicate identities, high-risk repeats, and repeated rewards must fail safely.
- Project-scoped navigation without a project must explain the prerequisite and link directly to project creation.

### Billing and downgrade lifecycle

- Paid entitlements remain active through the provider-authoritative paid-through date, including after a scheduled cancellation.
- Send one warning on each of the final three paid days when a cancellation is scheduled.
- At expiry or immediate cancellation, restore Free branding and limits and disable paid-only features server-side.
- Keep the Free project allowance active and freeze only deterministic excess projects without deleting their data.
- Unfreeze downgrade-frozen projects automatically after a successful upgrade; users may still delete frozen projects themselves.

### Customer feedback and product updates

- Authenticated users can send a bounded suggestion, problem, question, or positive note from Settings.
- Internal product feedback is routed into a private system project owned by the product administrator and excluded from customer plan usage.
- Published updates from that project appear in the same Settings surface so the product team can close the loop.
- Each release note has an independent on/off visibility state available in both its editor and the overview list.
- Turning a release note off preserves its identifier, content, publication time, metrics, and visitor seen state.
- Editing or re-enabling an existing release note does not make it reappear for visitors who already saw it.
- The dashboard warns about the persistent seen state before publication and while editing a published note, and directs owners to create a new release note for a new announcement.

## 8. UX requirements

### Required UX characteristics

- install path must feel obvious
- primary actions must be visually dominant
- terminology must match user goals, not internal system behavior
- mobile views must remain usable but not overload the user

### Explicit UX constraints

- do not force a multi-step wizard for a simple install
- do not default to advanced configuration
- do not bury the install snippet under tabs or dense settings
- do not use decorative UI that weakens action clarity

## 9. Non-functional requirements

### Performance

- widget JS should remain small enough for performance-sensitive teams
- widget should not create obvious layout shift or blocking behavior
- dashboard initial experience should feel fast on modern mobile and desktop

### Reliability

- copy-paste install examples must be tested and consistent
- docs must use the same API names as production code
- project setup should work without requiring users to understand the architecture

### Security

- server-side validation for all public submissions
- rate limiting or anti-spam measures
- sensitive credentials must never reach browser code

## 10. Risks

### Product risks

- building too many advanced options too early
- trying to satisfy enterprise and indie use cases in the same first-run UX
- making the widget customizable at the cost of install simplicity

### Delivery risks

- archived implementation patterns may leak back into the rebuild
- docs and implementation may drift again if there is no single source of truth

## 11. Launch criteria for v1

The rebuild is ready for implementation when:

- the quick install flow is clearly defined
- the widget API surface is stabilized
- the MVP scope is agreed
- user stories are complete enough for execution

The product is ready for first release when:

- first-run installation is tested end to end
- feedback reaches the inbox correctly
- status, tags, and filters work
- at least one outbound integration works reliably
