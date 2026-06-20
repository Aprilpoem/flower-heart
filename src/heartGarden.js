export const MOODS = {
  焦虑: { label: "焦虑", color: "#d9827c", soft: "#f8dedb" },
  悲伤: { label: "悲伤", color: "#6f8fb8", soft: "#dfe9f5" },
  平静: { label: "平静", color: "#6aa68f", soft: "#def0e9" },
  快乐: { label: "快乐", color: "#e3b64b", soft: "#fbefc8" },
  愤怒: { label: "愤怒", color: "#c75f45", soft: "#f3d8cf" },
  麻木: { label: "麻木", color: "#8b8f99", soft: "#e7e8eb" },
  希望: { label: "希望", color: "#b28bd6", soft: "#eee1f7" },
};

const REQUIRED_MESSAGES = {
  title: "请给这朵花一个名字。",
  moment: "请写下这个事件或瞬间。",
  feeling: "请写下当时的感受。",
};

const FLOWER_POSITIONS = [
  [14, 62],
  [31, 45],
  [50, 68],
  [74, 42],
  [84, 70],
  [22, 78],
  [64, 56],
  [42, 30],
  [11, 38],
  [89, 34],
  [57, 82],
  [36, 61],
];

export function normalizeTags(raw) {
  const values = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,，、]+/);
  const seen = new Set();
  const tags = [];

  for (const value of values) {
    const tag = String(value).trim();
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }

  return tags;
}

export function validateEntry(input) {
  const errors = {};

  for (const field of ["title", "moment", "feeling"]) {
    if (!String(input?.[field] ?? "").trim()) {
      errors[field] = REQUIRED_MESSAGES[field];
    }
  }

  if (!MOODS[input?.mood]) {
    errors.mood = "请选择一种心情颜色。";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function createEntry(input, now = new Date()) {
  const validation = validateEntry(input);
  if (!validation.valid) {
    const error = new Error("Invalid flower entry");
    error.errors = validation.errors;
    throw error;
  }

  const createdAt = now.toISOString();
  const idSeed = `${createdAt}-${String(input.title).trim()}`;

  return {
    id: `flower-${hashString(idSeed)}`,
    title: String(input.title).trim(),
    createdAt,
    moment: String(input.moment).trim(),
    feeling: String(input.feeling).trim(),
    association: String(input.association ?? "").trim(),
    tags: normalizeTags(input.tags),
    mood: input.mood,
  };
}

export function serializeEntries(entries) {
  return JSON.stringify(entries);
}

export function parseEntries(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntryLike) : [];
  } catch {
    return [];
  }
}

export function filterEntriesByTag(entries, tag) {
  const selected = String(tag ?? "").trim();
  if (!selected) return entries;
  return entries.filter((entry) => entry.tags?.includes(selected));
}

export function getFlowerStyle(entry, index) {
  const [x, y] = FLOWER_POSITIONS[index % FLOWER_POSITIONS.length];
  return {
    color: MOODS[entry.mood]?.color ?? MOODS["平静"].color,
    soft: MOODS[entry.mood]?.soft ?? MOODS["平静"].soft,
    x,
    y,
    scale: 0.88 + (index % 4) * 0.04,
  };
}

export function buildShareText(entry) {
  const date = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(entry.createdAt));
  const tags = entry.tags?.length ? `\n${entry.tags.map((tag) => `#${tag}`).join(" ")}` : "";
  const association = entry.association ? `\n\n它让我想到：${entry.association}` : "";

  return `我种下了一朵花：${entry.title}
${date} · ${entry.mood}

${entry.moment}

当时的感受：${entry.feeling}${association}${tags}`;
}

function isEntryLike(value) {
  return Boolean(
    value &&
      typeof value.id === "string" &&
      typeof value.title === "string" &&
      typeof value.createdAt === "string" &&
      typeof value.moment === "string" &&
      typeof value.feeling === "string" &&
      typeof value.mood === "string" &&
      Array.isArray(value.tags),
  );
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
