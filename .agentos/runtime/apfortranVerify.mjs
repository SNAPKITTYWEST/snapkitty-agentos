import { existsSync, readFileSync } from "node:fs";
import { ok, fail, isMain } from "./core.mjs";

const requiredFiles = [
  ".agentos/runtime/apfortran.h",
  ".agentos/runtime/apfortran.c",
  ".agentos/runtime/apfortran_expr.c",
  ".agentos/runtime/apfortran_array.c",
  ".agentos/runtime/apfortran_fortran.c",
  ".agentos/runtime/apfortran_objc.h",
  ".agentos/runtime/apfortran_objc.m",
  ".agentos/runtime/gitbucket_sqlite.h",
  "APL_FORTRAN_WINDOWS_README.md",
  "CMakeLists.txt"
];

const requiredSymbols = [
  "apl_init",
  "apl_parse",
  "apl_create_array",
  "apl_fortran_backend",
  "gitbucket",
  "sqlite"
];

export function verifyApFortran() {
  const missing = requiredFiles.filter((file) => !existsSync(file));
  if (missing.length > 0) return fail("missing APL Fortran files", { missing });

  const corpus = requiredFiles
    .filter((file) => /\.(c|h|m|md|txt)$/i.test(file))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  const missingSymbols = requiredSymbols.filter((symbol) => !corpus.includes(symbol));
  if (missingSymbols.length > 0) {
    return fail("missing APL Fortran symbols", { missingSymbols });
  }

  const badCHeaders = [".agentos/runtime/apfortran_array.c", ".agentos/runtime/apfortran_fortran.c"]
    .filter((file) => /^# [A-Za-z]/.test(readFileSync(file, "utf8")));
  if (badCHeaders.length > 0) {
    return fail("invalid C prose headers", { files: badCHeaders });
  }

  return ok("APL Fortran source package verified", {
    files: requiredFiles.length,
    symbols: requiredSymbols.length,
    nativeBuild: "run npm run windows:build from a Visual Studio developer shell"
  });
}

if (isMain(import.meta.url)) {
  const result = verifyApFortran();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}
