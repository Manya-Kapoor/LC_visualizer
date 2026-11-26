const solutions = {
  onePass: {
    name: "Hash map", icon: "grid", time: "O(n)", space: "O(n)",
    description: "Scan once, saving each value and its index. Before saving a value, look for its complement in the map. A hit gives you two distinct indices. Each lookup takes constant time on average.",
    code: [
      "def two_sum(nums, target):",
      "    seen = {}",
      "",
      "    for i, num in enumerate(nums):",
      "        need = target - num",
      "        if need in seen:",
      "            return [seen[need], i]",
      "        seen[num] = i"
    ],
    trace: traceOnePass
  },
  brute: {
    name: "Brute force", icon: "pairs", time: "O(n²)", space: "O(1)",
    description: "Fix one index and check every value to its right. Starting the inner loop at i + 1 keeps the indices distinct and checks each pair only once.",
    code: [
      "def two_sum(nums, target):",
      "    for i in range(len(nums) - 1):",
      "        for j in range(i + 1, len(nums)):",
      "            total = nums[i] + nums[j]",
      "            if total == target:",
      "                return [i, j]"
    ],
    trace: traceBrute
  },
  twoPass: {
    name: "Two-pass map", icon: "layers", time: "O(n)", space: "O(n)",
    description: "First map every value to an index. Then scan again for a complement. Since the map includes the current value, check that the stored index differs from i before returning.",
    code: [
      "def two_sum(nums, target):",
      "    index = {}",
      "    for i, num in enumerate(nums):",
      "        index[num] = i",
      "",
      "    for i, num in enumerate(nums):",
      "        need = target - num",
      "        j = index.get(need)",
      "        if j is not None and j != i:",
      "            return [i, j]"
    ],
    trace: traceTwoPass
  },
  pointers: {
    name: "Two pointers", icon: "pointers", time: "O(n log n)", space: "O(n)",
    description: "Sort value–index pairs, keeping each original index. A sum below the target lets you discard the smallest value. A sum above it lets you discard the largest. Return the original indices when the sum matches.",
    code: [
      "def two_sum(nums, target):",
      "    pairs = sorted((v, i) for i, v",
      "                   in enumerate(nums))",
      "    l, r = 0, len(pairs) - 1",
      "    while l < r:",
      "        total = pairs[l][0] + pairs[r][0]",
      "        if total == target:",
      "            return [pairs[l][1], pairs[r][1]]",
      "        if total < target:",
      "            l += 1",
      "        else:",
      "            r -= 1"
    ],
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
    const add = (line, title, detail, extra = {}) => frames.push({
      line, title, detail, entries: [...seen], pointers: [[i, "i"]], ...extra
    });
    add(4, i === 0 ? "Inspect the first value" : "Move to the next value",
      `Read ${num} at index ${i}. ${i === 0 ? "The hash map starts empty." : "The map holds the values from earlier indices."}`);
    add(5, "Find the complement", `${target} − (${num}) = ${need}. Look for ${need} to complete the pair.`);
    if (seen.has(need)) {
      const j = seen.get(need);
      add(6, "The complement is in the map", `${need} was stored at index ${j}. Pair it with ${num} at index ${i}.`, {mapKey: need});
      add(7, "Return the two indices", `${nums[j]} + ${num} = ${target}. The answer is [${j}, ${i}].`,
        {result: [j, i], pointers: [[j, "seen[need]"], [i, "i"]], mapKey: need});
      return frames;
    }
    add(6, "Check the hash map", `The map has no entry for ${need}. Save the current value for a later lookup.`);
    seen.set(num, i);
    add(8, "Store the current value", `Map ${num} to index ${i} so a later value can find it.`, {mapKey: num});
  }
  return frames;
}

function traceBrute(nums, target) {
  const frames = [];
  for (let i = 0; i < nums.length - 1; i++) {
    frames.push({line: 2, title: "Choose the first index", detail: `Hold ${nums[i]} at index ${i} and scan the values to its right.`, pointers: [[i, "i"]]});
    for (let j = i + 1; j < nums.length; j++) {
      const total = nums[i] + nums[j];
      const add = (line, title, detail, extra = {}) => frames.push({
        line, title, detail, pointers: [[i, "i"], [j, "j"]], ...extra
      });
      add(3, "Choose the second index", `Test ${nums[j]} at index ${j} with the value at index ${i}.`);
      add(4, "Add the two values", `${nums[i]} + ${nums[j]} = ${total}.`, {total});
      const match = total === target;
      add(5, "Compare with the target", match ? `${total} matches the target ${target}.` : `${total} differs from ${target}. Continue to the next pair.`, {total});
      if (match) {
        add(6, "Return the two indices", `${nums[i]} + ${nums[j]} = ${target}. The answer is [${i}, ${j}].`, {total, result: [i, j]});
        return frames;
      }
    }
  }
  return frames;
}

function traceTwoPass(nums, target) {
  const frames = [];
  const index = new Map();
  const add = (i, line, title, detail, extra = {}) => frames.push({
    line, title, detail, entries: [...index], pointers: [[i, "i"]], ...extra
  });
  for (const [i, num] of nums.entries()) {
    add(i, 3, "Build the index map", `Read ${num} at index ${i} during the first pass.`);
    const previous = index.get(num);
    index.set(num, i);
    add(i, 4, "Record the index", previous === undefined
      ? `Store ${num} with index ${i}.`
      : `Update the entry for ${num} from index ${previous} to index ${i}.`, {mapKey: num});
  }
  for (const [i, num] of nums.entries()) {
    const need = target - num;
    add(i, 6, "Scan the indexed array", `Read ${num} at index ${i} during the second pass.`);
    add(i, 7, "Find the complement", `${target} − (${num}) = ${need}.`);
    const j = index.get(need);
    add(i, 8, "Look up the complement", j === undefined ? `${need} is absent, so get returns None.` : `The map gives index ${j} for ${need}.`, {mapKey: need});
    const match = j !== undefined && i !== j;
    add(i, 9, "Check the candidate index", match ? `Indices ${i} and ${j} are distinct.`
      : j === i ? `Index ${i} is the current index. Skip this candidate.` : "There is no candidate index. Continue scanning.", {mapKey: need});
    if (match) {
      add(i, 10, "Return the two indices", `${num} + ${nums[j]} = ${target}. The answer is [${i}, ${j}].`,
        {result: [i, j], pointers: [[i, "i"], [j, "j"]], mapKey: need});
      return frames;
    }
  }
  return frames;
}

function tracePointers(nums, target) {
  const order = nums.map((_, i) => i).sort((a, b) => nums[a] - nums[b] || a - b);
  const frames = [{line: 2, title: "Sort the value–index pairs", detail: "Arrange values from smallest to largest. The number above each tile retains its original index.", order, pointers: []}];
  let l = 0;
  let r = nums.length - 1;
  const add = (line, title, detail, extra = {}) => frames.push({line, title, detail, order,
    pointers: [[order[l], "l"], [order[r], "r"]], ...extra});
  add(4, "Place the two pointers", "Start l at the smallest value and r at the largest.");
  while (l < r) {
    const i = order[l], j = order[r];
    const total = nums[i] + nums[j];
    add(5, "Check the pointer bounds", `Sorted positions ${l} and ${r} are distinct. Test this pair.`);
    add(6, "Add the endpoints", `${nums[i]} + ${nums[j]} = ${total}.`, {total});
    add(7, "Compare with the target", `${total} ${total === target ? "matches" : "differs from"} the target ${target}.`, {total});
    if (total === target) {
      add(8, "Return the original indices", `${nums[i]} + ${nums[j]} = ${target}. Their original indices are [${i}, ${j}].`, {total, result: [i, j]});
      return frames;
    }
    add(9, "Choose which pointer moves", total < target
      ? `${total} is too small. A larger left value is needed.`
      : `${total} is too large. A smaller right value is needed.`, {total});
    if (total < target) {
      l++;
      add(10, "Move the left pointer", `Advance l to sorted position ${l}, holding r in place.`);
    } else {
      r--;
      add(12, "Move the right pointer", `Move r back to sorted position ${r}, holding l in place.`);
    }
  }
  return frames;
}
