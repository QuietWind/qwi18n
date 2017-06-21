import * as fs from "fs";
import * as globby from "globby";
import * as babylon from "babylon";
import * as ts from "typescript";

const defaultOptions = ts.getDefaultCompilerOptions();
const tsConfig: ts.CompilerOptions = {
  ...defaultOptions,
  jsx: ts.JsxEmit.Preserve,
  target: ts.ScriptTarget.ES2015,
  sourceMap: false,
  module: ts.ModuleKind.CommonJS
};

console.log(ts.transpile(`const lanNode: HTMLInputElement = <HTMLInputElement>document.getElementById("LanguageCode");`, tsConfig), 'eee')

export function findImports(patterns: string | string[]) {
  console.log("begin", patterns);

  const files = globby.sync(patterns);

  files.forEach(file => {
    let str = fs.readFileSync(file, "utf8");
    /**
         * ts tsx 支持
         */
    if (/tsx?$/.test(file)) {
      str = ts.transpile(str, tsConfig);
      fs.writeFileSync(`${file}.ast.js`, str);
    }

    try {
      const estree = babylon.parse(str, {
        sourceType: "module",
        allowImportExportEverywhere: true,
        plugins: [
          "estree",
          "decorators",
          "classProperties",
          "jsx",
          "flow",
          "dynamicImport",
          "objectRestSpread",
          "exportExtensions"
        ]
      });

      // console.log(JSON.stringify(estree, null, 4));
      fs.writeFileSync(`${file}.ast.json`, JSON.stringify(estree, null, 4));
    } catch (err) {
      console.log(file, "error");
    //   console.error(err, "error");
    }
  });
}
