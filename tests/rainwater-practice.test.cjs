const test = require("node:test");
const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");
const vm = require("node:vm");

const scripts = ["listings.js", "rainwater.js", "rainwater-listings.js", "rainwater-hints.js",
  "practice-parser.js", "practice-runtime.js", "practice-runner.js"];
const {rainListings,rainExamples,rainHint,practiceCases,judgePractice} = vm.runInNewContext(
  scripts.map(f => readFileSync(join(__dirname, "..", f), "utf8")).join("\n") +
  "\n;({rainListings,rainExamples,rainHint,practiceCases,judgePractice})"
);
const cases = practiceCases(rainExamples, rainExamples.basin);
const run = (source, language = "python", inputs = cases) => judgePractice(source, language, inputs, "trapping-rain-water");
const hint = (source, method, language = "python") => rainHint(source, method, language, rainExamples.basin);
const edgeCases = [
  {name:"Single bar", nums:[100000], expected:0},
  {name:"Descending", nums:[4,3,2,1], expected:0},
  {name:"Tall walls", nums:[100000, ...Array(14).fill(0), 100000], expected:1400000},
  {name:"Nested basins", nums:[5,1,4,0,2,5], expected:13}
];
for (const [method, languages] of Object.entries(rainListings)) {
  for (const [language, listing] of Object.entries(languages)) {
    test(`${method} / ${language} handles the four presets and edge terrains`, () => {
      const source = listing.lines.join("\n");
      const result = run(source, language, [...cases, ...edgeCases]);
      assert.equal(result.error, undefined);
      assert.deepEqual(Array.from(result.results, row => row.expected), [9,6,4,0,...edgeCases.map(row=>row.expected)]);
      for (const row of result.results) assert.equal(row.status, "Passed", `${row.name}: ${row.error || row.actual}`);
      assert.equal(hint("", method, language).kind, "start");
      for (let n = 1; n < listing.lines.length; n++) {
        const step = hint(listing.lines.slice(0,n).join("\n"), method, language);
        assert.notEqual(step.kind, "fix", `Line ${n}: ${step.body}`);
      }
      assert.equal(hint(source, method, language).kind, "test");
    });
  }
}

test("reads the current draft and gives a first step, a next step and a specific correction", () => {
  const starter = "def trap(height):\n    # return [0] or sort the height array\n    pass";
  assert.match(hint(starter, "pointers").body, /pointer at each end/);
  const partial = "def trap(height):\n    l, r = 0, len(height) - 1";
  assert.equal(hint(partial,"pointers").kind, "progress");
  assert.match(hint(partial,"pointers").body, /loop/);
  const fixed = hint(partial + "\n    height.sort()", "pointers");
  assert.equal(fixed.line, 3);
  assert.match(fixed.body, /original order/);
});

for (const [method, line, reason] of [
  ["brute", "level = max(leftMax, rightMax)", /shorter wall/],
  ["maxima", "right[i] = max(right[i-1], height[i])", /next index/],
  ["pointers", "r += 1", /inward/],
  ["stack", "width = i - left", /width/],
  ["stack", "stack.append(height[i])", /current index/],
  ["stack", "total += width + depth", /multiply/i]
]) {
  test(`${method} corrects ${line} in the student's draft`, () => {
    const result = hint(`def trap(height):\n    # working draft\n    ${line}`, method);
    assert.equal(result.kind, "fix");
    assert.equal(result.line, 3);
    assert.match(result.body, reason);
  });
}

test("shares preset cases with Edit input, appends a distinct custom terrain and grades scalar volume", () => {
  assert.equal(practiceCases(rainExamples, {nums:[4,2,0,3,2,5]}).length,4);
  const inputs = practiceCases(rainExamples,{nums:[3,0,3]});
  assert.deepEqual(Array.from(inputs, c=>c.name), ["Wide basin","Several pools","Level walls","Rising ground","Custom input"]);
  const rows = run("return 0","python",inputs).results;
  assert.deepEqual(Array.from(rows,r=>r.status),["Wrong answer","Wrong answer","Wrong answer","Passed","Wrong answer"]);
  assert.equal(rows.at(-1).expected,3);
  for (const draft of ["return False","return [0]","pass"]) assert.equal(run(draft).results[3].status,"Wrong answer");
});

test("runs different implementations with typed and renamed parameters", () => {
  const python = `from typing import List
class Solution:
    def trap(self, bars: List[int]) -> int:
        return sum(min(max(bars[:i+1]), max(bars[i:])) - h for i,h in enumerate(bars))`;
  assert.ok(run(python).results.every(r=>r.status === "Passed"));
  const cpp = rainListings.stack.cpp.lines.join("\n").replace("vector<int> stack;", "std::stack<int> indices;")
    .replaceAll("stack.", "indices.").replaceAll(".back()", ".top()").replace(".pop_back()", ".pop()").replace(".push_back(i)", ".push(i)");
  assert.ok(run("class Solution { public:\n" + cpp + "\n};", "cpp").results.every(r=>r.status === "Passed"));
  const java = rainListings.stack.java.lines.join("\n").replace("Deque<Integer> stack = new ArrayDeque<>()", "Stack<Integer> stack = new Stack<>()");
  assert.ok(run("import java.util.*;\nclass Solution {\n"+java+"\n}", "java").results.every(r=>r.status === "Passed"));
});

test("reports parse errors, runtime errors and a non-terminating draft", () => {
  assert.match(run("def two_sum(nums,target): return 0").error, /trap/);
  assert.match(run("def trap(a,b): return 0").error, /one parameter/);
  const rows = run("stack = []\nif len(height) == 5: return stack.pop()\nreturn 9").results;
  assert.equal(rows[0].status,"Passed");
  assert.match(rows[3].error,/Line 2.*empty stack/i);
  assert.match(run("while True: pass").results[0].error,/step limit/i);
});

test("uses the original height array to judge a draft that changes it", () => {
  const row = run("height.sort()\nreturn 0").results[0];
  assert.equal(row.status,"Wrong answer");
  assert.equal(row.expected,9);
  assert.equal(row.nums.join(","),"4,2,0,3,2,5");
});
