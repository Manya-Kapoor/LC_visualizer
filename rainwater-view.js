function setupRainPage() {
  document.title = "Trapping Rain Water · Code Astra";
  document.querySelector('meta[name="description"]').content = "Trace Trapping Rain Water through four algorithms with an interactive elevation map and synchronized code in Code Astra.";
  document.body.classList.add("rain-page");
  $("problem-title").textContent = "Trapping Rain Water";
  document.querySelector(".source-link").href = "https://leetcode.com/problems/trapping-rain-water/description/";
  document.querySelector(".problem-id").textContent = "PROBLEM 042";
  document.querySelector(".easy").innerHTML = "<i></i>Hard";
  document.querySelector(".hero-text p").textContent = "Each bar is one unit wide. Find how much water the terrain holds after it rains.";
  document.querySelector(".tags").innerHTML = "<span>Array</span><span>Two pointers</span><span>Monotonic stack</span>";
  document.querySelector("footer span:last-child").textContent = "Trapping Rain Water workspace";
  $("array-label").textContent = "ELEVATION MAP";
  $("array-row").setAttribute("aria-label", "Terrain heights, recorded water depths and pointers by index");
  $("array-row").className = "terrain-scroll";
  document.querySelector(".array-caption").insertAdjacentHTML("afterend",
    '<div class="terrain-key"><span><i class="ground-key"></i>Terrain height</span><span><i class="water-key"></i>Water depth</span></div>');
  document.querySelector(".dialog-intro").textContent = "Choose a landscape or enter your own bar heights. Each bar is one unit wide.";
  $("preset").innerHTML = '<option value="custom">Custom input</option>' + Object.entries(rainExamples).map(([key, example]) =>
    `<option value="${key}">${example.name}</option>`).join("");
  document.querySelector('label[for="nums-input"]').textContent = "Heights";
  $("array-help").textContent = "Enter 1–16 whole numbers from 0 to 100,000, separated by commas.";
  $("target-input").disabled = true;
  $("target-field").hidden = true;
}

function readRainInput(raw) {
  const values = raw.trim().replace(/^\[([\s\S]*)\]$/, "$1").split(",").map(token => token.trim());
  if (values.length > 16) throw new Error("Use at most 16 bars so you can follow the terrain one step at a time.");
  if (!values.every(token => /^\d+$/.test(token) && Number(token) <= 100000)) {
    throw new Error("Enter 1–16 whole-number heights between 0 and 100,000.");
  }
  return {nums: values.map(Number)};
}

function renderRainFrame(step, heights) {
  $("target-chip").innerHTML = `Water <b>${units(step.total)}</b>`;
  const peak = Math.max(1, ...heights);
  const columnWidth = Math.max(35, String(peak).length * 9 + 10);
  const columns = heights.map((height, i) => {
    const labels = step.pointers.filter(([idx]) => idx === i).map(([, label]) => label);
    const depth = step.water[i];
    const groundPercent = height * 100 / peak, waterPercent = depth * 100 / peak;
    const summary = `Index ${i}, height ${height}, trapped water ${units(depth)}${labels.length ? ", " + labels.join(" and ") : ""}`;
    return `<div class="terrain-column${labels.length ? " is-current" : ""}" role="listitem" aria-label="${summary}" title="${summary}">
      <div class="terrain-track">
        <div class="terrain-ground" style="height:${groundPercent}%"></div>
        ${depth ? `<div class="terrain-water" style="bottom:${groundPercent}%;height:${waterPercent}%">${waterPercent >= 15 ? `+${depth}` : ""}</div>` : ""}
        <span class="terrain-height${height === 0 || groundPercent < 15 ? " near-zero" : ""}">${height}</span>
      </div>
      <span class="terrain-index">[${i}]</span><span class="terrain-pointer">${labels.join(" · ")}</span>
    </div>`;
  }).join("");
  $("array-row").innerHTML = `<div class="terrain-chart" role="list" style="--bars:${heights.length};--bar-min:${columnWidth}px">${columns}</div>`;
  $("memory-label").textContent = step.result !== undefined ? "FINAL STATE" : "WORKING STATE";
  $("memory-hint").textContent = step.memory.some(([label]) => label === "stack") ? "indices · top at right" : "";
  $("memory-contents").innerHTML = step.memory.map(([name, value]) => {
    const display = Array.isArray(value) ? `[${value.map(v => v ?? "·").join(", ")}]` : value;
    return `<span class="memory-entry">${name} = ${display}</span>`;
  }).join("") || `<span class="memory-entry hot">total = ${step.total}</span>`;
}

function drawRainHero(ctx, face, line) {
  const heights = [4, 2, 0, 3, 2, 5];
  const depths = [0, 2, 4, 1, 2, 0];
  // Project a cross section of the wide basin. Each translucent block is one water unit.
  for (let i = heights.length - 1; i >= 0; i--) {
    for (let layer = 0; layer < heights[i] + depths[i]; layer++) {
      const wet = layer >= heights[i];
      const x = 93 + i * 46, y = 161 - i * 6 - layer * 21;
      const edge = wet ? "#92dbe1" : "#a9c8a7";
      face([[x, y], [x, y-20], [x+44, y-26], [x+44, y-6]], wet ? "#62aab5" : "#6e9d80", edge);
      face([[x-17, y-10], [x-17, y-30], [x, y-20], [x, y]], wet ? "#438c9a" : "#4d806c", edge);
      face([[x, y-20], [x-17, y-30], [x+27, y-36], [x+44, y-26]], wet ? "#a1e0df" : "#bddeb0", edge);
    }
  }
  line([[137, 161], [137, 168], [318, 144], [318, 137]], "#b0dcd1", 1.3);
  ctx.font = "13px Consolas, monospace";
  ctx.fillStyle = "#d2f0df";
  ctx.fillText("2 + 4 + 1 + 2 = 9 units", 155, 186);
}
