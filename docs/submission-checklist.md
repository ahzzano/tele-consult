# Submission Checklist

Deadline: May 30, 2026 at 11:59 PM.

Submission form: https://forms.gle/2QrDQ17KBhHqWqBK9

## Required Links

- Deployed app:
- Git repository:
- Video demo:
- Pair programming schedule status:

## Product Manager Track Only

- Deck:

## Access Checks

Before submitting, open each link in an incognito/private browser window and confirm:

- The deployed app loads without requiring local development services.
- The git repository is accessible to reviewers.
- The video demo is viewable without requesting access.
- The deck is viewable without requesting access, if applicable.

## Video Demo Coverage

Use [video-walkthrough.md](./video-walkthrough.md) as the recording guide.

The video should cover:

- Application walkthrough
- Code overview
- Technical limitations
- Future improvement plan

## Final Verification

Run before submission:

```bash
cd backend
pnpm test --runInBand
pnpm build
```

```bash
cd frontend
pnpm build
```
