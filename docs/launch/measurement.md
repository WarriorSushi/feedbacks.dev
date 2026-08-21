# Launch measurement and decision system

## North star and guardrails

North-star acquisition metric: **accounts that receive first feedback within 24 hours of project creation**.

Guardrails:

- median and p90 time to verified installation;
- widget submission error rate;
- seven-day return rate among activated accounts;
- support requests per activated account;
- security, privacy, and spam incidents;
- Pro conversion only after activation quality is healthy.

Signups, application count, impressions, votes, and clicks are diagnostics-not success.

## Funnel

| Stage | Event/source | Initial threshold | Decision |
| --- | --- | ---: | --- |
| Visit | privacy-safe aggregate page analytics | establish baseline | Compare qualified sources |
| Intent | auth started / qualified visit | 8% | Weak: fix message/CTA |
| Account | `CompleteRegistration` | observe | Diagnose auth abandonment |
| Setup | `project_created` / registered | 70% | Weak: fix first-run setup |
| Install | `verification_completed` / project | 60% | Weak: fix snippets/docs |
| Value | `first_feedback_received` / verified | 65% | Weak: add test-feedback path and guidance |
| Habit | 7-day return / activated | 35% | Weak: improve triage/notifications |
| Revenue | Pro / activated | 5–10% | Do not optimize before value |
| Advocacy | qualified referral / activated | 5% | Ask only after earned moment |

## Attribution convention

Every distributed link uses lowercase values and one canonical campaign:

```text
utm_source=x|reddit|linkedin|facebook|instagram|producthunt|hackernews|indiehackers|devto|newsletter|direct_outreach
utm_medium=organic_social|community|directory|paid_social|email|dm|content
utm_campaign=founding_beta_2026q3|public_launch_2026q3|product_hunt_2026q3
utm_content=<asset-or-angle>
utm_term=<paid-audience-only>
```

Examples:

```text
/?utm_source=x&utm_medium=organic_social&utm_campaign=public_launch_2026q3&utm_content=install_clip
/?utm_source=reddit&utm_medium=community&utm_campaign=founding_beta_2026q3&utm_content=bug_context_checklist
/?utm_source=producthunt&utm_medium=directory&utm_campaign=public_launch_2026q3&utm_content=launch_page
```

Do not add UTMs to community links when rules or norms discourage tracking. Never use redirects that conceal the destination.

## How activation attribution works

Browser/server ad events are consent-gated and currently cover `Lead`, `CompleteRegistration`, and `ProjectCreated`. The true value event occurs later through the customer's installed widget. Do **not** add ad scripts to customer widgets and do not reuse the end user's IP/browser as the account owner's conversion data.

Instead, evaluate activation internally by joining:

- `marketing_conversion_events.user_id` and attribution from registration/project creation;
- `activation_milestones.user_id`, project, and `first_feedback_received` timestamp;
- quarantine/test-actor exclusions already present in product analytics.

Ad networks may optimize for `ProjectCreated` until enough privacy-safe, consent-valid owner-side value events can be implemented. Business decisions use the internal activated-project cost.

## Founding Beta review rubric

Score applications 0–2 per item:

| Criterion | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Product stage | Idea only | Private/low traffic | Live with active users |
| Install timing | Unknown/>30 days | 8–30 days | Within 7 days |
| Problem intensity | Curious | Scattered feedback | Active painful workflow |
| Technical fit | Native-only/no web surface | Needs help | Can install web snippet |
| Research commitment | No details | Async feedback | Session + follow-ups |

Invite highest-fit applicants while preserving variety across frameworks and company stages. Do not use protected characteristics or infer sensitive traits. Record a one-line decision reason. Review twice weekly; reply within three business days.

## Weekly source scorecard

For each `utm_source` report:

- qualified visits;
- registrations;
- projects created;
- verified installs;
- first feedback within 24 hours;
- median time to activation;
- seven-day activated return;
- spend;
- cost per project;
- cost per activated project;
- number and theme of support incidents.

Small samples need raw counts and qualitative notes, not confident percentages.

## Paid test budget and rules

Paid acquisition is locked until 20 organic activations and reliable source joins.

First Meta test:

- one campaign, one broad ad set, three creatives;
- seven full days without daily restructuring;
- suggested learning budget: USD 20/day, maximum USD 140, only if fully affordable to lose;
- optimize for `ProjectCreated`; evaluate on `first_feedback_received`;
- keep Pixel/CAPI consent-gated and use the same event ID for deduplication.

X paid is second, not simultaneous. Test only if an organic X creative produces qualified engagement; use the same USD 140 ceiling.

Decision rules after the complete window:

- continue if activated-project CAC is below the chosen first-month gross-profit ceiling and users match the ICP;
- change landing message if clicks are qualified but project creation is weak;
- change onboarding if project creation is healthy but activation is weak;
- stop a creative/audience when both qualified click-through and activation are weak;
- never increase budget because of cheap clicks alone.

## Daily launch dashboard

At 09:00 local time record:

```text
Date:
Traffic by source:
New applications / invited / accepted:
Registrations / projects / verified installs / first feedback:
Median install time:
Top abandonment point:
Security or reliability incidents:
Top customer sentence (verbatim, permission-safe):
One action today:
```

## Experiment log

Every change gets:

```text
Hypothesis:
Single variable:
Primary metric:
Guardrail:
Start/end:
Minimum observation window:
Result with raw counts:
Decision:
```

Do not run simultaneous hero, pricing, and onboarding changes that make the result uninterpretable.
