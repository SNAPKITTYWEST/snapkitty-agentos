# APL Fortran C Bindings - Windows Port
# Platform: Windows x64
# Architecture: APL Array Language -> Fortran Runtime with C Bindings

## Overview

This project provides a Windows-compatible source package for APL (Array
Programming Language) to Fortran runtime bindings. The AgentOS verifier checks
the source package, API surface, CMake metadata, and Windows environment. Native
C compilation is intentionally gated behind a Visual Studio developer shell.

### Key Features

- **APL Expression Parsing**: Parse APL expressions into an abstract syntax tree (AST)
- **Array-Orientation**: Full support for APL's array-based operations
- **Fortran Backend**: Source package for generating Fortran code from APL expressions
- **C API Integration**: Cross-language compatibility for Windows applications
- **Optimization Pipeline**: Hooks for vectorization, fusion, tiling, parallelization, and offloading
- **Memory Management**: Efficient array operations and garbage collection
- **Windows Compatibility**: Native Windows API integration, threading, and file I/O

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               APL Fortran C Bindings                        │
│                   (Windows API)                             │
├─────────────────────────────────────────────────────────────┤
│             APL Expression Parser                            │
│                 • AST Construction                           │
│                 • Semantic Analysis                          │
├─────────────────────────────────────────────────────────────┤
│                APL Array Engine                              │
│                 • Array Operations                           │
│                 • Memory Management                         │
│                 • Array Manipulation                        │
├─────────────────────────────────────────────────────────────┤
│               APL Fortran Backend                             │
│                 • Fortran Code Generation                   │
│                 • Optimization Pipeline                      │
│                 • Compilation & Linking                      │
├─────────────────────────────────────────────────────────────┤
│                    Fortran Runtime                            │
│                 • BLAS/LAPACK Integration                    │
│                 • Parallel Processing                        │
│                 • Array Computations                        │
└─────────────────────────────────────────────────────────────┘
```

### Primary Components

1. **Core Runtime** (`apfortran.c`)
   - C bindings and Windows API integration
   - Memory management and threading
   - Error handling and platform abstractions

2. **Expression Engine** (`apfortran_expr.c`)
   - APL parser and AST construction
   - Expression evaluation and manipulation
   - Ref-counted memory management

3. **Array Engine** (`apfortran_array.c`)
   - APL array operations (shape, dtype, memory)
   - Array iteration and transformation
   - Vectorization and parallelization

4. **Fortran Backend** (`apfortran_fortran.c`)
   - Fortran code generation
   - Optimization pipeline (vectorization, fusion, tiling)
   - Compilation and execution

### Building on Windows

#### Prerequisites

- Visual Studio 2019 or later (with C++ development tools)
- Windows SDK
- Git for Windows
- Node.js (>= 20) for testing

#### Build Instructions

**Option 1: Using CMake**

```bash
# Create build directory
mkdir build && cd build

# Configure CMake
cmake -S . -B build -G "Visual Studio 17 2022" -A x64

# Build the source-package verification target
cmake --build build --config Release

# Install (optional)
cmake --install build --config Release --prefix "C:/Program Files/APL Fortran"
```

**Option 2: Using Visual Studio**

1. Open a Visual Studio developer shell.
2. Run `npm run windows:build`.
3. Run `npm run test:aplfortran`.

**Option 3: Using Command Line (MinGW or WSL)**

```bash
# Using MinGW-w64
cmake -S . -B build -G "MinGW Makefiles"
cmake --build .

# Using WSL (Windows Subsystem for Linux)
cd /mnt/c/Users/jessi/IdeaProjects/SNAPKITTYWEST/snapkitty-agentos
mkdir build && cd build
cmake .. -G "Unix Makefiles"
make
```

#### Testing on Windows

```bash
# Navigate to snapkitty-agentos
cd C:/Users/jessi/IdeaProjects/SNAPKITTYWEST/snapkitty-agentos

# Run the test suite
npm test

# Verify the build
npm run verify:all

# Bootstrap context
npm run context:bootstrap

# Test APL Fortran specifically
npm run test:aplfortran
```

### API Usage Examples

#### Basic Array Operations

```c
#include "apfortran.h"

int main() {
    // Initialize the APL Fortran runtime
    apl_compiler_options_t opts = {0};
    opts.enable_vectorization = true;
    opts.enable_fusion = true;
    opts.enable_tiling = true;
    apl_init(&opts);

    // Create an APL expression: 2 * 3 + 4
    apl_expr_t* expr = apl_expr_create(APL_EXPR_BINARY);
    apl_expr_t* lit2 = apl_expr_literal(2.0);
    apl_expr_t* lit3 = apl_expr_literal(3.0);
    apl_expr_t* mul = apl_expr_binary(NULL, lit2, '*', lit3);
    apl_expr_t* lit4 = apl_expr_literal(4.0);
    apl_expr_t* add = apl_expr_binary(NULL, mul, '+', lit4);

    // Create array input
    int shape[] = {1};
    double data[] = {2.0};
    apl_array_t* input = apl_array_create(1, shape, "float64", sizeof(double), data);

    // Compile and execute
    apl_fortran_backend_t* backend;
    apl_compile(add, &backend);

    apl_array_t* output;
    apl_execute(backend, input, &output);

    // Print result
    apl_print_array(output);

    // Cleanup
    apl_free_expr(add);
    apl_array_free(input);
    apl_array_free(output);
    apl_free_backend(backend);
    apl_cleanup();

    return 0;
}
```

#### Advanced Array Processing

```c
// APL scalar function
apl_error_t apl_scalar_func(double* x) {
    // Apply function element-wise
    *x = *x * *x + 1.0;  // f(x) = x² + 1
    return APL_SUCCESS;
}

// Create and process an array
int shape[] = {3, 4};
double data[12] = {1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0};
apl_array_t* arr = apl_array_create(2, shape, "float64", sizeof(double), data);

apl_array_apply_to_all(arr, (apl_array_element_op)apl_scalar_func);

apl_array_free(arr);
```

#### Parallel Processing

```c
#include <omp.h>

// Configure parallel processing
apl_compiler_options_t opts = {0};
opts.enable_parallelization = true;
opts.num_threads = omp_get_max_threads();

opts.tile_size = 64;  // Cache-friendly tile size
apl_init(&opts);

// Process with parallel backend
apl_array_t* result;
apl_optimized_process(input_array, &result);
```

### Windows-Specific Features

#### Native Threading

```c
// Create a Windows thread
apl_thread_t thread;
apl_create_thread(&thread, my_worker_function, my_args);
apl_join_thread(&thread);
```

#### File I/O

```c
// Windows file operations (UTF-8 support)
apl_file_handle_t* file = apl_win32_file_open("C:/data/input.bin");
if (file) {
    apl_win32_file_read(file, buffer, BUFFER_SIZE);
    apl_win32_file_close(file);
}
```

#### Memory Management

```c
// Aligned memory allocation (for Fortran compatibility)
double* aligned_data = (double*)apl_win32_aligned_alloc(64, sizeof(double) * 1024);
if (aligned_data) {
    // Use aligned memory
    apl_win32_aligned_free(aligned_data);
}
```

### Configuration and Options

The APL Fortran C bindings support extensive configuration through the `apl_compiler_options_t` structure:

```c
typedef struct {
    bool enable_vectorization;   // SIMD instructions
    bool enable_fusion;          // Loop fusion
    bool enable_tiling;          // Cache tiling
    bool enable_parallelization; // OpenMP parallelization
    int64_t tile_size;           // Tile size in elements
    int num_threads;             // Thread count
    const char* optimization_level; // "0" (none) to "3" (aggressive)
} apl_compiler_options_t;
```

### Error Handling

All functions return `apl_error_t` error codes:

```c
typedef enum {
    APL_SUCCESS = 0,           // Success
    APL_ERROR_UNSPECIFIED = 1, // Generic error
    APL_ERROR_PARSER = 2,       // Parse error
    APL_ERROR_SEMANTIC = 3,     // Semantic error
    APL_ERROR_COMPILER = 4,     // Compilation error
    APL_ERROR_MEMORY = 5,       // Memory allocation error
    APL_ERROR_F90 = 6           // Fortran runtime error
} apl_error_t;
```

Use `apl_error_string()` to get human-readable error messages:

```c
apl_error_t err = apl_execute_program("A+1", "program.f90");
if (err != APL_SUCCESS) {
    const char* msg = apl_error_string(err);
    fprintf(stderr, "Error: %s\n", msg);
}
```

### Performance Considerations

1. **Memory Alignment**: Use 64-byte alignment for optimal SIMD performance
2. **Cache Blocking**: Configure tile sizes based on cache line sizes
3. **Numa Awareness**: Windows supports NUMA memory, use `apl_win32_aligned_alloc()`
4. **Thread Affinity**: Set thread affinity for NUMA systems

### Integration with SnapKitty Agent OS

The APL Fortran C bindings integrate with the broader SnapKitty ecosystem:

```bash
# Bootstrap the agent OS
npm run context:bootstrap

# Verify all components
npm run verify:all

# P/NP Swarm integration
npm run pnp:claim optimal_borrow_schedule_2026_Q3
```

### Development and Testing

#### Unit Tests

Run the test suite:

```bash
npm test
```

Run specific tests:

```bash
# Test array operations only
node --test .agentos/runtime/apfortran_array.c

# Test expression parser
node --test .agentos/runtime/apfortran_expr.c
```

#### Performance Testing

```c
// Benchmark APL expressions
double elapsed_ms;
apl_benchmark("A*B", 1000, &elapsed_ms);
printf("Average time: %.3f ms\n", elapsed_ms);
```

### License

Apache 2.0

### References

1. **[APL Language]** https://en.wikipedia.org/wiki/APL_(programming_language)
2. **[Fortran 90]** ISO/IEC 1539-1:2010
3. **[BLAS]** https://netlib.org/blas/
4. **[LAPACK]** https://netlib.org/lapack/

### Changelog

#### Version 1.0.0 (2026-07-03)
- Initial Windows release
- C bindings for APL->Fortran compilation
- Array operations and optimizations
- Integration with SnapKitty Agent OS
