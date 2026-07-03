APLFortran C Bindings
========================

**Description**
This module provides C bindings for the APL-to-Fortran compilation system, enabling APL expressions to be compiled and executed in Fortran runtime with full support for array operations, optimization passes, and cross-platform deployment.

**Module Files**

| File | Description |
|------|-------------|
| `apfortran.h` | Main C API header with Windows compatibility pragmas |
| `apfortran.c` | Core C bindings and Windows API integration |
| `apfortran_expr.c` | APL parser, AST construction, and expression handling |
| `apfortran_array.c` | APL array operations and memory management |
| `apfortran_fortran.c` | Fortran backend, code generation, and compilation |
| `CMakeLists.txt` | Build configuration for Windows and cross-platform compilation |
| `apfortran_config.json` | Runtime configuration for APL Fortran bindings |

**Building APL Fortran**

### Prerequisites
- Node.js (>= 20)
- Visual C++ Build Tools (Windows) or GCC/Clang (Unix)
- CMake (>= 3.15)

### Build Commands

#### Standard Build
```bash
# Navigate to the snapkitty-agentos directory
cd C:/Users/jessi/IdeaProjects/SNAPKITTYWEST/snapkitty-agentos

# Build APL Fortran C bindings
cmake -S . -B build -G "Visual Studio 17 2022" -A x64
cmake --build build --config Release

# Install (optional)
cmake --install build --config Release
```

#### Development Build
```bash
# Configure for development
cmake -S . -B build-dev -G "Ninja"
cmake --build build-dev

# Run tests
ctest --test-dir build-dev -C Debug
```

#### Cross-Platform Build
```bash
# For Unix-like systems
cmake -S . -B build-unix -G "Unix Makefiles"
cmake --build build-unix
```

### API Usage Examples

#### Basic APL Expression Compilation
```c
#include "apfortran.h"

int main() {
    // Initialize APL Fortran runtime
    apl_compiler_options_t opts = {0};
    opts.enable_vectorization = true;
    opts.enable_fusion = true;
    opts.enable_tiling = true;
    apl_init(&opts);

    // Parse APL expression: (2 + 3) * 4 - 1
    const char* source = "(2 + 3) * 4 - 1";
    apl_expr_t* expr;
    apl_parse(source, &expr);

    // Execute expression
    apl_array_t* result;
    apl_evaluate(source, &result);

    // Process result using Fortran backend
    apl_fortran_backend_t* backend;
    apl_compile(expr, &backend);

    // Clean up
    apl_free_expr(expr);
    apl_array_free(result);
    apl_free_backend(backend);
    apl_cleanup();

    return 0;
}
```

#### Advanced Array Operations
```c
// Create a 2D APL array
int shape[] = {3, 4};
double data[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12};
apl_array_t* arr = apl_array_create(2, shape, "float64", sizeof(double), data);

// Apply APL functions to arrays
apl_array_t* squared;
apl_array_copy(&squared, arr);

// Element-wise square function
scalar_op_t square_op = [](void* elem, size_t size, void* ctx) {
    double* val = (double*)elem;
    *val = (*val) * (*val);
};

apl_array_apply_to_all(squared, square_op, NULL);

// Generate Fortran code for optimization
apl_fortran_backend_t* backend;
apl_compile(arr, &backend);
apl_generate_f90(backend, "optimized.f90");

// Execute optimized Fortran code
apl_array_t* output;
apl_execute(backend, squared, &output);

// Cleanup
apl_array_free(arr);
apl_array_free(squared);
apl_array_free(output);
apl_free_backend(backend);
```

#### Fortran Integration
```c
// Register Fortran callbacks for runtime integration
apl_fortran_callback fortran_callback = [](const char* operation, const char* args) {
    // Forward operation to Fortran runtime
    if (strcmp(operation, "matmul") == 0) {
        // Handle matrix multiplication
        // Implementation depends on Fortran runtime
    } else if (strcmp(operation, "solve") == 0) {
        // Handle linear system solving
        // Implementation depends on Fortran runtime
    }
};

apl_register_fortran_callback(fortran_callback);

// Execute Fortran program with APL-generated code
apl_execute_fortran("matrix_operations.f90");
```

#### Performance Optimization
```c
// Configure optimization options
apl_compiler_options_t opts = {0};
opts.enable_vectorization = true;      // Enable SIMD instructions
opts.enable_fusion = true;             // Enable loop fusion
opts.enable_tiling = true;             // Enable cache tiling
opts.enable_parallelization = true;   // Enable OpenMP parallelization
opts.tile_size = 64;                   // Cache-friendly tile size
opts.num_threads = 8;                  // Number of threads for parallel processing
opts.optimization_level = "3";        // Aggressive optimization

apl_init(&opts);

// Process array with optimizations
apl_array_t* result;
apl_optimized_process(input_array, &result, backend);
```

### APL Expression AST

The APL expression AST supports the following node types:

| Node Type | Description |
|-----------|-------------|
| `APL_EXPR_LITERAL` | Numeric literal (double) |
| `APL_EXPR_BINARY` | Binary operation (+, -, *, /, ^) |
| `APL_EXPR_UNARY` | Unary operation (+, -, ~) |
| `APL_EXPR_ARRAY` | Array construction from expression |
| `APL_EXPR_SCALAR` | Scalar application to array |
| `APL_EXPR_ATOM` | Named function or variable |
| `APL_EXPR_CALL` | Function call with arguments |
| `APL_EXPR_NOFREE` | Opaque pointer for custom objects |

### Array Operations API

#### Array Creation and Management
```c
// Create a new APL array
apl_array_t* arr = apl_array_create(rank, shape, dtype, element_size, data);

// Free array and all associated resources
apl_array_free(arr);

// Copy array
apl_array_t* copy;
apl_array_copy(&copy, arr);

// Get array metadata
apl_array_rank(arr, &rank);
apl_array_shape(arr, shape);
apl_array_dtype(arr, &dtype);
```

#### Array Iteration and Application
```c
// Iterate over all array elements
apl_array_iterate(arr, &my_callback, context);

// Apply operation to all elements
apl_array_apply_to_all(arr, &my_operation);
```

#### Array Mathematics
```c
// Element-wise operations combining two arrays
apl_array_t* result;
apl_array_binary_op(arr1, arr2, &result, &add_operation);

// Reduce operation across dimensions
double scalar = apl_array_reduce(arr, &sum_reduce, dimension);
```

### Error Handling

All APL Fortran functions return an `apl_error_t` error code:

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

### Windows-Specific Features

#### Native Threading
```c
// Create a Windows thread using aplfortran
apl_thread_t thread;
apl_create_thread(&thread, my_worker_function, my_args);
apl_join_thread(&thread);
```

#### File I/O
```c
// Windows file operations with UTF-8 support
apl_file_handle_t* file = apl_win32_file_open("C:/data/input.bin");
if (file) {
    apl_win32_file_read(file, buffer, BUFFER_SIZE);
    apl_win32_file_close(file);
}
```

#### Memory Management
```c
// Aligned memory allocation for Fortran compatibility
double* aligned_data = (double*)apl_win32_aligned_alloc(64, sizeof(double) * 1024);
if (aligned_data) {
    // Use aligned memory
    apl_win32_aligned_free(aligned_data);
}
```

### Configuration

The APL Fortran runtime can be configured using `apl_compiler_options_t`:

```c
typedef struct {
    bool enable_vectorization;   // Enable SIMD instructions
    bool enable_fusion;          // Enable loop fusion
    bool enable_tiling;          // Enable cache tiling
    bool enable_parallelization; // Enable OpenMP parallelization
    int64_t tile_size;           // Cache-friendly tile size
    int num_threads;             // Thread count
    const char* optimization_level; // "0" (none) to "3" (aggressive)
} apl_compiler_options_t;
```

### Performance Considerations

1. **Memory Alignment**: Use 64-byte alignment for optimal SIMD performance
2. **Cache Blocking**: Configure tile sizes based on cache line sizes
3. **Numa Awareness**: Windows supports NUMA memory, use `apl_win32_aligned_alloc()`
4. **Thread Affinity**: Set thread affinity for NUMA systems

### Integration with SnapKitty Agent OS

#### P/NP Swarm Integration
```bash
# Bootstrap the agent OS
npm run context:bootstrap

# Verify all components
npm run verify:all

# Claim an NP-hard problem related to APL Fortran
apl_fortran_problem = {
    id: "optimal_borrow_schedule_2026_Q3",
    specHash: "0x7f3a...",
    verifyFn: "pnp/verifiers/optimal_borrow_schedule.wasm",
    difficulty: "NP-hard"
}
```

#### Context Compilation
```bash
# Compile APL Fortran context for specific problem
npm run context:compile -- --agent agent_0x9b2c --problem optimal_borrow_schedule_2026_Q3
```

### Development Guidelines

1. **Thread Safety**: Use `apl_lock()` and `apl_unlock()` for thread-safe operations
2. **Resource Management**: Always call `apl_free_*` functions when freeing resources
3. **Error Handling**: Check return codes for all APL Fortran API calls
4. **Memory Management**: Use aligned memory allocation for performance-critical code

### Testing

Run the test suite:

```bash
# Run all tests
cd snapkitty-agentos
npm test

# Test specific components
npm run test:expressions
npm run test:arrays
npm run test:fortran

# Memory leak detection
npm run test:memory
```

### Build Targets

The CMake configuration provides the following targets:

| Target | Description |
|--------|-------------|
| `aplfortran` | Static library containing all APL Fortran bindings |
| `aplfortran_test` | Test executable (Windows only) |
| `aplfortran_benchmark` | Performance benchmark utility |

### Troubleshooting

#### Common Issues

1. **Memory Allocation Failures**
```
Symptoms: APL_ERROR_MEMORY returned from API calls
Solution: Check system memory and increase stack size if needed
```

2. **Fortran Compiler Not Found**
```
Symptoms: APL_ERROR_F90 returned during compilation
Solution: Install Fortran compiler (e.g., MSVC with Intel Fortran)
```

3. **Array Size Exceeds Limits**
```
Symptoms: Segmentation fault or APL_ERROR_SEMANTIC
Solution: Use smaller tile sizes or reduce array dimensions
```

#### Debugging

Enable verbose debugging:

```c
// Enable verbose debugging
apl_compiler_options_t opts = {0};
opts.enable_vectorization = true;
opts.enable_fusion = true;
opts.verbose = true;

apl_init(&opts);
```

### License
Apache 2.0