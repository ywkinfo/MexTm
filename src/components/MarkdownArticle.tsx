import type { Chapter } from "../types";

type MarkdownArticleProps = {
  chapter: Chapter;
};

export function MarkdownArticle({ chapter }: MarkdownArticleProps) {
  return (
    <article
      className="article"
      dangerouslySetInnerHTML={{ __html: chapter.html }}
    />
  );
}
