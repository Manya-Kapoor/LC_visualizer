// Run the parsed program with fresh variables and a fresh input array for every example.
function executePractice(program, nums, target) {
  const python = program.language === "python" || program.language === "pseudocode";
  let steps = 0, activeLine = 1;
  const fail = message => { throw new Error(`Line ${activeLine}: ${message}`); };
  function tick(cost = 1) {
    steps += cost;
    if (steps > 60000) fail("Step limit reached. Check that your loop moves toward its stopping condition.");
  }
  function size(n) {
    if (!Number.isSafeInteger(n) || n < 0 || n > 4096) fail("The practice runner supports collections of up to 4,096 items.");
    tick(n);
    return n;
  }
  function integer(n) {
    if (!Number.isSafeInteger(n)) fail("Expected a whole number within the practice runner’s integer range.");
    return n;
  }
  function array(v) {
    if (!Array.isArray(v)) fail("Expected a list or array.");
    return v;
  }
  function truth(v) {
    if (python && Array.isArray(v)) return v.length > 0;
    if (python && v instanceof Map) return v.size > 0;
    return Boolean(v);
  }

  class Scope {
    constructor(parent) { this.parent = parent; this.vars = new Map(); }
    owner(id) { return this.vars.has(id) ? this : this.parent?.owner(id); }
    read(id) {
      const owner = this.owner(id);
      if (!owner) fail(`Unknown name '${id}'.`);
      return owner.vars.get(id);
    }
    write(id, value) {
      const owner = this.owner(id);
      if (!owner && !python) fail(`Declare '${id}' before using it.`);
      (owner || this).vars.set(id, value);
    }
  }

  function indexOf(base, key) {
    array(base); integer(key);
    if (python && key < 0) key += base.length;
    if (key < 0 || key >= base.length) fail(`Index ${key} is outside an array of length ${base.length}.`);
    return key;
  }
  function readAt(base, key) {
    if (base instanceof Map) {
      if (!base.has(key)) {
        if (program.language === "cpp") base.set(key, 0);
        else fail(`No entry for key ${key}. Check for the partner before reading it.`);
      }
      return base.get(key);
    }
    return base[indexOf(base, key)];
  }
  function write(node, value, env) {
    if (node.kind === "name") return env.write(node.id, value);
    if (node.kind !== "index") fail("Expected a variable or an indexed element on the left side.");
    const base = evaluate(node.base, env), key = evaluate(node.key, env);
    if (base instanceof Map) base.set(key, value);
    else base[indexOf(base, key)] = value;
  }
  function bind(names, value, env) {
    const items = names.length === 1 ? [value] : array(value);
    if (items.length !== names.length) fail("The number of values does not match the number of variables.");
    names.forEach((id, i) => env.vars.set(id, items[i]));
  }

  function compare(a, b) {
    tick();
    if (a === b) return 0;
    if (Array.isArray(a) && Array.isArray(b)) {
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const order = compare(a[i], b[i]);
        if (order) return order;
      }
      return a.length - b.length;
    }
    return integer(a) - integer(b);
  }
  function binary(op, a, b) {
    switch (op) {
      case "is": return a === b;
      case "is not": return a !== b;
      case "==": case "!=": {
        const equal = program.language !== "java" && Array.isArray(a) && Array.isArray(b) ? compare(a,b) === 0 : a === b;
        return op === "==" ? equal : !equal;
      }
      case "in": case "not in": {
        const found = b instanceof Map ? b.has(a) : array(b).includes(a);
        return op === "in" ? found : !found;
      }
      case "<": return compare(a,b) < 0;
      case "<=": return compare(a,b) <= 0;
      case ">": return compare(a,b) > 0;
      case ">=": return compare(a,b) >= 0;
    }
    integer(a); integer(b);
    if (op === "+") return integer(a + b);
    if (op === "-") return integer(a - b);
    if (op === "*") return integer(a * b);
    if (b === 0) fail("Division by zero.");
    if (op === "%") return python ? ((a % b) + b) % b : a % b;
    if (op === "//") return Math.floor(a / b);
    if (op === "/") return python ? a / b : Math.trunc(a / b);
    fail(`Unsupported operator '${op}'.`);
  }

  function construct(type, args) {
    if (["map","unordered_map","HashMap","Map"].includes(type)) return new Map();
    if (["vector","List","ArrayList","pair"].includes(type)) return Array(size(args[0] ?? 0)).fill(args[1] ?? 0);
    if (["int","Integer","long","size_t","bool","auto"].includes(type)) return args[0] ?? 0;
    fail(`Unsupported constructor '${type}'.`);
  }
  function sorted(items, key) {
    const list = array(items);
    const project = item => {
      if (!key) return item;
      if (key.kind !== "keyFunction") fail("Expected a sort key function.");
      const inner = new Scope(key.env);
      inner.vars.set(key.param, item);
      return evaluate(key.value, inner);
    };
    list.sort((a,b) => compare(project(a), project(b)));
    return list;
  }
  function call(id, args) {
    const [a,b,c] = args;
    switch (id) {
      case "len": return a instanceof Map ? a.size : array(a).length;
      case "enumerate": size(array(a).length); return a.map((v,i) => [i + (b ?? 0), v]);
      case "range": {
        const start = b == null ? 0 : integer(a), end = integer(b ?? a), step = integer(c ?? 1);
        if (!step) fail("The range step must be nonzero.");
        return Array.from({length:size(Math.max(0, Math.ceil((end-start)/step)))}, (_,i) => start + i*step);
      }
      case "dict": return new Map(a ? array(a) : []);
      case "list": if (!a) return []; size(array(a).length); return [...a];
      case "int": return integer(Math.trunc(a));
      case "abs": return Math.abs(integer(a));
      case "min": return Math.min(...(args.length === 1 ? array(a) : args).map(integer));
      case "max": return Math.max(...(args.length === 1 ? array(a) : args).map(integer));
      case "make_pair": return [a,b];
      case "sorted": size(array(a).length); return sorted([...a], b);
      case "sort":
        if (a?.edge !== "begin" || b?.edge !== "end" || a.list !== b.list || c) fail("Use sort with the begin and end of the same vector.");
        sorted(a.list); return null;
      default: fail(`Function '${id}' is outside the practice runner’s supported operations.`);
    }
  }
  function callMember(base, id, args) {
    const [a,b] = args;
    if (base instanceof Map) {
      switch (id) {
        case "put": base.set(a,b); return null;
        case "get": case "getOrDefault": return base.has(a) ? base.get(a) : b ?? null;
        case "at": if (!base.has(a)) fail(`No entry for key ${a}.`); return base.get(a);
        case "containsKey": case "contains": return base.has(a);
        case "count": return Number(base.has(a));
        case "find": return base.has(a) ? [a,base.get(a)] : null;
        case "end": return null;
        case "size": return base.size;
      }
    }
    if (Array.isArray(base)) {
      switch (id) {
        case "size": return base.length;
        case "at": case "get": return readAt(base,a);
        case "begin": case "end": return {edge:id,list:base};
        case "append": case "push_back": case "emplace_back": case "add":
          if (base.length >= 4096) fail("Collection size limit reached.");
          base.push(args.length === 1 ? a : args); return null;
        case "sort": sorted(base,a); return null;
        case "index": { const i = base.indexOf(a); if (i < 0) fail("Value is absent from the list."); return i; }
      }
    }
    fail(`Method '${id}' is unavailable for this value in the practice runner.`);
  }
  function invoke(node, env) {
    const args = node.args.map(arg => evaluate(arg, env));
    if (node.fn.kind === "name") return call(node.fn.id,args);
    if (node.fn.kind !== "member") fail("Expected a supported function or method.");
    const {base,id} = node.fn;
    if (base.kind === "name" && !env.owner(base.id)) {
      if (base.id === "Arrays" && id === "sort") { sorted(args[0],args[1]); return null; }
      if (base.id === "Comparator" && id === "comparingInt") return args[0];
      if (base.id === "Math" && ["min","max","abs"].includes(id)) return call(id,args);
    }
    return callMember(evaluate(base,env), id, args);
  }
  function evaluate(node, env) {
    tick();
    switch (node.kind) {
      case "literal": return node.value;
      case "name": return env.read(node.id);
      case "array": return node.items.map(item => evaluate(item,env));
      case "map": return new Map(node.entries.map(([k,v]) => [evaluate(k,env),evaluate(v,env)]));
      case "index": return readAt(evaluate(node.base,env),evaluate(node.key,env));
      case "lambda": return {kind:"keyFunction",param:node.param,value:node.value,env};
      case "member": {
        const base = evaluate(node.base,env);
        if (node.id === "length") return array(base).length;
        if (node.id === "first" || node.id === "second") return readAt(base,node.id === "first" ? 0 : 1);
        fail(`Unsupported property '${node.id}'.`);
        break;
      }
      case "call": return invoke(node,env);
      case "construct": return construct(node.type,node.args.map(a => evaluate(a,env)));
      case "allocate": {
        const dims = node.dims.map(d => integer(evaluate(d,env)));
        const build = i => i === dims.length ? 0 : Array.from({length:size(dims[i])}, () => build(i+1));
        return build(0);
      }
      case "unary": {
        const v = evaluate(node.value,env);
        if (node.op === "+") return integer(v);
        if (node.op === "-") return -integer(v);
        return !truth(v);
      }
      case "binary": {
        const a = evaluate(node.left,env);
        if (node.op === "and" || node.op === "&&") return truth(a) ? evaluate(node.right,env) : a;
        if (node.op === "or" || node.op === "||") return truth(a) ? a : evaluate(node.right,env);
        return binary(node.op,a,evaluate(node.right,env));
      }
      case "collect": {
        const result = node.key ? new Map() : [], inner = new Scope(env);
        for (const item of array(evaluate(node.over,env))) {
          tick(); bind(node.vars,item,inner);
          if (node.filter && !truth(evaluate(node.filter,inner))) continue;
          const value = evaluate(node.value,inner);
          if (node.key) result.set(evaluate(node.key,inner),value); else result.push(value);
        }
        return result;
      }
    }
    fail("Unsupported expression.");
  }

  function runBlock(statements, env) {
    const local = python ? env : new Scope(env);
    for (const statement of statements) {
      const signal = run(statement,local);
      if (signal) return signal;
    }
  }
  function run(node, env) {
    activeLine = node.line ?? activeLine;
    tick();
    switch (node.kind) {
      case "declare": for (const e of node.entries) env.vars.set(e.id,evaluate(e.value,env)); break;
      case "assign": {
        const items = node.right.map(r => evaluate(r,env));
        if (node.left.length === 1) write(node.left[0],items.length > 1 ? items : items[0],env);
        else {
          const values = items.length === 1 ? array(items[0]) : items;
          if (values.length !== node.left.length) fail("Assignment needs the same number of variables and values.");
          node.left.forEach((left,i) => write(left,values[i],env));
        }
        break;
      }
      case "change": {
        const old = evaluate(node.left,env), delta = node.value ? evaluate(node.value,env) : 1;
        write(node.left,binary(node.op[0],old,delta),env); break;
      }
      case "expr": evaluate(node.value,env); break;
      case "if": return runBlock(truth(evaluate(node.cond,env)) ? node.yes : node.no,env);
      case "each": {
        const local = python ? env : new Scope(env);
        const over = evaluate(node.over,env);
        for (const item of (over instanceof Map ? over.keys() : array(over))) {
          activeLine = node.line; tick(); bind(node.vars,item,local);
          const signal = runBlock(node.body,local);
          if (signal?.kind === "return") return signal;
          if (signal?.kind === "break") break;
        }
        break;
      }
      case "loop": {
        const local = python ? env : new Scope(env);
        if (node.init) run(node.init,local);
        for (;;) {
          activeLine = node.line; tick();
          if (node.cond && !truth(evaluate(node.cond,local))) break;
          const signal = runBlock(node.body,local);
          if (signal?.kind === "return") return signal;
          if (signal?.kind === "break") break;
          if (node.update) run(node.update,local);
        }
        break;
      }
      case "return": return {kind:"return", value:node.value ? evaluate(node.value,env) : undefined};
      case "break": case "continue": return {kind:node.kind};
      case "pass": break;
      default: fail("Unsupported statement.");
    }
  }
  const env = new Scope();
  bind(program.params, [[...nums],target], env);
  const signal = runBlock(program.body,env);
  if (signal && signal.kind !== "return") fail(`Use '${signal.kind}' inside a loop.`);
  return signal?.value;
}
