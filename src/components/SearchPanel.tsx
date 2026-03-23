import { useDeferredValue, useState } from "react";

import { searchContent } from "../lib/search";

type SearchPanelProps = {
  onNavigate: (chapterSlug: string, sectionId?: string) => void;
};

export function SearchPanel({ onNavigate }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const results = searchContent(deferredQuery);

  return (
    <div className="search-shell">
      <label className="search-label" htmlFor="reader-search">
        검색
      </label>
      <input
        id="reader-search"
        className="search-input"
        type="search"
        value={query}
        placeholder="장 제목, 섹션 제목, 본문 검색"
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
      {query.trim() ? (
        <div className="search-results" role="listbox" aria-label="검색 결과">
          {results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.id}
                className="search-result"
                type="button"
                onClick={() => {
                  onNavigate(result.chapterSlug, result.sectionId || undefined);
                  setQuery("");
                }}
              >
                <span className="search-result-meta">{result.chapterTitle}</span>
                <strong className="search-result-title">{result.sectionTitle}</strong>
                <span className="search-result-excerpt">{result.excerpt}</span>
              </button>
            ))
          ) : (
            <div className="search-empty">일치하는 섹션을 찾지 못했습니다.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
