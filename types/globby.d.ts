declare module "globby" {
  import * as glob from "glob";

  type Patterns = string | string[];
  function globby(
    patterns: Patterns,
    options?: glob.IOptions
  ): Promise<string[]>;


  export function sync(patterns: Patterns, options?: glob.IOptions): string[];

  export default globby;
}
