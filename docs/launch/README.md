# feedbacks.dev launch operating plan

Last reviewed: 22 August 2026

This is the launch source of truth. It turns the broad go-to-market thesis in `docs/2026-08-02-go-to-market-plan.md` into a staged operating plan.

## The decision: open product, selective partnership

Do **not** put the product behind a waitlist. The public landing page should always let a developer create the Free plan immediately: no application, card, or trial clock. A developer who arrives with intent should never have to ask permission to use a working product.

Run the Founding Beta as a second, optional lane for people who want closer access:

```text
Landing page
├── Start free -> sign in -> create project -> install -> first feedback
└── Apply for Founding Beta -> short application -> reviewed batch
                                      ├── invited -> onboarding session + private channel
                                      └── not yet -> useful updates; can still start free
```

The beta is not an access gate. It is a research cohort and high-touch customer-development program. This preserves conversion while producing the five to fifteen close collaborators needed to improve activation.

## Positioning

Category: developer-first in-product feedback infrastructure.

Core promise: **Install in ten minutes. Receive feedback with useful context. Decide what to ship next.**

Primary message: **The feedback stack for developers who ship.**

Proof, in order:

1. a real install completed in under ten minutes;
2. the production widget is under 20 KB gzip and loads asynchronously;
3. a real feedback item with page/browser context and an optional screenshot;
4. the clean path from inbox to public product update;
5. Free: two projects, 500 feedback items per month, 30 days of history, no card;
6. Pro: $19 per month, unlimited projects and feedback.

Do not lead with “all-in-one,” AI, MCP, public boards, or integrations. Those are supporting proof after the core loop is understood.

## Ideal first customers

Prioritize people who can install the widget themselves and have enough traffic to receive feedback:

- solo and technical SaaS founders with a live web app;
- small developer-led teams without a dedicated product-ops stack;
- agencies maintaining several client products;
- open-source maintainers with a hosted product or documentation site.

Deprioritize idea-stage founders without a live surface, enterprises needing procurement, native-only mobile apps, and teams seeking a full research repository.

## Founding Beta offer

Target 12 accepted teams in three batches of four. An application is strong when the applicant has a live product, can install in seven days, expects real user traffic, and can attend one 25-minute session.

Accepted teams receive:

- a 25-minute install/activation session;
- direct founder support for four weeks;
- a private feedback channel and prioritized bug response;
- recognition as a founding customer only with explicit permission;
- one complimentary Pro month after completing the research cycle, not merely for applying.

In return, ask for:

- install within seven days;
- permission to observe the setup session;
- two short check-ins after first feedback;
- honest permission-based use of a quote or anonymized lesson.

Never promise roadmap control, lifetime pricing, or guaranteed feature delivery.

## Rollout gates

### Stage 0 - release proof

Before inviting a cohort:

- production deploy is green;
- auth, project creation, copy snippet, verification, submission, triage, and updates are smoke-tested;
- Dodo remains in test mode until the final live-billing checklist;
- security advisor has no unresolved repository-actionable high-severity findings;
- support, privacy, and status paths work.

### Stage 1 - Founding Beta, days 1–7

Recruit 12 qualified teams but onboard only four at a time. Watch at least five installs. Exit when:

- 60% of new projects verify installation;
- 65% of verified installs receive first feedback;
- median time to verified install is under ten minutes;
- no open severity-1 security or data-loss issue exists.

### Stage 2 - controlled public distribution, days 8–21

Publish one channel-native artifact at a time. Reddit, X, LinkedIn, Indie Hackers, and technical content should land on the open Free path; the beta CTA remains secondary. Exit when at least 20 organic accounts have reached `first_feedback_received` and seven-day activated retention can be measured.

### Stage 3 - coordinated launch, days 22–30

Launch on Product Hunt and one secondary directory only after proof assets and customer language exist. Consider Show HN only when visitors can meaningfully try the product without an application barrier. Paid acquisition begins only after the organic activation gate.

## The operating rhythm

Every weekday:

1. answer product and community replies;
2. review yesterday's funnel by source;
3. watch one session or interview one activated/non-activated user;
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
