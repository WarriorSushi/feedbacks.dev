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
- each mode includes the right install snippet

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
- generated install code reflects the saved configuration

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

### Should-have shortly after v1

- US-4.3
- US-4.4
- US-6.3
- US-7.2
- US-8.1
- US-9.2

### Nice-to-have later

- richer collaboration workflows
- more advanced analytics
- deeper routing automation
