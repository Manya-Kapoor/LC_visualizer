# Tracepad

An interactive walkthrough of LeetCode 1, Two Sum. Open `index.html` in a modern browser. All assets are local and there is no install or build step.

To serve the page over HTTP with Python, run the following command from the repository root and open <http://localhost:8000>.

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Choose an approach to follow its Python code, array state, and step explanation together. Play or pause the trace, move one step at a time, or scrub the timeline. With focus outside a control, Space toggles playback and the left and right arrow keys move between steps.

The input editor includes four examples and accepts 2–12 integers with exactly one matching pair. The shorter input limit keeps the visualization readable. Sorting retains original indices, and duplicate values occupy distinct tiles.

The trace generators and displayed Python are in `solutions.js`. Browser interactions and the header illustration are in `app.js`. Layout and theme tokens are in `styles.css`.
