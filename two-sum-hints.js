// These checks recognize algorithm steps in a draft. They never execute editor text.
const twoSumHint = (() => {
  const startSteps = {
    onePass: "Create an empty map. Each entry will pair a number you have already visited with its original index.",
    twoPass: "Create a map from values to indices. In the first pass, give every array value an entry before you start looking for pairs.",
    brute: "Choose the first index with an outer loop. For each index i, a second loop will inspect only the positions after i.",
    pointers: "Pair each number with its original index. Once you sort those pairs by value, the indices will still point into the input array."
  };
  function normalize(source, language) {
    // Keep newlines so that a correction still points to the user's original line.
    const ignored = language === "python"
      ? /"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|#[^\n]*/g
      : /\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*|#[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g;
    let text = source.replace(/\r\n?/g, "\n").replace(ignored, part => part.replace(/[^\n]/g, " "))
      .toLowerCase().replace(/←/g, "=").replace(/−/g, "-").replace(/≠/g, "!=").replace(/≤/g, "<=");
    const names = new Map();
    const signature = text.match(/\b(?:two_sum|twosum)\s*\(([^)]*)\)/);
    if (signature) {
      const args = signature[1].split(",").map(s => s.trim()).filter(s => s !== "self");
      for (const [k, name] of ["nums", "target"].entries()) {
        const parameter = args[k]?.split(":")[0].match(/[a-z_]\w*/g)?.pop();
        if (parameter) names.set(parameter, name);
      }
    }
    text = text.replace(/[a-z_]\w*/g, word => names.get(word) ?? word);
    const indices = new Set(), values = new Set();
    for (const loop of text.matchAll(/\bfor\s+(?:\(\s*)?(\w+)\s*,\s*(\w+)\s*\)?\s+in\s+enumerate\s*\(\s*nums\s*\)/g)) {
      indices.add(loop[1]); values.add(loop[2]);
    }
    for (const loop of text.matchAll(/\bfor\s*(?:\(\s*(?:(?:int|size_t|auto)\s+)?(\w+)\s*=|(?:\s+each\s+index)?\s+(\w+)\s+(?:in\s+range|from|from\s+left))/g)) {
      indices.add(loop[1] || loop[2]);
    }
    for (const match of text.matchAll(/\b(\w+)\s*=\s*nums\s*\[\s*\w+\s*\]/g)) values.add(match[1]);
    for (const match of text.matchAll(/\bfor\s+(\w+)\s+in\s+nums\b/g)) values.add(match[1]);
    return {text, indices, values};
  }

  function pairReturn(text) {
    // Split at the outer comma only, including returns such as [seen[need], i].
    for (const match of text.matchAll(/\breturn\b[ \t]*(?:new\s+int\s*\[\s*\]\s*)?/g)) {
      let offset = match.index + match[0].length;
      const wrapped = "[{(".includes(text[offset] || "\0");
      if (wrapped) offset++;
      let depth = 0, start = offset;
      const parts = [];
      for (let i = offset; i <= text.length; i++) {
        const ch = text[i];
        if (depth === 0 && ((!wrapped && (!ch || /[;\n}]/.test(ch))) || (wrapped && ch && "]})".includes(ch)))) {
          parts.push(text.slice(start, i).trim());
          if (parts.length === 2) return {index: match.index, parts};
          break;
        }
        if (!ch) break;
        if (ch === "," && depth === 0) { parts.push(text.slice(start, i).trim()); start = i + 1; }
        else if ("([{".includes(ch)) depth++;
        else if (")]}".includes(ch)) depth--;
      }
    }
    return null;
  }

  function inspect(source, selected, language, input) {
    const {text, indices, values} = normalize(source, language);
    const find = pattern => text.match(pattern);
    const has = pattern => pattern.test(text);
    const progress = (evidence, next) => ({kind: "progress", title: "On track", body: `${evidence} ${next}`});
    const guide = body => ({kind: "guide", title: "Next step", body});
    const fix = (at, body) => {
      const line = text.slice(0, at.index).split("\n").length;
      return {kind: "fix", title: `Check line ${line}`, line, body};
    };
    const test = () => ({kind: "test", title: "Trace a test case", body:
      "Trace [3, 2, 4] with target 6 and check that your return contains indices 1 and 2 in either order. Then try [3, 3] with target 6 to check that two distinct positions are used."});
    const hasBody = text.split("\n").some(line => {
      const s = line.trim();
      return s && !/^[{};:\s]*$/.test(s) && !/^(?:pass\b|\.\.\.|import\b|from\b|using\b|(?:public\s+)?class\b|public:|(?:def\b|.*\b(?:two_sum|twosum)\s*\().*(?:\{|:)\s*$)/.test(s);
    });
    if (!hasBody) return {kind: "start", title: "First step", body: startSteps[selected]};

    const loops = [...text.matchAll(/\bfor\b/g)];
    const map = find(/\b(?:hashmap|unordered_map|dict|defaultdict)\b|\bempty\s+(?:map|dictionary|hash\s+(?:table|map))\b|\b\w+\s*=\s*\{(?:\s*\}|[^\n}]+\bfor\b)/);
    const sort = find(/\b(?:sorted|sort)\b/);
    const store = find(/\b(\w+)\.put\s*\(\s*([^,\n]+),\s*([^)\n]+)\)|\b(\w+)\s*\[\s*((?:target\s*-\s*)?\w+(?:\s*\[\s*\w+\s*\])?)\s*\]\s*=(?!=)\s*([^;\n}]+)/);
    const lookup = find(/\b(?:if|when)\b[^\n;]*(?:\bin\s+\w+|\bcontains(?:key)?\b|\.(?:find|count|get)\s*\()|\b\w+\.(?:get|getordefault|find)\s*\(|\b\w+\s*=\s*\w+\[[^\]\n]+\]\s+if present/);
    const singleScan = loops.length === 1 && store && lookup && lookup.index < store.index;
    const method = sort ? "pointers" : map
      ? (loops.length >= 2 || (selected === "twoPass" && !singleScan) ? "twoPass" : "onePass")
      : selected === "brute" || loops.length >= 2 ? "brute" : selected;
    const ret = pairReturn(text);
    const need = find(/\b(\w+)\s*=\s*target\s*-\s*(?![=>])[\w(]/);
    const currentValue = s => values.has(s.trim()) || /^nums\s*\[[^\]]+\]$/.test(s.trim());
    if (ret) {
      const [a,b] = ret.parts;
      if (a === b) return fix(ret, "Return two distinct indices. Repeating the same expression selects one position twice. Use the other index you found for the match.");
      if (/^\d+$/.test(a) && /^\d+$/.test(b)) return fix(ret, "These indices are fixed. The matching positions change with the input. Return the indices discovered by your search.");
      if (ret.parts.some(part => currentValue(part) || part === need?.[1] || /^target\s*-/.test(part))) {
        return fix(ret, "Return the positions of the two numbers. A value or its complement can be outside the array’s index range. Keep the index when you visit each value and return the two matching indices.");
      }
    }

    const limit = find(/\b\w+\s*<=\s*(?:nums\.length\b|nums\.size\s*\(\s*\)|len\s*\(\s*nums\s*\))(?=\s*[;):{])/);
    if (limit) return fix(limit, "Stop the index before the array length. For a four-element array the last valid index is 3, so visiting index 4 goes past the end.");
    const assign = language !== "pseudocode" && find(/\bif\s*\(?\s*[\w.+\-[\] \t]+?(?<![=!<>])=(?!=)\s*target\b/);
    if (assign) return fix(assign, "Use == to compare the sum with the target. A single = assigns a value. Only return the indices when the comparison succeeds.");
    const returnsOnMiss = find(/\bif\s*\(?\s*[\w.+\-[\] \t]+?\s*(?:!=|[<>]=?)\s*target\b[\s):{]*return\b/);
    if (returnsOnMiss) return fix(returnsOnMiss, "This branch returns a pair whose sum differs from the target. Return when the sum equals the target, and keep looking after a miss.");

    const matchedTarget = /\b(?:if|when)\b[^\n;]*(?:==|(?<![=!<>])=(?!=)|\bequals\b)\s*target\b|\b(?:if|when)\b[^\n;]*\btarget\s*==/;
    if (method === "brute") {
      const outer = [...indices][0];
      const inner = loops[1] && text.slice(loops[1].index);
      const innerStart = inner?.match(/^for\s*(?:\(\s*(?:int\s+)?\w+\s*=\s*(\w+)\s*;|\s+\w+\s+in\s+range\s*\(\s*(\w+)\s*,|\s+\w+\s+from\s+(\w+)\s+to)/);
      const startsAtSelf = outer && innerStart?.slice(1).includes(outer);
      const startsAtZero = innerStart?.slice(1).includes("0") || /^for\s+\w+\s+in\s+range\s*\(\s*(?:len\s*\(\s*nums\s*\)|\w+)\s*\)/.test(inner || "");
      const innerIndex = [...indices][1];
      if ((startsAtSelf || startsAtZero) && outer && innerIndex) {
        const hasGuard = new RegExp(String.raw`\b(?:${outer}\s*(?:!=|==)\s*${innerIndex}|${innerIndex}\s*(?:!=|==)\s*${outer})\b`).test(inner);
        if (!hasGuard) return fix(loops[1], `Start the inner loop at ${outer} + 1. Its current range includes the outer index, so one number can pair with itself. Then compare the two values with the target.`);
      }
      const repeated = find(/\bnums\s*\[\s*(\w+)\s*\]\s*\+\s*nums\s*\[\s*\1\s*\]/);
      if (repeated) return fix(repeated, "Read one value from each loop index. This sum uses the same position twice and can miss the pair at two different indices.");
      const indexSum = find(/\b(\w+)\s*\+\s*(\w+)\b(?=\s*(?:==?\s*target|[;\n]))/);
      if (indexSum && indices.has(indexSum[1]) && indices.has(indexSum[2])) return fix(indexSum,
        "Add the array values at these indices. Adding the positions themselves compares their addresses in the array with the target. Return the positions only after their values match.");
      const difference = find(/nums\s*\[[^\]]+\]\s*-\s*nums\s*\[[^\]]+\]/);
      if (difference) return fix(difference, "Add the two candidate values. Subtracting them tests their difference, which answers a different question. Compare their sum with the target.");
      if (!loops.length) return guide(startSteps.brute);
      if (loops.length === 1) return progress("You have a loop for the first index.", "Add an inner loop starting one position later so each candidate pair has distinct indices.");
      const comparesPartner = has(/\bif\b[^\n;]*nums\s*\[[^\]]+\]\s*==?\s*target\s*-\s*nums\s*\[[^\]]+\]/);
      if (!comparesPartner && !has(/nums\s*\[[^\]]+\]\s*\+\s*nums\s*\[[^\]]+\]/)) return progress("You have two loops for choosing a pair.", "Inside the inner loop, add the values at the two indices and compare their sum with the target.");
      if (!comparesPartner && !has(matchedTarget)) {
        if (ret && !/\b(?:if|when)\b/.test(text.slice(0, ret.index))) return fix(ret, "The loops return this pair before checking its sum. Compare the two values with the target and return the indices only inside the matching branch.");
        return progress("Your draft adds the two indexed values.", "Compare their sum with the target before returning the pair.");
      }
      if (!ret) return progress("You compare the pair’s sum with the target.", "Inside the matching branch, return the two loop indices.");
      return test();
    }

    if (method === "pointers") {
      const sortedValues = find(/(?:arrays\.sort|sorted|sort)\s*\(\s*nums\s*(?:[),]|\.\s*begin\s*\()|\bnums\.sort\s*\(/);
      if (sortedValues && !has(/\b(?:enumerate|indexof|index_map|hashmap|unordered_map)\b|\.index\s*\(/)) return fix(sortedValues,
        "Keep each value with its original index before sorting. In [3, 2, 4], sorting moves 2 from index 1 to index 0. Sort the value–index pairs so you can return the original positions.");
      const same = find(/\bwhile\s*\(?\s*(\w+)\s*<=\s*(\w+)/);
      if (same) return fix(same, "Keep the left pointer strictly below the right pointer. When they meet, both refer to the same element. Stop before testing that pair.");
      const bounds = find(/\bwhile\s*\(?\s*(\w+)\s*<\s*(\w+)/);
      if (ret && bounds && ret.parts.includes(bounds[1]) && ret.parts.includes(bounds[2])) return fix(ret,
        "These pointers are positions in the sorted sequence. Read the original index stored in each endpoint pair before returning.");
      // Use the identifiers from the loop so setup counters cannot count as pointer moves.
      let movesInward = false;
      if (bounds) {
        const [, left, right] = bounds;
        const inc = name => String.raw`(?:\+\+\s*${name}\b|\b${name}\s*(?:\+\+|\+=\s*1|=\s*${name}\s*\+\s*1))`;
        const dec = name => String.raw`(?:--\s*${name}\b|\b${name}\s*(?:--|-=\s*1|=\s*${name}\s*-\s*1))`;
        const wrongSmall = find(new RegExp(String.raw`\bif\s*\(?\s*\w+\s*<\s*target[\s):{]*(?:${dec(right)}|${dec(left)}|${inc(right)})`));
        const wrongLarge = find(new RegExp(String.raw`\bif\s*\(?\s*\w+\s*>\s*target[\s):{]*(?:${inc(left)}|${inc(right)}|${dec(left)})`));
        if (wrongSmall || wrongLarge) return fix(wrongSmall || wrongLarge, wrongSmall
          ? "The sum is too small. With ascending pairs, advance the left pointer to try a larger value."
          : "The sum is too large. With ascending pairs, move the right pointer left to try a smaller value.");
        const scan = text.slice(bounds.index);
        movesInward = new RegExp(inc(left)).test(scan) && new RegExp(dec(right)).test(scan);
      }
      const paired = has(/\benumerate\s*\(|\bemplace_back\s*\(|\.(?:index|second)\b|\[\s*i\s*\]\s*\[\s*1\s*\]\s*=|original index/);
      if (!sort) return paired ? progress("Your draft keeps original indices with the values.", "Sort the pairs by value before comparing endpoints.") : guide(startSteps.pointers);
      if (!bounds) return progress("Your draft includes a sorting step.", "Place one pointer at each end and compare pairs while the left index is below the right.");
      if (!has(matchedTarget)) return progress("You scan between two distinct endpoints.", "Add their values and compare the sum with the target.");
      if (!ret) return progress("You check for a matching sum.", "Return the original index from each pair when the sum matches.");
      if (!movesInward) return progress("You have a return for a matching pair.", "After a miss, advance the left pointer for a small sum or move the right pointer back for a large sum. Otherwise the scan can repeat the same pair.");
      return test();
    }

    const complement = find(/\btarget\s*-\s*([\w]+(?:\s*\[[^\]]+\])?)/);
    const badMath = find(/(?:\btarget\s*\+\s*(?:\w+)|\b(?:nums\s*\[[^\]]+\]|\w+)\s*[+-]\s*target\b)/);
    const value = input.nums[0], missing = input.target - value;
    if (badMath || (complement && indices.has(complement[1]))) return fix(badMath || complement,
      `Compute target minus the current array value. With target ${input.target} and value ${value}, the missing partner is ${missing}. Look up that partner in your map.`);
    const maybeIndex = find(/\b(\w+)\s*=\s*\w+\.get\s*\(\s*\w+\s*\)/);
    if (language === "python" && maybeIndex) {
      const truthy = find(new RegExp(String.raw`\bif\s+${maybeIndex[1]}\s*:`));
      if (truthy) return fix(truthy, "Index 0 is a valid match, and Python treats it as false. Test whether the lookup result is not None before returning its index.");
    }
    const guardKey = find(/\bif\s+(?:\(\s*)?(\w+(?:\s*\[\s*\w+\s*\])?)\s+(?:not\s+)?in\b|\b(?:containskey|contains|count|find)\s*\(\s*(\w+(?:\s*\[\s*\w+\s*\])?)\s*\)|\bif\s+\w+\s+contains\s+(\w+)/);
    const checkedKey = guardKey?.slice(1).find(Boolean);
    const savedKey = store && (store[2] || store[5]).trim();
    if (checkedKey && currentValue(checkedKey) && savedKey && currentValue(savedKey)) return fix(guardKey,
      "This map holds numbers you have already visited. Looking up the current value searches for a duplicate. Look up target minus the current value to find its partner.");
    const returnsOnAbsent = find(/\bif\s+(?:\w+\s+not\s+in\s+\w+|\(?\s*!\s*\w+\.(?:containskey|count)\s*\([^)\n]+\))[\s):{]*return\b/);
    if (returnsOnAbsent) return fix(returnsOnAbsent, "This return runs when the partner is missing. Read its index only in the branch where the lookup succeeds. On a miss, keep scanning.");
    if (store) {
      const key = (store[2] || store[5]).trim(), stored = (store[3] || store[6]).trim();
      if (indices.has(key) && currentValue(stored)) return fix(store, "Reverse the map entry. The lookup uses a number as its key and needs its index as the result. Store the current value as the key and its position as the value.");
      if (currentValue(stored)) return fix(store, "Store the current index as the map value. Saving the number itself loses its position, which is what you need to return.");
    }
    const distinct = [...indices].some(i => new RegExp(String.raw`!=\s*${i}\b|\b${i}\s*!=`).test(text));
    if (method === "onePass" && store && lookup && store.index < lookup.index && !distinct) return fix(store,
      "Check for the partner before saving the current value. With [3, 3] and target 6, an early insert can make the first 3 find its own index. Move the insert after the lookup.");
    if (ret && complement && !/\b(?:if|when)\b/.test(text.slice(0, ret.index)) && ret.parts.some(s => /(?:\w+\s*\[|\.(?:get|at)\s*\()/.test(s))) {
      return fix(ret, "Check that the map contains the partner before returning. On the first iteration the partner can be absent, so a direct read can fail or produce an invalid index.");
    }
    if (method === "twoPass" && ret && lookup && !distinct) return fix(ret,
      "Check that the stored index differs from the current one before returning. Your map already includes every element, so a value equal to half the target could match itself.");
    const wrongContainer = language === "python" && find(/\b(?:seen|index|indices|positions|lookup|map|cache)\s*=\s*(?:\[\s*\]|(?:list|set)\(\s*\))/);
    if (wrongContainer && !map) return fix(wrongContainer, "Use a dictionary to map each number to its index. An empty list has no index slots, and a set only records membership. Initialize the lookup with {}.");
    if (!map && !store && !lookup) return guide(loops.length
      ? "You have started iterating over the input. Create a value-to-index map outside that loop so entries survive between iterations."
      : startSteps[method]);
    if (!loops.length) return progress("You have a map for the lookup.", method === "twoPass" ? "Loop over the array and store each value’s index in the map." : "Loop over the array with an index so you can keep track of where each number came from.");
    if (method === "twoPass" && !store && !has(/=\s*\{[^\n}]+\bfor\b/)) return guide("In the first pass, store each value with its original index. The second pass will look up the missing partner in that completed map.");
    if (method === "twoPass" && loops.length < 2) return progress("Your first pass records indices.", "Add a second pass over the array to look for each value’s complement.");
    if (!complement) return progress("You have the scan in place.", `Compute target minus the current value. For value ${value} in this input, the partner you want is ${missing}.`);
    if (!lookup) return progress("You calculate the missing partner from the target.", "Check whether the map contains that partner before reading its stored index.");
    if (method === "twoPass" && !distinct) return progress("Your draft looks up a candidate in the completed map.", "Check that the lookup succeeded and that its index differs from the current index.");
    if (!ret) return progress("You have a map lookup for the pair.", "When you find a valid partner, return its stored index and the current index.");
    if (!store && method === "onePass") return progress("You have a return for a match.", "On a miss, save the current number and its index so a later lookup can find it.");
    return test();
  }
  return inspect;
})();
