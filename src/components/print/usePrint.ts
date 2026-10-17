"use client";

import type { RefObject } from "react";

interface UsePrintOptions {
  contentRef: RefObject<HTMLElement | null>;
  title: string;
}

function copyDocumentStyles(target: Document): Promise<void[]> {
  return Promise.all(
    Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(
      (node) => {
        const copy = node.cloneNode(true) as HTMLElement;
        const loaded =
          copy.tagName === "LINK"
            ? new Promise<void>((resolve) => {
                copy.addEventListener("load", () => resolve(), { once: true });
                copy.addEventListener("error", () => resolve(), { once: true });
              })
            : Promise.resolve();
        target.head.appendChild(copy);
        return loaded;
      },
    ),
  );
}

async function waitForPrintImages(target: Document) {
  await Promise.all(
    Array.from(target.images).map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
}

/** Prints only the registered document, not the surrounding dashboard. */
export function usePrint({ contentRef, title }: UsePrintOptions) {
  return async () => {
    const source = contentRef.current;
    if (!source) return;

    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.className = "print-frame";
    document.body.appendChild(frame);

    const printWindow = frame.contentWindow;
    const printDocument = printWindow?.document;
    if (!printWindow || !printDocument) {
      frame.remove();
      return;
    }

    printDocument.open();
    printDocument.write(
      "<!doctype html><html><head></head><body></body></html>",
    );
    printDocument.close();
    printDocument.title = title;
    printDocument.documentElement.lang =
      source.lang || document.documentElement.lang;
    printDocument.documentElement.dir =
      source.dir || document.documentElement.dir;
    printDocument.body.className = document.body.className;
    const base = printDocument.createElement("base");
    base.href = document.baseURI;
    printDocument.head.appendChild(base);
    const stylesReady = copyDocumentStyles(printDocument);
    printDocument.body.appendChild(source.cloneNode(true));

    const cleanUp = () => window.setTimeout(() => frame.remove(), 0);
    printWindow.addEventListener("afterprint", cleanUp, { once: true });
    try {
      await stylesReady;
      await Promise.all([
        printDocument.fonts?.ready,
        waitForPrintImages(printDocument),
      ]);
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      frame.remove();
      throw error;
    }
  };
}
