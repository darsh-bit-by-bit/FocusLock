# FocusLock

> A commitment-based Chrome extension built to enforce focus by separating decision-making from enforcement.

---

## What this is

FocusLock is a Chrome extension I built because I kept messing up while studying online. Distractions were always just one tab away, and half the time I didn’t even realise I was opening them. I tried fixing this using different blockers and extensions, but none of them really worked for me long term.

Most tools I tried were either session-based or time-based. They would block sites for some time or give daily limits, but the problem was that I could always reset them or just turn them off when I felt tempted. So even though the tools existed, they still depended on me behaving well *in the moment* — which is exactly when I don’t.

That’s where FocusLock comes in.

---

## The core idea

The idea behind FocusLock is simple: instead of trusting my willpower later, I trust my decision **now**. I pick a future date till which distracting websites are blocked, and once that lock is set, it’s enforced strictly. During the lock period, I only get two emergency overrides, each lasting 15 minutes. No constant negotiation with myself, no “just five more minutes”.

Instagram and Reddit are easy cases — they’re almost entirely distracting for me, so I block them completely.

YouTube is different. It has a lot of genuinely useful content, so blocking it entirely felt like throwing away value. But at the same time, YouTube is also one of the biggest distraction machines out there. So instead of blocking YouTube, I decided to *change how it behaves*.

When FocusLock is active, YouTube loses all the stuff that pulls you in mindlessly: homepage thumbnails, Shorts, recommendations, comments, autoplay — all of it. Search still works, channels still work, and videos play normally **only when you explicitly click one**. This turns YouTube into something you use intentionally, not something you scroll through.

---

## How it works (high level)

The extension is split into a few parts, and each one has a very clear job.

- **`manifest.json`** is basically the rulebook. It tells Chrome which websites the extension should care about and which scripts should run where. Nothing fancy, but everything depends on this being correct.

- **`popup.html`** and **`popup.js`** are what run when I click the extension icon. These are only for decision-making. The popup lets me set the lock date, see whether I’m locked, and use an override if I really need one. Once that decision is made, the popup closes and disappears. It doesn’t block anything itself.

- **`chrome.storage.local`** is the memory of the system. All the important stuff — lock end date, override usage, override timing — lives here. This is what every other part of the extension trusts. Even if I close tabs, restart Chrome, or never open the popup again, the rules stay.

- **`block.js`** is responsible for Instagram and Reddit. Whenever one of these sites loads, this script runs immediately, checks storage, and decides whether the site should load or stay blocked. If I’m locked and not overriding, the page never loads.

- **`youtube.js`** handles YouTube. Instead of blocking access, it modifies the page when a lock is active. It removes recommendation-based elements and only allows media playback on pages that require explicit intent (actual video watch pages). This keeps YouTube usable without letting it become a distraction trap.

Everything talks through storage. No file directly controls another one. That separation is intentional.

---

## Trade-offs and future ideas

This MVP is intentionally strict. I didn’t try to make it smart or flexible — I tried to make it **work**. I avoided using AI in this version because it would have added complexity, bugs, and planning overhead without improving the core idea. The goal was to enforce commitment reliably, not to build a fancy productivity platform.

Because of that, YouTube restrictions in the MVP are blunt rather than intelligent. Shorts don’t appear, recommendations are gone, and autoplay-based content is disabled completely during a lock.

In a future version, I’d like to handle YouTube in a better way. AI-based filtering could be used to distinguish between productive and distracting content based on user intent, instead of treating everything the same. I also see this evolving into a broader student-focused system with productivity tracking and app-level blocking. But those ideas were intentionally left out of the MVP — this version is about discipline and reliability first, not feature completeness.

---

## And honestly

This project wasn’t about building the “perfect” blocker.  
It was about building something I’d actually listen to when my brain wants to procrastinate.

And for me, this works.
