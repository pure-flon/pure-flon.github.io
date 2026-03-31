# E-FACTORY Social Launch Package

> Prepared: 2026-03-31
> Repo: `pure-flon.github.io`
> Status: ready for execution, waiting on manual board post step

## Scope

This package covers the first social distribution window for the two already-shipped E-FACTORY games tied to the current tracker:

| Experiment | Game | Live URL | 7-day scale gate | 7-day kill floor |
| --- | --- | --- | --- | --- |
| `EXP-1009` | India Tech Culture Quiz | `https://pure-flon.com/games/india-tech-culture/` | `>= 500 UV` | `< 100 UV` |
| `EXP-1013` | AI or Human? Quiz | `https://pure-flon.com/games/ai-or-human/` | `>= 1000 UV` | `< 200 UV` |

## Guardrails

- This package does not change PM scope, game scope, or page design.
- Manual community posting is not in the CMO automation lane. Execution stays blocked until the board/user clears the human posting step.
- All links below point to `pure-flon.com` from the serving repo only.
- Use the exact UTM links below so GA4 can separate channel and experiment traffic.

## Destination Links

### `EXP-1009` — India Tech Culture Quiz

- Hacker News secondary link:
  - `https://pure-flon.com/games/india-tech-culture/?utm_source=hackernews&utm_medium=social&utm_campaign=exp1009&utm_content=secondary_link`
- `r/programming` primary link:
  - `https://pure-flon.com/games/india-tech-culture/?utm_source=reddit&utm_medium=social&utm_campaign=exp1009&utm_content=r_programming`
- `r/MachineLearning` secondary link:
  - `https://pure-flon.com/games/india-tech-culture/?utm_source=reddit&utm_medium=social&utm_campaign=exp1009&utm_content=r_machinelearning_secondary`

### `EXP-1013` — AI or Human? Quiz

- Hacker News primary link:
  - `https://pure-flon.com/games/ai-or-human/?utm_source=hackernews&utm_medium=social&utm_campaign=exp1013&utm_content=show_hn`
- `r/programming` secondary link:
  - `https://pure-flon.com/games/ai-or-human/?utm_source=reddit&utm_medium=social&utm_campaign=exp1013&utm_content=r_programming_secondary`
- `r/MachineLearning` primary link:
  - `https://pure-flon.com/games/ai-or-human/?utm_source=reddit&utm_medium=social&utm_campaign=exp1013&utm_content=r_machinelearning`

## Channel Sequencing

The goal is to avoid firing every channel at once so the first 24 hours stay attributable.

1. Hacker News
   - Primary surface: `AI or Human?`
   - Secondary surface: `India Tech Culture Quiz`
   - Window: Tue-Thu, 08:00-10:00 ET
   - Hold period before next channel: `6h`
2. `r/MachineLearning`
   - Primary surface: `AI or Human?`
   - Secondary surface: `India Tech Culture Quiz`
   - Window: Tue-Thu, 10:00-13:00 ET
   - Hold period before next channel: `12h`
3. `r/programming`
   - Primary surface: `India Tech Culture Quiz`
   - Secondary surface: `AI or Human?`
   - Window: Tue-Thu, 09:00-12:00 ET
   - Hold period after post: `24h`

## Launch Copy

### Hacker News

- Title:

```text
Show HN: AI or Human? — a small browser quiz that asks if text was written by AI
```

- URL field:

```text
https://pure-flon.com/games/ai-or-human/?utm_source=hackernews&utm_medium=social&utm_campaign=exp1013&utm_content=show_hn
```

- Optional text / first comment:

```text
Built this as a tiny no-framework browser game. You get 15 snippets across code, emails, blog posts, Reddit comments, and git commits, then guess whether each one was written by AI or a human.

It is plain HTML/CSS/JS on GitHub Pages, with short explanations after every answer.

Also shipped another dev-culture quiz from the same batch:
https://pure-flon.com/games/india-tech-culture/?utm_source=hackernews&utm_medium=social&utm_campaign=exp1009&utm_content=secondary_link

Feedback welcome on difficulty balance and whether the examples feel fair.
```

### `r/MachineLearning`

- Title:

```text
I made a browser quiz where you guess whether short texts were written by AI or by a human
```

- Body:

```text
Built a small browser quiz around a simple question: when you see a short snippet in the wild, can you reliably tell whether it was written by AI or by a person?

The game runs through 15 short examples across code, emails, blog blurbs, Reddit comments, and git commits. After each guess it shows a short explanation for why the answer leans one way or the other.

No signup, no framework, no install:
https://pure-flon.com/games/ai-or-human/?utm_source=reddit&utm_medium=social&utm_campaign=exp1013&utm_content=r_machinelearning

Also from the same launch batch, I built a second quiz around Indian developer slang and IT culture:
https://pure-flon.com/games/india-tech-culture/?utm_source=reddit&utm_medium=social&utm_campaign=exp1009&utm_content=r_machinelearning_secondary

Main thing I want to learn: which examples feel too easy, and which feel genuinely ambiguous?
```

### `r/programming`

- Title:

```text
I built two tiny browser quizzes for programmers: one on AI-generated writing, one on Indian dev slang
```

- Body:

```text
Built two small no-framework browser quizzes and bundled them into the same launch batch.

1. India Tech Culture Quiz
   10 random questions from a 50+ prompt pool around "do the needful", jugaad, bench period, fresher, service vs product, and other Indian IT culture references.

https://pure-flon.com/games/india-tech-culture/?utm_source=reddit&utm_medium=social&utm_campaign=exp1009&utm_content=r_programming

2. AI or Human?
   15 short snippets where you guess whether the text was written by AI or by a person.

https://pure-flon.com/games/ai-or-human/?utm_source=reddit&utm_medium=social&utm_campaign=exp1013&utm_content=r_programming_secondary

Both are plain HTML/CSS/JS, mobile-friendly, and free to play.

If you only try one, I want to know which concept is stronger as a programmer-facing launch surface.
```

## Measurement Notes

Capture evidence in the order below after each live post:

1. Save the final public post URL.
2. Save the destination URL exactly as posted.
3. In GA4 Realtime, confirm the source/medium and target path appear within `30m`.
4. Record early signal at `+30m` and `+6h`.
5. Record the first verdict snapshot at `+24h`.
6. Record final verdict at `+7d`.

### GA4 fields to watch

- `session_source`
- `session_medium`
- `campaign`
- `page_location`
- users
- sessions
- average engagement time

### Evidence Table

| Channel | Experiment | Post URL | Destination URL | Launch time (UTC) | +30m users | +6h users | +24h users | +7d users | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HN | `EXP-1013` | pending | pending | pending | pending | pending | pending | pending | pending |
| HN secondary | `EXP-1009` | pending | pending | pending | pending | pending | pending | pending | pending |
| `r/MachineLearning` | `EXP-1013` | pending | pending | pending | pending | pending | pending | pending | pending |
| `r/MachineLearning` secondary | `EXP-1009` | pending | pending | pending | pending | pending | pending | pending | pending |
| `r/programming` | `EXP-1009` | pending | pending | pending | pending | pending | pending | pending | pending |
| `r/programming` secondary | `EXP-1013` | pending | pending | pending | pending | pending | pending | pending | pending |

## Verdict Rules

- `EXP-1009`
  - `scale`: `>= 500 UV / 7d`
  - `continue`: `100-499 UV / 7d`
  - `kill`: `< 100 UV / 7d`
- `EXP-1013`
  - `scale`: `>= 1000 UV / 7d`
  - `continue`: `200-999 UV / 7d`
  - `kill`: `< 200 UV / 7d`

## Next Action

- Board/user clears the human posting step and returns the live post URLs.
- CMO then resumes the chain, fills the evidence table, and closes with one explicit `scale` / `continue` / `kill` verdict.
