function practiceCases(examples, current) {
  const cases = Object.values(examples);
  const sameInput = test => test.target === current.target && test.nums.length === current.nums.length &&
    test.nums.every((n, i) => n === current.nums[i]);
  if (!cases.some(sameInput)) cases.push({...current, name:"Custom input"});
  return cases;
}

function judgePractice(source, language, cases, problem = "two-sum") {
  const rain = problem === "trapping-rain-water";
  let program;
  try { program = parsePractice(source, language, problem); }
  catch (err) { return {error:err.message}; }

  function describe(value) {
    if (value === undefined) return "No return value";
    if (value === null) return "null";
    if (Array.isArray(value)) {
      const cells = value.slice(0,8).map(v => typeof v === "number" || typeof v === "boolean" ? String(v) : "…");
      if (value.length > 8) cells.push("…");
      return `[${cells.join(", ")}]`;
    }
    return typeof value === "object" ? "An object" : String(value);
  }
  function expectedPair(nums, target) {
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) if (nums[i] + nums[j] === target) return [i,j];
    }
    throw new Error("This input has no valid pair.");
  }
  // Compute the waterline at each column independently of the student's algorithm.
  function waterVolume(heights) {
    return heights.reduce((total, height, i) => {
      const leftWall = Math.max(...heights.slice(0, i + 1));
      const rightWall = Math.max(...heights.slice(i));
      return total + Math.min(leftWall, rightWall) - height;
    }, 0);
  }
  const results = cases.map(({name,nums,target}) => {
    const expected = rain ? waterVolume(nums) : expectedPair(nums,target);
    const result = {name,nums,target,expected};
    try {
      const actual = executePractice(program,nums,target);
      const passed = rain ? Number.isInteger(actual) && actual === expected :
        Array.isArray(actual) && actual.length === 2 &&
        actual.every(i => Number.isInteger(i) && i >= 0 && i < nums.length) &&
        actual[0] !== actual[1] && nums[actual[0]] + nums[actual[1]] === target;
      return {...result, status:passed ? "Passed" : "Wrong answer", actual:describe(actual)};
    } catch (err) {
      return {...result, status:"Runtime error", error:err.message};
    }
  });
  return {results};
}

// A Blob worker also runs when the static site is opened directly from disk.
// Only the authored interpreter is worker source. The editor text travels as message data.
function createPracticeRunControls(editor) {
  const run = $("practice-run"), panel = $("run-results"), summary = $("run-summary");
  const message = $("run-message"), list = $("run-cases");
  let worker, timeout;
  function stopWorker() {
    clearTimeout(timeout);
    worker?.terminate();
    worker = null;
    run.disabled = false;
    $("run-label").textContent = "Run";
  }
  function clear() {
    stopWorker();
    panel.hidden = true;
    $("run-status").textContent = "";
  }
  function display(report) {
    stopWorker();
    list.replaceChildren();
    if (report.error) {
      summary.textContent = "Couldn’t run this draft";
      message.textContent = report.error;
    } else {
      const passed = report.results.filter(row => row.status === "Passed").length;
      summary.textContent = `${passed} of ${report.results.length} cases passed`;
      message.textContent = "";
      for (const row of report.results) {
        const item = document.createElement("li"), details = document.createElement("details");
        const heading = document.createElement("summary"), label = document.createElement("strong");
        const flag = document.createElement("span");
        label.textContent = row.name;
        flag.textContent = row.status;
        flag.className = row.status === "Passed" ? "run-pass" : "run-fail";
        heading.append(label,flag);
        details.open = row.status !== "Passed";
        const inputs = document.createElement("p"), answer = document.createElement("p");
        inputs.textContent = isRain ? `height = [${row.nums.join(", ")}]` : `nums = [${row.nums.join(", ")}] · target = ${row.target}`;
        const expected = isRain ? units(row.expected) : `[${row.expected.join(", ")}]`;
        answer.textContent = row.error || `Returned ${row.actual} · Expected ${expected}`;
        details.append(heading,inputs,answer);
        item.append(details);
        list.append(item);
      }
    }
    message.hidden = !message.textContent;
    panel.hidden = false;
    $("run-status").textContent = [summary.textContent,message.textContent].filter(Boolean).join(". ");
    panel.scrollIntoView({block:"nearest"});
  }

  run.addEventListener("click", () => {
    clear();
    run.disabled = true;
    $("run-label").textContent = "Running…";
    $("run-status").textContent = "Running examples…";
    let url;
    try {
      const script = [parsePractice,executePractice,judgePractice].map(fn => fn.toString()).join("\n") +
        "\nself.onmessage = ({data}) => self.postMessage(judgePractice(data.source, data.language, data.cases, data.problem));";
      url = URL.createObjectURL(new Blob([script], {type:"text/javascript"}));
      const job = new Worker(url);
      worker = job;
      job.onmessage = event => { if (worker === job) display(event.data); };
      job.onerror = () => { if (worker === job) display({error:"The practice runner stopped. Check the draft and run again."}); };
      timeout = setTimeout(() => {
        if (worker === job) display({error:"Execution timed out. Check your loop bounds and run again."});
      }, 5000);
      job.postMessage({source:editor.value, language:$("language").value, cases:practiceCases(examples,input), problem:problemSlug});
    } catch (err) {
      display({error:`Couldn’t start the browser runner. ${err.message}`});
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  });
  return clear;
}
