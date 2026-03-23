import { NavLink } from "react-router-dom";

import type { HeadingNode } from "../types";

type SectionTocProps = {
  chapterSlug?: string;
  headings: HeadingNode[];
  activeHeadingId: string | null;
  onNavigate?: () => void;
};

function TocTree({
  chapterSlug,
  headings,
  activeHeadingId,
  onNavigate
}: SectionTocProps) {
  return (
    <ul className="toc-list">
      {headings.map((heading) => (
        <li key={heading.id}>
          <NavLink
            className={heading.id === activeHeadingId ? "toc-link active" : "toc-link"}
            to={`/chapter/${chapterSlug}#${heading.id}`}
            onClick={onNavigate}
          >
            {heading.title}
          </NavLink>
          {heading.children.length > 0 ? (
            <TocTree
              chapterSlug={chapterSlug}
              headings={heading.children}
              activeHeadingId={activeHeadingId}
              onNavigate={onNavigate}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SectionToc({
  chapterSlug,
  headings,
  activeHeadingId,
  onNavigate
}: SectionTocProps) {
  if (!chapterSlug || headings.length === 0) {
    return (
      <div className="toc-empty">
        현재 장의 섹션 목차가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <nav className="section-toc" aria-label="현재 장 섹션 목차">
      <div className="toc-eyebrow">현재 장 목차</div>
      <TocTree
        chapterSlug={chapterSlug}
        headings={headings}
        activeHeadingId={activeHeadingId}
        onNavigate={onNavigate}
      />
    </nav>
  );
}
