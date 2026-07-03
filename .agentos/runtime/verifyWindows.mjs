import { existsSync } from "node:fs";
import { ok, fail, isMain } from "./core.mjs";
import { verifyApFortran } from "./apfortranVerify.mjs";

export function verifyWindows() {
  if (process.platform !== "win32") {
    return fail("windows verifier must run on Windows", { platform: process.platform });
  }

  const sourceCheck = verifyApFortran();
  if (!sourceCheck.ok) return sourceCheck;

  return ok("Windows AgentOS source package verified", {
    visualStudioShell: Boolean(process.env.VCINSTALLDIR),
    cmakePresent: existsSync("CMakeLists.txt"),
    note: "Native C compilation requires a Visual Studio developer shell."
  });
}

if (isMain(import.meta.url)) {
  const result = verifyWindows();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}
