// Parse the practice dialects into statements and expressions. Draft text is always data.
function parsePractice(source, language) {
  const indented = language === "python" || language === "pseudocode";
  const error = (line, message) => { throw new Error(`Line ${line}: ${message}`); };
  if (!source.trim()) throw new Error("Write a solution in the editor, then run the examples.");
  if (source.length > 40000) throw new Error("This draft exceeds the practice runner’s 40,000-character limit.");

  // The walkthrough's pseudocode has indentation, inclusive ranges, and value–index pairs.
  function pseudoLine(line) {
    let s = line.replace(/←/g, "=").replace(/−/g, "-").replace(/≠/g, "!=").replace(/≤/g, "<=").replace(/≥/g, ">=");
    s = s.replace(/\bempty map\b/ig, "{}").replace(/\blength of (\w+)/ig, "len($1)")
      .replace(/\beach value paired with its original index\b/ig, "[(v, i) for i, v in enumerate(nums)]")
      .replace(/(\w+)\[([^\]]+)\] if present, otherwise NONE/ig, "$1.get($2)")
      .replace(/\b(\w+) contains (\w+)/ig, "$2 in $1").replace(/\.value\b/g, "[0]").replace(/\.index\b/g, "[1]");
    if (/^sort (\w+) by value(?:, then by original index)?$/i.test(s)) return s.replace(/^sort (\w+).*$/i, "$1.sort()");
    s = s.replace(/^for each index (\w+) from left to right$/i, "for $1 in range(len(nums)):")
      .replace(/^for (\w+) from (.+?) to (.+)$/i, "for $1 in range($2, ($3) + 1):")
      .replace(/\b(IF|ELSE|WHILE|RETURN|FOR|IN|AND|OR|NOT|BREAK|CONTINUE)\b/g, w => w.toLowerCase())
      .replace(/\bNONE\b/g, "None");
    if (/^(if|while)\b/.test(s)) s = s.replace(/(?<![=!<>])=(?!=)/g, "==");
    if (/^(if |while |else$)/.test(s) && !s.endsWith(":")) s += ":";
    return s;
  }

  const tokens = [];
  const push = (s, line) => tokens.push({s, line});
  const levels = [0];
  let nesting = 0;
  // Keep source line numbers when removing C-family comments.
  if (!indented) source = source.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, part => part.replace(/[^\n]/g, " "));
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = i + 1;
    let raw = lines[i].replace(indented ? /#.*/ : /\/\/.*/, "").trimEnd();
    if (!raw.trim() || (!indented && /^\s*#include\b/.test(raw))) continue;
    if (indented && nesting === 0) {
      const indent = raw.match(/^\s*/)[0].replace(/\t/g, "    ").length;
      if (indent > levels.at(-1)) { levels.push(indent); push("<indent>", line); }
      while (indent < levels.at(-1)) { levels.pop(); push("<dedent>", line); }
      if (indent !== levels.at(-1)) error(line, "Align this line with its enclosing block.");
    }
    raw = language === "pseudocode" ? pseudoLine(raw.trim()) : raw.trim();
    const lex = /\s+|[A-Za-z_]\w*|\d+|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|&&|\|\||::|->|\/\/|[(){}\[\],:;.+\-*/%<>=!&]/gy;
    while (lex.lastIndex < raw.length) {
      const at = lex.lastIndex;
      const match = lex.exec(raw);
      if (!match) error(line, `The practice runner does not support ${JSON.stringify(raw[at])} here.`);
      const s = match[0];
      if (s.trim()) {
        push(s, line);
        if (indented && "([{".includes(s)) nesting++;
        if (indented && ")]}".includes(s)) nesting--;
      }
    }
    if (indented && nesting < 0) error(line, "Unexpected closing bracket.");
    if (indented && nesting === 0) push(";", line);
  }
  if (indented && nesting) error(lines.length, "Close the unfinished expression.");
  while (levels.length > 1) { levels.pop(); push("<dedent>", lines.length); }
  push("<end>", lines.length);

  let pos = 0;
  const peek = (offset = 0) => tokens[pos + offset]?.s;
  const line = () => tokens[pos]?.line ?? lines.length;
  const take = () => {
    if (peek() === "<end>" || pos >= tokens.length) error(line(), "Unexpected end of the draft.");
    return tokens[pos++].s;
  };
  const eat = s => { if (peek() !== s) return false; pos++; return true; };
  const expect = s => { if (!eat(s)) error(line(), `Expected ${s}, found ${peek()}.`); };
  const name = () => {
    if (!/^[a-z_]\w*$/i.test(peek() || "")) error(line(), "Expected a variable name.");
    return take();
  };
  const typed = new Set(["int", "long", "bool", "Integer", "auto", "size_t", "vector", "pair", "map", "unordered_map", "Map", "HashMap", "List", "ArrayList"]);
  function typeName() {
    eat("const");
    if (eat("std")) expect("::");
    const type = name();
    if (!typed.has(type)) error(line(), `Type ${type} is outside the practice runner’s supported types.`);
    if (eat("<")) {
      let depth = 1;
      while (depth) { const token = take(); if (token === "<") depth++; if (token === ">") depth--; }
    }
    while (peek() === "[" && peek(1) === "]") { take(); take(); }
    eat("&");
    return type;
  }

  const priority = new Map([
    ["or",1],["||",1],["and",2],["&&",2],["in",3],["not in",3],["is",3],["is not",3],
    ["==",3],["!=",3],["<",3],["<=",3],[">",3],[">=",3],["+",4],["-",4],
    ["*",5],["/",5],["//",5],["%",5]
  ]);
  function list(end, read = expression) {
    const items = [];
    if (!eat(end)) {
      do { items.push(read()); } while (eat(",") && peek() !== end);
      expect(end);
    }
    return items;
  }
  function names() { const items = [name()]; while (eat(",")) items.push(name()); return items; }
  function comprehension(value, key) {
    const vars = names();
    expect("in");
    return {kind:"collect", vars, value, key, over:expression(), filter:eat("if") ? expression() : null};
  }
  function atom() {
    const at = line(), token = take();
    if (/^\d+$/.test(token)) return {kind:"literal", value:Number(token)};
    if (["None","null","true","True","false","False"].includes(token)) return {kind:"literal", value:/true/i.test(token) ? true : /false/i.test(token) ? false : null};
    if (["-","+","!","not"].includes(token)) return {kind:"unary", op:token, value:expression(token === "not" ? 3 : 6)};
    if (token === "new" && !indented) {
      const type = typeName();
      if (eat("{")) return {kind:"array", items:list("}")};
      if (eat("(")) return {kind:"construct", type, args:list(")")};
      const dims = [];
      while (eat("[")) { dims.push(expression()); expect("]"); }
      if (!dims.length) error(at, "Expected an array size or constructor.");
      return {kind:"allocate", dims};
    }
    if (["(","[","{"].includes(token)) {
      if (!indented && token === "[") error(at, language === "java" ? "Use new int[]{i, j} to return a Java array." : "Use {i, j} to return a C++ vector.");
      if (language === "java" && token === "{") error(at, "Use new int[]{i, j} for an array expression.");
      const end = {"(":")","[":"]","{":"}"}[token];
      if (!indented && token === "(" && ["int","long","size_t"].includes(peek()) && peek(1) === ")") {
        const type = take();
        take();
        return {kind:"construct", type, args:[expression(6)]};
      }
      if (eat(end)) return token === "{" && indented ? {kind:"map", entries:[]} : {kind:"array", items:[]};
      const first = expression();
      if (token === "{" && eat(":")) {
        const value = expression();
        if (eat("for")) { const node = comprehension(value, first); expect(end); return node; }
        const entries = [[first,value]];
        while (eat(",") && peek() !== end) { const key = expression(); expect(":"); entries.push([key,expression()]); }
        expect(end); return {kind:"map", entries};
      }
      if (eat("for")) { const node = comprehension(first); expect(end); return node; }
      const tuple = peek() === ",";
      if (!indented && token === "(" && tuple) error(at, "Use an array or vector initializer for a pair of indices.");
      const items = [first];
      while (eat(",") && peek() !== end) items.push(expression());
      expect(end);
      return token === "(" && !tuple ? first : {kind:"array", items};
    }
    if (token === "lambda") { const param = name(); expect(":"); return {kind:"lambda", param, value:expression()}; }
    if (!/^[a-z_]\w*$/i.test(token)) error(at, `Unexpected ${token} in an expression.`);
    if (language === "cpp" && (typed.has(token) || (token === "std" && peek() === "::" && typed.has(peek(1))))) {
      pos--;
      const type = typeName();
      if (eat("{")) return {kind:"array", items:list("}")};
      expect("("); return {kind:"construct", type, args:list(")")};
    }
    if (token === "std" && eat("::")) return {kind:"name", id:name()};
    if (language === "java" && eat("->")) return {kind:"lambda", param:token, value:expression()};
    return {kind:"name", id:token};
  }
  function expression(min = 0) {
    let node = atom();
    for (;;) {
      if (eat("[")) { const key = expression(); expect("]"); node = {kind:"index", base:node, key}; }
      else if (eat(".") || eat("->")) node = {kind:"member", base:node, id:name()};
      else if (eat("(")) {
        const args = list(")", () => {
          if (peek() === "key" && peek(1) === "=") { take(); take(); }
          const value = expression();
          return eat("for") ? comprehension(value) : value;
        });
        node = {kind:"call", fn:node, args};
      } else {
        let op = peek();
        if (op === "not" && peek(1) === "in") op = "not in";
        if (op === "is" && peek(1) === "not") op = "is not";
        const rank = priority.get(op);
        if (rank == null || rank < min) return node;
        take(); if (op.includes(" ")) take();
        node = {kind:"binary", op, left:node, right:expression(rank + 1)};
      }
    }
  }

  function declaration() {
    const type = typeName(), entries = [];
    do {
      const id = name();
      const initialized = eat("=");
      let value;
      if ((initialized || language === "cpp") && eat("{")) value = {kind:"array", items:list("}")};
      else if (initialized) value = expression();
      else value = {kind:"construct", type, args:eat("(") ? list(")") : []};
      entries.push({id,value});
    } while (eat(","));
    return {kind:"declare", entries};
  }
  const isType = () => typed.has(peek()) || peek() === "const" || (peek() === "std" && typed.has(peek(2)));
  function simple() {
    if (!indented && isType()) return declaration();
    if (["++","--"].includes(peek())) { const op = take(); return {kind:"change", left:expression(), op}; }
    const left = [expression()];
    if (indented) while (eat(",")) left.push(expression());
    if (eat("=")) {
      const right = [expression()];
      if (indented) while (eat(",")) {
        // Pseudocode can initialize two variables on one line: l = 0, r = n - 1.
        if (language === "pseudocode" && peek(1) === "=") { left.push(expression()); expect("="); }
        right.push(expression());
      }
      return {kind:"assign", left, right};
    }
    if (["++","--","+=","-=","*="].includes(peek())) {
      const op = take();
      return {kind:"change", left:left[0], op, value:["++","--"].includes(op) ? null : expression()};
    }
    return {kind:"expr", value:left[0]};
  }

  function block(end) {
    const body = [];
    while (peek() !== end) {
      if (peek() === "<end>") error(line(), `Expected ${end} before the end of the draft.`);
      if (eat(";")) continue;
      const at = line();
      body.push({...statement(), line:at});
    }
    if (end !== "<end>") take();
    return body;
  }
  function suite() {
    if (indented) {
      expect(":");
      if (eat(";")) {
        if (!eat("<indent>")) error(line(), "Add an indented statement inside this block.");
        return block("<dedent>");
      }
    } else if (eat("{")) return block("}");
    const at = line();
    return [{...statement(), line:at}];
  }
  function condition() {
    if (indented) return expression();
    expect("("); const value = expression(); expect(")"); return value;
  }
  function branch() {
    const cond = condition(), yes = suite(), at = line();
    const no = eat("elif") ? [{...branch(), line:at}] : eat("else") ? suite() : [];
    return {kind:"if", cond, yes, no};
  }
  function statement() {
    if (eat("if")) return branch();
    if (eat("while")) return {kind:"loop", cond:condition(), body:suite()};
    if (eat("for")) {
      if (indented) {
        const vars = names(); expect("in");
        return {kind:"each", vars, over:expression(), body:suite()};
      }
      expect("(");
      const init = peek() === ";" ? null : simple();
      if (eat(":")) {
        if (init?.kind !== "declare" || init.entries.length !== 1) error(line(), "Expected one loop variable.");
        const over = expression(); expect(")"); return {kind:"each", vars:[init.entries[0].id], over, body:suite()};
      }
      expect(";");
      const cond = peek() === ";" ? null : expression(); expect(";");
      const update = peek() === ")" ? null : simple(); expect(")");
      return {kind:"loop", init, cond, update, body:suite()};
    }
    let node;
    if (eat("return")) {
      const values = [];
      if (peek() !== ";") { do { values.push(expression()); } while (indented && eat(",")); }
      node = {kind:"return", value:values.length > 1 ? {kind:"array",items:values} : values[0]};
    } else if (["pass","break","continue"].includes(peek())) node = {kind:take()};
    else node = simple();
    expect(";");
    return node;
  }

  let params = ["nums","target"], body;
  if (indented) {
    while (peek() === "from" || peek() === "import") {
      const at = line(), words = [];
      while (peek() !== ";") words.push(take());
      take();
      if (!/^(from typing import |import typing$)/.test(words.join(" "))) error(at, "The practice runner supports typing imports only.");
    }
    const wrapper = eat("class");
    if (wrapper) { name(); expect(":"); expect(";"); expect("<indent>"); }
    if (eat("def")) {
      const id = name();
      if (!["two_sum","twoSum"].includes(id)) error(line(), "Name the solution two_sum or twoSum.");
      expect("(");
      params = list(")", () => {
        const id = name();
        if (eat(":")) { while (![",",")"].includes(peek())) take(); }
        return id;
      }).filter(id => id !== "self");
      if (eat("->")) while (peek() !== ":") take();
      body = suite();
    } else body = block("<end>");
    if (wrapper) expect("<dedent>");
  } else {
    while (["using","import","package"].includes(peek())) { while (take() !== ";") {} }
    if (peek() === "public" && peek(1) === "class") take();
    const wrapper = eat("class");
    if (wrapper) { name(); expect("{"); if (peek() === "public" && peek(1) === ":") { take(); take(); } }
    eat("public"); eat("static");
    typeName();
    const id = name();
    if (id !== "twoSum" && id !== "two_sum") error(line(), "Provide a twoSum function with the array and target parameters.");
    expect("(");
    params = list(")", () => { typeName(); const id = name(); if (eat("[")) expect("]"); return id; });
    expect("{"); body = block("}");
    if (wrapper) { expect("}"); eat(";"); }
  }
  if (peek() !== "<end>") error(line(), "The practice runner expects a single solution function.");
  if (params.length !== 2) error(1, "Use two parameters for the input array and target.");
  if (!body.length) throw new Error("Add a solution body that returns the two indices, then run again.");
  return {params, body, language};
}
