# feedbacks.dev

This repository has been reset as a greenfield planning workspace for the next version of `feedbacks.dev`.

The previous implementation has been archived in [`archived_project/`](/abs/path/C:/coding/feedbacks.dev/archived_project).

## What feedbacks.dev is

`feedbacks.dev` is a developer-first feedback collection product:
- a lightweight embeddable widget for websites and web apps
- a dashboard for triage, tagging, and response workflows
- optional integrations that push high-signal feedback into existing team tools

## Why this product should exist

Most feedback tools fail one of two ways:
- they are too heavy, slow, and enterprise-shaped for indie teams and small SaaS products
- they are too simplistic and become useless once feedback volume grows

The goal for `feedbacks.dev` is to sit in the middle:
- as easy to install as analytics
- focused enough to stay lightweight
- structured enough to help teams act on feedback instead of just collecting it

## Who it is for

- indie hackers
- SaaS founders
- product engineers
- small product teams
- agencies shipping client websites and apps

## Repository status

This root now contains product-definition docs only.

Start here:
- [AGENTS.md](/abs/path/C:/coding/feedbacks.dev/AGENTS.md)
- [docs/README.md](/abs/path/C:/coding/feedbacks.dev/docs/README.md)
- [docs/product-brief.md](/abs/path/C:/coding/feedbacks.dev/docs/product-brief.md)
- [docs/prd.md](/abs/path/C:/coding/feedbacks.dev/docs/prd.md)
- [docs/user-stories.md](/abs/path/C:/coding/feedbacks.dev/docs/user-stories.md)

## Current structure

```text
feedbacks.dev/
├── archived_project/     # previous implementation snapshot
├── docs/                 # source of truth for the rebuild
├── AGENTS.md             # instructions for humans and coding agents
└── README.md             # repository overview
```

## Working principle

Do not treat `archived_project/` as the source of truth for the rebuild.

Use it only for:
- reference
- migration ideas
- asset reuse
- lessons from the first implementation

All new planning and implementation decisions should follow the docs in the root `docs/` directory.
