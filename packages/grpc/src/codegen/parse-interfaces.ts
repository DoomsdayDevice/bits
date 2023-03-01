var fs = require("fs");
var ts2json = require("ts2json");

export function parseInterfaces() {
  const p = process.argv[2];
  console.log({ args: process.argv });
  const fullPath = `${process.cwd()}/${p}`;

  console.log({ p, d: fullPath });
  const file = fs.readFileSync(fullPath);
  const oneOfs = [];
  const str: string = file.toString();
  // str.forEach((c, i) => {
  //   console.log({ c });
  // });
  const ans = file.toString().match(/oneOf/);
  // console.log({ ans });
}

function patchInterface() {
  // remove oneOf?:
  // if  | is right after oneOf?: remove it too
  // remove previous curly bracket and matching
}

parseInterfaces();
