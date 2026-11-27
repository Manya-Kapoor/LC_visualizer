const test = require("node:test");
const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");
const vm = require("node:vm");

const scripts = ["solutions.js", "listings.js", "practice-parser.js", "practice-runtime.js", "two-sum-runner.js"];
const {codeListings, twoSumExamples, practiceCases, judgeTwoSum} = vm.runInNewContext(
  scripts.map(file => readFileSync(join(__dirname, "..", file), "utf8")).join("\n") +
  "\n;({codeListings,twoSumExamples,practiceCases,judgeTwoSum})"
);
const cases = practiceCases(twoSumExamples, twoSumExamples.classic);
const judge = (source, language = "python", inputs = cases) => judgeTwoSum(source, language, inputs);
const allPass = report => {
  assert.equal(report.error, undefined);
  for (const row of report.results) assert.equal(row.status, "Passed", `${row.name}: ${row.error || row.actual}`);
};

for (const [approach, languages] of Object.entries(codeListings)) {
  for (const [language, listing] of Object.entries(languages)) {
    test(`${approach} executes in ${language} on each Edit input example`, () => {
      const report = judge(listing.lines.join("\n"), language);
      allPass(report);
      assert.deepEqual(Array.from(report.results, r => r.name), ["Classic pair","Later match","Duplicate values","Negative values"]);
    });
  }
}

test("adds the active custom case once and accepts either index order", () => {
  const current = {nums:[10,9,1,-8],target:2};
  const inputs = practiceCases(twoSumExamples,current);
  assert.equal(inputs.length, 5);
  assert.equal(practiceCases(twoSumExamples,{nums:[3,2,4], target:6}).length, 4);
  const report = judge(codeListings.brute.python.lines.join("\n").replace("return [i, j]", "return j, i"), "python", inputs);
  allPass(report);
  assert.equal(report.results.at(-1).actual, "[3, 0]");
  assert.equal(report.results.at(-1).name, "Custom input");
});

test("executes the submitted return, including partially passing and invalid answers", () => {
  const rows = judge("def two_sum(nums, target): return [0, 1]").results;
  assert.deepEqual(Array.from(rows, r => r.status), ["Passed","Wrong answer","Passed","Wrong answer"]);
  for (const answer of ["[0, 0]","[-1, 2]","[0, 99]","[0]","[1, 0, 2]","[True, False]","3","None"]) {
    assert.ok(judge(`return ${answer}`).results.every(r => r.status === "Wrong answer"), answer);
  }
});

test("uses original inputs for judging when the draft mutates its argument", () => {
  const report = judge("nums.sort()\nreturn [0, 2]");
  assert.equal(report.results[1].status, "Wrong answer");
  assert.equal(report.results[1].nums.join(), "3,2,4");
  assert.equal(report.results[1].expected.join(), "1,2");
});

test("reports a runtime error on just the affected case and continues", () => {
  const draft = "def two_sum(nums,target):\n    if len(nums) == 2: return [nums[20],0]\n    return [0,1]";
  const rows = judge(draft).results;
  assert.equal(rows[0].status,"Passed");
  assert.match(rows[2].error,/Line 2: Index 20/);
  assert.equal(rows[3].status,"Wrong answer");
});

test("gives actionable diagnostics for blank drafts, syntax and unsupported operations", () => {
  assert.match(judge("").error,/write a solution/i);
  assert.match(judge("def two_sum(nums,target):\n    return [0,1").error,/line 2/i);
  assert.match(judge("public int[] twoSum(int[] a, int b){return [0,1];}", "java").error,/Java array/);
  assert.match(judge("return missing(nums)").results[0].error,/unsupported|supported operations/i);
  assert.match(judge("pass").results[0].actual,/no return/i);
});

test("limits non-terminating loops and excessive allocations", () => {
  assert.match(judge("while True: pass").results[0].error,/step limit/i);
  assert.match(judge("return list(range(99999999))").results[0].error,/collection/i);
});

test("accepts LeetCode class wrappers, typed Python signatures and renamed parameters", () => {
  const py = codeListings.onePass.python.lines.join("\n").replace("def two_sum(nums, target):","def twoSum(self, numbers: List[int], goal: int) -> List[int]:")
    .replaceAll("enumerate(nums)","enumerate(numbers)").replace("target - num","goal - num");
  allPass(judge("from typing import List\nclass Solution:\n" + py.split("\n").map(s => "    "+s).join("\n")));
  allPass(judge("import java.util.*;\nclass Solution {\n" + codeListings.brute.java.lines.join("\n") + "\n}", "java"));
  const cpp = codeListings.brute.cpp.lines.join("\n").replace("return {i, j};","return std::vector<int>{j, i};");
  allPass(judge("#include <vector>\nusing namespace std;\nclass Solution { public:\n" + cpp + "\n};", "cpp"));
});

test("executes a new dictionary-comprehension solution, independently of the selected approach", () => {
  const code = `def twoSum(a, goal):
    positions = {value: idx for idx, value in enumerate(a)}
    for i in range(len(a)):
        k = goal - a[i]
        if k not in positions or i == positions[k]: continue
        return positions[k], i`;
  allPass(judge(code));
});

test("runs edited pseudocode instead of replaying the walkthrough answer", () => {
  const wrong = codeListings.brute.pseudocode.lines.join("\n").replace("RETURN [i, j]", "RETURN [i, i]");
  assert.ok(judge(wrong,"pseudocode").results.every(r => r.status === "Wrong answer"));
});

test("recognizes Java and C++ array initializers and rejects a comma in place of a pair", () => {
  const java = codeListings.brute.java.lines.join("\n").replace("return new int[]{i, j};", "int[] pair = {j, i}; return pair;");
  const cpp = codeListings.brute.cpp.lines.join("\n").replace("nums.size()", "(int) nums.size()").replace("return {i, j};", "vector<int> result{j, i}; return result;");
  allPass(judge(java, "java"));
  allPass(judge(cpp, "cpp"));
  assert.ok(judge("public int[] twoSum(int[] nums, int target){return 0,1;}", "java").error);
  assert.ok(judge("vector<int> twoSum(vector<int>& nums,int target){return (0,1);}", "cpp").error);
});
