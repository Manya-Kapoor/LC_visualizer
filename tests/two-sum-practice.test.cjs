const test = require("node:test");
const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");
const vm = require("node:vm");

const read = file => readFileSync(join(__dirname, "..", file), "utf8");
const listings = vm.runInNewContext(read("listings.js") + "\ncodeListings");
const inspect = vm.runInNewContext(read("two-sum-hints.js") + "\ntwoSumHint");
const input = {nums: [3, 2, 4], target: 6};
const check = (draft, approach = "onePass", language = "python") => inspect(draft, approach, language, input);

for (const [approach, variants] of Object.entries(listings)) {
  for (const [language, {lines}] of Object.entries(variants)) {
    test(`${approach} / ${language} recognizes an empty draft and the reference approach`, () => {
      assert.equal(check("", approach, language).kind, "start");
      for (let n = 1; n < lines.length; n++) {
        const hint = check(lines.slice(0, n).join("\n"), approach, language);
        assert.notEqual(hint.kind, "fix", `Prefix of ${n} lines: ${hint.body}`);
      }
      const hint = check(lines.join("\n"), approach, language);
      assert.equal(hint.kind, "test", hint.body);
    });
  }
}

test("comments and the starter signature do not count as progress", () => {
  assert.equal(check("def two_sum(nums, target):\n    # for i in nums: return [i,i]\n    pass").kind, "start");
  assert.equal(check("/* Arrays.sort(nums); */\npublic int[] twoSum(int[] nums, int target) {\n}", "pointers", "java").kind, "start");
});

const scan = "seen = {}\nfor i, value in enumerate(nums):";
test("suggests the next missing map step as a draft grows", () => {
  for (const [draft, next] of [
    ["seen = {}", /loop over/i],
    [scan, /target minus/i],
    [scan + "\n    need = target - value", /contains that partner/i],
    [scan + "\n    need = target - value\n    if need in seen:", /return its stored index/i]
  ]) {
    const hint = check(draft);
    assert.equal(hint.kind, "progress");
    assert.match(hint.body, next);
  }
});

const pythonMap = listings.onePass.python.lines.join("\n");
const pythonBrute = listings.brute.python.lines.join("\n");
const pythonTwoPass = listings.twoPass.python.lines.join("\n");
const pythonPointers = listings.pointers.python.lines.join("\n");
const mistakes = [
  ["onePass", scan + "\n    need = target + value", 3, /target minus/],
  ["onePass", scan + "\n    need = target - i", 3, /current array value/],
  ["onePass", pythonMap.replace("need in seen", "num in seen"), 6, /duplicate/],
  ["onePass", pythonMap.replace("need in seen", "need not in seen"), 6, /missing/],
  ["onePass", pythonMap.replace("need = target", "seen[num] = i\n        need = target"), 5, /before saving/],
  ["onePass", pythonMap.replace("[seen[need], i]", "[need, num]"), 7, /positions/],
  ["onePass", pythonMap.replace("seen[num] = i", "seen[i] = num"), 8, /map entry/],
  ["brute", pythonBrute.replace("range(i + 1,", "range(i,"), 3, /pair with itself/],
  ["brute", pythonBrute.replace("range(i + 1, len(nums))", "range(len(nums))"), 3, /pair with itself/],
  ["brute", pythonBrute.replace("nums[i] + nums[j]", "nums[i] + nums[i]"), 4, /same position/],
  ["brute", pythonBrute.replace("nums[i] + nums[j]", "i + j"), 4, /values at/],
  ["brute", pythonBrute.replace("== target", "!= target"), 5, /differs/],
  ["twoPass", pythonTwoPass.replace(" and j != i", ""), 10, /differs/],
  ["onePass", "seen = []", 1, /dictionary/],
  ["onePass", scan + "\n    need = target - value\n    return [seen[need], i]", 4, /before returning/],
  ["onePass", scan + "\n    match = seen.get(need)\n    if match:\n        return [match, i]", 4, /Index 0/],
  ["pointers", "nums.sort()", 1, /original index/],
  ["pointers", pythonPointers.replace("l < r:", "l <= r:"), 5, /strictly below/],
  ["pointers", pythonPointers.replace("[pairs[l][1], pairs[r][1]]", "[l, r]"), 8, /sorted sequence/],
  ["pointers", pythonPointers.replace("l += 1", "r -= 1"), 9, /too small/]
];
for (const [approach, draft, line, reason] of mistakes) {
  test(`${approach} explains ${reason.source} on the original line`, () => {
    const hint = check(draft, approach);
    assert.equal(hint.kind, "fix", hint.body);
    assert.equal(hint.title, `Check line ${line}`);
    assert.equal(hint.line, line);
    assert.match(hint.body, reason);
  });
}

test("recognizes common Java, C++ and pseudocode mistakes", () => {
  for (const language of ["java", "cpp", "pseudocode"]) {
    const {lines, lineFor} = listings.onePass[language];
    const draft = lines.join("\n").replace(/target [-−] nums\[i\]/, "target + nums[i]");
    const hint = check(draft, "onePass", language);
    assert.equal(hint.kind, "fix");
    assert.equal(hint.line, lineFor.complement);
    assert.match(hint.body, /target minus/);
  }
});

test("allows equivalent bounds and complement comparisons", () => {
  const java = listings.onePass.java.lines.join("\n").replace("< nums.length", "<= nums.length - 1");
  assert.equal(check(java, "onePass", "java").kind, "test");
  const brute = pythonBrute.replace("total = nums[i] + nums[j]", "").replace("total == target", "nums[i] == target - nums[j]");
  assert.equal(check(brute, "brute").kind, "test");
});

test("accepts renamed input and scan variables", () => {
  const renamed = pythonMap.replace(/\bnums\b/g, "numbers").replace(/\btarget\b/g, "goal")
    .replace(/\bi\b/g, "position").replace(/\bnum\b/g, "current").replace(/\bseen\b/g, "positions");
  assert.equal(check(renamed).kind, "test");
});

test("recognizes the alternative of storing missing partners as keys", () => {
  const draft = pythonMap.replace("if need in seen", "if num in seen").replace("seen[need], i", "seen[num], i").replace("seen[num] = i", "seen[need] = i");
  assert.equal(check(draft).kind, "test");
});
