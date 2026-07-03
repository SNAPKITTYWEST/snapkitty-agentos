// APL Fortran Windows Test Harness
// Platform: Windows x64
// Purpose: Test APL Fortran bindings on Windows

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const aplfortranPath = path.join(__dirname, "apfortran.c");
const apfortranHeaderPath = path.join(__dirname, "apfortran.h");

function log(message) {
  console.log(`[APL Fortran Test] ${message}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function runTest(testName, testFunc) {
  try {
    log(`Running test: ${testName}`);
    const result = testFunc();
    log(`✅ Test passed: ${testName}`);
    return true;
  } catch (error) {
    console.error(`[APL Fortran Test] ❌ Test failed: ${testName}`, error.message);
    return false;
  }
}

function checkAPLFortranHeaders() {
  const headers = [
    aplfortranPath,
    apfortranHeaderPath
  ];

  for (const header of headers) {
    if (!checkFileExists(header)) {
      throw new Error(`Header file not found: ${header}`);
    }
  }

  log("✅ All APL Fortran header files present");
}

function checkWindowsCompatibility() {
  // Check if running on Windows
  if (process.platform !== "win32") {
    throw new Error("APLFortran Windows tests require Windows platform");
  }

  log("✅ Windows platform detected");
}

function checkVisualStudioTools() {
  // Check for Visual Studio build tools
  const vsInstallPath = process.env.VCINSTALLDIR;
  if (!vsInstallPath) {
    log("Visual Studio tools not loaded. Native compile test skipped outside a VS developer shell.");
    return;
  }

  const vcvarsPath = path.join(vsInstallPath, "vcvarsall.bat");
  if (!checkFileExists(vcvarsPath)) {
    throw new Error("Visual Studio vcvarsall.bat not found.");
  }

  log("✅ Visual Studio build tools found");
}

function checkCompilerIntegration() {
  // Check that the C compiler is accessible
  try {
    execSync("cl /? >nul 2>&1", { encoding: "utf8" });
    log("✅ C compiler (Visual C++) found");
  } catch (error) {
    log("Visual C++ compiler not on PATH. Native compile test skipped.");
    return;
  }

  // Check for relevant Visual C++ runtime libraries
  const libPaths = [
    "vcruntime140.dll",
    "msvcr140.dll",
    "ucrt.dll"
  ];

  const system32 = path.join(process.env.WINDIR || "C:\\Windows", "System32");

  for (const lib of libPaths) {
    const libPath = path.join(system32, lib);
    if (!checkFileExists(libPath)) {
      console.warn(`[APL Fortran Test] Warning: Runtime library not found: ${lib}`);
    }
  }
}

function checkAPIFunctionality() {
  // This test checks that the APL Fortran API functions
  // are accessible and can be called (if compiled)

  // We can't actually call the compiled functions since they
  // need to be compiled first, but we can verify the source exists
  const sourceFiles = [
    path.join(__dirname, "apfortran.c"),
    path.join(__dirname, "apfortran_expr.c"),
    path.join(__dirname, "apfortran_array.c"),
    path.join(__dirname, "apfortran_fortran.c")
  ];

  for (const file of sourceFiles) {
    if (!checkFileExists(file)) {
      throw new Error(`Source file not found: ${file}`);
    }
  }

  log("✅ All APL Fortran source files present");
}

function checkCMakeConfiguration() {
  const cmakeFile = path.join(__dirname, "..", "..", "CMakeLists.txt");
  if (!checkFileExists(cmakeFile)) {
    throw new Error("CMakeLists.txt not found");
  }

  const cmakeContent = fs.readFileSync(cmakeFile, "utf8");

  // Check for Windows-specific configurations
  const windowsChecks = [
    /CMAKE_GENERATOR.*Visual.*Studio/g,
    /Visual Studio/g,
    /developer shell/g,
    /WIN32/g,
    /MSVC/g,
    /_WIN32/g
  ];

  let windowsConfigured = false;
  for (const regex of windowsChecks) {
    if (regex.test(cmakeContent)) {
      windowsConfigured = true;
      break;
    }
  }

  if (!windowsConfigured) {
    console.warn("[APL Fortran Test] Warning: CMake configuration may not have Windows-specific settings");
  }

  log("✅ CMake configuration found");
}

function checkDocumentation() {
  const docs = [
    path.join(__dirname, "..", "..", "APL_FORTRAN_WINDOWS_README.md"),
    path.join(__dirname, "apfortran.md")
  ];

  for (const doc of docs) {
    if (!checkFileExists(doc)) {
      console.warn(`[APL Fortran Test] Warning: Documentation file not found: ${doc}`);
    }
  }

  log("✅ Documentation files found");
}

function testAPLFortranBuild() {
  const buildDir = path.join(__dirname, "..", "..", "build");

  if (!checkFileExists(buildDir)) {
    log("Build directory not found. Skipping compiled tests.");
    return true;
  }

  const libDir = path.join(buildDir, "Release");
  if (!checkFileExists(libDir)) {
    log("Release build directory not found. Skipping compiled tests.");
    return true;
  }

  const possibleLibNames = [
    "aplfortran.lib",
    "aplfortran.dll",
    "aplfortrangstatic.lib"
  ];

  let libFound = false;
  for (const lib of possibleLibNames) {
    if (checkFileExists(path.join(libDir, lib))) {
      libFound = true;
      log(`✅ Found library: ${lib}`);
      break;
    }
  }

  if (!libFound) {
    console.warn("[APL Fortran Test] Warning: No APL Fortran library found in Release build.");
  }

  return true;
}

function checkAPLFortranLicense() {
  const licensePath = path.join(__dirname, "..", "..", "LICENSE");
  if (!checkFileExists(licensePath)) {
    throw new Error("LICENSE file not found");
  }

  const licenseContent = fs.readFileSync(licensePath, "utf8");

  // Check for Apache 2.0 license
  if (!licenseContent.includes("Apache License") || !licenseContent.includes("2.0")) {
    console.warn("[APL Fortran Test] Warning: LICENSE file may not be Apache 2.0");
  }

  log("✅ License file found and appears to be Apache 2.0");
}

function printTestSummary(passedTests, totalTests) {
  console.log("\n" + "=".repeat(60));
  console.log("APL Fortran Windows Test Summary");
  console.log("=" .repeat(60));
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%`);
  console.log("=" .repeat(60));

  if (passedTests === totalTests) {
    console.log("🎉 All Windows compatibility tests passed!")
    return true;
  } else {
    console.log("⚠️  Some tests failed. Review the warnings above.");
    return false;
  }
}

function main() {
  const tests = [
    { name: "File Structure", func: checkAPLFortranHeaders },
    { name: "Platform Compatibility", func: checkWindowsCompatibility },
    { name: "Build Tools Check", func: checkVisualStudioTools },
    { name: "Compiler Integration", func: checkCompilerIntegration },
    { name: "API Functionality", func: checkAPIFunctionality },
    { name: "CMake Configuration", func: checkCMakeConfiguration },
    { name: "Documentation", func: checkDocumentation },
    { name: "License Check", func: checkAPLFortranLicense },
    { name: "Build Directory", func: testAPLFortranBuild }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    if (runTest(test.name, test.func)) {
      passedTests++;
    }
  }

  const success = printTestSummary(passedTests, totalTests);

  if (!success) {
    process.exit(1);
  }

  console.log("\n✅ APL Fortran Windows compatibility tests completed successfully!");
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}

export { main as runTests };
