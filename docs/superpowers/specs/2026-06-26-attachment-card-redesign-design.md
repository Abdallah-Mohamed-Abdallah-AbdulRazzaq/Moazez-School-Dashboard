# Attachment Card Redesign Specification (WhatsApp/Telegram-Style)

We are redesigning the default file attachment card layout in the redesigned conversations panel to match a premium WhatsApp/Telegram-style interface. This includes a WhatsApp Web-style rectangular layout for general documents, and a Large Rich Media Preview block for images and videos.

---

## 1. User Interface & Layout Design

The redesigned file attachment card will render differently depending on the type of attachment (Audio, Rich Media, or General Document).

### 1.1 Audio Attachments (Waveform Player)
- Already implemented as a WhatsApp/Telegram waveform player with peak downsampling, timeline seeking, playback speed control, and auto-pause synchronization.

### 1.2 Rich Media Attachments (Images & Videos)
If the file is an image or video, it will render as a large, beautiful media block with rounded corners:
- **Natural bounding:** Constrained to `max-w-[240px] sm:max-w-[280px]` and `max-h-[240px] sm:max-h-[280px]`.
- **Aesthetic wrapper:** Features soft borders (`border border-slate-200/50`) and background placeholders.
- **Images:**
  - Shows the image using `object-cover w-full h-full rounded-2xl`.
  - On hover, shows a dark semi-transparent overlay containing circular action buttons (download, delete) with smooth fade-in and scale transitions.
  - Clicking the image opens the media in a new tab.
- **Videos:**
  - Renders an HTML5 `<video>` player with inline playback controls (`controls`).
  - If `canDelete` is true, displays a floating circular delete button in the top-right corner on hover.

### 1.3 General Document Attachments (WhatsApp Web-Style Card)
For all other non-media attachments (PDFs, spreadsheets, text files, compressed archives, etc.):
- **Container:** `flex items-center gap-3 p-3 rounded-xl border w-full max-w-[280px] sm:max-w-[320px] mb-1.5 transition-all shadow-sm`.
- **Backgrounds:**
  - *Own Bubble (`isOwn = true`):* Semi-transparent white (`bg-white/10 border-white/10`).
  - *Other's Bubble (`isOwn = false`):* Light slate card (`bg-white border-slate-100` or `bg-slate-50 border-slate-200/60`).
- **Left Side (File Type Badge):**
  - A compact file-type container (`h-10 w-9 rounded shrink-0 flex flex-col items-center justify-between py-1 relative select-none shadow-sm`).
  - Background color is mapped based on the file extension (red for PDF, green for Excel, blue for Word, orange for PowerPoint, yellow for ZIP, neutral slate for others).
  - Shows a document lines icon at the top and the capitalized extension name (e.g., `PDF`, `ZIP`) in tiny bold letters at the bottom.
- **Center (Metadata):**
  - File name: Truncated bold text (`text-[13px] font-semibold truncate`).
  - Sub-details: File size and capitalized type, e.g., `1.4 MB • PDF` (`text-[10.5px] font-medium opacity-80 mt-0.5`).
- **Right Side (Actions):**
  - A clean circular download button (`h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-200/60 transition active:scale-90`).
  - A circular trash/delete button if `canDelete` is true.

---

## 2. Component Specifications

### 2.1 File Type Badge Color Mapping
- **PDF (`.pdf`):** Crimson/Red theme (`bg-red-500` / own bubble: `bg-red-600/30 text-red-200`)
- **Word/Text (`.doc`, `.docx`, `.txt`, `.rtf`):** Blue theme (`bg-blue-500` / own bubble: `bg-blue-600/30 text-blue-200`)
- **Excel/Sheets (`.xls`, `.xlsx`, `.csv`):** Green theme (`bg-emerald-500` / own bubble: `bg-emerald-600/30 text-emerald-200`)
- **PowerPoint/Slides (`.ppt`, `.pptx`):** Orange theme (`bg-amber-600` / own bubble: `bg-amber-600/30 text-amber-200`)
- **Compressed (`.zip`, `.rar`, `.7z`, `.tar`, `.gz`):** Amber/Yellow theme (`bg-orange-500` / own bubble: `bg-orange-600/30 text-orange-200`)
- **Images/Videos (`.png`, `.jpg`, `.jpeg`, `.gif`, `.mp4`, `.mov`, `.avi`):** Violet/Indigo theme (`bg-indigo-500` / own bubble: `bg-indigo-600/30 text-indigo-200`)
- **Generic/Other:** Neutral Slate theme (`bg-slate-500` / own bubble: `bg-slate-600/30 text-slate-300`)

---

## 3. Testing & Verification Plan

### 3.1 Unit Testing (`AttachmentCard.test.tsx`)
We will add new unit tests to assert the following behaviors:
1. Renders correct class names and backgrounds for own bubble vs others' bubbles.
2. Correctly parses file extensions and matches the appropriate badge background theme.
3. Renders the uppercase file extension text in the badge overlay (e.g. `PDF` for PDF files).
4. Verifies clicking the download button calls the download handler.
5. Verifies clicking the delete button opens the confirmation prompt and triggers deletion.
6. Renders `<img>` element for image attachments and verifies local Object URL loading.
7. Renders `<video>` element for video attachments and verifies controls are present.

### 3.2 Regression Testing
- Run all communication feature tests (`npx vitest run src/features/communication`) to ensure zero regressions.
