# Code Astra project context

## Where to resume

Code Astra teaches LeetCode solutions through interactive walkthroughs. The user has approved **Two Sum** and **Trapping Rain Water**. Open `index.html` and use the problem selector, or follow the local server instructions in [README.md](README.md).

The user approved Rain Water practice. Open it at `index.html?problem=trapping-rain-water`. Choose **Practice Code** to write a draft, ask for a hint, or run it on all terrains. The default walkthrough uses two pointers on the six-bar basin that holds nine units.

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
| Two Sum practice · `c00ddba` | Added an editor with a separate draft for every approach and language. Clicking **Hint** gives a first step, suggests the next step, or explains a recognized mistake on its original line. |
| Two Sum practice runs · `57fd361` | Each run tests the current draft against every named Edit input example and a distinct active custom input. Results accept either index order and show case-specific output or errors. |
| Trapping Rain Water practice | Each of the four approaches supports independent Java, C++, Python, and pseudocode drafts, on-demand hints, and runs scored by trapped volume. |

## Implementation notes

`solutions.js` produces a snapshot for each trace action. Pointers use original array indices, including after sorting. `listings.js` uses trailing `@action` markers to connect those snapshots to lines in each listing. The renderer strips the markers and uses the same line on desktop and mobile. Add a listing by covering all actions for its approach. The playback and input controls live in `app.js`.

`rainwater.js` records the water depth at each bar plus the approach’s working variables. Two pointers, prefix/suffix maxima, and brute force settle columns. The monotonic stack records horizontal layers across a basin. `rainwater-listings.js` maps the same actions to all four code views. `rainwater-view.js` draws the terrain and validates inputs.

`practice-editor.js` shares the editor across both problems. Draft keys include the problem slug, approach, and language and preserve existing Two Sum drafts. Hints in `two-sum-hints.js` and `rainwater-hints.js` inspect the current draft locally. Opening practice pauses playback at the current step.

Edit input and Run share each problem’s examples in `solutions.js` and `rainwater.js`. `practice-parser.js` parses the walkthrough language subset and `practice-runtime.js` executes it in a bounded browser worker. `practice-runner.js` grades against the original input, accepting either index order for Two Sum and a whole-number volume for Rain Water. It clears obsolete results after edits or input changes.

## Verification and next steps

All four rainwater approaches matched independently calculated per-column depths on 5,467 terrains, including both official examples, flat slopes, equal walls, and maximum-height inputs. Browser checks covered all 16 listings, problem switching, playback, invalid input, and phone layout. The Java and Python listings were also executed on seven test cases. C++ verification covered its displayed code and action mappings.

The 42 practice regression tests cover all 16 reference listings and their partial drafts, common errors, renamed variables, and alternative implementations. Run `node --test tests/two-sum-practice.test.cjs` after changing hints. Browser checks covered all three hint states, draft recovery after reload, switching approaches and languages, returning to the reference listing, both themes, phone layout, and the rainwater route.

Two Sum verification covered all 16 reference listings against each of its four named examples. Regression cases also exercise alternate implementations, reversed indices, input mutation, errors and runaway loops. In Chrome, the local file showed 4/4 for a valid Java draft, 2/4 for a fixed answer, and 5/5 with a custom input. Editing the draft or applying a different input cleared the old results.

Run `node --test` for the full practice suite. All 95 tests passed. Rain Water coverage includes all 16 reference listings on the four presets and edge terrains, custom input, hint line numbers, wrong return types, input mutation, runtime errors, and runaway loops. Browser checks verified first-step and corrective hints, 1/4 for a fixed zero return, 4/4 for the Java solution, 5/5 including custom heights, draft recovery after reload, approach and language switching, and returning to Two Sum.

## Public hosting

Version 1 is public at [Code Astra](https://code-astra-karmanya.manya-kapoor-9436.chatgpt.site). Sites project `appgprj_6b09741781648191ad892d0e085237c6` serves the app from GitHub revision `6a388a0`. For updates, reuse that Sites project and stage `index.html` plus the 12 scripts and one stylesheet it references in `dist/`. Publishing is separate from a GitHub push. The 95 local tests passed. An anonymous HTTPS request returned the Code Astra homepage and all 13 linked assets matched the project.

The public custom domain is [karmanya.xyz](https://karmanya.xyz/), managed at gen.xyz using its default TopDNS nameservers. Sites custom domain `appgdom_6b0974a3d4cc8191b5357c2eb69a0d54` and its HTTPS certificate are active. On 28 Nov 2026, anonymous HTTPS checks returned HTTP 200 on both walkthrough URLs, all 13 linked assets matched the project, and a browser rendered both Two Sum and Trapping Rain Water. The [idea checklist](IDEAS.md) tracks future browsing and tagging features.
