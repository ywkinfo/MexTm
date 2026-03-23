import { useEffect, useState } from "react";

export function useActiveHeading(headingIds: string[]) {
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(headingIds[0] ?? null);

  useEffect(() => {
    if (headingIds.length === 0) {
      setActiveHeadingId(null);
      return;
    }

    const updateActiveHeading = () => {
      const elements = headingIds
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => element instanceof HTMLElement);

      if (elements.length === 0) {
        setActiveHeadingId(null);
        return;
      }

      const firstElement = elements[0];
      if (!firstElement) {
        setActiveHeadingId(null);
        return;
      }

      let nextActiveId = firstElement.id;

      for (const element of elements) {
        if (element.getBoundingClientRect().top <= 144) {
          nextActiveId = element.id;
        } else {
          break;
        }
      }

      setActiveHeadingId(nextActiveId);
    };

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [headingIds]);

  return activeHeadingId;
}
