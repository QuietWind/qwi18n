import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface PathOption {
  baseUrl: string[];
  extensions: string[];
  node_modules: boolean;
}

export function digest(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

export function genPath(root: string, filename: string): string | null {
  const r = path.resolve(root, filename);
  if (fs.existsSync(r)) {
    return r;
  } else {
    return null;
  }
}

export function findModulePath(
  rootfile: string,
  filename: string,
  options: PathOption
): string | null {
  /**
 * . 相对路径
 * . 绝对路径
 */
  let r: string | null = null;
  const testExtnamReg = new RegExp(
    `(${options.extensions.join("|").replace(".", "\\.")})$`,
    "i"
  );

  function indexDeal(name: string) {
    options.extensions.forEach(extname => {
      if (r !== null) {
        return;
      }

      r = findModulePath(rootfile, `${name}${extname}`, options);

      if (r === null) {
        r = findModulePath(rootfile, `${name}/index${extname}`, options);
      }
    });
  }

  if (testExtnamReg.test(filename)) {
    const rootPathData = path.parse(rootfile);
    r = genPath(rootPathData.dir, filename);

    if (r === null) {
      options.baseUrl.forEach(ele => {
        if (r !== null) {
          return;
        }
        r = genPath(ele, filename);
      });
    }
  } else {
    indexDeal(filename);

    if (r === null) {
      options.baseUrl.forEach(baseRoot => {
        if (baseRoot.indexOf("node_modules") !== -1) {
          if (!options.node_modules) {
            r = null;
            return;
          }
          const dir = path.resolve(baseRoot, filename);
          if (fs.existsSync(dir)) {
            const pkgFile = JSON.parse(
              fs.readFileSync(`${dir}/package.json`, "utf8")
            ).main;

            r = genPath(dir, pkgFile);
          }
        } else {
          const dir = path.resolve(baseRoot, filename);

          if (fs.existsSync(dir)) {
            indexDeal(dir);
          }
        }
      });
    }
  }

  return r;
}
