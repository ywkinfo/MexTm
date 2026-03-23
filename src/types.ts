export type HeadingNode = {
  id: string;
  depth: number;
  title: string;
  children: HeadingNode[];
};

export type Chapter = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  html: string;
  headings: HeadingNode[];
};

export type DocumentMeta = {
  title: string;
  builtAt: string;
  chapterCount: number;
};

export type DocumentData = {
  meta: DocumentMeta;
  chapters: Chapter[];
};

export type SearchEntry = {
  id: string;
  chapterSlug: string;
  chapterTitle: string;
  sectionId: string;
  sectionTitle: string;
  text: string;
  excerpt: string;
};

export type NavigationState = {
  currentChapterSlug?: string;
  currentSectionId?: string;
  isSidebarOpen: boolean;
};

export type SearchState = {
  query: string;
  results: SearchEntry[];
  highlightedResultIndex: number;
};
