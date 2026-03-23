import type { HeadingNode } from "../types";

export function flattenHeadings(headings: HeadingNode[]) {
  const flat: HeadingNode[] = [];

  const walk = (nodes: HeadingNode[]) => {
    for (const node of nodes) {
      flat.push(node);
      walk(node.children);
    }
  };

  walk(headings);
  return flat;
}
