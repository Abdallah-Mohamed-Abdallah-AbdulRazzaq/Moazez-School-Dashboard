# Attachment Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the default file attachments card layout to match a premium WhatsApp/Telegram-style interface. This includes a WhatsApp Web-style rectangular split layout for general documents, and a Large Rich Media Preview block for images and videos.

**Architecture:** Use extension-based CSS classes to color document badges dynamically, fetch media blobs securely via authenticated dynamic API clients, and render custom HTML5 elements for images and videos inside the message bubble.

**Tech Stack:** React, Tailwind CSS, Lucide icons, Vitest, Testing Library.

## Global Constraints
- Keep all props for `AttachmentCard` unchanged (`{ attachment, canDelete, isOwn, labels, onDelete }`).
- Authenticated requests must use the standard `@/lib/api` client.
- Media URLs must be securely loaded as Object URLs and revoked on component unmount to prevent memory leaks.

---

### Task 1: General Document Card Redesign

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/messages/AttachmentCard.tsx`
- Test: `src/features/communication/__tests__/components/AttachmentCard.test.tsx`

**Interfaces:**
- Consumes: `attachment`, `canDelete`, `isOwn`, `labels`, `onDelete` props.
- Produces: WhatsApp Web-style rectangular document attachment card layout.

- [ ] **Step 1: Write a failing unit test for document card styling and badge coloring**
  
  Add a new test inside `src/features/communication/__tests__/components/AttachmentCard.test.tsx`:
  ```typescript
  it("renders document card with correct extension styling and badge colors", async () => {
    const attachment: MessageAttachment = {
      id: "doc-1",
      fileId: "file-doc-1",
      mimeType: "application/pdf",
      name: "report.pdf",
      file: {
        id: "file-doc-1",
        originalName: "report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048000,
        filename: "report.pdf",
        bucket: "moazez-dev",
        objectKey: "report.pdf",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    render(
      <AttachmentCard
        attachment={attachment}
        canDelete={true}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    // Assert file name is displayed
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    // Assert formatted size and type details are shown
    expect(screen.getByText(/1.95 MB • PDF/)).toBeInTheDocument();
    // Assert badge is colored red for PDF
    const badge = screen.getByText("PDF").parentElement;
    expect(badge).toHaveClass("bg-red-500");
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  
  Run: `npx vitest run src/features/communication/__tests__/components/AttachmentCard.test.tsx`
  Expected: FAIL (assertion `getByText(/1.95 MB • PDF/)` or class `bg-red-500` not found/failed).

- [ ] **Step 3: Implement WhatsApp Web-style document card and extension color mapping**
  
  Update the fallback render block of `src/features/communication/conversations_redesign/components/messages/AttachmentCard.tsx`:
  ```typescript
  // Extension badge background color helper
  const getBadgeConfig = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const nameUpper = ext.toUpperCase();
    if (ext === "pdf") {
      return { bg: "bg-red-500", text: "PDF" };
    }
    if (["doc", "docx", "txt", "rtf"].includes(ext)) {
      return { bg: "bg-blue-500", text: nameUpper };
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
      return { bg: "bg-emerald-500", text: nameUpper };
    }
    if (["ppt", "pptx"].includes(ext)) {
      return { bg: "bg-amber-600", text: nameUpper };
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
      return { bg: "bg-orange-500", text: nameUpper };
    }
    if (["png", "jpg", "jpeg", "gif", "webp", "svg", "mp4", "mov"].includes(ext)) {
      return { bg: "bg-indigo-500", text: nameUpper };
    }
    return { bg: "bg-slate-500", text: nameUpper || "FILE" };
  };

  const badgeConfig = getBadgeConfig(name);
  const extLabel = badgeConfig.text;
  const docDetails = `${size}${extLabel ? ` • ${extLabel}` : ""}`;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border w-full max-w-[280px] sm:max-w-[320px] mb-1.5 transition-all shadow-sm ${
        isOwn
          ? "bg-white/10 border-white/10 text-white"
          : "bg-white border-slate-100 text-slate-800"
      }`}
    >
      <div
        className={`h-10 w-9 rounded shrink-0 flex flex-col items-center justify-between py-1 relative select-none shadow-sm ${badgeConfig.bg}`}
      >
        <FileText className="h-4 w-4 text-white mt-0.5" />
        <span className="text-[8px] uppercase font-extrabold tracking-wider text-white mt-auto leading-none mb-0.5">
          {extLabel}
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <span className="block truncate text-[13px] font-semibold">{name}</span>
        {size ? (
          <span
            className={`block text-[10.5px] font-medium mt-0.5 ${
              isOwn ? "text-white/70" : "text-slate-500"
            }`}
          >
            {docDetails}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {fileId ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleDownload();
            }}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition active:scale-90 ${
              isOwn
                ? "text-white/80 hover:bg-white/10"
                : "text-primary hover:bg-slate-100"
            }`}
            aria-label="Download"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            onClick={(event) => void handleDelete(event)}
            disabled={isDeleting}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition active:scale-90 ${
              isOwn
                ? "text-white/75 hover:bg-white/10"
                : "text-rose-600 hover:bg-rose-50"
            }`}
            aria-label={labels.deleteAttachmentConfirm}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
  ```

- [ ] **Step 4: Run test to verify it passes**
  
  Run: `npx vitest run src/features/communication/__tests__/components/AttachmentCard.test.tsx`
  Expected: PASS.

- [ ] **Step 5: Commit**
  
  Run:
  ```bash
  git add src/features/communication/conversations_redesign/components/messages/AttachmentCard.tsx src/features/communication/__tests__/components/AttachmentCard.test.tsx
  git commit -m "feat(communication): redesign general file attachment card to match WhatsApp style"
  ```

---

### Task 2: Image and Video Rich Media Previews

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/messages/AttachmentCard.tsx`
- Test: `src/features/communication/__tests__/components/AttachmentCard.test.tsx`

**Interfaces:**
- Consumes: `apiClient` dynamic fetches, S3 file URLs.
- Produces: Image and video inline preview cards inside bubbles.

- [ ] **Step 1: Write failing unit tests for Image and Video media previews**
  
  Add tests inside `src/features/communication/__tests__/components/AttachmentCard.test.tsx`:
  ```typescript
  it("renders image preview and loads Object URL securely", async () => {
    const attachment: MessageAttachment = {
      id: "img-1",
      fileId: "file-img-1",
      mimeType: "image/png",
      name: "avatar.png",
      file: {
        id: "file-img-1",
        originalName: "avatar.png",
        mimeType: "image/png",
        sizeBytes: 102400,
        filename: "avatar.png",
        bucket: "moazez-dev",
        objectKey: "avatar.png",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const { apiClient } = await import("@/lib/api");
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob([new Uint8Array(100)]),
      headers: { "content-type": "image/png" },
    });

    const { container } = render(
      <AttachmentCard
        attachment={attachment}
        canDelete={true}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const imageElement = await screen.findByRole("img", { name: "avatar.png" });
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute("src", "blob:mock-url");
  });

  it("renders video preview with playback controls", async () => {
    const attachment: MessageAttachment = {
      id: "vid-1",
      fileId: "file-vid-1",
      mimeType: "video/mp4",
      name: "demo.mp4",
      file: {
        id: "file-vid-1",
        originalName: "demo.mp4",
        mimeType: "video/mp4",
        sizeBytes: 10240000,
        filename: "demo.mp4",
        bucket: "moazez-dev",
        objectKey: "demo.mp4",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const { apiClient } = await import("@/lib/api");
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob([new Uint8Array(100)]),
      headers: { "content-type": "video/mp4" },
    });

    const { container } = render(
      <AttachmentCard
        attachment={attachment}
        canDelete={true}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const videoElement = await screen.findByTestId("video-element");
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute("controls");
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  
  Run: `npx vitest run src/features/communication/__tests__/components/AttachmentCard.test.tsx`
  Expected: FAIL (assertion finding `img` or `video-element` fails).

- [ ] **Step 3: Implement image and video state loading and rendering**
  
  Modify `src/features/communication/conversations_redesign/components/messages/AttachmentCard.tsx` to handle `isImage` and `isVideo` loading and previews:
  - Add checks:
    ```typescript
    const isImage = Boolean(
      mimeType?.startsWith("image/") ||
      name.toLowerCase().endsWith(".png") ||
      name.toLowerCase().endsWith(".jpg") ||
      name.toLowerCase().endsWith(".jpeg") ||
      name.toLowerCase().endsWith(".gif") ||
      name.toLowerCase().endsWith(".webp") ||
      name.toLowerCase().endsWith(".svg")
    );
    const isVideo = Boolean(
      mimeType?.startsWith("video/") ||
      name.toLowerCase().endsWith(".mp4") ||
      name.toLowerCase().endsWith(".mov") ||
      name.toLowerCase().endsWith(".webm") ||
      name.toLowerCase().endsWith(".ogg")
    );
    const isMedia = isAudio || isImage || isVideo;
    ```
  - In `useEffect`, load media for `isMedia`:
    ```typescript
    useEffect(() => {
      if (!isMedia || !fileId) return;

      let objectUrl: string | null = null;
      
      async function loadMedia() {
        setLoading(true);
        setError(false);
        try {
          const { apiClient } = await import("@/lib/api");
          const response = await apiClient.get(`/files/${fileId}/download`, {
            responseType: "blob",
          });
          const blob = response.data instanceof Blob ? response.data : new Blob([response.data as BlobPart], { type: response.headers["content-type"] as string });
          objectUrl = URL.createObjectURL(blob);
          setAudioUrl(objectUrl); // We can keep audioUrl state or rename it to mediaUrl

          if (isAudio) {
            // Web Audio API Peak analysis
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (typeof AudioContextClass !== "undefined") {
              const arrayBuffer = await blob.arrayBuffer();
              const audioCtx = new AudioContextClass();
              try {
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const channelData = audioBuffer.getChannelData(0);
                const barCount = 28;
                const chunkSize = Math.floor(channelData.length / barCount);
                const calculatedPeaks: number[] = [];

                for (let i = 0; i < barCount; i++) {
                  const start = i * chunkSize;
                  const end = start + chunkSize;
                  let max = 0;
                  for (let j = start; j < end; j++) {
                    const val = Math.abs(channelData[j]);
                    if (val > max) max = val;
                  }
                  const heightPercent = Math.round(15 + max * 85);
                  calculatedPeaks.push(heightPercent);
                }
                setPeaks(calculatedPeaks);
              } catch (decodeErr) {
                console.error("decodeAudioData failed, using fallback peaks:", decodeErr);
                setPeaks([25, 40, 15, 60, 80, 45, 30, 70, 90, 50, 20, 35, 65, 85, 40, 30, 55, 75, 45, 25, 60, 80, 50, 30, 45, 65, 20, 15]);
              } finally {
                await audioCtx.close();
              }
            } else {
              setPeaks([25, 40, 15, 60, 80, 45, 30, 70, 90, 50, 20, 35, 65, 85, 40, 30, 55, 75, 45, 25, 60, 80, 50, 30, 45, 65, 20, 15]);
            }
          }
        } catch (err) {
          console.error("Failed to load media attachment:", err);
          setError(true);
        } finally {
          setLoading(false);
        }
      }

      void loadMedia();

      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    }, [fileId, isMedia]);
    ```
    *(Note: let's rename the local hook state `audioUrl` to `mediaUrl` or keep it as `audioUrl` inside `AttachmentCard.tsx` to maintain minimal modifications, but rename is cleaner. Let's keep it named `mediaUrl` for clarity. Let's rename all references to `audioUrl` state inside `AttachmentCard.tsx` to `mediaUrl` to maintain good code style).*
  - Render Image Block:
    ```typescript
    if (isImage && fileId) {
      if (loading) {
        return (
          <div className="flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl w-[240px] sm:w-[280px] h-[200px] animate-pulse">
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
          </div>
        );
      }
      if (error) {
        return (
          <div className="flex flex-col gap-1 items-center justify-center bg-rose-50/50 border border-rose-100 rounded-2xl w-[240px] sm:w-[280px] h-[160px] text-rose-600 text-xs">
            <span>Failed to load image</span>
          </div>
        );
      }
      return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-slate-50/50 max-w-[240px] sm:max-w-[280px] max-h-[240px] sm:max-h-[280px] flex items-center justify-center group cursor-pointer">
          <img
            src={mediaUrl || href}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            alt={name}
            onClick={() => window.open(mediaUrl || href, "_blank")}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleDownload();
              }}
              className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-all duration-200 active:scale-90"
              aria-label="Download"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(e);
                }}
                className="h-9 w-9 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-sm transition-all duration-200 active:scale-90"
                aria-label={labels.deleteAttachmentConfirm}
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      );
    }
    ```
  - Render Video Block:
    ```typescript
    if (isVideo && fileId) {
      if (loading) {
        return (
          <div className="flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl w-[240px] sm:w-[280px] h-[200px] animate-pulse">
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
          </div>
        );
      }
      if (error) {
        return (
          <div className="flex flex-col gap-1 items-center justify-center bg-rose-50/50 border border-rose-100 rounded-2xl w-[240px] sm:w-[280px] h-[160px] text-rose-600 text-xs">
            <span>Failed to load video</span>
          </div>
        );
      }
      return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-slate-50/50 max-w-[240px] sm:max-w-[280px] max-h-[240px] sm:max-h-[280px] flex items-center justify-center group">
          <video
            data-testid="video-element"
            src={mediaUrl || href}
            controls
            className="w-full h-full object-cover rounded-2xl"
          />
          {canDelete && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(e);
                }}
                className="h-8 w-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md active:scale-90"
                aria-label={labels.deleteAttachmentConfirm}
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>
      );
    }
    ```

- [ ] **Step 4: Run tests to verify they pass**
  
  Run: `npx vitest run src/features/communication/__tests__/components/AttachmentCard.test.tsx`
  Expected: PASS.

- [ ] **Step 5: Commit**
  
  Run:
  ```bash
  git add src/features/communication/conversations_redesign/components/messages/AttachmentCard.tsx src/features/communication/__tests__/components/AttachmentCard.test.tsx
  git commit -m "feat(communication): implement large rich media preview for image and video attachments"
  ```

---

### Task 3: Complete Suite Verification & Regression Testing

**Files:**
- Test: `src/features/communication`

**Interfaces:**
- Consumes: All tests in communication domain.
- Produces: Green verification status.

- [ ] **Step 1: Run all unit and property tests in communication domain**
  
  Run: `npx vitest run src/features/communication`
  Expected: PASS (All 232 tests pass).

- [ ] **Step 2: Commit plan completion**
  
  Run:
  ```bash
  git status
  ```
