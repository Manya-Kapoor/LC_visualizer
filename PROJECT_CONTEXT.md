# Code Astra project context

## Where to resume

Code Astra teaches LeetCode solutions through interactive walkthroughs. The user has approved **Two Sum** and **Trapping Rain Water**. Open `index.html` and use the problem selector, or follow the local server instructions in [README.md](README.md).

The user approved the Two Sum practice editor. Open the code panel’s **Solution Code** dropdown and choose **Practice Code**. Rainwater has a direct route at `index.html?problem=trapping-rain-water` and opens on two pointers with the six-bar example that holds nine units.

## Decisions from project chats

- Build and review one question at a time. The user chose Two Sum first and Trapping Rain Water second. A further question or problem library needs its own request.
- Use the existing static HTML, CSS, and JavaScript setup. The walkthrough works offline without an install or build step. Algoflowz inspired the synchronized walkthrough. Code Astra has its own design and implementation.
- Java is the default listing. C++, Python, and Pseudocode use the same sequence of steps. Changing the listing preserves the input, current step, speed, and playback state.
- Keep the time and auxiliary space explanations specific to each approach. Two Sum accepts 2–12 integers with exactly one matching pair. Rainwater accepts 1–16 nonnegative heights up to 100,000, including terrains that trap zero water.
- The GitHub repository is `Manya-Kapoor/LC_visualizer`, with `main` tracking `origin/main`. The user asks for **save and sync** when ready to commit and push. Check remote changes before pushing and keep secrets out of commits.

## Delivered

| Milestone | Working behavior |
| --- | --- |
| First walkthrough · `9efb2a4` | Brute force, one-pass hash map, two-pass hash map, and sorted two pointers. Includes sample and custom inputs, playback controls, a timeline, line highlighting, and light/dark themes. |
| Language and complexity update · `e3b529e` | Added Java and C++ alongside Python, with a reason for each time and space bound. |
| Code Astra and pseudocode · `ef5faaf` | Added four pseudocode listings, updated the branding and theme storage, and linked the editable checklist and this handoff from the README. |
| Trapping Rain Water · `d78a328` | Added a terrain chart, recorded water depths and totals, four approaches, and 16 synchronized listings. The problem selector connects both walkthroughs. |
| Two Sum practice | Added an editor with a separate draft for every approach and language. Clicking **Hint** gives a first step, suggests the next step, or explains a recognized mistake on its original line. |

## Implementation notes

`solutions.js` produces a snapshot for each trace action. Pointers use original array indices, including after sorting. `listings.js` uses trailing `@action` markers to connect those snapshots to lines in each listing. The renderer strips the markers and uses the same line on desktop and mobile. Add a listing by covering all actions for its approach. The playback and input controls live in `app.js`.

`rainwater.js` records the water depth at each bar plus the approach’s working variables. Two pointers, prefix/suffix maxima, and brute force settle columns. The monotonic stack records horizontal layers across a basin. `rainwater-listings.js` maps the same actions to all four code views. `rainwater-view.js` draws the terrain and validates inputs.

The Two Sum editor and browser storage live in `two-sum-practice.js`. Hints in `two-sum-hints.js` inspect the current text locally against common Two Sum patterns. Drafts stay in the current tab when browser storage is unavailable. Opening the editor pauses playback at the current step.

## Verification and next steps

All four rainwater approaches matched independently calculated per-column depths on 5,467 terrains, including both official examples, flat slopes, equal walls, and maximum-height inputs. Browser checks covered all 16 listings, problem switching, playback, invalid input, and phone layout. The Java and Python listings were also executed on seven test cases. C++ verification covered its displayed code and action mappings.

The 42 practice regression tests cover all 16 reference listings and their partial drafts, common errors, renamed variables, and alternative implementations. Run `node --test tests/two-sum-practice.test.cjs` after changing hints. Browser checks covered all three hint states, draft recovery after reload, switching approaches and languages, returning to the reference listing, both themes, phone layout, and the rainwater route.

The user will choose the next milestone. The [idea checklist](IDEAS.md) tracks future browsing and tagging features.
