import type { AnchorHTMLAttributes } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import styles from "./RichTextContent.module.css";

export interface RichTextContentProps {
  value: string;
  className?: string;
}

const richTextSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u"],
};

function SafeLink({ children, href, title }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export default function RichTextContent({
  value,
  className = "",
}: RichTextContentProps) {
  return (
    <div className={`${styles.richText} ${className}`}>
      <Markdown
        rehypePlugins={[rehypeRaw, [rehypeSanitize, richTextSanitizeSchema]]}
        components={{ a: SafeLink, img: () => null }}
      >
        {value}
      </Markdown>
    </div>
  );
}
