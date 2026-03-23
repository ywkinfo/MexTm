import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import GithubSlugger from "github-slugger";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";

type HeadingNode = {
  id: string;
  depth: number;
  title: string;
  children: HeadingNode[];
};

type ChapterSource = {
  title: string;
  slug: string;
  lines: string[];
};

type Chapter = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  html: string;
  headings: HeadingNode[];
};

type SearchEntry = {
  id: string;
  chapterSlug: string;
  chapterTitle: string;
  sectionId: string;
  sectionTitle: string;
  text: string;
  excerpt: string;
};

type DocumentData = {
  meta: {
    title: string;
    builtAt: string;
    chapterCount: number;
  };
  chapters: Chapter[];
};

type FlatHeading = {
  id: string;
  depth: number;
  title: string;
  lineIndex: number;
};

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "멕시코-상표-실무-운영-가이드북_v1_master.md");
const generatedDir = path.join(rootDir, "generated");
const documentDataPath = path.join(generatedDir, "document-data.json");
const searchIndexPath = path.join(generatedDir, "search-index.json");

const officialDomains = new Set([
  "gob.mx",
  "impi.gob.mx",
  "wipo.int",
  "scjn.gob.mx",
  "diputados.gob.mx",
  "anam.gob.mx",
  "kipo.go.kr",
  "kipris.or.kr",
  "cultura.gob.mx"
]);

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeEnhance)
  .use(rehypeStringify);

async function main() {
  const source = await fs.readFile(sourcePath, "utf-8");
  const { documentTitle, chapters } = parseDocument(source);

  const builtChapters: Chapter[] = [];
  const searchEntries: SearchEntry[] = [];

  for (const chapterSource of chapters) {
    const { chapter, entries } = await buildChapter(chapterSource);
    builtChapters.push(chapter);
    searchEntries.push(...entries);
  }

  const documentData: DocumentData = {
    meta: {
      title: documentTitle,
      builtAt: new Date().toISOString(),
      chapterCount: builtChapters.length
    },
    chapters: builtChapters
  };

  await fs.mkdir(generatedDir, { recursive: true });
  await fs.writeFile(documentDataPath, JSON.stringify(documentData, null, 2) + "\n", "utf-8");
  await fs.writeFile(searchIndexPath, JSON.stringify(searchEntries, null, 2) + "\n", "utf-8");

  console.log(
    `Generated ${builtChapters.length} chapters and ${searchEntries.length} search entries.`
  );
}

function parseDocument(source: string) {
  const lines = source.split(/\r?\n/);
  const chapterSlugger = new GithubSlugger();

  let documentTitle = "문서";
  const chapters: ChapterSource[] = [];
  let currentChapterTitle: string | null = null;
  let currentChapterLines: string[] = [];

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match && documentTitle === "문서") {
      documentTitle = h1Match[1].trim();
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      if (currentChapterTitle) {
        chapters.push({
          title: currentChapterTitle,
          slug: chapterSlugger.slug(currentChapterTitle),
          lines: trimLines(currentChapterLines)
        });
      }

      currentChapterTitle = h2Match[1].trim();
      currentChapterLines = [];
      continue;
    }

    if (currentChapterTitle) {
      currentChapterLines.push(line);
    }
  }

  if (currentChapterTitle) {
    chapters.push({
      title: currentChapterTitle,
      slug: chapterSlugger.slug(currentChapterTitle),
      lines: trimLines(currentChapterLines)
    });
  }

  return { documentTitle, chapters };
}

async function buildChapter(chapterSource: ChapterSource) {
  const markdown = chapterSource.lines.join("\n").trim();
  const { tree, flat } = extractHeadings(chapterSource.lines);
  const summary = extractSummary(chapterSource.lines);
  const html = await markdownToHtml(markdown);
  const entries = buildSearchEntries(chapterSource, flat);

  const chapter: Chapter = {
    id: chapterSource.slug,
    slug: chapterSource.slug,
    title: chapterSource.title,
    summary,
    html,
    headings: tree
  };

  return { chapter, entries };
}

function extractHeadings(lines: string[]) {
  const slugger = new GithubSlugger();
  const flat: FlatHeading[] = [];

  lines.forEach((line, lineIndex) => {
    const match = line.match(/^(#{3,5})\s+(.+?)\s*$/);
    if (!match) {
      return;
    }

    const depth = match[1].length;
    const title = cleanHeadingText(match[2]);
    const id = slugger.slug(title);

    flat.push({ id, depth, title, lineIndex });
  });

  const tree: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  for (const heading of flat) {
    const node: HeadingNode = {
      id: heading.id,
      depth: heading.depth,
      title: heading.title,
      children: []
    };

    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      tree.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return { tree, flat };
}

function buildSearchEntries(chapter: ChapterSource, headings: FlatHeading[]) {
  const entries: SearchEntry[] = [];
  const introLines = headings.length > 0 ? chapter.lines.slice(0, headings[0].lineIndex) : chapter.lines;
  const introText = stripMarkdown(introLines.join("\n"));

  if (introText) {
    entries.push({
      id: `${chapter.slug}::overview`,
      chapterSlug: chapter.slug,
      chapterTitle: chapter.title,
      sectionId: "",
      sectionTitle: "도입",
      text: introText,
      excerpt: createExcerpt(introText)
    });
  }

  if (headings.length === 0) {
    return entries;
  }

  for (let index = 0; index < headings.length; index += 1) {
    const current = headings[index];
    const next = headings[index + 1];
    const sectionLines = chapter.lines.slice(
      current.lineIndex,
      next ? next.lineIndex : chapter.lines.length
    );
    const sectionText = stripMarkdown(sectionLines.join("\n"));

    if (!sectionText) {
      continue;
    }

    entries.push({
      id: `${chapter.slug}::${current.id}`,
      chapterSlug: chapter.slug,
      chapterTitle: chapter.title,
      sectionId: current.id,
      sectionTitle: current.title,
      text: sectionText,
      excerpt: createExcerpt(sectionText)
    });
  }

  return entries;
}

function extractSummary(lines: string[]) {
  const firstHeadingIndex = lines.findIndex((line) => /^(#{3,5})\s+/.test(line));
  const summarySource =
    firstHeadingIndex > 0 ? lines.slice(0, firstHeadingIndex) : lines;

  const paragraphs = summarySource
    .join("\n")
    .split(/\n\s*\n/)
    .map((paragraph) => stripMarkdown(paragraph))
    .filter(Boolean);

  return paragraphs[0] ? createExcerpt(paragraphs[0], 220) : undefined;
}

async function markdownToHtml(markdown: string) {
  const file = await markdownProcessor.process(markdown);
  return String(file);
}

function trimLines(lines: string[]) {
  const next = [...lines];

  while (next.length > 0 && next[0].trim() === "") {
    next.shift();
  }

  while (next.length > 0 && next[next.length - 1].trim() === "") {
    next.pop();
  }

  return next;
}

function cleanHeadingText(value: string) {
  return stripInlineMarkdown(value.replace(/\s+#+\s*$/, "").trim());
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^ *\|?[-:| ]+\|? *$/gm, "")
    .replace(/\|/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createExcerpt(text: string, maxLength = 180) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function rehypeEnhance() {
  return (tree: HastNode) => {
    visit(tree, "element", (node: HastNode, index, parent) => {
      if (node.tagName && /^h[3-5]$/.test(node.tagName)) {
        node.properties = {
          ...node.properties,
          className: mergeClassNames(node.properties?.className, [
            "article-heading",
            `depth-${node.tagName}`
          ])
        };
      }

      if (node.tagName === "blockquote") {
        node.properties = {
          ...node.properties,
          className: mergeClassNames(node.properties?.className, ["callout-quote"])
        };
      }

      if (node.tagName === "a") {
        const href = String(node.properties?.href ?? "");

        if (/^https?:\/\//.test(href)) {
          const host = safeHostname(href);
          const classNames = ["external-link"];

          if (host && isOfficialDomain(host)) {
            classNames.push("official-link");
          }

          node.properties = {
            ...node.properties,
            target: "_blank",
            rel: "noreferrer noopener",
            className: mergeClassNames(node.properties?.className, classNames)
          };
        }
      }

      if (
        node.tagName === "table" &&
        parent &&
        typeof index === "number" &&
        !nodeAlreadyWrapped(parent as HastNode)
      ) {
        const wrapper: HastNode = {
          type: "element",
          tagName: "div",
          properties: {
            className: ["table-scroll"]
          },
          children: [node]
        };

        const parentNode = parent as HastNode;
        const children = parentNode.children ?? [];
        children[index] = wrapper;
        parentNode.children = children;

        return [SKIP, index];
      }

      return undefined;
    });
  };
}

function mergeClassNames(existing: unknown, additions: string[]) {
  const current = Array.isArray(existing)
    ? existing.map(String)
    : typeof existing === "string"
      ? existing.split(/\s+/).filter(Boolean)
      : [];

  const merged = new Set([...current, ...additions]);
  return [...merged];
}

function nodeAlreadyWrapped(parent: HastNode) {
  return (
    parent.tagName === "div" &&
    Array.isArray(parent.properties?.className) &&
    parent.properties.className.map(String).includes("table-scroll")
  );
}

function safeHostname(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isOfficialDomain(hostname: string) {
  return [...officialDomains].some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
