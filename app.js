const $ = id => document.getElementById(id);
const iconPaths = {
  brand: '<path d="m2.5 8 9.5-5 9.5 5-9.5 5z" fill="currentColor" stroke="none"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5" stroke-width="2.4"/>',
  external: '<path d="M13 4h7v7m0-7-11 11"/><path d="M10 5H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-5"/>',
  moon: '<path d="M20.8 14A8.8 8.8 0 0 1 10 3.2 8.9 8.9 0 1 0 20.8 14Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/>',
  array: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M9 5v14m6-14v14"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/>',
  pairs: '<path d="M4 5h6v5H4zM14 14h6v5h-6zM4 12v4h7m2-9h7v5"/>',
  layers: '<path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  pointers: '<path d="M2 8h12m-4-4 4 4-4 4m12 4H10m4-4-4 4 4 4"/>',
  sliders: '<path d="M3 7h4m5 0h9M3 17h10m5 0h3"/><circle cx="9.5" cy="7" r="2.5"/><circle cx="15.5" cy="17" r="2.5"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
  scan: '<path d="M4 9V5a1 1 0 0 1 1-1h4m6 0h4a1 1 0 0 1 1 1v4m0 6v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4M8 12h8"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  play: '<path d="M6 3.5 20 12 6 20.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M5 4h5v16H5zm9 0h5v16h-5z" fill="currentColor" stroke="none"/>',
  previous: '<path d="M5 5v14m13-14L9 12l9 7z"/>',
  next: '<path d="M19 5v14M6 5l9 7-9 7z"/>',
  reset: '<path d="M3 10a8.5 8.5 0 1 1 1 7M3 4v6h6"/>',
  speed: '<path d="M3 17a9 9 0 1 1 18 0M12 14l5-5"/><circle cx="12" cy="14" r="1.5"/>',
  chevron: '<path d="m5 9 7 7 7-7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  bulb: '<path d="M9 17c0-3-4-4-4-8a7 7 0 0 1 14 0c0 4-4 5-4 8zM9 20h6m-5 2h4"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>'
};
function icon(name) {
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name]}</svg>`;
}
document.querySelectorAll("[data-icon]").forEach(el => el.innerHTML = icon(el.dataset.icon));

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const action = `Switch to ${theme === "dark" ? "light" : "dark"} theme`;
  $("theme").setAttribute("aria-label", action);
  $("theme").title = action;
  $("theme").innerHTML = icon(theme === "dark" ? "sun" : "moon");
}
const themeKey = "code-astra-theme";
let savedTheme;
try {
  savedTheme = localStorage.getItem(themeKey);
  // Bring existing browser preferences across the project rename.
  const legacyKey = "tracepad-theme";
  if (savedTheme === null) {
    savedTheme = localStorage.getItem(legacyKey);
    if (savedTheme === "dark" || savedTheme === "light") localStorage.setItem(themeKey, savedTheme);
  }
  localStorage.removeItem(legacyKey);
} catch { /* Storage can be disabled for local files. */ }
setTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
$("theme").onclick = () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(theme);
  try { localStorage.setItem(themeKey, theme); } catch { /* The toggle also works without storage. */ }
};

const isRain = new URLSearchParams(location.search).get("problem") === "trapping-rain-water";
const examples = isRain ? rainExamples : twoSumExamples;
const approaches = isRain ? rainSolutions : solutions;
const listings = isRain ? rainListings : codeListings;
const problemSlug = isRain ? "trapping-rain-water" : "two-sum";
if (isRain) setupRainPage();
else for (const [key, example] of Object.entries(twoSumExamples)) $("preset").add(new Option(example.name, key));
$("problem-select").value = problemSlug;
$("problem-select").onchange = event => {
  const url = new URL(location.href);
  if (event.target.value === "two-sum") url.searchParams.delete("problem");
  else url.searchParams.set("problem", event.target.value);
  location.assign(url.href);
};
window.addEventListener("pageshow", () => { $("problem-select").value = problemSlug; });
let input = isRain ? examples.basin : examples.classic;
let approach = isRain ? "pointers" : "onePass";
let frames = [];
let position = 0;
let timer = null;
const refreshPractice = createPracticeEditor();

// Only fixed, authored code lines pass through the tokenizer.
function highlightCode(line) {
  const tokens = line.match(/[A-Za-z_]\w*|\d+|./g) || [];
  return tokens.map(token => {
    const style = /^(def|for|in|if|return|while|else|and|is|not|None|public|int|new|auto|break|FOR|FROM|TO|IF|RETURN|WHILE|ELSE|AND|NONE|SORT|DOWN|BREAK)$/.test(token) ? "keyword"
      : /^(enumerate|len|range|sorted|get|Map|Integer|HashMap|Arrays|Comparator|vector|pair|unordered_map|sort|Deque|ArrayDeque|Math|max|min)$/.test(token) ? "builtin"
      : /^(two_sum|twoSum|trap)$/.test(token) ? "fn" : /^\d+$/.test(token) ? "number" : "";
    const safe = token === "<" ? "&lt;" : token === ">" ? "&gt;" : token === "&" ? "&amp;" : token;
    return style ? `<span class="token-${style}">${safe}</span>` : safe;
  }).join("");
}
function renderCode() {
  const language = $("language");
  const source = $("source-code");
  source.setAttribute("aria-label", language.selectedOptions[0].text + " solution with current line highlighted");
  source.innerHTML = `<div class="code-list">${listings[approach][language.value].lines.map((line, i) =>
    `<div class="code-line"><span class="line-num" aria-hidden="true">${i + 1}</span><code>${highlightCode(line)}</code></div>`).join("")}</div>`;
  source.scrollTop = 0;
  refreshPractice();
}
function renderApproach() {
  stop();
  const solution = approaches[approach];
  frames = solution.trace(input.nums, input.target);
  position = 0;
  renderCode();
  $("time-cost").textContent = solution.time;
  $("space-cost").textContent = solution.space;
  $("time-reason").textContent = solution.timeReason;
  $("space-reason").textContent = solution.spaceReason;
  $("approach-description").textContent = solution.description;
  $("approaches").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === approach)));
  renderFrame();
}
function renderTwoSumFrame(step) {
  $("target-chip").innerHTML = `target = <b>${input.target}</b>`;
  const order = step.order || input.nums.map((_, i) => i);
  const pointerByIndex = new Map(step.pointers);
  $("array-label").textContent = step.order ? "SORTED ARRAY · ORIGINAL INDICES" : "INPUT ARRAY";
  $("array-row").innerHTML = order.map(i => {
    const value = String(input.nums[i]);
    const pointer = pointerByIndex.get(i);
    const state = step.result?.includes(i) ? "found" : pointer ? (i === step.pointers[0][0] ? "active" : "partner") : "";
    return `<div class="array-cell ${state}" aria-label="Original index ${i}, value ${value}${pointer ? `, pointer ${pointer}` : ""}"><span class="cell-index">[${i}]</span><span class="tile ${value.length > 4 ? "long" : ""}">${value}</span><span class="cell-pointer">${pointer ? `↑ ${pointer}` : ""}</span></div>`;
  }).join("");
  if (step.entries) {
    $("memory-label").textContent = "HASH MAP";
    $("memory-hint").textContent = "value → index";
    $("memory-contents").innerHTML = step.entries.length ? step.entries.map(([k, v]) =>
      `<span class="memory-entry ${k === step.mapKey ? "hot" : ""}">${k} → ${v}</span>`).join("")
      : '<span class="memory-empty">{ } Empty</span>';
  } else {
    $("memory-label").textContent = approach === "brute" ? "CURRENT PAIR" : "TWO POINTERS";
    $("memory-hint").textContent = step.order ? "sorted positions" : "array indices";
    $("memory-contents").innerHTML = step.pointers.length ? step.pointers.map(([i, label]) =>
      `<span class="memory-entry">${label} = ${step.order ? step.order.indexOf(i) : i}</span>`).join("")
      : '<span class="memory-empty">Awaiting pointers</span>';
    if (step.total !== undefined) $("memory-contents").insertAdjacentHTML("beforeend", `<span class="memory-entry hot">sum = ${step.total}</span>`);
  }
}
function renderFrame() {
  const step = frames[position];
  if (isRain) renderRainFrame(step, input.nums);
  else renderTwoSumFrame(step);
  const source = $("source-code");
  const listing = listings[approach][$("language").value];
  const line = listing.lineFor[step.action];
  const previousLine = source.querySelector(".current");
  previousLine?.classList.remove("current");
  previousLine?.removeAttribute("aria-current");
  const activeLine = source.firstElementChild.children[line - 1];
  activeLine.classList.add("current");
  activeLine.setAttribute("aria-current", "step");
  // Scroll just the code pane so playback never moves the page or its controls.
  const lineTop = activeLine.offsetTop;
  const lineBottom = lineTop + activeLine.offsetHeight;
  if (lineTop < source.scrollTop) source.scrollTop = lineTop;
  else if (lineBottom > source.scrollTop + source.clientHeight) source.scrollTop = lineBottom - source.clientHeight;
  $("step-title").textContent = step.title;
  $("mobile-line-number").textContent = "Line " + line;
  $("mobile-code").textContent = listing.lines[line - 1].trim();
  $("step-description").textContent = step.detail;
  $("note-icon").innerHTML = icon(step.result !== undefined ? "check" : "scan");
  $("step-counter").textContent = `Step ${position + 1} / ${frames.length}`;
  const timeline = $("timeline");
  timeline.max = frames.length;
  timeline.value = position + 1;
  timeline.style.setProperty("--progress", `${100 * position / (frames.length - 1)}%`);
  timeline.setAttribute("aria-valuetext", `Step ${position + 1} of ${frames.length}. ${step.title}. Code line ${line}.`);
  $("back").disabled = position === 0;
  $("next").disabled = position === frames.length - 1;
  renderPlay();
}
function renderPlay() {
  const label = timer !== null ? "Pause" : position === frames.length - 1 ? "Replay" : "Play";
  $("play").innerHTML = `${icon(timer !== null ? "pause" : "play")}${label}`;
}
function stop() {
  clearInterval(timer);
  timer = null;
}
function start() {
  stop();
  if (position === frames.length - 1) position = 0;
  timer = setInterval(() => {
    position++;
    if (position === frames.length - 1) stop();
    renderFrame();
  }, 1600 / Number($("speed").value));
  renderFrame();
}
function togglePlayback() {
  if (timer === null) start();
  else { stop(); renderPlay(); }
}
function seek(index) {
  stop();
  position = Math.max(0, Math.min(frames.length - 1, index));
  renderFrame();
}
for (const [id, solution] of Object.entries(approaches)) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.id = id;
  button.innerHTML = `${icon(solution.icon)}${solution.name}`;
  button.onclick = () => {
    if (approach === id) return;
    approach = id;
    renderApproach();
  };
  $("approaches").append(button);
}
$("play").onclick = togglePlayback;
$("language").onchange = () => {
  renderCode();
  renderFrame();
};
$("back").onclick = () => seek(position - 1);
$("next").onclick = () => seek(position + 1);
$("reset").onclick = () => seek(0);
$("timeline").oninput = e => seek(Number(e.target.value) - 1);
$("speed").onchange = () => { if (timer !== null) start(); };
document.addEventListener("keydown", event => {
  if ($("input-dialog").open || event.target.closest("button, input, select, a, textarea") || event.ctrlKey || event.altKey || event.metaKey) return;
  if (!["ArrowLeft", "ArrowRight", " "].includes(event.key)) return;
  event.preventDefault();
  if (event.key === " ") togglePlayback();
  else seek(position + (event.key === "ArrowRight" ? 1 : -1));
});

function fillEditor(value) {
  $("nums-input").value = value.nums.join(", ");
  $("target-input").value = value.target ?? "";
  $("input-error").hidden = true;
}
$("edit-input").onclick = () => {
  stop();
  renderPlay();
  fillEditor(input);
  $("preset").value = Object.keys(examples).find(key => examples[key].target === input.target && String(examples[key].nums) === String(input.nums)) || "custom";
  $("input-dialog").showModal();
};
$("preset").onchange = e => { if (examples[e.target.value]) fillEditor(examples[e.target.value]); };
for (const id of ["nums-input", "target-input"]) $(id).oninput = () => {
  $("preset").value = "custom";
  $("input-error").hidden = true;
};
$("close-dialog").onclick = $("cancel-input").onclick = () => $("input-dialog").close();
function readInput(raw, rawTarget) {
  const text = raw.trim().replace(/^\[([\s\S]*)\]$/, "$1");
  const parts = text.split(",").map(n => n.trim());
  if (parts.length < 2 || parts.length > 12) throw new Error("Use 2–12 integers so every array tile fits the walkthrough.");
  const isInteger = s => /^[+-]?\d+$/.test(s) && Math.abs(Number(s)) <= 1e9;
  if (!parts.every(isInteger) || !isInteger(rawTarget.trim())) throw new Error("Use whole numbers between −1,000,000,000 and 1,000,000,000 for the array and target.");
  const nums = parts.map(Number);
  const target = Number(rawTarget);
  let matches = 0;
  nums.forEach((value, i) => { for (let j = i + 1; j < nums.length; j++) if (value + nums[j] === target) matches++; });
  if (!matches) throw new Error("No pair reaches this target. Change the array or target and try again.");
  if (matches > 1) throw new Error("More than one pair reaches this target. Choose an input with exactly one matching pair.");
  return {nums, target};
}
$("input-form").onsubmit = event => {
  event.preventDefault();
  try {
    input = isRain ? readRainInput($("nums-input").value) : readInput($("nums-input").value, $("target-input").value);
  } catch (error) {
    $("input-error").textContent = error.message;
    $("input-error").hidden = false;
    return;
  }
  $("input-dialog").close();
  renderApproach();
};

function drawHero() {
  const canvas = $("hero-diagram");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const {width, height} = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.scale(ratio, ratio);
  const scale = Math.min(width / 490, height / 205);
  ctx.translate((width - 490 * scale) / 2, (height - 205 * scale) / 2);
  ctx.scale(scale, scale);
  function line(points, color, lineWidth = 1) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  function face(points, fill, edge) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = edge;
    ctx.stroke();
  }
  // Construct the illustration from the same isometric axes as its floor grid.
  ctx.lineJoin = "round";
  for (let k = -16; k < 17; k++) {
    line([[-150, 40 * k], [660, 40 * k - 255]], "#b0e7bc0e");
    line([[-150, 40 * k], [660, 40 * k + 403]], "#b0e7bc0b");
  }
  if (isRain) {
    drawRainHero(ctx, face, line);
    return;
  }
  const points = [[44, 102], [131, 75], [218, 48], [305, 21]];
  const palettes = [
    ["#c5edaf", "#80b998", "#99d0a3", "#c4e5b7", "#1a4937"],
    ["#a3dcac", "#6da88f", "#87be98", "#b2dcad", "#164a39"],
    ["#386b59", "#214b41", "#2c5b4d", "#72957e", "#d5e9d6"],
    ["#336455", "#1d453d", "#265246", "#648e77", "#c8e0ce"]
  ];
  points.forEach(([x, y], i) => {
    const [top, side, front, edge, ink] = palettes[i];
    const corners = [[x, y + 17], [x + 58, y - 1], [x + 93, y + 16], [x + 35, y + 34]];
    ctx.save();
    ctx.translate(0, 45);
    face(corners, "#06251c36", "#06251c10");
    ctx.restore();
    face([corners[0], corners[3], [x + 35, y + 72], [x, y + 55]], side, edge);
    face([corners[3], corners[2], [x + 93, y + 54], [x + 35, y + 72]], front, edge);
    face(corners, top, edge);
    ctx.save();
    ctx.transform(1, -.31, .62, .8, x + 48, y + 17);
    ctx.font = "bold 27px Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = ink;
    ctx.fillText([2, 7, 11, 15][i], 0, 0);
    ctx.restore();
    ctx.save();
    ctx.transform(1, -.31, 0, 1, x + 63, y + 49);
    ctx.font = "12px Consolas, monospace";
    ctx.fillStyle = i < 2 ? "#315e48" : "#aac7ae";
    ctx.textAlign = "center";
    ctx.fillText(`[${i}]`, 0, 0);
    ctx.restore();
  });
  line([[110, 170], [110, 179], [197, 152], [197, 143]], "#add7a9", 1.3);
  line([[154, 166], [172, 179], [202, 179]], "#add7a9", 1.3);
  ctx.fillStyle = "#c4e8bb";
  ctx.font = "13px Consolas, monospace";
  ctx.fillText("2 + 7 = 9", 212, 183);
}

renderApproach();
new ResizeObserver(drawHero).observe($("hero-diagram").parentElement);
