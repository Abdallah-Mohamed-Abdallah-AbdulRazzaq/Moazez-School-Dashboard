// FILE: src/components/admissions/HighlightText.tsx

interface HighlightTextProps {
  text: string;
  highlight: string;
}

export default function HighlightText({ text, highlight }: HighlightTextProps) {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(
    `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 text-gray-900 font-semibold px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}
