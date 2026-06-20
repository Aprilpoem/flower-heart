import assert from "node:assert/strict";
import test from "node:test";

import {
  MOODS,
  buildShareText,
  createEntry,
  filterEntriesByTag,
  getFlowerStyle,
  getPuzzlePieceStyle,
  normalizeTags,
  parseEntries,
  serializeEntries,
  validateEntry,
} from "../src/heartGarden.js";

const fixedNow = new Date("2026-06-20T06:30:00.000Z");

test("createEntry normalizes a valid flower specimen", () => {
  const entry = createEntry(
    {
      title: "我又不会游泳了",
      moment: "站在浅水区，脚不敢离开池底。",
      feeling: "害怕，也有一点羞愧。",
      association: "这像我现在的人生，不敢漂浮。",
      tags: "游泳, 身体, 希望",
      mood: "焦虑",
    },
    fixedNow,
  );

  assert.equal(entry.title, "我又不会游泳了");
  assert.equal(entry.createdAt, "2026-06-20T06:30:00.000Z");
  assert.deepEqual(entry.tags, ["游泳", "身体", "希望"]);
  assert.equal(entry.mood, "焦虑");
  assert.match(entry.id, /^flower-/);
});

test("validateEntry reports missing required fields and invalid mood", () => {
  const result = validateEntry({
    title: "",
    moment: "   ",
    feeling: "",
    association: "水托不住我。",
    tags: "",
    mood: "困惑",
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, {
    title: "请给这朵花一个名字。",
    moment: "请写下这个事件或瞬间。",
    feeling: "请写下当时的感受。",
    mood: "请选择一种心情颜色。",
  });
});

test("normalizeTags trims, splits, removes duplicates, and keeps order", () => {
  assert.deepEqual(normalizeTags(" 工作,健康  关系，工作\n游泳 "), [
    "工作",
    "健康",
    "关系",
    "游泳",
  ]);
});

test("entries serialize and parse safely", () => {
  const entry = createEntry(
    {
      title: "一朵花",
      moment: "今天写下来了。",
      feeling: "平静。",
      association: "我还在。",
      tags: ["希望"],
      mood: "希望",
    },
    fixedNow,
  );

  assert.deepEqual(parseEntries(serializeEntries([entry])), [entry]);
  assert.deepEqual(parseEntries("not-json"), []);
  assert.deepEqual(parseEntries(JSON.stringify({ nope: true })), []);
});

test("filterEntriesByTag returns all entries for empty tag and matching entries for a selected tag", () => {
  const entries = [
    { id: "a", tags: ["工作", "虚无"] },
    { id: "b", tags: ["游泳", "身体"] },
  ];

  assert.deepEqual(filterEntriesByTag(entries, ""), entries);
  assert.deepEqual(filterEntriesByTag(entries, "身体"), [entries[1]]);
});

test("getFlowerStyle maps mood and index into deterministic garden placement", () => {
  const style = getFlowerStyle({ mood: "希望" }, 3);

  assert.equal(style.color, MOODS["希望"].color);
  assert.equal(style.x, 74);
  assert.equal(style.y, 42);
  assert.equal(style.scale, 1);
});

test("getPuzzlePieceStyle maps filled and empty puzzle pieces", () => {
  const filled = getPuzzlePieceStyle({ mood: "希望" }, 5);
  const empty = getPuzzlePieceStyle(undefined, 5);

  assert.equal(filled.color, MOODS["希望"].color);
  assert.equal(filled.soft, MOODS["希望"].soft);
  assert.equal(filled.active, true);
  assert.equal(filled.art, "moon");
  assert.equal(empty.active, false);
  assert.equal(empty.color, "transparent");
  assert.equal(empty.art, "moon");
});

test("buildShareText creates a one-flower text card", () => {
  const text = buildShareText({
    title: "我又不会游泳了",
    createdAt: "2026-06-20T06:30:00.000Z",
    moment: "我站在浅水区，水只到胸口。",
    feeling: "我很害怕。",
    association: "我怕的不是水，是失去支撑。",
    tags: ["游泳", "身体"],
    mood: "焦虑",
  });

  assert.match(text, /我又不会游泳了/);
  assert.match(text, /2026\/6\/20/);
  assert.match(text, /我怕的不是水，是失去支撑。/);
  assert.match(text, /#游泳 #身体/);
  assert.doesNotMatch(text, /整座花园/);
});
