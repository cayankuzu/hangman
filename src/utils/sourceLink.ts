export interface ParsedSource {
  label: string;
  url: string | null;
}

export function parseSourceNote(sourceNote: string): ParsedSource {
  const match = sourceNote.match(/https?:\/\/\S+/);
  if (!match || match.index === undefined) {
    return { label: sourceNote.trim(), url: null };
  }

  const label = sourceNote
    .slice(0, match.index)
    .replace(/[\s:–—-]+$/u, "")
    .trim();

  return {
    label: label || match[0],
    url: match[0],
  };
}
