# Voice Note Waveform Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace native browser audio controls with a custom, premium WhatsApp/Telegram-style waveform player with speed control and auto-pause behavior.

**Architecture:** Use the browser's Web Audio API (`AudioContext`) to decode loaded audio binary array buffer and downsample it to 28 peak amplitude heights for custom waveform rendering, utilizing standard HTML5 `<audio>` for lightweight playback.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide icons, HTML5 Audio API, Web Audio API.

## Global Constraints
- Target browser compatibility: modern Chrome, Safari, Firefox.
- Must handle AudioContext closure immediately after decoding to prevent browser context exhaustion.
- Must gracefully fallback to mock peak heights if Web Audio decoding throws an error.
- Responsive design constraints: fit within message bubble max-width.

---

### Task 1: Web Audio Peak Extraction
Decodes the fetched audio Blob's `ArrayBuffer` and downsamples it into a 28-value peak amplitude array.

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/messages/AttachmentCard.tsx`
- Create: `src/features/communication/__tests__/components/AttachmentCard.test.tsx`

**Interfaces:**
- Consumes: `apiClient` from `@/lib/api`
- Produces: `peaks` array of normalized numbers (15 to 100) representing vertical waveform heights

- [ ] **Step 1: Write a unit test for peak downsampling fallback**
  Write a test in `AttachmentCard.test.tsx` verifying that when a corrupt array buffer or error is encountered during decoding, `AttachmentCard` falls back to render a mock waveform instead of crashing.
- [ ] **Step 2: Run the test to verify it fails**
  `npx vitest run src/features/communication/__tests__/components/AttachmentCard.test.tsx`
- [ ] **Step 3: Implement the Web Audio decoding and normalization logic**
  Convert the downloaded audio blob to an `ArrayBuffer`, run it through a temp `AudioContext.decodeAudioData`, calculate max amplitudes for 28 chunk divisions, normalise them, and call `audioCtx.close()` in the `finally` block.
- [ ] **Step 4: Run the test to verify it passes**
- [ ] **Step 5: Commit changes**
  `git commit -m "feat(communication): implement Web Audio decoding and peak extraction for waveforms"`

---

### Task 2: Custom Playback, Waveform Seek & Speed Controls
Build the custom Play/Pause control state, interactive SVG waveform timeline, and cyclic speed button.

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/messages/AttachmentCard.tsx`
- Modify: `src/features/communication/__tests__/components/AttachmentCard.test.tsx`

**Interfaces:**
- Consumes: `peaks` array state from Task 1, standard HTML5 `<audio>` ref
- Produces: Custom audio UI rendering play/pause buttons, seek-on-click waveform, speed control cycle (1x -> 1.5x -> 2x)

- [ ] **Step 1: Write a test verifying that speed control toggle updates playbackRate**
  Add a test checking that clicking the speed control badge correctly cycles the speed state and sets `audio.playbackRate` accordingly.
- [ ] **Step 2: Run the test to verify it fails**
- [ ] **Step 3: Implement playback rate cycling, elapsed duration math, and seek click handlers**
  Listen to `timeupdate` and `loadedmetadata` on the hidden `<audio>` element to update current time/duration. Map peak percentages to colored waveform vertical bar elements.
- [ ] **Step 4: Run the tests to verify they pass**
- [ ] **Step 5: Commit changes**
  `git commit -m "feat(communication): build custom waveform timeline seeking and speed controls"`

---

### Task 3: Single Playback Synchronization
Add event-driven listeners to ensure that only one voice note plays at any given time.

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/messages/AttachmentCard.tsx`
- Modify: `src/features/communication/__tests__/components/AttachmentCard.test.tsx`

**Interfaces:**
- Consumes: Custom window event `voice-play`
- Produces: Decoupled auto-pause mechanism on all playing audios except the newly active one

- [ ] **Step 1: Write a test for single playback synchronization**
  Add a test that mounts two separate `AttachmentCard` players, starts playing the first, starts playing the second, and asserts that the first one is automatically paused.
- [ ] **Step 2: Run the test to verify it fails**
- [ ] **Step 3: Implement the voice-play window event dispatcher and listener**
  Add `window.dispatchEvent` when starting playback, and setup a `window.addEventListener("voice-play")` hook in each player to pause when receiving events with other file IDs.
- [ ] **Step 4: Run all communication tests to verify full suite passes**
  `npx vitest run src/features/communication`
- [ ] **Step 5: Commit changes**
  `git commit -m "feat(communication): synchronize active voice players using global event listener"`
