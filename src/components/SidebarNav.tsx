import { NavLink } from "react-router-dom";

import type { Chapter } from "../types";

type SidebarNavProps = {
  chapters: Chapter[];
  currentChapterSlug?: string;
  onNavigate?: () => void;
};

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
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
