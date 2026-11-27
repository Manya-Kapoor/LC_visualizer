# Code Astra project context

## Where to resume

Code Astra teaches LeetCode solutions through interactive walkthroughs. The current milestone covers **Two Sum**. Open `index.html` directly or use the local server command in [README.md](README.md).

The latest change adds Pseudocode to every approach, adopts the Code Astra name across the site, and establishes this handoff. Existing browsers carry their saved theme over to the new name.

## Decisions from project chats

- Build and review one question at a time. The user chose Two Sum for the first milestone. A future question or problem library needs its own request.
- Use the existing static HTML, CSS, and JavaScript setup. The walkthrough works offline without an install or build step. Algoflowz inspired the synchronized walkthrough. Code Astra has its own design and implementation.
- Java is the default listing. C++, Python, and Pseudocode use the same sequence of steps. Changing the listing preserves the input, current step, speed, and playback state.
- Keep the time and auxiliary space explanations specific to each approach. The input editor accepts 2–12 integers with exactly one matching pair. Duplicate values at distinct indices are valid.
- The GitHub repository is `Manya-Kapoor/LC_visualizer`, with `main` tracking `origin/main`. The user asks for **save and sync** when ready to commit and push. Check remote changes before pushing and keep secrets out of commits.

## Delivered

| Milestone | Working behavior |
| --- | --- |
| First walkthrough · `9efb2a4` | Brute force, one-pass hash map, two-pass hash map, and sorted two pointers. Includes sample and custom inputs, playback controls, a timeline, line highlighting, and light/dark themes. |
| Language and complexity update · `e3b529e` | Added Java and C++ alongside Python, with a reason for each time and space bound. |
| Code Astra and pseudocode | Added four pseudocode listings, updated the branding and theme storage, and linked the editable checklist and this handoff from the README. |

## Implementation notes

`solutions.js` produces a snapshot for each trace action. Pointers use original array indices, including after sorting. `listings.js` uses trailing `@action` markers to connect those snapshots to lines in each listing. The renderer strips the markers and uses the same line on desktop and mobile. Add a listing by covering all actions for its approach. The playback and input controls live in `app.js`.

## Next steps

The user approved the pseudocode, branding, and project handoff milestone. Verification covered every action across all 16 approach/listing combinations, correct results on 92 walkthroughs, and theme preference migration. Browser checks covered language switching during playback, backward and forward stepping, scrubbing, and the highlighted line in the mobile view.

The user will choose the next implementation task. The browsing ideas in [IDEAS.md](IDEAS.md) include the question list, approach dropdowns, and company and difficulty tags.
