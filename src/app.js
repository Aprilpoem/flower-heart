import {
  MOODS,
  buildShareText,
  createEntry,
  filterEntriesByTag,
  getFlowerStyle,
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
  elements.gardenCount.textContent = `${state.entries.length} 朵花`;
  elements.gardenStage.querySelectorAll(".flower-button").forEach((node) => node.remove());
  elements.emptyGarden.hidden = state.entries.length > 0;

  state.entries
    .slice()
    .reverse()
    .forEach((entry, index) => {
      const style = getFlowerStyle(entry, index);
      const flower = document.createElement("button");
      flower.type = "button";
      flower.className = "flower-button";
      flower.style.setProperty("--flower-color", style.color);
      flower.style.setProperty("--flower-soft", style.soft);
      flower.style.left = `${style.x}%`;
      flower.style.top = `${style.y}%`;
      flower.style.transform = `translate(-50%, -50%) scale(${style.scale})`;
      flower.setAttribute("aria-label", `打开 ${entry.title}`);
      flower.innerHTML = flowerMarkup();
      flower.addEventListener("click", () => openDetail(entry));
      elements.gardenStage.append(flower);
    });
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
