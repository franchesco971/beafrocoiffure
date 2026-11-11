import Link from "next/link";
import { Fragment } from "react";
import { parseLegalText, type Inline } from "@/lib/legal-text";

const LINK_CLASS = "text-gold underline underline-offset-4 transition-colors hover:text-bone";

function Inlines({ parts }: { parts: Inline[] }) {
  return parts.map((part, index) => {
    if (!part.href) return <Fragment key={index}>{part.text}</Fragment>;
    if (part.href.startsWith("/")) {
      return (
        <Link key={index} href={part.href} className={LINK_CLASS}>
          {part.text}
        </Link>
      );
    }
    return (
      <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        {part.text}
      </a>
    );
  });
}

export function LegalText({ source }: { source: string }) {
  return (
    <div className="space-y-5 text-bone-dim">
      {parseLegalText(source).map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2 key={index} className="display !mt-12 text-2xl text-bone md:text-3xl">
              {block.text}
            </h2>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6 marker:text-gold">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inlines parts={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="whitespace-pre-line">
            <Inlines parts={block.inline} />
          </p>
        );
      })}
    </div>
  );
}
