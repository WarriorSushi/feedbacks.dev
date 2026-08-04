# feedbacks.dev go-to-market plan

## The growth thesis

Do not market “a feedback tool.” Market the shortest trustworthy path from a shipped product to useful, contextual feedback.

The core promise is: **install in ten minutes, receive feedback with context, decide what to ship next.** Every acquisition asset should prove one of those three moments.

The primary loop is product-led word of mouth:

1. A founder installs the widget.
2. Their users see a tasteful feedbacks.dev attribution on Free.
3. The founder receives useful feedback quickly.
4. A contextual prompt asks them to invite another builder.
5. Five genuinely activated accounts unlock one Pro month.
6. Public boards and shipped updates create additional shareable surfaces.

## The first 30 days

### Days 1–3: prove activation before seeking volume

- Recruit 10–15 founder friends, indie builders, or existing contacts.
- Watch five installs live. Record where users hesitate, especially between project creation, copying the snippet, and verifying the first submission.
- Ask for one sentence after first value: “What did feedbacks.dev replace for you?” Use exact customer language on the site.
- Define the activation event as `first_feedback_received`, not account creation.
- Create a public “building feedbacks.dev” board and ship visible fixes from these sessions.

Exit gate: at least 60% of new projects verify an install, and at least 40% receive first feedback within 24 hours.

### Days 4–7: founder-led Reddit launch

Post as a builder, not as an advertiser. Use one substantial post per relevant community and follow each community’s self-promotion rules.

Post angles:

- Build story: “I was tired of feedback tools that take longer to configure than the feature. I built a one-snippet alternative.”
- Teardown: “I compared five ways indie SaaS teams collect in-product feedback. Here is where each breaks.”
- Useful artifact: “A copy-paste checklist for collecting actionable bug reports without asking users 12 questions.”
- Honest request: “I need five founders to break my ten-minute feedback install flow.”

Each post should include a real lesson, a screenshot or 20-second install clip, the exact snippet, the Free limits, and a direct disclosure that you built the product. Stay in the thread for the first two hours. Answer every serious question and ship small fixes publicly.

Candidate communities must be validated against current rules before posting. Likely fits include communities for SaaS founders, indie hackers, web development, startups, and framework-specific builders when the post is genuinely technical.

### Week 2: repeat what activated users, then test paid traffic

- Turn the highest-response Reddit angle into two landing-page variants.
- Publish one short customer story showing install time, first feedback, and a decision made from it.
- Add lifecycle prompts only after value: after the first feedback is triaged and after the first public update is shipped.
- Start Meta only if activation tracking is reliable and at least 20 organic users have reached first feedback.

Initial Meta test:

- One campaign, one broad founder/developer audience, no fragmented ad-set maze.
- Three materially different creatives: install proof, feedback-to-fix story, and dashboard triage proof.
- Optimize for `ProjectCreated` only until `first_feedback_received` has enough volume, but judge the campaign by activated-project cost.
- Run for seven days without daily edits. Cap the first test at an amount you are comfortable losing entirely.
- Use consent-gated Pixel plus Conversions API with the same event ID for deduplication. Never place ad measurement in customer widgets or public boards.

Kill or continue after the full test window:

- Continue if activated-project cost is below the first-month gross profit you are willing to spend and users resemble the target customer.
- Iterate the landing page if click-through is healthy but project creation is weak.
- Iterate onboarding if project creation is healthy but first feedback is weak.
- Stop the audience/creative if both click-through and activation are weak.

### Weeks 3–4: compound trust

- Ship one technical article per week around feedback implementation, bug-report context, widget performance, or public-roadmap tradeoffs.
- Convert common support answers into searchable docs with working snippets.
- Add two small integration recipes that match actual requests, not a broad integration catalog.
- Ask activated users for a quote only after they receive and triage meaningful feedback.
- Publish a weekly changelog with “requested by” credit when the customer opts in.

## Word-of-mouth mechanics

Prompts should follow earned moments, never interrupt first-run setup:

- After first feedback received: “Your loop works. Know another builder who is still collecting feedback in DMs?”
- After five items triaged: “You have a working feedback rhythm. Invite a founder you collaborate with.”
- After an update is published: offer a shareable public update link.

Do not reward raw signups. A referral qualifies only after verified identity, a safety delay, and a meaningful activation event. This protects the program and makes the invite count represent potential retained users.

## Weekly scorecard

Track one funnel by source:

| Stage | Metric | Initial target |
| --- | --- | ---: |
| Visit | Qualified landing visits | Baseline first |
| Intent | Auth started / visit | 8%+ |
| Setup | Project created / auth completed | 70%+ |
| Install | Verified install / project created | 60%+ |
| Value | First feedback / verified install | 65%+ |
| Habit | Returned in 7 days / activated account | 35%+ |
| Revenue | Pro / activated account | 5–10% |
| Advocacy | Qualified referral / activated account | 5%+ |

The north-star acquisition metric is **cost per account that receives first feedback**, not cost per click or cost per signup.

## Messaging bank

- Headline: “The feedback stack for developers who ship.”
- Proof line: “One snippet. Useful context. A clean path from report to release.”
- Reddit CTA: “Try the install and tell me where you hesitate.”
- Pro CTA: “Keep every project live and remove the limits between feedback and shipping.”
- Referral CTA: “Give another builder a proper introduction.”

## What not to do

- Do not launch in ten communities on the same day with duplicate copy.
- Do not buy traffic before first-feedback activation is measurable.
- Do not optimize ad campaigns for cheap signups.
- Do not use the invite reward before users experience value.
- Do not hide Free limits or downgrade behavior.
- Do not add invasive fingerprinting or hard-block shared IP addresses.
