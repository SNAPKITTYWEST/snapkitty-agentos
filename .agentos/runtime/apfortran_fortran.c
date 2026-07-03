// APL Fortran Backend - Fortran code generation and compilation
// Transforms APL expressions into Fortran code with optimization pipeline

#include "apfortran_fortran.h"

APL_API apl_fortran_backend_t* apl_fortran_backend_create(apl_expr_t* expr) {
    apl_fortran_backend_t* backend = (apl_fortran_backend_t*)malloc(sizeof(apl_fortran_backend_t));
    if (!backend) return NULL;

    memset(backend, 0, sizeof(apl_fortran_backend_t));

    backend->expr = expr;
    expr->ref_count++;

    // Initialize backend state
    memset(&backend->optimization_stats, 0, sizeof(apl_optimization_stats_t));
    backend->optimization_level = 3; // Default medium optimization
    backend->tile_size = 64;
    backend->num_threads = 1;

    // Create output directory
    apl_fortran_backend_set_output_dir(backend, ".");

    // Initialize Fortran runtime
    backend->fortran_initialized = true;

    return backend;
}

APL_API void apl_fortran_backend_free(apl_fortran_backend_t* backend) {
    if (!backend) return;

    backend->expr_count--;
    if (backend->expr_count <= 0) {
        if (backend->expr) {
            apl_expr_free(backend->expr);
        }
        if (backend->fortran_context) {
            free_fortran_context(backend->fortran_context);
        }
        free(backend);
    }
}

APL_API apl_error_t apl_fortran_compile(apl_fortran_backend_t* backend, apl_array_t* input, apl_array_t** output) {
    if (!backend || !input || !output) return APL_ERROR_UNSPECIFIED;

    // Clear previous output
    if (*output) {
        apl_array_free(*output);
        *output = NULL;
    }

    // Initialize result array matching input type
    apl_array_t* result = apl_array_create(input->rank, input->shape, input->dtype,
                                        input->element_size, NULL);
    if (!result) return APL_ERROR_MEMORY;

    // Generate Fortran source code based on expression
    char* fortran_code = NULL;
    size_t code_size = 0;

    apl_error_t error = apl_generate_f90_backend(backend, &fortran_code, &code_size);
    if (error != APL_SUCCESS) {
        apl_array_free(result);
        return error;
    }

    // Write to temporary file for compilation
    char temp_file[] = "fortran_temp_XXXXXX.f90";
    int fd = _mktemp(temp_file);
    if (fd == -1) {
        free(fortran_code);
        apl_array_free(result);
        return APL_ERROR_COMPILER;
    }

    FILE* f = _fsopen(temp_file, "w", _SH_DENYNO);
    if (!f) {
        free(fortran_code);
        remove(temp_file);
        apl_array_free(result);
        return APL_ERROR_COMPILER;
    }

    fwrite(fortran_code, 1, code_size, f);
    fclose(f);

    // Compile the Fortran code (platform-dependent)
    error = apl_compile_fortran_source(temp_file, result);

    // Clean up
    remove(temp_file);
    free(fortran_code);

    if (error == APL_SUCCESS) {
        *output = result;
    } else {
        apl_array_free(result);
    }

    return error;
}

APL_API apl_error_t apl_fortran_execute(apl_fortran_backend_t* backend, apl_array_t* input, apl_array_t** output) {
    if (!backend || !input || !output) return APL_ERROR_UNSPECIFIED;

    // For execution, we simply run the compiled or generated code
    return apl_fortran_compile(backend, input, output);
}

APL_API apl_error_t apl_generate_f90_backend(apl_fortran_backend_t* backend, char** code, size_t* size) {
    if (!backend || !code || !size) return APL_ERROR_UNSPECIFIED;

    // Use the backend's output file path
    char* output_file = apl_fortran_backend_get_output_file(backend, "code.f90");
    if (!output_file) return APL_ERROR_MEMORY;

    // Generate Fortran code using the backend
    apl_error_t error = apl_generate_f90_code(backend->expr, output_file);
    if (error != APL_SUCCESS) {
        free(output_file);
        return error;
    }

    // Read the generated code
    FILE* f = fopen(output_file, "rb");
    if (!f) {
        free(output_file);
        return APL_ERROR_COMPILER;
    }

    // Get file size
    fseek(f, 0, SEEK_END);
    *size = ftell(f);
    rewind(f);

    *code = (char*)malloc(*size + 1);
    if (!*code) {
        fclose(f);
        free(output_file);
        return APL_ERROR_MEMORY;
    }

    *size = fread(*code, 1, *size, f);
    (*code)[*size] = '\0';
    fclose(f);

    free(output_file);
    return APL_SUCCESS;
}

APL_API apl_error_t apl_configure_backend(apl_fortran_backend_t* backend, apl_compiler_options_t* options) {
    if (!backend || !options) return APL_ERROR_UNSPECIFIED;

    if (options->enable_vectorization) {
        backend->optimization_stats.vectorizations++;
    }
    if (options->enable_fusion) {
        backend->optimization_stats.fusions++;
    }
    if (options->enable_tiling) {
        backend->optimization_stats.tiling++;
        backend->tile_size = options->tile_size;
    }
    if (options->enable_parallelization) {
        backend->optimization_stats.parallelization++;
        backend->num_threads = options->num_threads;
    }
    if (options->offload) {
        backend->optimization_stats.offload++;
    }

    backend->optimization_level = atoi(options->optimization_level);

    return APL_SUCCESS;
}

APL_API const char* apl_backend_get_stats_summary(apl_fortran_backend_t* backend) {
    static char summary[256];
    if (!backend) {
        strcpy(summary, "Backend not initialized\n");
        return summary;
    }

    snprintf(summary, sizeof(summary),
        "APL Fortran Backend Statistics:\n"
        "  Vectors: %d\n"
        "  Fusions: %d\n"
        "  Tilings: %d\n"
        "  Parallel: %d\n"
        "  Offloads: %d\n"
        "  Optimization: %d\n"
        "  Tile Size: %d\n"
        "  Threads: %d\n",
        backend->optimization_stats.vectorizations,
        backend->optimization_stats.fusions,
        backend->optimization_stats.tiling,
        backend->optimization_stats.parallelization,
        backend->optimization_stats.offload,
        backend->optimization_level,
        backend->tile_size,
        backend->num_threads);

    return summary;
}

APL_API apl_error_t apl_add_include_path(apl_fortran_backend_t* backend, const char* path) {
    if (!backend || !path) return APL_ERROR_UNSPECIFIED;

    size_t path_len = strlen(path) + 1;
    char* new_path = (char*)realloc(backend->include_paths,
                                  (backend->include_path_count + 1) * sizeof(char*));
    if (!new_path) return APL_ERROR_MEMORY;

    backend->include_paths = new_path;
    backend->include_paths[backend->include_path_count] = (char*)malloc(path_len);
    if (!backend->include_paths[backend->include_path_count]) {
        return APL_ERROR_MEMORY;
    }

    strcpy(backend->include_paths[backend->include_path_count], path);
    backend->include_path_count++;

    return APL_SUCCESS;
}
