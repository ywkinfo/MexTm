import MiniSearch from "minisearch";

import { searchEntries } from "../content";
import type { SearchEntry } from "../types";

const index = new MiniSearch<SearchEntry>({
  fields: ["chapterTitle", "sectionTitle", "text"],
  storeFields: ["id", "chapterSlug", "chapterTitle", "sectionId", "sectionTitle", "text", "excerpt"],
  searchOptions: {
    boost: {
      chapterTitle: 4,
      sectionTitle: 2
    },
    prefix: true
  }
});

index.addAll(searchEntries);
const entryMap = new Map(searchEntries.map((entry) => [entry.id, entry]));

export function searchContent(rawQuery: string) {
  const query = rawQuery.trim();

  if (!query) {
    return [];
  }

  const indexedResults = index.search(query, {
    prefix: true,
    fuzzy: query.length >= 4 ? 0.2 : false,
    boost: {
      chapterTitle: 4,
      sectionTitle: 2
    }
  });
  const results = indexedResults
    .map((result) => entryMap.get(result.id))
    .filter((entry): entry is SearchEntry => Boolean(entry));

  const normalizedQuery = query.toLowerCase();
  const fallback = searchEntries.filter((entry) =>
    [entry.chapterTitle, entry.sectionTitle, entry.text].some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    )
  );

  const merged = new Map<string, SearchEntry>();

  for (const result of [...results, ...fallback]) {
    if (!merged.has(result.id)) {
      merged.set(result.id, result);
    }
  }

  return [...merged.values()].slice(0, 24);
}
