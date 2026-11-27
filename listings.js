// A trailing @action connects a source line to a language-independent trace step.
function listing(source) {
  const lineFor = {};
  const lines = source.trimEnd().split("\n").map((line, index) =>
    line.replace(/ +@(\w+)$/, (_, action) => {
      lineFor[action] = index + 1;
      return "";
    })
  );
  return {lines, lineFor};
}

const codeListings = {
  onePass: {
    java: listing(`public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();

    for (int i = 0; i < nums.length; i++) { @visit
        int need = target - nums[i]; @complement
        if (seen.containsKey(need)) { @lookup
            return new int[]{seen.get(need), i}; @found
        }
        seen.put(nums[i], i); @store
    }
    return new int[0];
}`),
    cpp: listing(`vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;

    for (int i = 0; i < nums.size(); ++i) { @visit
        int need = target - nums[i]; @complement
        if (seen.count(need)) { @lookup
            return {seen.at(need), i}; @found
        }
        seen[nums[i]] = i; @store
    }
    return {};
}`),
    python: listing(`def two_sum(nums, target):
    seen = {}

    for i, num in enumerate(nums): @visit
        need = target - num @complement
        if need in seen: @lookup
            return [seen[need], i] @found
        seen[num] = i @store`),
    pseudocode: listing(`seen ← empty map

FOR each index i from left to right @visit
    need ← target − nums[i] @complement
    IF seen contains need @lookup
        RETURN [seen[need], i] @found
    seen[nums[i]] ← i @store`)
  },
  brute: {
    java: listing(`public int[] twoSum(int[] nums, int target) {
    int n = nums.length;
    for (int i = 0; i < n - 1; i++) { @first
        for (int j = i + 1; j < n; j++) { @second
            int total = nums[i] + nums[j]; @sum
            if (total == target) { @compare
                return new int[]{i, j}; @found
            }
        }
    }
    return new int[0];
}`),
    cpp: listing(`vector<int> twoSum(vector<int>& nums, int target) {
    int n = nums.size();
    for (int i = 0; i < n - 1; ++i) { @first
        for (int j = i + 1; j < n; ++j) { @second
            int total = nums[i] + nums[j]; @sum
            if (total == target) { @compare
                return {i, j}; @found
            }
        }
    }
    return {};
}`),
    python: listing(`def two_sum(nums, target):
    for i in range(len(nums) - 1): @first
        for j in range(i + 1, len(nums)): @second
            total = nums[i] + nums[j] @sum
            if total == target: @compare
                return [i, j] @found`),
    pseudocode: listing(`n ← length of nums
FOR i FROM 0 TO n − 2 @first
    FOR j FROM i + 1 TO n − 1 @second
        total ← nums[i] + nums[j] @sum
        IF total = target @compare
            RETURN [i, j] @found`)
  },
  twoPass: {
    java: listing(`public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> index = new HashMap<>();
    for (int i = 0; i < nums.length; i++) { @build
        index.put(nums[i], i); @store
    }

    for (int i = 0; i < nums.length; i++) { @visit
        int need = target - nums[i]; @complement
        int j = index.getOrDefault(need, -1); @lookup
        if (j >= 0 && j != i) { @distinct
            return new int[]{i, j}; @found
        }
    }
    return new int[0];
}`),
    cpp: listing(`vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> index;
    for (int i = 0; i < nums.size(); ++i) { @build
        index[nums[i]] = i; @store
    }

    for (int i = 0; i < nums.size(); ++i) { @visit
        int need = target - nums[i]; @complement
        auto match = index.find(need); @lookup
        if (match != index.end() && match->second != i) { @distinct
            return {i, match->second}; @found
        }
    }
    return {};
}`),
    python: listing(`def two_sum(nums, target):
    index = {}
    for i, num in enumerate(nums): @build
        index[num] = i @store

    for i, num in enumerate(nums): @visit
        need = target - num @complement
        j = index.get(need) @lookup
        if j is not None and j != i: @distinct
            return [i, j] @found`),
    pseudocode: listing(`index ← empty map
FOR each index i from left to right @build
    index[nums[i]] ← i @store

FOR each index i from left to right @visit
    need ← target − nums[i] @complement
    j ← index[need] if present, otherwise NONE @lookup
    IF j ≠ NONE AND j ≠ i @distinct
        RETURN [i, j] @found`)
  },
  pointers: {
    java: listing(`public int[] twoSum(int[] nums, int target) {
    int n = nums.length;
    int[][] pairs = new int[n][2];
    for (int i = 0; i < n; i++) {
        pairs[i][0] = nums[i];
        pairs[i][1] = i;
    }
    Arrays.sort(pairs, Comparator.comparingInt(p -> p[0])); @sort
    int l = 0, r = n - 1; @place
    while (l < r) { @bounds
        int total = pairs[l][0] + pairs[r][0]; @sum
        if (total == target) { @compare
            return new int[]{pairs[l][1], pairs[r][1]}; @found
        }
        if (total < target) { @direction
            l++; @left
        } else {
            r--; @right
        }
    }
    return new int[0];
}`),
    cpp: listing(`vector<int> twoSum(vector<int>& nums, int target) {
    vector<pair<int, int>> pairs;
    for (int i = 0; i < nums.size(); ++i) {
        pairs.emplace_back(nums[i], i);
    }
    sort(pairs.begin(), pairs.end()); @sort
    int l = 0, r = int(pairs.size()) - 1; @place
    while (l < r) { @bounds
        int total = pairs[l].first + pairs[r].first; @sum
        if (total == target) { @compare
            return {pairs[l].second, pairs[r].second}; @found
        }
        if (total < target) { @direction
            ++l; @left
        } else {
            --r; @right
        }
    }
    return {};
}`),
    python: listing(`def two_sum(nums, target):
    pairs = sorted((v, i) for i, v @sort
                   in enumerate(nums))
    l, r = 0, len(pairs) - 1 @place
    while l < r: @bounds
        total = pairs[l][0] + pairs[r][0] @sum
        if total == target: @compare
            return [pairs[l][1], pairs[r][1]] @found
        if total < target: @direction
            l += 1 @left
        else:
            r -= 1 @right`),
    pseudocode: listing(`pairs ← each value paired with its original index
SORT pairs by value, then by original index @sort
l ← 0, r ← length of pairs − 1 @place
WHILE l < r @bounds
    total ← pairs[l].value + pairs[r].value @sum
    IF total = target @compare
        RETURN [pairs[l].index, pairs[r].index] @found
    IF total < target @direction
        l ← l + 1 @left
    ELSE
        r ← r − 1 @right`)
  }
};
