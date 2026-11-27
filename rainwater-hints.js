// Give one line-specific correction or the next step for the selected rainwater approach.
function rainHint(source, approach, language, input) {
  const comments = language === "python" || language === "pseudocode"
    ? /"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|#[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g
    : /\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*|#[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g;
  const clean = source.replace(/\r\n?/g, "\n").replace(comments, s => s.replace(/[^\n]/g, " "));
  const signature = clean.match(/\btrap\s*\(\s*(?:self\s*,\s*)?([^,)\n]+)/i);
  const parameter = signature?.[1].split(":")[0].match(/[a-z_]\w*/gi)?.at(-1)?.toLowerCase();
  const lines = clean.toLowerCase().split("\n").map(line => line
    .replace(/^.*?\btrap\s*\([^)]*\)\s*(?:->\s*[\w[\], ]+)?\s*[:{]/, "")
    .replace(/^\s*(?:import\b|using\b|from\b).*|^\s*(?:public\s+)?class\s+\w+\s*[:{]|^\s*public:/, "")
    .replace(/[a-z_]\w*/g, word => word === parameter ? "height" : word.replace(/_/g, ""))
    .replace(/math\.|std::/g, "").replace(/←/g, "=").replace(/−/g, "-").replace(/×/g, "*")
    .replace(/≤/g, "<=").replace(/≥/g, ">=").trim());
  const text = lines.join("\n");
  const seen = pattern => pattern.test(text);
  const start = {
    pointers: "Place a pointer at each end of the height array. Track the tallest wall seen from each side and start the water total at zero.",
    maxima: "Make a left-maximum array and a right-maximum array, each with one entry per bar. Seed the outermost entries with their edge heights.",
    stack: "Create an empty stack for bar indices and set the water total to zero. Storing indices lets you measure the distance between two walls.",
    brute: "Start a water total at zero and loop over the bars. For each bar, find the tallest wall on each side."
  };
  if (!lines.some(s => s && !/^(?:[{};:\s]+|pass|\.\.\.)$/.test(s))) {
    return {kind:"start", title:"First step", body:start[approach]};
  }

  const instructions = lines.filter(s => s && !/^[{};:]+$/.test(s));
  if (instructions.length === 1 && /^return\s+-?\d+\s*[;}\s]*$/.test(instructions[0])) {
    const line = lines.indexOf(instructions[0]) + 1;
    return {kind:"fix", title:`Check line ${line}`, line, body:"A fixed return gives the same volume for every terrain. [2, 0, 2] holds two units and a rising slope holds zero. Compute the total from the heights."};
  }

  const corrections = [
    [/\breturn\s+(?:new\s+int\s*\[|\[|height\s*[;}]?$)/,
      "Return one whole number for the total trapped water. Accumulate the water above the bars and return that total after the scan."],
    [/\b(?:arrays\.sort\s*\(\s*height\b|sort\s*\(\s*height\.begin|height\.sort\s*\()/,
      "Sorting the terrain changes which walls enclose each bar. Use the original order when measuring water."],
    [/\b(?:level|waterline|boundedheight)\s*=\s*max\(\s*(?!0\b)(?:\w+(?:\[[^\]]+\])?)\s*,|\bmax\([^;\n]+\)\s*-\s*height\s*\[(?:base|bottom)\]/,
      "The shorter wall sets the waterline. Using the taller wall counts water that spills over the shorter one. Take the minimum of the two wall heights."],
    [/(?:\+=|=\s*(?:total|water|ans|result)\s*\+)\s*height\[[^\]]+\]\s*-\s*(?:level|waterline|\w*max\w*)\b/,
      "Subtract the bar height from the waterline. Reversing that difference can make trapped water negative."],
    [/\b(?:total|water|ans|result)\s*=(?!=)\s*(?:level|waterline|\w*max\w*)\s*-\s*height\[/,
      "Add this column’s depth to your running total. Assigning the depth directly discards the water counted in earlier columns."]
  ];
  if (approach === "pointers") corrections.push(
    [/\b(?:l|left|lo)\s*--|--\s*(?:l|left|lo)\b|\b(?:l|left|lo)\s*-=\s*1|\b(?:r|right|hi)\s*\+\+|\+\+\s*(?:r|right|hi)\b|\b(?:r|right|hi)\s*\+=\s*1|move (?:l|left) one place left|move (?:r|right) one place right/,
      "Move the settled pointer inward. Advance the left index or decrease the right one so the unprocessed interval shrinks."],
    [/\b(?:rightmax|leftmax|maxleft|maxright|lmax|rmax)\s*=\s*min\(/,
      "A running wall tracks the tallest bar seen on that side. Update it with max before calculating the depth."],
    [/\b(?:r|right|hi)\s*=\s*(?:len\(height\)|height\.length|height\.size\(\))\s*[;}]?$/,
      "The array length is one past the last index. Start the right pointer at the length minus one before reading its bar."]
  );
  if (approach === "maxima") corrections.push(
    [/\b(\w+)\[(\w+)\]\s*=\s*min\(\s*(?:\1\[|height\[)/,
      "Each prefix or suffix entry stores the tallest wall seen so far. Use max to build these arrays, then min to combine the two sides."],
    [/\b(?:left|prefix|leftmax)\[(\w+)\]\s*=\s*max\(\s*(?:left|prefix|leftmax)\[\1\s*\+\s*1\]/,
      "A prefix maximum depends on the previous index. Read i − 1 while scanning left to right."],
    [/\b(?:right|suffix|rightmax)\[(\w+)\]\s*=\s*max\(\s*(?:right|suffix|rightmax)\[\1\s*-\s*1\]/,
      "A suffix maximum depends on the next index. Read i + 1 while scanning right to left."]
  );
  if (approach === "stack") corrections.push(
    [/\bwhile\s*\(?\s*(?:\w+\.(?:empty|isempty)\(\)|not\s+\w+)\s*(?:&&|and)\s*height\[/,
      "Check that the stack contains an index before comparing with its top. An empty stack has no bar to use as the basin floor."],
    [/\b(?:width|distance|gap)\s*=\s*\w+\s*-\s*\w+\s*[;}]?$/,
      "Exclude both wall columns. The width between indices left and i is i − left − 1. Adjacent walls enclose zero columns."],
    [/\.(?:append|push|pushback)\(\s*height\[|\bpush height\[/,
      "Push the current index onto the stack. The height alone loses the position you need to calculate basin width."],
    [/\b(?:depth|boundedheight|layer)\s*=\s*min\(.+\)\s*-\s*(?:base|bottom)\s*[;}]?$/,
      "The popped index identifies the basin floor. Subtract the height at that index to measure the layer’s depth."],
    [/(?:\+=|=\s*\w+\s*\+)\s*(?:width\s*\+\s*depth|depth\s*\+\s*width)\b/,
      "Multiply width by depth. A layer two columns wide and three units deep holds six units of water."]
  );
  for (const [pattern, body] of corrections) {
    const index = lines.findIndex(s => pattern.test(s));
    if (index >= 0) return {kind:"fix", title:`Check line ${index + 1}`, line:index + 1, body};
  }

  // Each milestone names the evidence and the coding step that produces it.
  const heightRead = /\bheight\s*\[/;
  const steps = {
    pointers: [
      [/\b(?:l|left|lo|low|start)\b[^\n]*=\s*(?:0|first index)/, "You’ve placed the left pointer.", start.pointers],
      [/\bwhile\b/, "You have a loop over the remaining interval.", "Use a loop to scan inward from the two ends."],
      [/\bif\s*\(?\s*[\w[\]]+\s*[<>]=?\s*[\w[\]]+/, "You compare the two sides.", "Compare the two running walls or the two endpoint heights to choose a side to settle."],
      [/\bmax\s*\(|\b(?:if|while)\b[^\n]*height\[[^\]]+\]\s*>\s*\w+/, "Your draft updates a wall height.", "Update that side’s maximum with the current bar."],
      [/(?:\+=|=\s*\w+\s*\+)[^\n;]*-\s*height\[/, "You add water above the current bar.", "Add the difference between that side’s maximum and its bar height to the total."],
      [/\b(?:l|left|lo|low|start)\s*(?:\+\+|\+=\s*1|=\s*\w+\s*\+\s*1)|\+\+\s*\w+|move \w+ one place right/, "You advance the left pointer.", "After settling the left bar, advance the left pointer toward the center."],
      [/\b(?:r|right|hi|high|end)\s*(?:--|-=\s*1|=\s*\w+\s*-\s*1)|--\s*\w+|move \w+ one place left/, "You move the right pointer inward.", "Complete the other branch so either side can contribute water, and move the settled pointer inward."]
    ],
    maxima: [
      [/\bnew\s+int\[|=\s*\[0\]|create arrays|\bvector\s*<|\b(?:left|prefix)\s*\[/, "You have storage for wall heights.", start.maxima],
      [/\bmax\([^;\n]*(?:-\s*1\]|height\[)/, "You carry a maximum from the left.", "Fill the prefix maxima from left to right, comparing each bar with the previous maximum."],
      [/\bmax\([^;\n]*\+\s*1\]/, "You carry a maximum back from the right.", "Fill suffix maxima from the rightmost bar toward index zero, using the entry at i + 1."],
      [/\bmin\(/, "You choose the lower of the two walls.", "At each index, take the minimum of its prefix and suffix maxima."],
      [/(?:\+=|=\s*\w+\s*\+)[^\n;]*-\s*height\[/, "You accumulate water column by column.", "Subtract the current height from the waterline and add the depth to the total."]
    ],
    stack: [
      [/\b(?:stack|deque|arraydeque|vector)\b|=\s*\[\]/, "You have a stack for pending bars.", start.stack],
      [/\bfor\b/, "You scan the bars in order.", "Scan from left to right so the current index can close a basin."],
      [/\.pop(?:back)?\s*\(|pop the top index/, "You pop a candidate basin floor.", "While the current bar rises above the stack top, pop that index as a possible floor."],
      [/\bif\b[^\n]*(?:empty|not\s+\w+|\w+\s*(?:\)|:))/, "You check whether a left wall remains.", "After popping a floor, check whether the stack still contains a left wall before reading the top."],
      [/\b\w+\s*-\s*\w+\s*-\s*1/, "You count the columns between the walls.", "Measure the interior width as current index minus left wall index minus one."],
      [/\bmin\(/, "You use the shorter wall to bound the layer.", "Compute the layer depth from the shorter wall height minus the popped floor height."],
      [/(?:\+=|=\s*\w+\s*\+)[^\n;]*\*/, "You add the area of the bounded layer.", "Multiply the layer’s width by its depth and add that amount to the total."],
      [/\.(?:push|pushback|append)\(|push \w+ onto/, "You save the current index for future basins.", "After handling the pops, push the current index as a future wall or floor."]
    ],
    brute: [
      [/\bfor\b/, "You visit each candidate column.", start.brute],
      [heightRead, "You read the terrain height.", "Start the two wall searches at the current bar so an exposed bar stays dry."],
      [/\bmax\(/, "You search for a tallest wall.", "Scan both sides of the column and keep the tallest height found in each direction."],
      [/\bmin\(/, "You use the lower wall as the waterline.", "Take the smaller of the two side maxima to find the waterline above this bar."],
      [/(?:\+=|=\s*\w+\s*\+)[^\n;]*-\s*height\[/, "You add the column’s depth to the total.", "Subtract the bar height from the waterline and add the difference to the total."]
    ]
  };
  const milestones = steps[approach];
  let evidence = seen(/\b(?:total|ans|water|result)\s*=\s*0\b/) ? "Your water total starts at zero." : "";
  for (const [pattern, found, next] of milestones) {
    if (!seen(pattern)) return {kind:evidence ? "progress" : "guide", title:evidence ? "On track" : "Next step", body:[evidence,next].filter(Boolean).join(" ")};
    evidence = found;
  }
  if (!seen(/\breturn\s+[\w(]+/)) return {kind:"progress", title:"On track", body:`${evidence} Return the accumulated water after the scan finishes.`};
  return {kind:"test", title:"Trace a test case", body:`Try your draft on height = [${input.nums.join(", ")}]. Click Run to compare your total with the expected volume for each terrain.`};
}
