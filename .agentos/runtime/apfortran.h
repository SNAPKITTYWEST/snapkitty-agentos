#ifndef APLFORTTRAN_C_BINDINGS_H
#define APLFORTTRAN_C_BINDINGS_H

// APL Fortran C Bindings
// Platform: Windows
// Architecture: APL Array Language -> Fortran Runtime

#ifdef _WIN32
    #ifdef APLFORTTRAN_EXPORTS
        #define APL_API __declspec(dllexport)
    #else
        #define APL_API __declspec(dllimport)
    #endif
    #define APL_CDECL __cdecl
    #define APL_THREAD __declspec(threads)
    #include <windows.h>
#else
    #define APL_API __attribute__((visibility("default")))
    #define APL_CDECL __attribute__((cdecl))
    #define APL_THREAD
    #include <stdint.h>
    #include <stddef.h>
#endif

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// APL Fortran C Bindings
// Platform: Windows
// Architecture: APL Array Language -> Fortran Runtime

// Error types
typedef enum {
    APL_SUCCESS = 0,
    APL_ERROR_UNSPECIFIED = 1,
    APL_ERROR_PARSER = 2,
    APL_ERROR_SEMANTIC = 3,
    APL_ERROR_COMPILER = 4,
    APL_ERROR_MEMORY = 5,
    APL_ERROR_F90 = 6
} apl_error_t;

// APL array type (opaque to C clients)
typedef struct apl_array_t apl_array_t;

// APL expression type (opaque to C clients)
typedef struct apl_expr_t apl_expr_t;

// Fortran backend type (opaque)
typedef struct apl_fortran_backend_t apl_fortran_backend_t;

// Memory management
typedef struct {
    size_t total_bytes;
    size_t allocated_bytes;
    size_t peak_bytes;
} apl_memory_stats_t;

// Optimization statistics
typedef struct {
    int64_t vectorizations;
    int64_t fusions;
    int64_t tiling;
    int64_t parallelization;
    int64_t offload;
    double compilation_time_ms;
} apl_optimization_stats_t;

// APL array metadata
typedef struct {
    int rank;
    int64_t* shape;
    const char* dtype;
    size_t element_size;
} apl_array_metadata_t;

// Compiler options
typedef struct {
    bool enable_vectorization;
    bool enable_fusion;
    bool enable_tiling;
    bool enable_parallelization;
    int64_t tile_size;
    int num_threads;
    const char* optimization_level;
} apl_compiler_options_t;

// APL Expression Core - AST representation
// Supports APL's array-oriented operations and functional programming

typedef enum {
    APL_EXPR_LITERAL = 0,
    APL_EXPR_BINARY = 1,
    APL_EXPR_UNARY = 2,
    APL_EXPR_ARRAY = 3,
    APL_EXPR_SCALAR = 4,
    APL_EXPR_ATOM = 5,
    APL_EXPR_CALL = 6,
    APL_EXPR_NOFREE = 7,
    APL_EXPR_UNKNOWN = 255
} AplExprType;

struct apl_expr_t {
    AplExprType type;
    int ref_count;
    union {
        struct {
            double value;
        } literal;
        struct {
            apl_expr_t* left;
            apl_expr_t* right;
            char op;
        } binary;
        struct {
            char op;
            apl_expr_t* operand;
        } unary;
        struct {
            int rank;
            apl_expr_t* base_expr;
        } array;
        struct {
            apl_expr_t* expr;
        } scalar;
        struct {
            char name[128];
        } atom;
        struct {
            char func_name[128];
            apl_expr_t** args;
            int args_count;
        } call;
        struct {
            void* ptr;
        } nofree;
    } u;
};

// APL Array Container
// Implements APL's array semantics for the APL Fortran compiler

typedef struct apl_array_t {
    int rank;
    int64_t shape[APL_MAX_RANK];
    char dtype[32];
    size_t element_size;
    size_t total_elements;
    int64_t strides[APL_MAX_RANK];
    void* data;

    // Array metadata
    apl_array_metadata_t metadata;

    // Coordinate tracking for array operations
    int64_t* coords;

    // Reference counting
    int ref_count;
} apl_array_t;

// APL-Fortran Backend Configuration
// Manages the compilation pipeline and Fortran runtime integration

typedef struct apl_fortran_backend_t {
    apl_expr_t* expr;
    int expr_count;
    char* output_dir;
    int optimization_level;
    int tile_size;
    int num_threads;
    bool verbose;

    // Optimization statistics
    apl_optimization_stats_t optimization_stats;

    // Fortran runtime state
    bool fortran_initialized;
    void* fortran_context;

    // Include paths for Fortran generation
    char** include_paths;
    int include_path_count;
} apl_fortran_backend_t;

// Platform-specific Windows types and utilities

#ifdef _WIN32
    // Windows-specific file operations
    typedef struct {
        HANDLE hFile;
        LARGE_INTEGER file_size;
        char path[MAX_PATH];
    } apl_file_handle_t;

    // Windows-specific error handling
    APL_API apl_error_t apl_win32_error_from_hresult(HRESULT hr);

    // Windows memory allocation utilities
    APL_API void* apl_win32_aligned_alloc(size_t alignment, size_t size);
    APL_API void apl_win32_aligned_free(void* ptr);

    // Windows thread utilities
    typedef struct {
        HANDLE thread_handle;
        DWORD thread_id;
        bool active;
    } apl_thread_t;

    APL_API apl_error_t apl_create_thread(apl_thread_t* thread, void* (*func)(void*), void* arg);
    APL_API apl_error_t apl_join_thread(apl_thread_t* thread);

    // Windows file utilities
    APL_API apl_file_handle_t* apl_win32_file_open(const char* path);
    APL_API apl_error_t apl_win32_file_close(apl_file_handle_t* file);
    APL_API apl_error_t apl_win32_file_read(apl_file_handle_t* file, void* buffer, size_t size);
    APL_API apl_error_t apl_win32_file_write(apl_file_handle_t* file, const void* buffer, size_t size);
#endif

// APL Core C API Interface

// Initialization and lifecycle management
APL_API void APL_CDECL apl_init(const apl_compiler_options_t* options);
APL_API void APL_CDECL apl_cleanup(void);
APL_API apl_error_t APL_CDECL apl_get_memory_stats(apl_memory_stats_t* stats);
APL_API apl_error_t APL_CDECL apl_get_optimization_stats(apl_optimization_stats_t* stats);

// Expression parsing and construction
APL_API apl_error_t APL_CDECL apl_parse(const char* source, apl_expr_t** expr);
APL_API apl_error_t APL_CDECL apl_free_expr(apl_expr_t* expr);
APL_API apl_expr_t* APL_CDECL apl_expr_literal(double value);
APL_API apl_error_t APL_CDECL apl_expr_binary(apl_expr_t** expr, apl_expr_t* left,
                                             char op, apl_expr_t* right);
APL_API apl_error_t APL_CDECL apl_expr_unary(apl_expr_t** expr, char op, apl_expr_t* operand);

// Array operations and manipulation
APL_API apl_array_t* APL_CDECL apl_array_create(int rank, const int64_t* shape,
                                              const char* dtype, size_t element_size, void* data);
APL_API void APL_CDECL apl_array_free(apl_array_t* arr);
APL_API apl_error_t APL_CDECL apl_array_copy(apl_array_t** dest, apl_array_t* src);
APL_API apl_error_t APL_CDECL apl_array_rank(const apl_array_t* arr, int* rank);
APL_API apl_error_t APL_CDECL apl_array_shape(const apl_array_t* arr, int64_t* shape);
APL_API apl_error_t APL_CDECL apl_array_dtype(const apl_array_t* arr, const char** dtype);
APL_API apl_error_t APL_CDECL apl_array_elements(const apl_array_t* arr, size_t* count);

// Fortran compilation pipeline
APL_API apl_error_t APL_CDECL apl_compile(apl_expr_t* expr, apl_fortran_backend_t** backend);
APL_API apl_error_t APL_CDECL apl_optimize(apl_fortran_backend_t* backend, apl_array_t* input, apl_array_t** output);
APL_API apl_error_t APL_CDECL apl_execute(apl_fortran_backend_t* backend, apl_array_t* input, apl_array_t** output);
APL_API apl_error_t APL_CDECL apl_free_backend(apl_fortran_backend_t* backend);

// Fortran code generation
APL_API apl_error_t APL_CDECL apl_generate_f90(apl_fortran_backend_t* backend, const char* output_file);
APL_API apl_error_t APL_CDECL apl_set_output_dir(apl_fortran_backend_t* backend, const char* dir);
APL_API apl_error_t APL_CDECL apl_set_optimization_level(apl_fortran_backend_t* backend, const char* level);
APL_API apl_error_t APL_CDECL apl_set_tile_size(apl_fortran_backend_t* backend, int64_t size);
APL_API apl_error_t APL_CDECL apl_set_threads(apl_fortran_backend_t* backend, int threads);

// Error handling
APL_API const char* APL_CDECL apl_error_string(apl_error_t error);
APL_API apl_error_t APL_CDECL apl_get_error(int* code, char* buffer, size_t buffer_size);

// Debug and introspection utilities
APL_API apl_error_t APL_CDECL apl_print_expr(apl_expr_t* expr);
APL_API apl_error_t APL_CDECL apl_print_array(apl_array_t* arr);
APL_API apl_error_t APL_CDECL apl_memory_dump(const char* file_path);

// Fortran runtime integration
typedef void (*apl_fortran_callback)(const char* operation, const char* args);
APL_API apl_error_t APL_CDECL apl_register_fortran_callback(apl_fortran_callback callback);
APL_API apl_error_t APL_CDECL apl_execute_fortran(const char* program);

// High-level convenience functions for rapid prototyping
APL_API apl_error_t APL_CDECL apl_evaluate(const char* expression, apl_array_t** result);
APL_API apl_error_t APL_CDECL apl_execute_program(const char* apl_program, const char* fortran_program);
APL_API apl_error_t APL_CDECL apl_benchmark(const char* expression, int iterations, double* elapsed_ms);

// Thread synchronization
APL_API apl_error_t APL_CDECL apl_lock(void);
APL_API apl_error_t APL_CDECL apl_unlock(void);
APL_API bool APL_CDECL apl_is_locked(void);

// Performance profiling utilities
APL_API apl_error_t APL_CDECL apl_profile_start(const char* operation);
APL_API apl_error_t APL_CDECL apl_profile_end(const char* operation, double* elapsed_ms);
APL_API apl_error_t APL_CDECL apl_print_profile_stats(void);

// Application state and persistence
APL_API apl_error_t APL_CDECL apl_save_state(const char* file_path);
APL_API apl_error_t APL_CDECL apl_load_state(const char* file_path);

#ifdef __cplusplus
}
#endif

#endif // APLFORTTRAN_C_BINDINGS_H
