# feedbacks.dev launch operating plan

Last reviewed: 22 August 2026

This is the launch source of truth. It turns the broad go-to-market thesis in `docs/2026-08-02-go-to-market-plan.md` into a staged operating plan.

## The decision: open product, automated early-adopter programme

Do **not** put the product behind a waitlist. The public landing page should always let a developer create the Free plan immediately: no application, card, or trial clock. A developer who arrives with intent should never have to ask permission to use a working product.

Run the Early Adopter Programme as a second, optional lane for people who want to exchange useful monthly product feedback for Pro:

```text
Landing page
├── Start free -> sign in -> create project -> install -> first feedback
└── Join Early Adopter Programme -> email claim -> verified account -> completed tour claims one of 100 places
                                      ├── guided tour -> Pro month one
                                      └── monthly check-in -> next Pro month, up to 12
```

The programme is not an access gate and does not promise observed sessions or private founder access. The product handles onboarding, check-in windows, renewal, reminders, the two-month grace period, and programme completion automatically.

## Positioning

Category: developer-first in-product feedback infrastructure.

Core promise: **Install in ten minutes. Receive feedback with useful context. Decide what to ship next.**

Primary message: **The feedback stack for developers who ship.**

Proof, in order:

1. a real install completed in under ten minutes;
2. the production widget is under 20 KB gzip and loads asynchronously;
3. a real feedback item with page/browser context and an optional screenshot;
4. the clean path from inbox to public product update;
5. Free: two projects, 500 feedback items per month, full feedback history, no card;
6. Pro: $19 per month, unlimited projects and feedback.

Do not lead with “all-in-one,” AI, MCP, public boards, or integrations. Those are supporting proof after the core loop is understood.

## Ideal first customers

Prioritize people who can install the widget themselves and have enough traffic to receive feedback:

- solo and technical SaaS founders with a live web app;
- small developer-led teams without a dedicated product-ops stack;
- agencies maintaining several client products;
- open-source maintainers with a hosted product or documentation site.

Deprioritize idea-stage founders without a live surface, enterprises needing procurement, native-only mobile apps, and teams seeking a full research repository.

## Early Adopter Programme offer

Offer exactly 100 places. Every valid enrolment is accepted automatically while a place remains; there is no fit review or manual batch.

Members receive:

- guided in-product onboarding;
- one complimentary Pro month after finishing the tour;
- one additional Pro month for each complete monthly product check-in;
- up to 12 total Pro months;
- in-product and email reminders with a two-month grace period.

In return, ask for:

- completion of the guided onboarding;
- one honest monthly check-in covering what is good, bad, and worth improving;
- specific examples when possible.

Never promise roadmap control, lifetime pricing, or guaranteed feature delivery.

## Rollout gates

### Stage 0 - release proof

Before inviting a cohort:

- production deploy is green;
- auth, project creation, copy snippet, verification, submission, triage, and updates are smoke-tested;
- Dodo remains in test mode until the final live-billing checklist;
- security advisor has no unresolved repository-actionable high-severity findings;
- support, privacy, and status paths work.

### Stage 1 - Early Adopter Programme, days 1–7

Open all 100 places and monitor the automated onboarding and first-month activation path. Exit when:

- 60% of new projects verify installation;
- 65% of verified installs receive first feedback;
- median time to verified install is under ten minutes;
- no open severity-1 security or data-loss issue exists.

### Stage 2 - controlled public distribution, days 8–21

Publish one channel-native artifact at a time. Reddit, X, LinkedIn, Indie Hackers, and technical content should land on the open Free path; the Early Adopter Programme CTA remains secondary. Exit when at least 20 organic accounts have reached `first_feedback_received` and seven-day activated retention can be measured.

### Stage 3 - coordinated launch, days 22–30

Launch on Product Hunt and one secondary directory only after proof assets and customer language exist. Consider Show HN only when visitors can meaningfully try the product without an application barrier. Paid acquisition begins only after the organic activation gate.

## The operating rhythm

Every weekday:

1. answer product and community replies;
2. review yesterday's funnel by source;
3. review one Early Adopter check-in or interview one activated/non-activated user;
4. ship one meaningful friction fix or publish one useful artifact;
5. record the lesson in the public changelog when it is safe to share.

One founder owns all human community interactions. Do not automate replies, votes, DMs, or cross-posting.

## Launch materials

- `channel-map.md` - channel purpose, current constraints, and sequence
- `post-bank.md` - editable copy and channel-specific templates
- `content-calendar.md` - 30-day execution calendar
- `measurement.md` - attribution, funnel, dashboards, budgets, and decisions
- `creative-briefs.md` - images, screen recordings, and exact video storyboards

## Sources checked

- [Product Hunt: how to post a product](https://help.producthunt.com/en/articles/479557-how-to-post-a-product)
- [Product Hunt featuring guidelines](https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines)
- [Hacker News Show HN guidelines](https://news.ycombinator.com/showhn.html)
- [Hacker News guidelines](https://news.ycombinator.com/newsguidelines.html)
- [Reddit spam guidance](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam)
- [Meta Conversions API overview](https://www.facebook.com/business/help/AboutConversionsAPI)
- [X Ads creative specifications](https://business.x.com/en/help/campaign-setup/creative-ad-specifications)
