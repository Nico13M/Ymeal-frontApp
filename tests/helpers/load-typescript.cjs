const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

// Run the production TypeScript modules with Node's test runner, without adding
// a second framework or loading native modules. Network/storage are mocked by callers.
module.exports = function loadTypeScript(relativePath, mocks = {}) {
  const root = path.resolve(path.dirname(module.filename), "../..");
  const cache = new Map();

  function load(file) {
    const filename = [file, `${file}.ts`, `${file}.tsx`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!filename) throw new Error(`Module not found: ${file}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const compiled = new Module(filename, module);
    compiled.filename = filename;
    compiled.paths = Module._nodeModulePaths(path.dirname(filename));
    cache.set(filename, compiled);
    const originalRequire = compiled.require.bind(compiled);
    compiled.require = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith("@/")) return load(path.join(root, name.slice(2)));
      if (name.startsWith(".")) return load(path.resolve(path.dirname(filename), name));
      return originalRequire(name);
    };
    const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.React },
      fileName: filename,
      reportDiagnostics: true,
    });
    const errors = result.diagnostics?.filter((item) => item.category === ts.DiagnosticCategory.Error) ?? [];
    if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, ts.createCompilerHost({})));
    compiled._compile(result.outputText, filename);
    return compiled.exports;
  }

  return load(path.resolve(root, relativePath));
};
