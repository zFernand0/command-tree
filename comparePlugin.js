/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

/**
 * Run Github workflows locally
 *
 * Steps:
 * 1. Verifies that act is installed
 * 2. Reads given workflow (e.g. zowe-cli.yml)
 * 3. Replaces all known steps that could fail
 * 4. Generates a .github/_act_<workflow-name>.yml
 * 5. Executes `act -rW .github/_act_<workflow-name>.yml -e .github/_act_event.json
 * Creates a custom yaml file for running locally with act
 */
const cp = require("child_process");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const chalk = require("chalk");
const rl = require("readline").createInterface({input: process.stdin, output: process.stdout});

const opts = {
  help: ["--help", "-h"],
}

const _sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms ?? 1000));
}
const _handle = async (fun, msg) => {
  try {
    await fun();
  } catch(_) {
    if (msg) console.log(chalk.red(msg));
    console.error(_.toString());
    process.exit(1);
  }
}

const _yesno = async (q) => {
  const question = (str) => new Promise(resolve => rl.question(str, resolve));
  const res = (await question(q)) ?? "no";
  return res.toLowerCase() === "yes" || res.toLowerCase() === "y";
}

const _readLongJsonOutput = async (cmd) => {
  const tempFile = "__temp__.json";
  const tempPath = path.resolve(__dirname, tempFile);
  cp.execSync(`${cmd} > ${tempFile}`);
  const raw = fs.readFileSync(tempPath);
  await fsp.unlink(tempPath);
  return JSON.parse(raw.toString());
}

async function main() {
  const args = process.argv.slice(2);
  _handle(() => { if (args.length === 0) throw "Need 'plugin-name', 'versions' or both"; }, "Missing Arguments:");
  _handle(() => { if (args.length > 2) throw "Need 'plugin-name', 'versions' or both; Nothing else"; }, "Too many Arguments:");

  _handle(() => {
    console.log(`Using Zowe CLI version: ${cp.execSync("zowe --version").toString().trim()}`);
  }, "CLI not installed");
  await _sleep();

  let baseCli = null;
  console.log("Reading Base CLI...");
  await _sleep();
  _handle(async () => {
    baseCli = await _readLongJsonOutput("zowe --ac --rfj");
  }, "Error:\nUnable to get CLI commands:");

  if (args[0].indexOf(",") >= 0) {
    console.log("TODO: Compare versions of the CLI using docker");
  } else {
    console.log("TODO: Everything else");
  }
}

async function help() {
  console.log(`
Usage:
  Help:
  - node comparePlugin.js -h
  - node comparePlugin.js --help

  View Plugin Commands:
  - node comparePlugin.js <plugin-name>

  Compare CLI versions:
  - node comparePlugin.js <version1>,<version2>

  Compare Plugin versions:
  - node comparePlugin.js <plugin-name> <version1>,<version2>
`);
}

(async () => {
  if (process.argv.indexOf(opts.help[0]) > 0 || process.argv.indexOf(opts.help[1]) > 0) {
    await help();
  } else {
    await main();
  }
  rl.close();
})();