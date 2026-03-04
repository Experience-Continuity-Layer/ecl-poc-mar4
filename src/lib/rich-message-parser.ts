export type RichSegment =
  | { type: "text"; content: string }
  | { type: "model-card"; slug: string }
  | { type: "link"; label: string; target: string }
  | { type: "action"; label: string; actionId: string }
  | { type: "info"; title: string; content: string }
  | { type: "handoff"; channel: string; message: string };

export function parseRichMessage(raw: string): RichSegment[] {
  const segments: RichSegment[] = [];

  if (!raw) {
    return segments;
  }

  const regex = /\{\{([^}]+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const markerStart = match.index;
    const markerEnd = regex.lastIndex;

    if (markerStart > lastIndex) {
      segments.push({ type: "text", content: raw.slice(lastIndex, markerStart) });
    }

    const inner = match[1].trim();
    const parsed = parseMarker(inner);

    if (parsed) {
      segments.push(parsed);
    } else {
      segments.push({ type: "text", content: raw.slice(markerStart, markerEnd) });
    }

    lastIndex = markerEnd;
  }

  if (lastIndex < raw.length) {
    segments.push({ type: "text", content: raw.slice(lastIndex) });
  }

  return segments;
}

function parseMarker(inner: string): RichSegment | null {
  const [kind, rest] = inner.split(":", 2);
  if (!kind || rest == null) return null;

  const trimmedKind = kind.trim();
  const trimmedRest = rest.trim();

  if (trimmedKind === "model") {
    if (!trimmedRest) return null;
    return { type: "model-card", slug: trimmedRest };
  }

  if (trimmedKind === "link") {
    const [label, target] = splitPair(trimmedRest);
    if (!label || !target) return null;
    return { type: "link", label, target };
  }

  if (trimmedKind === "action") {
    const [label, actionId] = splitPair(trimmedRest);
    if (!label || !actionId) return null;
    return { type: "action", label, actionId };
  }

  if (trimmedKind === "info") {
    const [title, content] = splitPair(trimmedRest);
    if (!title || !content) return null;
    return { type: "info", title, content };
  }

  if (trimmedKind === "handoff") {
    const [channel, message] = splitPair(trimmedRest);
    if (!channel || !message) return null;
    return { type: "handoff", channel, message };
  }

  return null;
}

function splitPair(value: string): [string, string] {
  const index = value.indexOf("|");
  if (index === -1) return ["", ""];
  const left = value.slice(0, index).trim();
  const right = value.slice(index + 1).trim();
  return [left, right];
}

