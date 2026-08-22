# User Stories

This document is intentionally detailed so another LLM or engineer can work from it without prior context.

## Story format

- `ID`
- `Story`
- `Why it matters`
- `Acceptance criteria`

## Epic 1: Understand the product quickly

### US-1.1

Story:
As a first-time visitor, I want to understand what `feedbacks.dev` does within seconds so I can decide whether it is relevant to my product.

Why it matters:
Developer tools lose users quickly if the value proposition is vague.

Acceptance criteria:
- homepage explains the product in one sentence
- homepage shows who it is for
- homepage shows how it works at a high level
- homepage communicates that installation is quick

### US-1.2

Story:
As a skeptical developer, I want to see a realistic install example so I can trust that the product is not hand-wavy.

Why it matters:
Trust is driven by concrete examples.

Acceptance criteria:
- homepage includes a real install snippet
- snippet uses current API names
- snippet matches dashboard-generated code

## Epic 2: Create a project

### US-2.1

Story:
As a signed-in user, I want to create a project with one clear form so I can start collecting feedback without setup fatigue.

Why it matters:
Project creation should feel like the start of value, not admin work.

Acceptance criteria:
- create-project page has one primary field: project name
- success path takes user directly to install instructions
- system generates a project key automatically

### US-2.2

Story:
As a user with multiple products, I want each project clearly separated so feedback does not get mixed together.

Acceptance criteria:
- each project has its own identifier
- widget code is project-specific
- dashboard filtering can isolate a project

## Epic 3: Install the widget

### US-3.1

Story:
As a first-time user, I want to see the recommended install snippet immediately after project creation so I can get to first value fast.

Acceptance criteria:
- install snippet is above the fold
- website install is the default recommended path
- copy button is highly visible

### US-3.2

Story:
As a React developer, I want a framework-specific example so I do not have to translate a vanilla script example myself.

Acceptance criteria:
- React example exists
- Vue example exists
- Website example exists
- examples are accurate and use current widget configuration names

### US-3.3

Story:
As a user who is new to embed scripts, I want install guidance in plain language so I know where the code should go.

Acceptance criteria:
- UI explains where to paste the snippet
- UI explains what to expect after install
- UI explains how to verify success

### US-3.4

Story:
As a user who has not installed yet, I want advanced customization hidden until later so I am not overwhelmed before I have basic success.

Acceptance criteria:
- advanced controls are collapsed or on a separate section
- install snippet is not buried behind setup steps

## Epic 4: Customize the widget

### US-4.1

Story:
As a product owner, I want to change the button label and color so the widget feels on-brand.

Acceptance criteria:
- user can edit label
- user can edit primary color
- preview updates clearly

### US-4.2

Story:
As a user, I want to switch between floating modal, inline embed, and custom trigger modes so the widget fits my product layout.

Acceptance criteria:
- recommended mode is obvious
- alternative modes are available
- switching modes updates installed embeds remotely without replacement code
- the stable host supports modal, inline, and trigger modes

### US-4.3

Story:
As a user, I want optional fields like email, category, and screenshot so I can collect more context when needed.

Acceptance criteria:
- optional fields can be turned on or off
- quick install works without enabling them
- UI explains why each optional field may help

### US-4.4

Story:
As a user, I want to know whether changes are preview-only or saved so I do not lose work or publish accidentally.

Acceptance criteria:
- UI labels save state clearly
- save action is explicit
- unsaved changes are obvious

## Epic 5: Submit feedback

### US-5.1

Story:
As an end user of a product using `feedbacks.dev`, I want the feedback form to feel simple and respectful so I am willing to submit feedback.

Acceptance criteria:
- form has a clear title
- required fields are minimal
- success state is clear
- errors are understandable

### US-5.2

Story:
As an end user, I want to optionally include my email so I can be contacted without making the form feel mandatory.

Acceptance criteria:
- email is optional by default
- required-email mode is supported for teams that want it

### US-5.3

Story:
As a product team, I want the system to capture page context automatically so feedback is useful without forcing the user to explain everything.

Acceptance criteria:
- page URL is captured
- user agent or device context is captured
- timestamp is captured

### US-5.4

Story:
As a product team, I want anti-spam protections so public feedback forms do not become a liability.

Acceptance criteria:
- rate limiting exists
- spam protection options exist
- failures degrade gracefully

## Epic 6: Review feedback in the dashboard

### US-6.1

Story:
As a product team member, I want an inbox view of recent feedback so I can quickly review new submissions.

Acceptance criteria:
- newest feedback appears first
- unread or new items are visually distinct
- each item shows enough summary context to decide whether to open it

### US-6.2

Story:
As a reviewer, I want statuses so I can move feedback through a lightweight workflow.

Acceptance criteria:
- statuses can be updated quickly
- status changes are persisted
- filtering by status is supported

### US-6.3

Story:
As a reviewer, I want tags so I can cluster recurring issues and patterns.

Acceptance criteria:
- tags can be added and removed
- tag filtering exists

### US-6.4

Story:
As a reviewer, I want to open a feedback detail view so I can see message, metadata, and attachments in one place.

Acceptance criteria:
- message is fully visible
- page context is visible
- attachments and screenshots are visible when present

## Epic 7: Route feedback into team workflows

### US-7.1

Story:
As a small team, I want new feedback alerts in Slack so I do not have to keep a dashboard open all day.

Acceptance criteria:
- user can connect Slack or webhook notifications
- notification payload includes enough context to be useful

### US-7.2

Story:
As a team lead, I want to escalate important feedback into issue tracking so product feedback results in action.

Acceptance criteria:
- webhook or issue-routing path exists in MVP or shortly after
- routing high-signal feedback is easier than copy-pasting manually

## Epic 8: Operate across multiple projects

### US-8.1

Story:
As an agency or founder with multiple apps, I want to switch projects easily so I can manage all product feedback in one account.

Acceptance criteria:
- project switcher is clear
- feedback is scoped correctly
- install snippets are per project

## Epic 9: Admin and lifecycle management

### US-9.1

Story:
As an owner, I want to archive or delete a project safely so old products do not clutter my workspace.

Acceptance criteria:
- destructive actions require confirmation
- archive and delete are clearly distinguished if both exist

### US-9.2

Story:
As an owner, I want install docs and widget settings to stay consistent over time so my team is not guessing which configuration is current.

Acceptance criteria:
- saved widget settings are retrievable
- current version/config is obvious
- generated install code remains stable after installation
- saved browser-safe configuration is delivered remotely and matches the dashboard preview

### US-9.3

Story:
As a cancelling customer, I want a predictable downgrade that preserves my work so I can return without rebuilding my projects.

Acceptance criteria:
- paid features remain available only through the paid-through date
- cancellation warnings are sent during the final three paid days
- Free branding and feature limits return at expiry
- only projects above the Free allowance are frozen, and no project data is deleted automatically
- upgrading restores projects that were frozen by the downgrade

## Epic 10: Discover and recommend the product

### US-10.1

Story:
As an interested developer who is not ready to create an account, I want to join a concise product list so I can receive useful launch guidance without entering the dashboard.

Acceptance criteria:
- email consent is explicit and separate from advertising measurement
- duplicate submissions are idempotent and abuse-limited
- the success state explains what happens next

### US-10.2

Story:
As a user who recommends feedbacks.dev, I want a personal five-use invite link so successful introductions are easy to track and reward.

Acceptance criteria:
- each verified new account fills one of five slots
- self-referrals and duplicate invitee credit do not count
- the fifth signup grants one complimentary Pro month atomically
- the reward can be earned only once

### US-10.3

Story:
As a privacy-conscious visitor, I want advertising measurement off by default and reversible so I control whether ad platforms receive conversion data.

Acceptance criteria:
- tags and server conversion calls require explicit consent
- Meta and Reddit browser/server events deduplicate with the same identifier
- customer widgets and public boards never contain advertising tags
- privacy choices remain available after the first decision

### US-10.4

Story:
As the product owner, I want complimentary Pro rewards protected from one person creating several accounts so the program remains sustainable.

Acceptance criteria:
- email ownership and real product activation are required before an invite qualifies
- qualification matures for at least 24 hours
- self-referrals and normalized duplicate identities are rejected
- hashed device reuse and network velocity trigger graduated review instead of relying on IP alone
- abuse signals are removed after 90 days

### US-10.5

Story:
As an early adopter, I want an automatic, clearly scheduled way to earn Pro by giving useful feedback so I never depend on a vague application review or founder call.

Acceptance criteria:
- the programme accepts no more than 100 members and closes enrolment atomically when the cohort fills
- the account email links the reserved place to guided onboarding
- programme members cannot skip guided onboarding, and completing it activates Pro
- a structured feedback check-in grants one later month at a time, up to 12 total months
- the check-in opens seven days before its due date and is reachable from a dashboard banner
- lifecycle emails explain the due date, two-month grace period, final week, completion, and removal
- the complete programme closes no later than 14 months after onboarding
- duplicate or concurrent submissions cannot grant duplicate months
- programme completion or removal never deletes projects or feedback
- the Pro list price at enrolment remains the member's maximum Pro list price for at least five years from enrolment, excluding taxes and optional add-ons

## Epic 11: Talk with the feedbacks.dev team

### US-11.1

Story:
As an authenticated user, I want to send product feedback and read recent updates in Settings so I can help shape the product and see what changed.

Acceptance criteria:
- suggestion, problem, question, and positive-note categories are available
- submissions are private, authenticated, bounded, and rate limited
- the internal project does not consume the administrator's customer project allowance
- published product updates appear without adding a second messaging system

## Epic 12: Control release-note visibility safely

### US-12.1

Story:
As a product owner, I want to hide and restore a published release note without losing its history so I can control what is currently shown without corrupting metrics or repeatedly notifying users.

Acceptance criteria:
- every release note has an on/off control in both the overview and editor
- turning a note off preserves its content, publication time, metrics, and visitor seen state
- turning the same note on again does not re-announce it to visitors who already saw it
- owners see a clear warning before first publication and when editing a published note
- the editor explains that a new release note is required for a new announcement

## Priority order

### Must-have for v1

- US-1.1
- US-2.1
- US-3.1
- US-3.2
- US-3.3
- US-4.1
- US-4.2
- US-5.1
- US-5.3
- US-5.4
- US-6.1
- US-6.2
- US-6.4
- US-7.1
- US-10.1
- US-10.2
- US-10.3
- US-12.1
- US-10.4
- US-10.5
- US-11.1

### Should-have shortly after v1

- US-4.3
- US-4.4
- US-6.3
- US-7.2
- US-8.1
- US-9.2
- US-9.3

### Nice-to-have later

- richer collaboration workflows
- more advanced analytics
- deeper routing automation
