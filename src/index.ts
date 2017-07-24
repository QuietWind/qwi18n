import * as fs from "fs";
import * as path from "path";
import * as globby from "globby";
import * as babylon from "babylon";
import { findModulePath, PathOption } from "./file";

export interface ImportItem {
  file: string;
  modules: string[];
  count: number;
}

const ignoreReg = /(\.d\.ts|\.png|\.jpg|\.json|\.svg|\.scss|\.css|\.less)$/i;

/**
 * 
 * @param codeStr 代码str
 */
function findModules(codeStr: string): string[] {
  const modules: string[] = [];
  try {
    const estree = babylon.parse(codeStr, {
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

    function addModule(filename: string) {
      if (ignoreReg.test(filename)) {
        return;
      }

      if (modules.findIndex(ele => ele === filename) === -1) {
        modules.push(filename);
      }
    }

    estree.program.body.forEach(function(node: any) {
      if (
        node.type === "ExpressionStatement" &&
        node.expression.type === "CallExpression" &&
        node.expression.callee.type === "MemberExpression" &&
        node.expression.callee.object.type === "CallExpression" &&
        node.expression.callee.object.callee.name === "require"
      ) {
        addModule(node.expression.callee.object.arguments[0].value);
        return;
      }

      if (
        node.type === "ExpressionStatement" &&
        node.expression.type === "CallExpression" &&
        node.expression.callee.name === "require"
      ) {
        addModule(node.expression.arguments[0].value);
        return;
      }

      if (node.type === "VariableDeclaration") {
        node.declarations.forEach(function(decl: any) {
          if (
            !decl.init ||
            decl.init.type !== "CallExpression" ||
            decl.init.callee.name !== "require"
          ) {
            return;
          }

          addModule(decl.init.arguments[0].value);
        });
        return;
      }

      if (node.type === "ImportDeclaration") {
        addModule(node.source.value);
        return;
      }
    });

    return modules;
  } catch (err) {
    console.log(err);
    return modules;
  }
}

const defaultItem: ImportItem = {
  file: "",
  modules: [],
  count: 0
};
function findFileModules(
  file: string,
  item: ImportItem = defaultItem,
  options: PathOption
): ImportItem | null {
  if (ignoreReg.test(file) || !fs.existsSync(file)) {
    return null;
  }

  const str = fs.readFileSync(file, "utf8");

  const filename = path.resolve(process.cwd(), file);
  if (!item.file) {
    item.file = filename;
  }

  function addModuleToImport(moduleFile: string): void {
    const modulePath = findModulePath(file, moduleFile, options) || moduleFile;

    if (item.modules.findIndex(ele => ele === modulePath) === -1) {
      item.modules.push(modulePath);
      item.count += 1
      findFileModules(modulePath, item, options);
    }
  }

  const modules = findModules(str);
  console.log(modules);

  modules.forEach(ele => {
    addModuleToImport(ele);
  });

  console.log(item);

  return item;
}

interface Options extends PathOption {}

const defaultOptions: Options = {
  baseUrl: [process.cwd(), `${process.cwd()}/node_modules`],
  extensions: [".js", ".jsx", ".ts", ".tsx"],
  node_modules: false
};

export function findImports(
  patterns: string | string[],
  options: PathOption = defaultOptions
) {
  const Imports: ImportItem[] = [];

  const files = globby.sync(patterns);
  if (files.length === 0) {
    console.log(`${patterns} error, cannot find any file.`);
    process.exit(0);
  }

  files.forEach(file => {
    const item = findFileModules(file, undefined, options);
    if (item !== null) {
      Imports.push(item);
    }
  });

  fs.writeFileSync(
    `${process.cwd()}/imports.json`,
    JSON.stringify(Imports, null, 4)
  );

  return Imports;
}

export default findImports;
