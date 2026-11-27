const rainListings = {
  pointers: {
    java: listing(`public int trap(int[] height) {
    int leftMax = 0, rightMax = 0, total = 0;
    int l = 0, r = height.length - 1; @init
    while (l <= r) {
        if (leftMax <= rightMax) { @choose
            leftMax = Math.max(leftMax, height[l]); @leftWall
            total += leftMax - height[l]; @leftFill
            l++; @moveLeft
        } else {
            rightMax = Math.max(rightMax, height[r]); @rightWall
            total += rightMax - height[r]; @rightFill
            r--; @moveRight
        }
    }
    return total; @done
}`),
    cpp: listing(`int trap(vector<int>& height) {
    int leftMax = 0, rightMax = 0, total = 0;
    int l = 0, r = int(height.size()) - 1; @init
    while (l <= r) {
        if (leftMax <= rightMax) { @choose
            leftMax = max(leftMax, height[l]); @leftWall
            total += leftMax - height[l]; @leftFill
            ++l; @moveLeft
        } else {
            rightMax = max(rightMax, height[r]); @rightWall
            total += rightMax - height[r]; @rightFill
            --r; @moveRight
        }
    }
    return total; @done
}`),
    python: listing(`def trap(height):
    leftMax = rightMax = total = 0
    l, r = 0, len(height) - 1 @init
    while l <= r:
        if leftMax <= rightMax: @choose
            leftMax = max(leftMax, height[l]) @leftWall
            total += leftMax - height[l] @leftFill
            l += 1 @moveLeft
        else:
            rightMax = max(rightMax, height[r]) @rightWall
            total += rightMax - height[r] @rightFill
            r -= 1 @moveRight
    return total @done`),
    pseudocode: listing(`leftMax ← 0, rightMax ← 0, total ← 0
l ← first index, r ← last index @init
WHILE l ≤ r
    IF leftMax ≤ rightMax @choose
        leftMax ← max(leftMax, height[l]) @leftWall
        total ← total + leftMax − height[l] @leftFill
        move l one place right @moveLeft
    ELSE
        rightMax ← max(rightMax, height[r]) @rightWall
        total ← total + rightMax − height[r] @rightFill
        move r one place left @moveRight
RETURN total @done`)
  },
  maxima: {
    java: listing(`public int trap(int[] height) {
    int n = height.length, total = 0;
    int[] left = new int[n], right = new int[n];
    left[0] = height[0]; @first
    for (int i = 1; i < n; i++) {
        left[i] = Math.max(left[i - 1], height[i]); @prefix
    }
    right[n - 1] = height[n - 1]; @last
    for (int i = n - 2; i >= 0; i--) {
        right[i] = Math.max(right[i + 1], height[i]); @suffix
    }
    for (int i = 0; i < n; i++) {
        int level = Math.min(left[i], right[i]); @level
        total += level - height[i]; @fill
    }
    return total; @done
}`),
    cpp: listing(`int trap(vector<int>& height) {
    int n = height.size(), total = 0;
    vector<int> left(n), right(n);
    left[0] = height[0]; @first
    for (int i = 1; i < n; ++i) {
        left[i] = max(left[i - 1], height[i]); @prefix
    }
    right[n - 1] = height[n - 1]; @last
    for (int i = n - 2; i >= 0; --i) {
        right[i] = max(right[i + 1], height[i]); @suffix
    }
    for (int i = 0; i < n; ++i) {
        int level = min(left[i], right[i]); @level
        total += level - height[i]; @fill
    }
    return total; @done
}`),
    python: listing(`def trap(height):
    n, total = len(height), 0
    left, right = [0] * n, [0] * n
    left[0] = height[0] @first
    for i in range(1, n):
        left[i] = max(left[i - 1], height[i]) @prefix
    right[n - 1] = height[n - 1] @last
    for i in range(n - 2, -1, -1):
        right[i] = max(right[i + 1], height[i]) @suffix
    for i in range(n):
        level = min(left[i], right[i]) @level
        total += level - height[i] @fill
    return total @done`),
    pseudocode: listing(`n ← length of height, total ← 0
create arrays left and right of length n
left[0] ← height[0] @first
FOR i FROM 1 TO n − 1
    left[i] ← max(left[i − 1], height[i]) @prefix
right[n − 1] ← height[n − 1] @last
FOR i FROM n − 2 DOWN TO 0
    right[i] ← max(right[i + 1], height[i]) @suffix
FOR each index i
    level ← min(left[i], right[i]) @level
    total ← total + level − height[i] @fill
RETURN total @done`)
  },
  stack: {
    java: listing(`public int trap(int[] height) {
    Deque<Integer> stack = new ArrayDeque<>();
    int total = 0;
    for (int i = 0; i < height.length; i++) { @visit
        while (!stack.isEmpty() && height[i] > height[stack.peek()]) {
            int base = stack.pop(); @pop
            if (stack.isEmpty()) break; @open
            int left = stack.peek(); @wall
            int width = i - left - 1; @width
            int depth = Math.min(height[i], height[left]) - height[base]; @depth
            total += width * depth; @fill
        }
        stack.push(i); @push
    }
    return total; @done
}`),
    cpp: listing(`int trap(vector<int>& height) {
    vector<int> stack;
    int total = 0;
    for (int i = 0; i < height.size(); ++i) { @visit
        while (!stack.empty() && height[i] > height[stack.back()]) {
            int base = stack.back();
            stack.pop_back(); @pop
            if (stack.empty()) break; @open
            int left = stack.back(); @wall
            int width = i - left - 1; @width
            int depth = min(height[i], height[left]) - height[base]; @depth
            total += width * depth; @fill
        }
        stack.push_back(i); @push
    }
    return total; @done
}`),
    python: listing(`def trap(height):
    stack, total = [], 0
    for i in range(len(height)): @visit
        while stack and height[i] > height[stack[-1]]:
            base = stack.pop() @pop
            if not stack: break @open
            left = stack[-1] @wall
            width = i - left - 1 @width
            depth = min(height[i], height[left]) - height[base] @depth
            total += width * depth @fill
        stack.append(i) @push
    return total @done`),
    pseudocode: listing(`stack ← empty stack, total ← 0
FOR each index i from left to right @visit
    WHILE stack has indices AND height[i] > height[top]
        base ← pop the top index @pop
        IF stack is empty, BREAK @open
        left ← top index on stack @wall
        width ← i − left − 1 @width
        depth ← min(height[i], height[left]) − height[base] @depth
        total ← total + width × depth @fill
    push i onto stack @push
RETURN total @done`)
  },
  brute: {
    java: listing(`public int trap(int[] height) {
    int total = 0;
    for (int i = 0; i < height.length; i++) {
        int leftMax = height[i], rightMax = height[i]; @seed
        for (int j = i - 1; j >= 0; j--) {
            leftMax = Math.max(leftMax, height[j]); @scanLeft
        }
        for (int j = i + 1; j < height.length; j++) {
            rightMax = Math.max(rightMax, height[j]); @scanRight
        }
        int level = Math.min(leftMax, rightMax); @level
        total += level - height[i]; @fill
    }
    return total; @done
}`),
    cpp: listing(`int trap(vector<int>& height) {
    int total = 0;
    for (int i = 0; i < height.size(); ++i) {
        int leftMax = height[i], rightMax = height[i]; @seed
        for (int j = i - 1; j >= 0; --j) {
            leftMax = max(leftMax, height[j]); @scanLeft
        }
        for (int j = i + 1; j < height.size(); ++j) {
            rightMax = max(rightMax, height[j]); @scanRight
        }
        int level = min(leftMax, rightMax); @level
        total += level - height[i]; @fill
    }
    return total; @done
}`),
    python: listing(`def trap(height):
    total = 0
    for i in range(len(height)):
        leftMax = rightMax = height[i] @seed
        for j in range(i - 1, -1, -1):
            leftMax = max(leftMax, height[j]) @scanLeft
        for j in range(i + 1, len(height)):
            rightMax = max(rightMax, height[j]) @scanRight
        level = min(leftMax, rightMax) @level
        total += level - height[i] @fill
    return total @done`),
    pseudocode: listing(`total ← 0
FOR each index i
    leftMax ← height[i], rightMax ← height[i] @seed
    FOR j FROM i − 1 DOWN TO 0
        leftMax ← max(leftMax, height[j]) @scanLeft
    FOR j FROM i + 1 TO last index
        rightMax ← max(rightMax, height[j]) @scanRight
    level ← min(leftMax, rightMax) @level
    total ← total + level − height[i] @fill
RETURN total @done`)
  }
};
