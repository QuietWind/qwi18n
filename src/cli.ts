import * as yargs from "yargs";
import { findImports } from "./index";

interface FindImportsOptions {
  find: string | string[];
}

const options: FindImportsOptions = yargs
  .usage("--find [FILE-TYPE] [PATTERN] [PATH]")
  .options({
    "find": {
      type: "string",
      alias: "find",
      array: true,
      required: true,
      describe: "find imports"
    }
  })
  .version(function(){ return "0.1.1" })
  .help("help").argv;

if (options.find) {
  findImports(options.find);
}
