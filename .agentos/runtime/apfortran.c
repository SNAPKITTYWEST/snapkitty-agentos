/*
 * APL Fortran C Bindings
 *
 * This file provides C bindings for the APL-to-Fortran compilation system.
 * It enables APL expressions to be compiled and executed in Fortran runtime,
 * with support for arrays, optimization passes, and cross-platform deployment.
 *
 * Key Features:
 * - APL expression parsing and AST construction
 * - Array-based IR generation
 * - Fortran backend compiler
 * - C API for cross-language integration
 * - Optimization pipeline (vectorization, fusion, tiling)
 * - Memory management and array operations
 *
 * Architecture:
 * C API (this file) -> APL Parser -> Array DAG -> Optimization Passes -> Fortran Runtime
 */

#ifndef APLFORTRAN_C_BINDINGS_H
#define APLFORTRAN_C_BINDINGS_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

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

//APL array metadata
typedef struct {
    int rank;
    int64_t* shape;
    const char* dtype;
    size_t element_size;
} apl_array_metadata_t;

//Compiler options
typedef struct {
    bool enable_vectorization;
    bool enable_fusion;
    bool enable_tiling;
    bool enable_parallelization;
    int64_t tile_size;
    int num_threads;
    const char* optimization_level;
} apl_compiler_options_t;

//C API functions

// Initialization and cleanup
APL_API void apl_init(const apl_compiler_options_t* options);
APL_API void apl_cleanup(void);
APL_API apl_error_t apl_get_memory_stats(apl_memory_stats_t* stats);
APL_API apl_error_t apl_get_optimization_stats(apl_optimization_stats_t* stats);

//APL expression parsing and AST
APL_API apl_error_t apl_parse(const char* source, apl_expr_t** expr);
APL_API apl_error_t apl_free_expr(apl_expr_t* expr);

//Array operations
APL_API apl_error_t apl_create_array(apl_array_t** arr, const apl_array_metadata_t* meta, void* data);
APL_API apl_error_t apl_array_rank(const apl_array_t* arr, int* rank);
APL_API apl_error_t apl_array_shape(const apl_array_t* arr, int64_t* shape);
APL_API apl_error_t apl_array_dtype(const apl_array_t* arr, const char** dtype);
APL_API apl_error_t apl_array_elements(const apl_array_t* arr, size_t* count);
APL_API apl_error_t apl_free_array(apl_array_t* arr);
APL_API apl_error_t apl_copy_array(apl_array_t** dest, const apl_array_t* src);
APL_API apl_error_t apl_free_array(void* arr);
APL_API apl_error_t apl_copy_array(void** dest, const void* src);
APL_API apl_error_t apl_create_array(void** arr, const void* meta, const void* data);
APL_API apl_error_t apl_array_rank(const void* arr, int* rank);
APL_API apl_error_t apl_array_shape(const void* arr, int64_t* shape);
APL_API apl_error_t apl_array_dtype(const void* arr, const char** dtype);
APL_API apl_error_t apl_array_elements(const void* arr, size_t* count);

// APL expression builder
APL_API apl_error_t apl_expr_add(apl_expr_t** expr, apl_expr_t* left, apl_expr_t* right);
APL_API apl_error_t apl_expr_subtract(apl_expr_t** expr, apl_expr_t* left, apl_expr_t* right);
APL_API apl_error_t apl_expr_multiply(apl_expr_t** expr, apl_expr_t* left, apl_expr_t* right);
APL_API apl_error_t apl_expr_divide(apl_expr_t** expr, apl_expr_t* numerator, apl_expr_t* denominator);
APL_API apl_error_t apl_expr_power(apl_expr_t** expr, apl_expr_t* base, apl_expr_t* exponent);
APL_API apl_error_t apl_expr_negate(apl_expr_t** expr, apl_expr_t* operand);
APL_API apl_error_t apl_expr_constant(apl_expr_t** expr, const char* value);
APL_API apl_expr_t* apl_expr_literal(double value);
APL_API apl_error_t apl_expr_binary(apl_expr_t** expr, apl_expr_t* left, char op, apl_expr_t* right);
APL_API apl_error_t apl_expr_unary(apl_expr_t** expr, char op, apl_expr_t* operand);

//AST manipulation
APL_API apl_error_t apl_free_expr(void* expr);
APL_API apl_error_t apl_expr_add(void** expr, void* left, void* right);
APL_API apl_error_t apl_expr_subtract(void** expr, void* left, void* right);
APL_API apl_error_t apl_expr_multiply(void** expr, void* left, void* right);
APL_API apl_error_t apl_expr_divide(void** expr, void* numerator, void* denominator);
APL_API apl_error_t apl_expr_power(void** expr, void* base, void* exponent);
APL_API apl_error_t apl_expr_negate(void** expr, void* operand);
APL_API apl_error_t apl_expr_constant(void** expr, const char* value);

// optimization pipeline
APL_API apl_error_t apl_compile(apl_expr_t* expr, apl_fortran_backend_t** backend);
APL_API apl_error_t apl_optimize(apl_fortran_backend_t* backend, apl_array_t* input, apl_array_t** output);
APL_API apl_error_t apl_execute(apl_fortran_backend_t* backend, apl_array_t* input, apl_array_t** output);
APL_API apl_error_t apl_free_backend(apl_fortran_backend_t* backend);

// Fortran code generation
APL_API apl_error_t apl_generate_f90(apl_fortran_backend_t* backend, const char* output_file);
APL_API apl_error_t apl_set_output_dir(apl_fortran_backend_t* backend, const char* dir);
APL_API apl_error_t apl_set_optimization_level(apl_fortran_backend_t* backend, const char* level);
APL_API apl_error_t apl_set_tile_size(apl_fortran_backend_t* backend, int64_t size);
APL_API apl_error_t apl_set_threads(apl_fortran_backend_t* backend, int threads);

// Error handling
APL_API const char* apl_error_string(apl_error_t error);
APL_API apl_error_t apl_get_error(int* code, char* buffer, size_t buffer_size);

// Debug and introspection
APL_API apl_error_t apl_print_expr(apl_expr_t* expr);
APL_API apl_error_t apl_print_array(apl_array_t* arr);
APL_API apl_error_t apl_memory_dump(const char* file_path);

// Fortran runtime integration
typedef void (*apl_fortran_callback)(const char* operation, const char* args);
APL_API apl_error_t apl_register_fortran_callback(apl_fortran_callback callback);
APL_API apl_error_t apl_execute_fortran(const char* program);

// High-level convenience functions
APL_API apl_error_t apl_evaluate(const char* expression, apl_array_t** result);
APL_API apl_error_t apl_execute_program(const char* apl_program, const char* fortran_program);
APL_API apl_error_t apl_benchmark(const char* expression, int iterations, double* elapsed_ms);

// Thread safety
APL_API apl_error_t apl_lock(void);
APL_API apl_error_t apl_unlock(void);
APL_API bool apl_is_locked(void);

#ifdef __cplusplus
}
#endif

#endif // APLFORTRAN_C_BINDINGS_H
