import documentDataJson from "../generated/document-data.json";
import searchEntriesJson from "../generated/search-index.json";

import type { DocumentData, SearchEntry } from "./types";

export const documentData = documentDataJson as DocumentData;
export const searchEntries = searchEntriesJson as SearchEntry[];
