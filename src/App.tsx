import { useEffect, useState } from "react";
import {
  HashRouter,
  matchPath,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";

import { documentData } from "./content";
import { MarkdownArticle } from "./components/MarkdownArticle";
import { SearchPanel } from "./components/SearchPanel";
import { SectionToc } from "./components/SectionToc";
import { SidebarNav } from "./components/SidebarNav";
import { useActiveHeading } from "./hooks/useActiveHeading";
import { flattenHeadings } from "./lib/outline";
import type { Chapter } from "./types";

const chapters = documentData.chapters;
const chapterMap = new Map(chapters.map((chapter) => [chapter.slug, chapter]));

function decodeRouteSegment(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function ReaderShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const chapterMatch = matchPath("/chapter/:chapterSlug", location.pathname);
  const currentChapterSlug = decodeRouteSegment(chapterMatch?.params.chapterSlug);
  const currentChapter = currentChapterSlug ? chapterMap.get(currentChapterSlug) : undefined;
  const hasActiveToc = Boolean(currentChapter && currentChapter.headings.length > 0);

  const headingIds = flattenHeadings(currentChapter?.headings ?? []).map((heading) => heading.id);
  const activeHeadingId = useActiveHeading(headingIds);

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);

  useEffect(() => {
    setIsNavOpen(false);
    setIsTocOpen(false);
  }, [location.pathname, location.hash]);

  const navigateToSection = (chapterSlug: string, sectionId?: string) => {
    navigate({
      pathname: `/chapter/${chapterSlug}`,
      hash: sectionId ? `#${sectionId}` : ""
    });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="topbar-kicker">Local Reader</span>
          <NavLink className="brand-link" to="/">
            {documentData.meta.title}
          </NavLink>
        </div>
        <div className="topbar-actions">
          <button
            className="topbar-button mobile-only"
            type="button"
            onClick={() => setIsNavOpen((open) => !open)}
          >
            목차
          </button>
          <SearchPanel onNavigate={navigateToSection} />
          {hasActiveToc ? (
            <button
              className="topbar-button mobile-only"
              type="button"
              onClick={() => setIsTocOpen((open) => !open)}
            >
              섹션
            </button>
          ) : null}
        </div>
      </header>

      <div className={`reader-layout ${hasActiveToc ? "has-toc" : "no-toc"}`}>
        <aside className={`left-rail ${isNavOpen ? "open" : ""}`}>
          <SidebarNav
            chapters={chapters}
            currentChapterSlug={currentChapterSlug}
            onNavigate={() => setIsNavOpen(false)}
          />
        </aside>

        <main className="content-pane">
          <Outlet />
        </main>

        {hasActiveToc ? (
          <aside className={`right-rail ${isTocOpen ? "open" : ""}`}>
            <SectionToc
              chapterSlug={currentChapter?.slug}
              headings={currentChapter?.headings ?? []}
              activeHeadingId={activeHeadingId}
              onNavigate={() => setIsTocOpen(false)}
            />
          </aside>
        ) : null}
      </div>

      {(isNavOpen || isTocOpen) && (
        <button
          className="mobile-scrim"
          type="button"
          aria-label="열린 패널 닫기"
          onClick={() => {
            setIsNavOpen(false);
            setIsTocOpen(false);
          }}
        />
      )}
    </div>
  );
}

function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-card">
        <p className="hero-kicker">문서 소개</p>
        <h1>{documentData.meta.title}</h1>
        <p className="hero-summary">
          마스터 원고를 기반으로 장별 탐색, 섹션 점프, 전문 검색을 지원하는 로컬
          문서 리더입니다. 좌측 목차로 전체 구조를 훑고, 상단 검색으로 필요한
          실무 포인트를 바로 찾을 수 있습니다.
        </p>
        <div className="hero-meta">
          <span>장 수 {documentData.meta.chapterCount}개</span>
          <span>빌드 시각 {new Date(documentData.meta.builtAt).toLocaleString("ko-KR")}</span>
        </div>
      </section>

      <section className="chapter-grid">
        {chapters.map((chapter) => (
          <NavLink key={chapter.slug} className="chapter-card" to={`/chapter/${chapter.slug}`}>
            <span className="chapter-card-label">Chapter</span>
            <strong className="chapter-card-title">{chapter.title}</strong>
            <p className="chapter-card-summary">
              {chapter.summary ?? "이 장의 핵심 내용을 탐색할 수 있습니다."}
            </p>
          </NavLink>
        ))}
      </section>
    </div>
  );
}

function ChapterPage() {
  const { chapterSlug } = useParams();
  const location = useLocation();
  const normalizedChapterSlug = decodeRouteSegment(chapterSlug);

  if (!normalizedChapterSlug) {
    return <Navigate to="/" replace />;
  }

  const chapter = chapterMap.get(normalizedChapterSlug);

  useEffect(() => {
    const anchor = location.hash.replace(/^#/, "");

    if (!anchor) {
      window.scrollTo({ top: 0 });
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(anchor);
      target?.scrollIntoView({ block: "start" });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [normalizedChapterSlug, location.hash]);

  if (!chapter) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="chapter-page">
      <section className="chapter-header">
        <p className="chapter-eyebrow">읽는 중</p>
        <h1>{chapter.title}</h1>
        {chapter.summary ? <p className="chapter-summary">{chapter.summary}</p> : null}
      </section>
      <MarkdownArticle chapter={chapter} />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<ReaderShell />}>
          <Route index element={<HomePage />} />
          <Route path="chapter/:chapterSlug" element={<ChapterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
