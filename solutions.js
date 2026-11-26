const solutions = {
  onePass: {
    name: "Hash map", icon: "grid", time: "O(n)", space: "O(n)",
    description: "Scan once, saving each value and its index. Before saving a value, look for its complement in the map. A hit gives you two distinct indices. Each lookup takes constant time on average.",
    timeReason: "Each of the n numbers is visited at most once. A hash lookup and an insertion each take constant time on average, giving linear expected time.",
    spaceReason: "The map stores one index per distinct value seen so far. In the worst case it holds up to n entries.",
    trace: traceOnePass
  },
  brute: {
    name: "Brute force", icon: "pairs", time: "O(n²)", space: "O(1)",
    description: "Fix one index and check every value to its right. Starting the inner loop at i + 1 keeps the indices distinct and checks each pair only once.",
    timeReason: "If the match comes last, the loops check (n − 1) + (n − 2) + … + 1 pairs. That total, n(n − 1)/2, grows quadratically.",
    spaceReason: "The two indices and the running sum take a fixed amount of memory, regardless of the array length.",
    trace: traceBrute
  },
  twoPass: {
    name: "Two-pass map", icon: "layers", time: "O(n)", space: "O(n)",
    description: "First map every value to an index. Then scan again for a complement. Since the map includes the current value, check that the stored index differs from i before returning.",
    timeReason: "Building the map takes n insertions. The second pass makes up to n lookups. With constant-time hash operations on average, the two passes together take linear expected time.",
    spaceReason: "The map holds one index for each distinct number. If all n numbers differ, it stores n entries.",
    trace: traceTwoPass
  },
  pointers: {
    name: "Two pointers", icon: "pointers", time: "O(n log n)", space: "O(n)",
    description: "Sort value–index pairs, keeping each original index. A sum below the target lets you discard the smallest value. A sum above it lets you discard the largest. Return the original indices when the sum matches.",
    timeReason: "Sorting n value–index pairs takes O(n log n) time. Each pointer then moves only inward, so the O(n) scan adds less work than the sort.",
    spaceReason: "Keeping each value with its original index creates n pairs. This copy takes linear extra space, and the scan needs only two pointers and a sum.",
    trace: tracePointers
  }
};

// Frames own their map and pointer snapshots, so stepping back restores exact state.
// A pointer always refers to an original index, even when a frame reorders the tiles.
function traceOnePass(nums, target) {
  const frames = [];
  const seen = new Map();
  for (const [i, num] of nums.entries()) {
    const need = target - num;
    const add = (action, title, detail, extra = {}) => frames.push({
      action, title, detail, entries: [...seen], pointers: [[i, "i"]], ...extra
    });
    add("visit", i === 0 ? "Inspect the first value" : "Move to the next value",
      `Read ${num} at index ${i}. ${i === 0 ? "The hash map starts empty." : "The map holds the values from earlier indices."}`);
    add("complement", "Find the complement", `${target} − (${num}) = ${need}. Look for ${need} to complete the pair.`);
    if (seen.has(need)) {
      const j = seen.get(need);
      add("lookup", "The complement is in the map", `${need} was stored at index ${j}. Pair it with ${num} at index ${i}.`, {mapKey: need});
      add("found", "Return the two indices", `${nums[j]} + ${num} = ${target}. The answer is [${j}, ${i}].`,
        {result: [j, i], pointers: [[j, "match"], [i, "i"]], mapKey: need});
      return frames;
    }
    add("lookup", "Check the hash map", `The map has no entry for ${need}. Save the current value for a later lookup.`);
    seen.set(num, i);
    add("store", "Store the current value", `Map ${num} to index ${i} so a later value can find it.`, {mapKey: num});
  }
  return frames;
}

function traceBrute(nums, target) {
  const frames = [];
  for (let i = 0; i < nums.length - 1; i++) {
    frames.push({action: "first", title: "Choose the first index", detail: `Hold ${nums[i]} at index ${i} and scan the values to its right.`, pointers: [[i, "i"]]});
    for (let j = i + 1; j < nums.length; j++) {
      const total = nums[i] + nums[j];
      const add = (action, title, detail, extra = {}) => frames.push({
        action, title, detail, pointers: [[i, "i"], [j, "j"]], ...extra
      });
      add("second", "Choose the second index", `Test ${nums[j]} at index ${j} with the value at index ${i}.`);
      add("sum", "Add the two values", `${nums[i]} + ${nums[j]} = ${total}.`, {total});
      const match = total === target;
      add("compare", "Compare with the target", match ? `${total} matches the target ${target}.` : `${total} differs from ${target}. Continue to the next pair.`, {total});
      if (match) {
        add("found", "Return the two indices", `${nums[i]} + ${nums[j]} = ${target}. The answer is [${i}, ${j}].`, {total, result: [i, j]});
        return frames;
      }
    }
  }
  return frames;
}

function traceTwoPass(nums, target) {
  const frames = [];
  const index = new Map();
  const add = (i, action, title, detail, extra = {}) => frames.push({
    action, title, detail, entries: [...index], pointers: [[i, "i"]], ...extra
  });
  for (const [i, num] of nums.entries()) {
    add(i, "build", "Build the index map", `Read ${num} at index ${i} during the first pass.`);
    const previous = index.get(num);
    index.set(num, i);
    add(i, "store", "Record the index", previous === undefined
      ? `Store ${num} with index ${i}.`
      : `Update the entry for ${num} from index ${previous} to index ${i}.`, {mapKey: num});
  }
  for (const [i, num] of nums.entries()) {
    const need = target - num;
    add(i, "visit", "Scan the indexed array", `Read ${num} at index ${i} during the second pass.`);
    add(i, "complement", "Find the complement", `${target} − (${num}) = ${need}.`);
    const j = index.get(need);
    add(i, "lookup", "Look up the complement", j === undefined ? `${need} is absent, so there is no candidate index.` : `The map gives index ${j} for ${need}.`, {mapKey: need});
    const match = j !== undefined && i !== j;
    add(i, "distinct", "Check the candidate index", match ? `Indices ${i} and ${j} are distinct.`
      : j === i ? `Index ${i} is the current index. Skip this candidate.` : "There is no candidate index. Continue scanning.", {mapKey: need});
    if (match) {
      add(i, "found", "Return the two indices", `${num} + ${nums[j]} = ${target}. The answer is [${i}, ${j}].`,
        {result: [i, j], pointers: [[i, "i"], [j, "match"]], mapKey: need});
      return frames;
    }
  }
  return frames;
}

function tracePointers(nums, target) {
  const order = nums.map((_, i) => i).sort((a, b) => nums[a] - nums[b] || a - b);
  const frames = [{action: "sort", title: "Sort the value–index pairs", detail: "Arrange values from smallest to largest. The number above each tile retains its original index.", order, pointers: []}];
  let l = 0;
  let r = nums.length - 1;
  const add = (action, title, detail, extra = {}) => frames.push({action, title, detail, order,
    pointers: [[order[l], "l"], [order[r], "r"]], ...extra});
  add("place", "Place the two pointers", "Start l at the smallest value and r at the largest.");
  while (l < r) {
    const i = order[l], j = order[r];
    const total = nums[i] + nums[j];
    add("bounds", "Check the pointer bounds", `Sorted positions ${l} and ${r} are distinct. Test this pair.`);
    add("sum", "Add the endpoints", `${nums[i]} + ${nums[j]} = ${total}.`, {total});
    add("compare", "Compare with the target", `${total} ${total === target ? "matches" : "differs from"} the target ${target}.`, {total});
    if (total === target) {
      add("found", "Return the original indices", `${nums[i]} + ${nums[j]} = ${target}. Their original indices are [${i}, ${j}].`, {total, result: [i, j]});
      return frames;
    }
    add("direction", "Choose which pointer moves", total < target
      ? `${total} is too small. A larger left value is needed.`
      : `${total} is too large. A smaller right value is needed.`, {total});
    if (total < target) {
      l++;
      add("left", "Move the left pointer", `Advance l to sorted position ${l}, holding r in place.`);
    } else {
      r--;
      add("right", "Move the right pointer", `Move r back to sorted position ${r}, holding l in place.`);
    }
  }
  return frames;
}
