# Heart Garden First Version Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable local Heart Garden web app where a user can plant a flower entry, see it in a garden, browse specimen cards, and copy a share card.

**Architecture:** Use a dependency-free static web app. Keep domain behavior in a pure ES module with Node tests, and keep browser rendering/event wiring in a separate app module. Store entries in browser `localStorage`.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node.js built-in test runner.

## Global Constraints

- Default data storage is local to the current browser and device.
- No account, login, cloud sync, social feed, comments, likes, reminders, streaks, rankings, badges, or AI analysis.
- First screen is the actual garden, not a landing page.
- First version supports writing, flower growth, specimen review, tag filtering, and one-flower share card copy/preview.
- Tone is quiet, intimate, mature, and not childish.
- Tests use `node --test`; no npm dependency install is required.

---

## File Structure

- `package.json`: scripts for tests and local serving.
- `index.html`: static app shell and semantic containers.
- `src/styles.css`: responsive visual design, garden, flowers, cards, modal, share preview.
- `src/heartGarden.js`: pure domain logic for moods, entry creation, validation, storage serialization, filtering, layout, and share text.
- `src/app.js`: browser state management, DOM rendering, event handlers, localStorage integration.
- `tests/heartGarden.test.js`: Node tests for domain behavior.
- `README.md`: short local run instructions.

---

### Task 1: Domain Model And Tests

**Files:**
- Create: `package.json`
- Create: `src/heartGarden.js`
- Create: `tests/heartGarden.test.js`

**Interfaces:**
- Produces: `MOODS`, `createEntry(input, now)`, `validateEntry(input)`, `normalizeTags(raw)`, `filterEntriesByTag(entries, tag)`, `getFlowerStyle(entry, index)`, `serializeEntries(entries)`, `parseEntries(raw)`, `buildShareText(entry)`.

- [ ] **Step 1: Write failing tests for model behavior**

Create tests that assert valid entries are normalized, invalid entries report missing fields, tags are parsed, entries can be serialized and parsed, tag filtering works, flower style is deterministic, and share text contains only one flower's content.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`

Expected: FAIL because `src/heartGarden.js` does not exist yet.

- [ ] **Step 3: Implement minimal domain module**

Implement the exported functions in `src/heartGarden.js` with no browser dependencies.

- [ ] **Step 4: Run tests and verify pass**

Run: `npm test`

Expected: PASS for all domain tests.

---

### Task 2: Static App Shell And Browser Wiring

**Files:**
- Create: `index.html`
- Create: `src/app.js`
- Create: `src/styles.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: all exports from `src/heartGarden.js`.
- Produces: a browser app with garden/specimen tabs, entry modal, localStorage persistence, and share preview.

- [ ] **Step 1: Add app shell**

Create semantic containers for the app header, tabs, garden view, specimen book, editor modal, detail modal, and share preview area.

- [ ] **Step 2: Implement browser state and rendering**

Wire `src/app.js` to load entries from `localStorage`, render garden flowers, render specimen cards, filter by tag, validate and save the editor form, and copy share text.

- [ ] **Step 3: Style the first version**

Create a calm responsive interface with the garden as the first screen, abstract CSS flowers, readable specimen cards, compact controls, and mobile-safe layout.

- [ ] **Step 4: Run domain tests**

Run: `npm test`

Expected: PASS.

---

### Task 3: Manual Verification And Polish

**Files:**
- Modify as needed: `index.html`, `src/app.js`, `src/styles.css`, `README.md`

**Interfaces:**
- Consumes: completed static app.
- Produces: verified first-version experience.

- [ ] **Step 1: Start local server**

Run: `npm run dev`

Expected: local server serves the app.

- [ ] **Step 2: Verify core flows**

In a browser, verify creating a flower, seeing it in the garden, opening details, viewing it in specimen book, filtering by tag, copying share card text, and persistence after reload.

- [ ] **Step 3: Verify responsive layout**

Check desktop and mobile widths for text overlap, visible controls, and usable modal layout.

- [ ] **Step 4: Run final automated tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit implementation**

Commit the app after verification.
