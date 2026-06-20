import {
  MOODS,
  PUZZLE_PIECE_COUNT,
  buildShareText,
  createEntry,
  filterEntriesByTag,
  getPuzzlePieceStyle,
  parseEntries,
  serializeEntries,
  validateEntry,
} from "./heartGarden.js";

const STORAGE_KEY = "heart-garden.entries.v1";

const state = {
  entries: [],
  activeView: "garden",
  selectedTag: "",
  selectedEntry: null,
};

const elements = {
  plantButton: document.querySelector("#plantButton"),
  emptyPlantButton: document.querySelector("#emptyPlantButton"),
  tabs: document.querySelectorAll(".tab"),
  views: {
    garden: document.querySelector("#gardenView"),
    book: document.querySelector("#bookView"),
  },
  gardenStage: document.querySelector("#gardenStage"),
  emptyGarden: document.querySelector("#emptyGarden"),
  gardenCount: document.querySelector("#gardenCount"),
  specimenGrid: document.querySelector("#specimenGrid"),
  tagFilter: document.querySelector("#tagFilter"),
  editorModal: document.querySelector("#editorModal"),
  entryForm: document.querySelector("#entryForm"),
  closeEditor: document.querySelector("#closeEditor"),
  cancelEditor: document.querySelector("#cancelEditor"),
  moodOptions: document.querySelector("#moodOptions"),
  detailModal: document.querySelector("#detailModal"),
  closeDetail: document.querySelector("#closeDetail"),
  copyShare: document.querySelector("#copyShare"),
  toast: document.querySelector("#toast"),
};

const detail = {
  date: document.querySelector("#detailDate"),
  title: document.querySelector("#detailTitle"),
  flower: document.querySelector("#detailFlower"),
  moment: document.querySelector("#detailMoment"),
  feeling: document.querySelector("#detailFeeling"),
  association: document.querySelector("#detailAssociation"),
  tags: document.querySelector("#detailTags"),
  sharePreview: document.querySelector("#sharePreview"),
};

init();

function init() {
  state.entries = loadEntries();
  renderMoodOptions();
  bindEvents();
  render();
}

function bindEvents() {
  elements.plantButton.addEventListener("click", openEditor);
  elements.emptyPlantButton.addEventListener("click", openEditor);
  elements.closeEditor.addEventListener("click", requestCloseEditor);
  elements.cancelEditor.addEventListener("click", requestCloseEditor);
  elements.closeDetail.addEventListener("click", () => elements.detailModal.close());
  elements.copyShare.addEventListener("click", copySelectedShare);
  elements.entryForm.addEventListener("submit", saveEntry);
  elements.tagFilter.addEventListener("change", (event) => {
    state.selectedTag = event.target.value;
    renderSpecimens();
  });

  for (const tab of elements.tabs) {
    tab.addEventListener("click", () => setView(tab.dataset.view));
  }
}

function loadEntries() {
  return parseEntries(localStorage.getItem(STORAGE_KEY)).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, serializeEntries(state.entries));
}

function setView(view) {
  state.activeView = view;
  for (const tab of elements.tabs) {
    tab.classList.toggle("is-active", tab.dataset.view === view);
  }
  for (const [name, section] of Object.entries(elements.views)) {
    section.classList.toggle("is-active", name === view);
  }
}

function render() {
  renderGarden();
  renderTagFilter();
  renderSpecimens();
}

function renderGarden() {
  const filledCount = Math.min(state.entries.length, PUZZLE_PIECE_COUNT);
  elements.gardenCount.textContent = `${filledCount}/${PUZZLE_PIECE_COUNT} 片`;
  elements.gardenStage.querySelectorAll(".puzzle-board").forEach((node) => node.remove());
  elements.emptyGarden.hidden = state.entries.length > 0;

  const chronologicalEntries = state.entries.slice().reverse();
  const board = document.createElement("div");
  board.className = "puzzle-board";
  board.setAttribute("aria-label", "拼图花园");

  for (let index = 0; index < PUZZLE_PIECE_COUNT; index += 1) {
    const entry = chronologicalEntries[index];
    const style = getPuzzlePieceStyle(entry, index);
    const piece = document.createElement(entry ? "button" : "div");
    piece.className = `puzzle-piece puzzle-${style.tone}${style.active ? " is-lit" : ""}`;
    piece.style.setProperty("--piece-color", style.color);
    piece.style.setProperty("--piece-soft", style.soft);
    piece.style.setProperty("--piece-rotation", `${((index % 5) - 2) * 0.45}deg`);
    piece.innerHTML = `
      <span class="piece-fill"></span>
      <span class="piece-art" aria-hidden="true">${puzzleArtMarkup(style.art)}</span>
      <span class="piece-index">${index + 1}</span>
    `;

    if (entry) {
      piece.type = "button";
      piece.setAttribute("aria-label", `打开拼图 ${index + 1}：${entry.title}`);
      piece.addEventListener("click", () => openDetail(entry));
    } else {
      piece.setAttribute("aria-label", `未点亮拼图 ${index + 1}`);
    }

    board.append(piece);
  }

  elements.gardenStage.append(board);
}

function renderTagFilter() {
  const tags = [...new Set(state.entries.flatMap((entry) => entry.tags))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
  const current = state.selectedTag;
  elements.tagFilter.innerHTML = `<option value="">全部</option>`;

  for (const tag of tags) {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    option.selected = tag === current;
    elements.tagFilter.append(option);
  }

  if (current && !tags.includes(current)) {
    state.selectedTag = "";
    elements.tagFilter.value = "";
  }
}

function renderSpecimens() {
  const entries = filterEntriesByTag(state.entries, state.selectedTag);
  elements.specimenGrid.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-book";
    empty.textContent = state.entries.length === 0 ? "还没有标本。" : "这个标签下还没有花。";
    elements.specimenGrid.append(empty);
    return;
  }

  for (const entry of entries) {
    const mood = MOODS[entry.mood] ?? MOODS["平静"];
    const card = document.createElement("article");
    card.className = "specimen-card";
    card.style.setProperty("--mood-color", mood.color);
    card.innerHTML = `
      <div class="specimen-card-head">
        <div>
          <p>${formatDate(entry.createdAt)} · ${entry.mood}</p>
          <h3>${escapeHtml(entry.title)}</h3>
        </div>
        <span class="specimen-dot" aria-hidden="true"></span>
      </div>
      <p class="specimen-text">${escapeHtml(entry.moment)}</p>
      <div class="tag-row">${renderTags(entry.tags)}</div>
    `;
    card.addEventListener("click", () => openDetail(entry));
    elements.specimenGrid.append(card);
  }
}

function renderMoodOptions() {
  elements.moodOptions.innerHTML = "";
  Object.values(MOODS).forEach((mood, index) => {
    const id = `mood-${index}`;
    const label = document.createElement("label");
    label.className = "mood-option";
    label.style.setProperty("--mood-color", mood.color);
    label.style.setProperty("--mood-soft", mood.soft);
    label.innerHTML = `
      <input type="radio" name="mood" id="${id}" value="${mood.label}" />
      <span class="mood-swatch" aria-hidden="true"></span>
      <span>${mood.label}</span>
    `;
    elements.moodOptions.append(label);
  });
}

function openEditor() {
  elements.entryForm.reset();
  clearErrors();
  elements.editorModal.showModal();
  document.querySelector("#titleInput").focus();
}

function requestCloseEditor() {
  if (hasFormContent() && !confirm("这朵花还没有保存，要放弃吗？")) return;
  elements.editorModal.close();
}

function saveEntry(event) {
  event.preventDefault();
  clearErrors();

  const form = new FormData(elements.entryForm);
  const input = Object.fromEntries(form.entries());
  const validation = validateEntry(input);

  if (!validation.valid) {
    showErrors(validation.errors);
    return;
  }

  try {
    const entry = createEntry(input);
    state.entries = [entry, ...state.entries];
    persistEntries();
    elements.editorModal.close();
    render();
    showToast("已经种下一朵花。");
  } catch (error) {
    if (error.errors) {
      showErrors(error.errors);
      return;
    }
    showToast("保存失败，但你写下的内容还在。");
  }
}

function openDetail(entry) {
  state.selectedEntry = entry;
  const mood = MOODS[entry.mood] ?? MOODS["平静"];
  detail.date.textContent = `${formatDate(entry.createdAt)} · ${entry.mood}`;
  detail.title.textContent = entry.title;
  detail.flower.style.setProperty("--flower-color", mood.color);
  detail.flower.style.setProperty("--flower-soft", mood.soft);
  detail.flower.innerHTML = flowerMarkup();
  detail.moment.textContent = entry.moment;
  detail.feeling.textContent = entry.feeling;
  detail.association.textContent = entry.association || "这朵花没有写下联想。";
  detail.tags.innerHTML = renderTags(entry.tags);
  detail.sharePreview.textContent = buildShareText(entry);
  elements.detailModal.showModal();
}

async function copySelectedShare() {
  if (!state.selectedEntry) return;
  const text = buildShareText(state.selectedEntry);

  try {
    await navigator.clipboard.writeText(text);
    showToast("分享卡片已复制。");
  } catch {
    showToast("复制失败，可以手动选中卡片文字。");
  }
}

function hasFormContent() {
  const form = new FormData(elements.entryForm);
  return [...form.values()].some((value) => String(value).trim());
}

function showErrors(errors) {
  for (const [field, message] of Object.entries(errors)) {
    const node = document.querySelector(`[data-error-for="${field}"]`);
    if (node) node.textContent = message;
  }
}

function clearErrors() {
  document.querySelectorAll("[data-error-for]").forEach((node) => {
    node.textContent = "";
  });
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function renderTags(tags) {
  if (!tags?.length) return `<span class="muted">没有标签</span>`;
  return tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
}

function flowerMarkup() {
  return `
    <span class="flower-bloom">
      <span></span><span></span><span></span><span></span>
    </span>
    <span class="flower-core"></span>
    <span class="flower-stem"></span>
    <span class="flower-leaf"></span>
  `;
}

function puzzleArtMarkup(type) {
  const art = {
    flower: `<svg viewBox="0 0 80 80"><path d="M40 49v17M30 65c7-3 8-9 8-9-9 0-13 4-15 10M50 65c-7-3-8-9-8-9 9 0 13 4 15 10"/><path d="M40 30c-10-15-29 1-12 12 2 18 25 18 24 0 17-11-2-27-12-12Z"/><circle cx="40" cy="40" r="7"/></svg>`,
    leaf: `<svg viewBox="0 0 80 80"><path d="M16 58c28 1 43-15 48-40-26 5-44 21-48 40Z"/><path d="M20 56c14-12 28-22 42-34"/><path d="M38 41c-2-8-8-13-14-15M48 33c3 8 8 12 15 14"/></svg>`,
    path: `<svg viewBox="0 0 80 80"><path d="M11 64c18-8 15-21 30-26 14-5 14-14 25-24"/><path d="M16 70c18-8 20-20 35-25 13-4 12-13 23-24"/><path d="M20 20h12M48 62h14"/></svg>`,
    sprout: `<svg viewBox="0 0 80 80"><path d="M40 66V28"/><path d="M40 42c-12-13-24-9-28 5 12 3 22 1 28-5ZM40 33c10-14 23-13 29 0-11 5-21 5-29 0Z"/><path d="M28 68h25"/></svg>`,
    pond: `<svg viewBox="0 0 80 80"><path d="M13 48c6-15 24-22 42-16 17 6 16 23 1 29-18 7-50 2-43-13Z"/><path d="M23 48c8 5 24 6 35-1M31 28c4-7 9-10 16-13"/></svg>`,
    moon: `<svg viewBox="0 0 80 80"><path d="M53 12c-18 5-27 23-19 39 6 12 19 18 33 14-7 9-20 14-34 10C13 69 4 48 12 29 19 13 36 5 53 12Z"/><path d="M18 18l4 4M63 34l5-2M54 70l2 5"/></svg>`,
    star: `<svg viewBox="0 0 80 80"><path d="M40 11l8 21 22 2-17 14 5 22-18-12-18 12 5-22-17-14 22-2 8-21Z"/><path d="M13 13l5 5M64 16l-5 6M16 65l7-4"/></svg>`,
    vine: `<svg viewBox="0 0 80 80"><path d="M18 68c26-7 42-26 44-56"/><path d="M34 54c-12-5-21-2-26 7 11 5 20 3 26-7ZM45 42c-2-13 3-21 14-24 3 12-1 20-14 24ZM53 30c-9-8-10-18-3-26 8 8 9 17 3 26Z"/></svg>`,
    seed: `<svg viewBox="0 0 80 80"><path d="M40 15c15 15 22 31 12 43-8 10-24 10-32 0C10 46 25 25 40 15Z"/><path d="M39 22c-3 16-4 30 3 45M28 54c7-2 12-7 15-14"/></svg>`,
    sun: `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="15"/><path d="M40 5v13M40 62v13M5 40h13M62 40h13M15 15l9 9M56 56l9 9M65 15l-9 9M24 56l-9 9"/></svg>`,
    branch: `<svg viewBox="0 0 80 80"><path d="M19 65c17-10 28-25 38-50"/><path d="M35 45c-2-11-8-18-17-20M45 31c9-2 16-7 20-16M28 55c8 2 15 0 22-6"/></svg>`,
    rain: `<svg viewBox="0 0 80 80"><path d="M22 47c-8-2-12-10-9-18 3-9 12-12 20-8 6-12 24-9 27 5 9 2 13 10 10 18-3 8-10 11-18 10H27"/><path d="M29 59l-4 10M43 57l-4 12M57 59l-4 10"/></svg>`,
    stone: `<svg viewBox="0 0 80 80"><path d="M12 53c3-19 18-32 37-29 17 3 23 19 16 31-7 13-29 17-45 9-6-3-9-7-8-11Z"/><path d="M24 50c8 6 21 7 34 1M34 32c8-2 15-1 22 3"/></svg>`,
  };

  return art[type] ?? art.flower;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
