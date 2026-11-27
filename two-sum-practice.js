function createTwoSumPractice() {
  const mode = $("code-mode");
  const editor = $("practice-editor");
  const clearRun = createPracticeRunControls(editor);
  const feedback = $("hint-feedback");
  const drafts = new Map();
  const starters = {
    java: "public int[] twoSum(int[] nums, int target) {\n    \n}",
    cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    \n}",
    python: "def two_sum(nums, target):\n    ",
    pseudocode: ""
  };
  let draftKey;
  $("code-mode-picker").hidden = false;
  $("code-heading-text").classList.add("sr-only");
  mode.value = "solution";

  function refresh() {
    clearRun();
    feedback.hidden = true;
    if (mode.value !== "practice") return;
    const language = $("language").value;
    const key = `code-astra:two-sum:draft:${approach}:${language}`;
    $("practice-label").textContent = `${solutions[approach].name} draft`;
    if (key === draftKey) return;
    draftKey = key;
    let text = drafts.get(key);
    try {
      text ??= localStorage.getItem(key);
      $("draft-status").textContent = "Drafts are saved in this browser for each approach and language.";
    } catch {
      $("draft-status").textContent = "Draft available in this tab for this session.";
    }
    editor.value = text ?? starters[language];
    editor.placeholder = language === "pseudocode" ? "Write your Two Sum steps here…" : "Write your Two Sum solution here…";
    const caret = text == null && language !== "pseudocode" ? editor.value.indexOf("\n    ") + 5 : editor.value.length;
    editor.setSelectionRange(caret, caret);
  }

  function saveDraft() {
    clearRun();
    drafts.set(draftKey, editor.value);
    feedback.hidden = true;
    try {
      localStorage.setItem(draftKey, editor.value);
      $("draft-status").textContent = "Draft saved in this browser.";
    } catch {
      $("draft-status").textContent = "Draft available in this tab for this session.";
    }
  }

  editor.addEventListener("input", saveDraft);
  editor.addEventListener("keydown", event => {
    if (event.key !== "Enter" || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    const before = editor.value.slice(0, editor.selectionStart).split("\n").pop();
    const indent = before.match(/^\s*/)[0] + (/[{:]$/.test(before.trimEnd()) ? "    " : "");
    if (!indent) return;
    event.preventDefault();
    editor.setRangeText("\n" + indent, editor.selectionStart, editor.selectionEnd, "end");
    saveDraft();
  });

  mode.addEventListener("change", () => {
    const practicing = mode.value === "practice";
    document.body.classList.toggle("practice-active", practicing);
    $("source-code").hidden = practicing;
    $("practice-panel").hidden = !practicing;
    $("code-heading-text").textContent = practicing ? "Practice Code" : "Solution Code";
    if (practicing) {
      stop();
      renderPlay();
      refresh();
      editor.focus({preventScroll: true});
    } else {
      clearRun();
      renderFrame();
    }
  });
  $("practice-hint").addEventListener("click", () => {
    const hint = twoSumHint(editor.value, approach, $("language").value, input);
    $("hint-title").textContent = hint.title;
    const excerpt = $("hint-line");
    excerpt.hidden = hint.line == null;
    excerpt.textContent = hint.line ? editor.value.split("\n")[hint.line - 1].trim() : "";
    $("hint-body").textContent = hint.body;
    feedback.dataset.kind = hint.kind;
    feedback.hidden = false;
  });
  return refresh;
}
