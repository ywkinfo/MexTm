import { NavLink } from "react-router-dom";

import type { Chapter, HeadingNode } from "../types";

type SidebarNavProps = {
  chapters: Chapter[];
  currentChapterSlug?: string;
  onNavigate?: () => void;
};

function NestedHeadingList({
  headings,
  chapterSlug,
  onNavigate
}: {
  headings: HeadingNode[];
  chapterSlug: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="sidebar-sublist">
      {headings.map((heading) => (
        <li key={heading.id}>
          <NavLink
            className="sidebar-subitem"
            to={`/chapter/${chapterSlug}#${heading.id}`}
            onClick={onNavigate}
          >
            {heading.title}
          </NavLink>
          {heading.children.length > 0 ? (
            <NestedHeadingList
              headings={heading.children}
              chapterSlug={chapterSlug}
              onNavigate={onNavigate}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SidebarNav({
  chapters,
  currentChapterSlug,
  onNavigate
}: SidebarNavProps) {
  return (
    <nav className="sidebar-nav" aria-label="전체 문서 목차">
      <div className="sidebar-eyebrow">문서 구조</div>
      <ul className="sidebar-list">
        {chapters.map((chapter) => {
          const isActive = chapter.slug === currentChapterSlug;

          return (
            <li key={chapter.slug} className="sidebar-item">
              <NavLink
                to={`/chapter/${chapter.slug}`}
                className={({ isActive: routeActive }) =>
                  routeActive || isActive ? "sidebar-link active" : "sidebar-link"
                }
                onClick={onNavigate}
              >
                {chapter.title}
              </NavLink>
              {isActive && chapter.headings.length > 0 ? (
                <NestedHeadingList
                  headings={chapter.headings}
                  chapterSlug={chapter.slug}
                  onNavigate={onNavigate}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
