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
- I can route important items to Slack, Linear, GitHub, or email workflows.

## 5. MVP scope

### In scope

- project creation
- widget installation
- quick widget customization
- feedback submission with context
- dashboard inbox
- tagging and status workflow
- basic filtering
- basic team notifications/integrations

### Out of scope for v1

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

### Feedback inbox

- Show newest feedback first.
- Support status states such as `new`, `reviewed`, `planned`, `closed`.
- Support tags.
- Support filtering by project, status, type, and date.
- Support viewing full feedback context.

### Integrations

- Basic outbound notifications for new feedback.
- Initial targets can include Slack, email, and webhook.
- Integration setup should be secondary to the core install flow.

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
