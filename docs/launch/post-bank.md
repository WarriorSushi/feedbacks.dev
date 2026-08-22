# Launch post and message bank

These are working drafts. Replace every bracketed proof point with a true value before posting. Never invent customers, install times, endorsements, scarcity, or results. Founder/community posts should be edited into the founder's natural voice; do not cross-post identical text.

Canonical CTA by intent:

- ready now: **Start free - no card, no trial clock.**
- early adopter: **Join the 100-member Early Adopter Programme and earn up to 12 Pro months through monthly product check-ins.**
- community post: **Try the install and tell me exactly where you hesitate.**

## Founder outreach

### Warm DM/email

Subject: Could you try a 10-minute feedback install?

> Hey [name] - I noticed [specific product/surface]. I’m building feedbacks.dev, a small in-product feedback widget that captures the page, browser context, and optional screenshot, then gives the team a clean inbox and update loop.
>
> The product is already open and free to use. I’m also opening a 100-member Early Adopter Programme: enrolment is automatic while places remain, the onboarding tour unlocks month one of Pro, and an honest monthly product check-in can unlock each following month, up to 12 total.
>
> If that sounds useful, join with your work email and follow the guided setup. No call or application review is required.
>
> [Early Adopter Programme link]

### Cold but researched note

Subject: A feedback setup for [product], not a generic demo

> Hi [name] - I found [product] through [specific place] and saw [specific live user surface]. If feedback is still arriving through [only say this if observed], I may have something useful.
>
> feedbacks.dev installs with one snippet, keeps the widget under 20 KB gzip, and sends feedback into an inbox with useful technical context. The Free plan is open-no card or application.
>
> The optional Early Adopter Programme has 100 places and accepts people automatically while a place remains. Complete the guided onboarding to activate the first Pro month, then submit one useful product check-in near each renewal to earn the next month, up to 12. Join here: [link]. The public Free product is here: [link].

No automated follow-up chain. One considerate follow-up after five business days is the maximum.

## Early Adopter Programme email sequence

### Place reserved

Subject: Your Early Adopter Programme place is reserved

> You’re in. Place [seat] of 100 is reserved for [email].
>
> Sign in with that email and complete the guided onboarding. When the tour is finished, your first complimentary Pro month activates automatically.
>
> [Continue onboarding]

### Monthly check-in opens

Subject: Your next complimentary Pro month is ready to earn

> Your Early Adopter check-in is open until [due date]. Tell us what is working, what is not, and what would make feedbacks.dev more useful. A complete submission activates Pro month [number] automatically.
>
> [Share this month’s check-in]

### Grace period

Subject: Your Early Adopter check-in is overdue - your grace period is active

> The due date passed, but your place is still protected. You have until [grace date] to submit the check-in and claim the next complimentary Pro month.
>
> If no check-in arrives by that date, the programme will end automatically. Your account, projects, and feedback history will remain intact on the plan available to you.
>
> [Complete the check-in]

### Final grace reminder

Subject: One week remains to keep your Early Adopter place

> Your final grace deadline is [grace date]. Submit this month’s check-in before then to activate the next Pro month. If it is not submitted, your Early Adopter membership will close automatically; your product data will not be deleted.
>
> [Complete the check-in]

### Programme completed

Subject: You completed the feedbacks.dev Early Adopter Programme

> Thank you. You completed all 12 Early Adopter months. Your final complimentary Pro month remains active through [end date], then normal plan and billing rules resume automatically. Your account and feedback history remain available.

### Installed, not verified (24 hours)

Subject: Did the feedbacks.dev snippet get stuck?

> Your project exists, but I haven’t seen installation verification yet. The shortest path is: copy the snippet, place it before `</body>`, deploy, then use Verify installation.
>
> If that failed, reply with the framework and the exact error. A screenshot or URL is enough; do not send secret keys.
>
> [Resume setup]

### Verified, no first feedback (24 hours)

Subject: Your widget is live-send the first test report

> Installation is verified. Open your product as a user, submit one real test report, and check that its page/browser context reaches the inbox.
>
> That single round trip proves the whole feedback loop before inviting customers.
>
> [Open project]

## X organic

### Launch post A - direct

> feedbacks.dev is open.
>
> Add one lightweight widget. Collect feedback with the page, browser context, and optional screenshots. Triage it, route it, and close the loop with product updates.
>
> Free: 2 projects, 500 feedback/month, no card.
>
> [tagged link]

### Launch post B - programme clarity

> The feedbacks.dev Early Adopter Programme is open to the first 100 members.
>
> Joining is automatic while places remain. Finish the guided onboarding for Pro month one, then give one honest product check-in near each renewal to earn the next month, up to 12 total. A two-month grace period protects a missed check-in.
>
> Start: [link]
> Join the programme: [link]

### Build thread

1. `I kept seeing founders collect product feedback in DMs, support chats, and screenshots-then lose the context needed to act. I built feedbacks.dev to make the first loop smaller, not add another product-ops suite.`
2. `The install target is under 10 minutes: create a project, copy one snippet, deploy, verify. Customization is deliberately after the first working loop.`
3. `The widget is under 20 KB gzip, loads asynchronously, and uses a publishable project key that cannot read the private inbox.`
4. `A report can carry page and browser context plus an optional screenshot. The dashboard turns it into a small triage workflow, webhook/API/MCP routing, and public updates.`
5. `The Free plan is meant to be genuinely usable: 2 projects, 500 feedback/month, full feedback history, no card. Pro is $19/month when volume, routing, branding, or update automation matter.`
6. `There are two entry paths: start free immediately, or join the optional 100-member Early Adopter Programme to earn up to 12 Pro months through guided onboarding and monthly product check-ins.`
7. `I need the most useful kind of feedback: try the install and tell me the first moment that makes you pause. [tagged link]`

### Seven reusable short posts

1. `The activation metric for a feedback tool should not be “account created.” It should be “first feedback arrived.” Everything before that is setup debt.`
2. `A public widget key should be publishable by design. If it can read an inbox, rotate secrets, or call private endpoints, the security boundary is wrong.`
3. `The fastest onboarding improvement we made was moving customization after verification. First make the loop work; then make it yours.`
4. `A bug report without page and browser context creates a second support ticket: “Can you tell me where this happened?” Good feedback tooling removes that round trip.`
5. `Free plans should reach real value. feedbacks.dev Free includes two projects and 500 feedback items/month-enough to learn whether the workflow belongs in your product.`
6. `We keep advertising tags off customer widgets and public boards. A customer's end user should not become part of our acquisition tracking.`
7. `Today’s build-in-public number: [X] projects created, [Y] installs verified, [Z] received first feedback. The gap between [stage] and [stage] is what I’m fixing next.`

### Reply when someone asks “How is this different from Canny?”

> Canny is a mature feature-request/roadmap platform. feedbacks.dev is narrower and developer-first: a lightweight in-product collector, automatic technical context, a small triage inbox, and routing through API/webhooks/MCP. The Free plan is open; Pro is $19/month without tracked-user pricing. If you need a large research suite, Canny may fit better.

## Reddit drafts

Before using any draft: verify the community rules, ask moderators if necessary, add the correct flair, rewrite in the founder's natural voice, and remove the link if native links are disallowed.

### r/SaaS - data/lesson angle

Title: `The signup metric hid the real problem in my feedback tool: nobody had completed the loop`

> I built a developer-focused feedback widget, and for too long I treated account and project creation as progress.
>
> They were not. A user had received no value until four things happened: the snippet was deployed, installation was verified, a real report came through, and the founder could understand/triage it.
>
> I changed the activation event to first feedback received and started measuring each gap. The working checklist is now:
>
> 1. explain the entire product before asking for signup;
> 2. make project creation choose defaults, not demand configuration;
> 3. put copy/paste install before advanced customization;
> 4. verify the production URL;
> 5. ask the founder to send one real test report;
> 6. show the received context in the inbox;
> 7. only then ask about upgrades or referrals.
>
> I built feedbacks.dev, so this is self-promotion as well as a lesson. The product itself is open and free. I also opened an optional 100-member Early Adopter Programme where the onboarding tour unlocks the first Pro month and useful monthly check-ins can unlock up to 11 more.
>
> The question I’d value here: where does your current feedback flow stop-collection, context, triage, or closing the loop?

Add a link only if rules permit and the account meets the current r/SaaS interval/karma requirements.

### r/SideProject - honest build request

Title: `I made the feedback tool I wanted for small shipped products-please break the 10-minute install`

> My old feedback workflow was a footer form plus messages scattered across email and DMs. The messages were often real, but the page, browser, screenshot, and decision history were gone.
>
> I built feedbacks.dev around one small loop:
>
> - paste one asynchronous snippet;
> - collect a short report with useful technical context;
> - triage it in a small inbox;
> - route the important items and publish an update.
>
> I deliberately kept the Free plan usable (2 projects, 500 feedback/month, no card) and kept the production widget under 20 KB gzip.
>
> I’m the builder, and I’m not looking for polite “looks cool” replies. If you have a live web product, try the public Free flow and name the first confusing moment, or join the optional Early Adopter Programme and share one structured product check-in each month.
>
> Screenshot/demo: [attach natively]
> Link: [include only under current rules]

### r/webdev - standalone technical value

Title: `Security and performance checklist for a third-party feedback widget`

> A copy-paste widget creates a deceptively large trust boundary. Here is the checklist I used while building one:
>
> - The browser key is publishable and rejected by every private endpoint.
> - The script is asynchronous and size-budgeted in CI (current gzip: under 20 KB).
> - Allowed origins are explicit; CORS is not `*` for credentialed operations.
> - Public submissions are bounded, rate-limited, schema-validated, and idempotent.
> - Screenshots are type/size checked, stored outside public buckets, and served through controlled paths.
> - Rich text is sanitized; CSP reporting is rate-limited so it cannot become a log-flood endpoint.
> - Webhook signatures and internal bearer tokens use constant-time comparison.
> - Advertising tags never load inside customer widgets or public boards.
> - Configuration can update remotely without reinstalling the script.
>
> This checklist came from building feedbacks.dev (disclosure: my product). I can share the implementation tradeoffs for any item. What boundary would you add before trusting a third-party widget?

Keep this link-free unless moderators explicitly approve a product/docs link.

### Generic founder-group version

> A lesson from building a feedback product: “joined the waitlist” and “created an account” are acquisition events, not value.
>
> The value event is first useful feedback received. The product is open to everyone, with a separate optional 100-member Early Adopter Programme for sustained product check-ins. Enrolment and onboarding are automated, so no application can block a developer who is ready now.
>
> I built feedbacks.dev. If your group permits it, I can share the exact activation checklist and the numbers after the first cohort. I will not add a product link without moderator approval.

## Product Hunt

Name: `feedbacks.dev`

Tagline: `From in-product feedback to the next shipped update`

Description (under 260 characters):

> Install a lightweight feedback widget in minutes. Capture useful page and browser context, triage reports in a clean inbox, route important issues through API, webhooks, or MCP, and close the loop with public product updates.

Topics: Developer Tools, SaaS, Productivity (use only the closest topics available at submission time).

Pricing: Paid (with a free plan).

First maker comment:

> Hey Product Hunt - I built feedbacks.dev after watching useful product feedback lose its context across DMs, email, screenshots, and generic forms.
>
> The goal is deliberately small: get a developer from zero to a working in-product feedback loop in under ten minutes. One async snippet opens a configurable feedback form. Reports arrive with useful page/browser context and optional screenshots. From there, a small inbox, public boards/updates, REST API, webhooks, and MCP help move the important items into the workflow you already use.
>
> The Free plan is not a demo: two projects, 500 feedback items per month, full feedback history, no card. Pro is $19/month for unlimited projects and feedback, deeper routing, branding controls, and update automation.
>
> I would especially value feedback on three things:
>
> 1. Is the product clear before signup?
> 2. Where does the install make you hesitate?
> 3. Does the first received report contain enough context to act?
>
> I’m here all day and will answer every serious question. Thanks for trying it.

### Product Hunt FAQ replies

**Is it free?**

> Yes. Free includes two projects, 500 feedback items per month, full feedback history, the widget/inbox, public boards and product updates, REST API/MCP, and one webhook. No card or trial clock. Pro is $19/month.

**Will it slow down my site?**

> The production widget is under 20 KB gzip, loads asynchronously, and has a CI size budget. If you share your framework, I can point to the shortest install path.

**Is the public key a secret?**

> No. Project keys are designed to be publishable and are rejected by private REST and MCP endpoints. Private operations use separate authenticated credentials.

**Can I use feedbacks.dev without the Early Adopter Programme?**

> Yes. The product is fully open on Free. The Early Adopter Programme is an optional, 100-member feedback-for-Pro programme, not a waitlist or access requirement.

**How is this different from a generic form?**

> The report starts inside the product and can include page/browser context and an optional screenshot. It then enters a triage/routing/update workflow instead of becoming another disconnected form response.

## LinkedIn

### Founder launch post

> A signup is not activation.
>
> I relearned that while building feedbacks.dev.
>
> A developer can create an account, name a project, even copy a code snippet-and still receive zero value. The product becomes real only when a report travels from their live app into an inbox with enough context to act.
>
> So we rebuilt the first-run path around one outcome: first feedback received.
>
> Create a project. Paste one lightweight snippet. Verify the live install. Send a real report. See the page, browser context, and optional screenshot. Then customize and connect workflows.
>
> feedbacks.dev is now open to everyone on a genuinely usable Free plan: two projects, 500 feedback items per month, no card.
>
> I’m also opening 100 places in an optional Early Adopter Programme. Joining is automatic while places remain. Guided onboarding activates Pro month one; each useful monthly product check-in can activate another month, up to 12 total. It is not a waitlist; anyone can start Free now.
>
> [tagged link]
>
> If you run a live product, what is the least reliable part of your current feedback loop?

### LinkedIn document/carousel copy

1. `A useful bug report should not create another support ticket.`
2. `Ask for one clear description-not a 12-field intake form.`
3. `Capture the page and product area automatically.`
4. `Include browser/device context only when it helps reproduce the issue.`
5. `Make screenshots optional and explain how they are handled.`
6. `Route only important reports; do not mirror noise into every tool.`
7. `Close the loop with a visible update when the issue ships.`

Caption:

> This is the minimum context checklist behind feedbacks.dev. Save it even if you use another tool. Better intake removes the “where did this happen?” round trip without turning feedback into surveillance.

## Facebook founder/operator groups

Post only after administrator approval or in a designated showcase thread:

> Admin-approved founder post: I built feedbacks.dev, a lightweight in-product feedback widget for small developer-led teams. The useful lesson from our launch is that applications and signups are not activation-the first complete report is.
>
> I wrote up the seven-step activation checklist in this post: [include checklist natively]. The product is open on a no-card Free plan; a separate optional 100-member Early Adopter Programme exchanges useful monthly product check-ins for up to 12 Pro months. If links are allowed, it is here: [tagged link]. Happy to answer implementation questions and remove the link if it is not appropriate for this group.

## Indie Hackers

Title: `Why I paired an open Free plan with a 100-member feedback-for-Pro programme`

> Product access and structured product research are different jobs.
>
> Product access should be open: a technical founder arriving with intent can create a Free project, install the widget, and learn from real users without asking permission.
>
> Research should be predictable for both sides. The Early Adopter Programme accepts the first 100 members automatically, teaches the product through a guided tour, and activates the first complimentary Pro month when onboarding is complete.
>
> Near each renewal, members get a structured prompt: what is good, what is bad, and what should improve. Submitting it activates the next Pro month, up to 12 total. A two-month grace period handles missed deadlines; after that the programme closes automatically without deleting product data.
>
> Start Free remains the primary CTA. Join the Early Adopter Programme is optional and capped only because the programme has a defined lifecycle. I’ll report the honest funnel: visits, projects, verified installs, first feedback, completed check-ins, and seven-day returns.
>
> Has anyone else tried a feedback-for-access programme with an explicit end date? What made the exchange feel fair?

## Hacker News fact checklist - not publishable copy

HN currently prohibits generated or AI-edited text. The founder must write the Show HN submission personally. Include only facts personally understood and defensible:

- why scattered, context-poor product feedback was personally frustrating;
- what a visitor can try immediately;
- install architecture and current gzip size;
- publishable project-key/private-credential boundary;
- submission limits, origin controls, sanitization, and screenshot handling;
- how form configuration updates without reinstalling;
- Free/Pro limits in plain language;
- specific known limitations and the exact feedback sought.

Use a plain title beginning `Show HN:`. Do not ask anyone to vote or comment. Do not link to the programme enrolment page.

## Paid creative copy

### Meta A - installation proof

Primary text:

> Your feedback tool should not become an integration project. Add one lightweight snippet, verify it on your live app, and receive the first contextual report. feedbacks.dev is free for two projects-no card and no trial clock.

Headline: `Install the feedback loop in minutes`

Description: `One snippet. Useful context. Start free.`

CTA: `Sign Up`

### Meta B - context proof

Primary text:

> Stop replying “Which page and browser?” to every bug report. Collect a short note with useful technical context and an optional screenshot, then triage it in one clean inbox.

Headline: `Feedback with the context to act`

Description: `500 reports/month on Free.`

CTA: `Learn More`

### Meta C - feedback-to-update

Primary text:

> Feedback is unfinished until the user knows what shipped. Collect reports in-product, route the important ones, and publish a clear update from the same lightweight workflow.

Headline: `Close the feedback loop`

Description: `Free plan. No card.`

CTA: `Sign Up`

### X paid A

> Install one lightweight feedback widget. Receive reports with useful page and browser context. Triage, route, and publish updates from one developer-first workflow. Free for two projects-no card.

### X paid B

> A bug report should not trigger “Which page? Which browser?” feedbacks.dev captures useful context and optional screenshots, then sends the report to a clean triage inbox. Start free.

## Technical article

Title: `How to collect useful bug context without shipping a surveillance bundle`

Outline:

1. why “more metadata” is the wrong goal;
2. the minimum context that reduces a support round trip;
3. consent and screenshot boundaries;
4. publishable keys versus private credentials;
5. origin validation, bounded payloads, idempotency, and rate limits;
6. async loading and bundle-size budgets;
7. a framework-neutral snippet and test checklist;
8. what feedbacks.dev chose and what it deliberately does not collect.

Opening:

> Most bug-report forms fail in opposite directions. They collect only a sentence, forcing a second conversation to discover where the problem happened, or they vacuum up far more data than the team can justify. The useful middle is a small, explicit context envelope: enough to reproduce the issue, bounded enough to explain to a customer.
