# Code Astra

Interactive walkthroughs for [1. Two Sum](https://leetcode.com/problems/two-sum/description/) and [42. Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/description/). Open `index.html` in a modern browser and select a question from **Problem**. The rainwater walkthrough also opens directly at `index.html?problem=trapping-rain-water`. All assets are local and there is no install or build step.

To serve the page over HTTP with Python, run the following command from the repository root and open <http://localhost:8000>.

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Choose an approach to follow its code, array state, and step explanation together. The code panel opens in Java. Switch to C++, Python, or Pseudocode at any step, including during playback. Each approach explains its time and auxiliary space costs below the code.

Play or pause the trace, move one step at a time, or scrub the timeline. With focus outside a control, Space toggles playback and the left and right arrow keys move between steps.

Two Sum accepts 2–12 integers with exactly one matching pair. Sorting retains original indices, and duplicate values occupy distinct tiles.

In Two Sum, open **Solution Code** and choose **Practice Code** to write your own solution. Click **Hint** for a first step, feedback on your progress, or a correction with the relevant line and the reason to change it. Hints use local pattern checks for the four walkthrough approaches. Each approach and language has its own draft, saved in this browser when local storage is available. Switch back to **Solution Code** to see the highlighted walkthrough again.

Click **Run** to execute the current draft against **Classic pair**, **Later match**, **Duplicate values**, and **Negative values**. Apply a different input in **Edit input** to include it as a fifth case. Expand a result to see the array, target, returned indices, and expected pair. Either index order passes. Failed cases open automatically.

The offline runner interprets the integer, array, map, loop, conditional, and sorting operations used in the four language views. Java and C++ drafts can use the starter method or a LeetCode-style solution class. Python also accepts a function body, and pseudocode follows the indentation and notation in the walkthroughs. Other language features and libraries can fall outside this subset. An execution limit stops runaway loops.

Run `node --test` from the repository root to check practice hints and example execution.

Trapping Rain Water accepts 1–16 whole-number heights from 0 to 100,000. Compare two pointers, prefix/suffix maxima, a monotonic stack, and brute force. The chart shows terrain heights, water depth per column, and total volume at each step. The **Wide basin** example traps 9 units and **Several pools** traps 6.

Two Sum traces and listings live in `solutions.js` and `listings.js`. The corresponding rainwater files are `rainwater.js` and `rainwater-listings.js`. Both problems use the same action markers, code panel, and playback controls. The terrain chart and input validation are in `rainwater-view.js`. Layout and theme tokens are in `styles.css`.

To continue the project in a new chat, start with the [project context](PROJECT_CONTEXT.md). The [idea checklist](IDEAS.md) tracks suggestions for future work.
