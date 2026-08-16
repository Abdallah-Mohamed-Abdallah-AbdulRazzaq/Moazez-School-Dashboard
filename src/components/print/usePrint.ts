"use client";

import type { RefObject } from "react";

interface UsePrintOptions {
  contentRef: RefObject<HTMLElement | null>;
  title: string;
}

function copyDocumentStyles(target: Document) {
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    target.head.appendChild(node.cloneNode(true));
  });
}

/** Prints only the registered document, not the surrounding dashboard. */
export function usePrint({ contentRef, title }: UsePrintOptions) {
  return () => {
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
    printDocument.write("<!doctype html><html><head></head><body></body></html>");
    printDocument.close();
    printDocument.title = title;
    copyDocumentStyles(printDocument);
    printDocument.body.appendChild(source.cloneNode(true));

    const cleanUp = () => window.setTimeout(() => frame.remove(), 0);
    printWindow.addEventListener("afterprint", cleanUp, { once: true });
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 150);
  };
}
