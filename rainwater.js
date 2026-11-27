const rainExamples = {
  basin: {name: "Wide basin", nums: [4, 2, 0, 3, 2, 5]},
  classic: {name: "Several pools", nums: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]},
  plateau: {name: "Level walls", nums: [3, 3, 1, 1, 3, 3]},
  slope: {name: "Rising ground", nums: [0, 1, 2, 3, 4]}
};

const rainSolutions = {
  pointers: {
    name: "Two pointers", icon: "pointers", time: "O(n)", space: "O(1)",
    description: "Work inward from both ends. If the left maximum is lower, the right side already has a wall at least that high. The next left bar either raises the wall or traps the difference. The same reasoning applies on the right.",
    timeReason: "Each turn settles one bar and moves one pointer inward. After n turns the pointers cross.",
    spaceReason: "Two indices, two running maxima, and the total occupy a fixed amount of extra memory.",
    trace: traceRainPointers
  },
  maxima: {
    name: "Prefix & suffix", icon: "array", time: "O(n)", space: "O(n)",
    description: "Record the tallest wall seen from each end at every index. The shorter of these two walls sets the waterline. Subtract the bar height to find the water above it.",
    timeReason: "Two passes build the wall heights and one pass sums the water. Each pass visits at most n bars.",
    spaceReason: "The left and right maximum arrays each store n heights, so their combined size grows linearly.",
    trace: traceRainMaxima
  },
  stack: {
    name: "Monotonic stack", icon: "layers", time: "O(n)", space: "O(n)",
    description: "Keep indices of bars in non-increasing height order. When a taller bar arrives, pop a basin floor. If a left wall remains, the gap between the two walls gains a horizontal layer of water.",
    timeReason: "Each index enters the stack once and can leave it only once. All the inner-loop pops together take at most n steps.",
    spaceReason: "A descending or flat landscape can keep all n indices on the stack at the same time.",
    trace: traceRainStack
  },
  brute: {
    name: "Brute force", icon: "pairs", time: "O(n²)", space: "O(1)",
    description: "For each bar, scan both sides to find their tallest walls. Water spills over the lower wall, so the depth here is that wall’s height minus the current bar’s height.",
    timeReason: "For each of n bars, the two outward scans together inspect the other n − 1 bars. The number of height comparisons grows quadratically.",
    spaceReason: "The scan keeps its indices, two maximum heights, and a running total. These take constant extra space.",
    trace: traceRainBrute
  }
};

// The walkthrough records history for rewind. Complexity notes describe the displayed solution.
function rainHistory(heights) {
  const frames = [];
  const water = heights.map(() => 0);
  function record(action, title, detail, pointers = [], memory = []) {
    frames.push({
      action, title, detail, pointers, water: water.slice(),
      total: water.reduce((sum, depth) => sum + depth, 0),
      memory: memory.map(([name, value]) => [name, Array.isArray(value) ? value.slice() : value])
    });
  }
  function finish(memory) {
    const total = water.reduce((sum, depth) => sum + depth, 0);
    record("done", "Return the trapped water", `The terrain holds ${units(total)} in total.`, [], memory);
    frames[frames.length - 1].result = total;
    return frames;
  }
  return {water, record, finish};
}

function units(n) { return `${n} ${n === 1 ? "unit" : "units"}`; }

function traceRainPointers(h) {
  const {water, record, finish} = rainHistory(h);
  let l = 0, r = h.length - 1, leftMax = 0, rightMax = 0;
  const memory = () => [["leftMax", leftMax], ["rightMax", rightMax]];
  const pointers = () => [[l, "l"], [r, "r"]];
  const mark = (action, title, detail) => record(action, title, detail, pointers(), memory());
  mark("init", "Start at the outer edges", `Place l at index 0 and r at index ${r}. Both running wall heights start at zero.`);
  while (l <= r) {
    const left = leftMax <= rightMax;
    mark("choose", left ? "Settle the left side" : "Settle the right side", left
      ? `leftMax (${leftMax}) ≤ rightMax (${rightMax}). Use the left wall to settle index ${l}.`
      : `rightMax (${rightMax}) < leftMax (${leftMax}). Use the right wall to settle index ${r}.`);
    const i = left ? l : r;
    if (left) leftMax = Math.max(leftMax, h[i]);
    else rightMax = Math.max(rightMax, h[i]);
    const wall = left ? leftMax : rightMax;
    mark(left ? "leftWall" : "rightWall", "Update the wall height", `Including the bar of height ${h[i]} at index ${i}, the ${left ? "left" : "right"} maximum is ${wall}.`);
    water[i] = wall - h[i];
    mark(left ? "leftFill" : "rightFill", water[i] ? "Fill this column" : "This bar stays dry",
      `At index ${i}, depth = ${wall} − ${h[i]} = ${water[i]}. Add ${units(water[i])} to the total.`);
    if (left) l++;
    else r--;
    mark(left ? "moveLeft" : "moveRight", "Move the pointer inward", l > r ? "The pointers have crossed. Every bar has been settled."
      : `Move ${left ? "l" : "r"} to index ${left ? l : r}. Indices ${l} through ${r} still need to be settled.`);
  }
  return finish(memory());
}

function traceRainMaxima(h) {
  const {water, record, finish} = rainHistory(h);
  const n = h.length, left = Array(n).fill(null), right = Array(n).fill(null);
  const memory = () => [["left", left], ["right", right]];
  const mark = (action, title, detail, i) => record(action, title, detail, [[i, "i"]], memory());
  left[0] = h[0];
  mark("first", "Seed the left maximum", `At the left edge the only wall is height ${h[0]}.`, 0);
  for (let i = 1; i < n; i++) {
    left[i] = Math.max(left[i - 1], h[i]);
    mark("prefix", "Carry the tallest wall from the left", `left[${i}] = max(${left[i-1]}, ${h[i]}) = ${left[i]}.`, i);
  }
  right[n - 1] = h[n - 1];
  mark("last", "Seed the right maximum", `At the right edge the only wall is height ${h[n-1]}.`, n - 1);
  for (let i = n - 2; i >= 0; i--) {
    right[i] = Math.max(right[i + 1], h[i]);
    mark("suffix", "Carry the tallest wall from the right", `right[${i}] = max(${right[i+1]}, ${h[i]}) = ${right[i]}.`, i);
  }
  for (let i = 0; i < n; i++) {
    const level = Math.min(left[i], right[i]);
    mark("level", "Find the lower wall", `At index ${i}, the lower of ${left[i]} and ${right[i]} sets the waterline at ${level}.`, i);
    water[i] = level - h[i];
    mark("fill", water[i] ? "Fill this column" : "This bar stays dry", `Waterline ${level} minus bar height ${h[i]} adds ${units(water[i])}.`, i);
  }
  return finish(memory());
}

function traceRainBrute(h) {
  const {water, record, finish} = rainHistory(h);
  for (let i = 0; i < h.length; i++) {
    let leftMax = h[i], rightMax = h[i];
    const mark = (action, title, detail, scan) => {
      const pointers = [[i, "i"]];
      if (scan !== undefined) pointers.push([scan, "j"]);
      record(action, title, detail, pointers, [["leftMax", leftMax], ["rightMax", rightMax]]);
    };
    mark("seed", "Start at this bar", `For index ${i}, start both wall heights at ${h[i]}.`);
    for (let j = i - 1; j >= 0; j--) {
      leftMax = Math.max(leftMax, h[j]);
      mark("scanLeft", "Scan to the left", `Compare height ${h[j]} at index ${j}. The tallest left wall so far is ${leftMax}.`, j);
    }
    for (let j = i + 1; j < h.length; j++) {
      rightMax = Math.max(rightMax, h[j]);
      mark("scanRight", "Scan to the right", `Compare height ${h[j]} at index ${j}. The tallest right wall so far is ${rightMax}.`, j);
    }
    const level = Math.min(leftMax, rightMax);
    mark("level", "Choose the lower wall", `The two walls reach ${leftMax} and ${rightMax}. Water can rise to ${level} at index ${i}.`);
    water[i] = level - h[i];
    mark("fill", water[i] ? "Fill this column" : "This bar stays dry", `${level} − ${h[i]} adds ${units(water[i])} above index ${i}.`);
  }
  return finish([]);
}

function traceRainStack(h) {
  const {water, record, finish} = rainHistory(h);
  const stack = [];
  const memory = () => [["stack", stack]];
  for (let i = 0; i < h.length; i++) {
    const mark = (action, title, detail, extra = []) => record(action, title, detail, [[i, "i"], ...extra], memory());
    mark("visit", "Inspect the next bar", `Index ${i} has height ${h[i]}. Check whether it rises above the stack top.`);
    while (stack.length && h[i] > h[stack[stack.length - 1]]) {
      const base = stack.pop();
      mark("pop", "Pop the basin floor", `Height ${h[i]} exceeds ${h[base]}. Pop index ${base} as the floor of a possible layer.`, [[base, "base"]]);
      if (!stack.length) {
        mark("open", "The basin is open on the left", "Popping the floor emptied the stack. This layer has no left wall to hold water.", [[base, "base"]]);
        break;
      }
      const left = stack[stack.length - 1], walls = [[left, "left"], [base, "base"]];
      mark("wall", "Find the left wall", `Index ${left} is now on top. It and index ${i} enclose the popped floor.`, walls);
      const width = i - left - 1, depth = Math.min(h[left], h[i]) - h[base];
      mark("width", "Measure the basin width", `There are ${i} − ${left} − 1 = ${width} columns strictly between the walls.`, walls);
      mark("depth", "Measure the new layer", `The lower wall reaches ${Math.min(h[left],h[i])}. Subtract the floor height ${h[base]} for a layer ${depth} high.`, walls);
      for (let j = left + 1; j < i; j++) water[j] += depth;
      mark("fill", depth ? "Add the horizontal layer" : "Equal heights add no layer", `${width} columns × ${depth} height adds ${units(width * depth)}. Previously counted layers stay in place.`, walls);
    }
    stack.push(i);
    mark("push", "Push the current index", `Keep ${i} on the stack as a possible wall or floor for the next bars.`);
  }
  return finish(memory());
}
