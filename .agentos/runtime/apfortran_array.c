// APL Fortran Array Operations - Core Array Manipulation
// Supports APL's array-oriented operations with Fortran backend integration

#include "apfortran_internal.h"

// Array metadata management
APL_API apl_array_t* apl_array_create(int rank, const int64_t* shape, const char* dtype,
                                     size_t element_size, void* data) {
    apl_array_t* arr = (apl_array_t*)malloc(sizeof(apl_array_t));
    if (!arr) return NULL;

    memset(arr, 0, sizeof(apl_array_t));
    arr->ref_count = 1;

    arr->rank = rank;
    arr->dtype = dtype;
    arr->element_size = element_size;
    arr->total_elements = 1;

    for (int i = 0; i < rank; i++) {
        arr->shape[i] = shape[i];
        arr->total_elements *= shape[i];
    }

    size_t total_bytes = arr->total_elements * element_size;
    arr->data = malloc(total_bytes);
    if (!arr->data) {
        free(arr);
        return NULL;
    }

    if (data) {
        memcpy(arr->data, data, total_bytes);
    } else {
        memset(arr->data, 0, total_bytes);
    }

    // Initialize metadata
    arr->metadata.rank = rank;
    arr->metadata.shape = (int64_t*)malloc(rank * sizeof(int64_t));
    memcpy(arr->metadata.shape, shape, rank * sizeof(int64_t));
    arr->metadata.dtype = _strdup(dtype);
    arr->metadata.element_size = element_size;

    return arr;
}

APL_API void apl_array_free(apl_array_t* arr) {
    if (!arr) return;

    arr->ref_count--;
    if (arr->ref_count <= 0) {
        // Clean up allocated resources
        if (arr->data) {
            free(arr->data);
        }
        if (arr->metadata.dtype) {
            free(arr->metadata.dtype);
        }
        if (arr->metadata.shape) {
            free(arr->metadata.shape);
        }
        if (arr->coords) {
            free(arr->coords);
        }
        free(arr);
    }
}

APL_API apl_error_t apl_array_copy(apl_array_t** dest, apl_array_t* src) {
    if (!dest || !src) return APL_ERROR_UNSPECIFIED;

    *dest = apl_array_create(src->rank, src->shape, src->dtype, src->element_size, src->data);
    if (!*dest) return APL_ERROR_MEMORY;

    (*dest)->metadata = src->metadata;
    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_rank(const apl_array_t* arr, int* rank) {
    if (!arr || !rank) return APL_ERROR_UNSPECIFIED;
    *rank = arr->rank;
    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_shape(const apl_array_t* arr, int64_t* shape) {
    if (!arr || !shape) return APL_ERROR_UNSPECIFIED;
    memcpy(shape, arr->shape, arr->rank * sizeof(int64_t));
    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_dtype(const apl_array_t* arr, const char** dtype) {
    if (!arr || !dtype) return APL_ERROR_UNSPECIFIED;
    *dtype = arr->dtype;
    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_elements(const apl_array_t* arr, size_t* count) {
    if (!arr || !count) return APL_ERROR_UNSPECIFIED;
    *count = arr->total_elements;
    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_mem_usage(apl_array_t* arr, size_t* bytes) {
    if (!arr || !bytes) return APL_ERROR_UNSPECIFIED;
    *bytes = arr->total_elements * arr->element_size;
    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_iterate(apl_array_t* arr,
                                     apl_array_callback callback,
                                     void* context) {
    if (!arr || !callback) return APL_ERROR_UNSPECIFIED;

    int total_elements = arr->total_elements;
    for (int i = 0; i < total_elements; i++) {
        int* index = apl_compute_array_index(i, arr->rank, arr->shape);
        if (!index) return APL_ERROR_MEMORY;

        char* element_ptr = (char*)arr->data + (i * arr->element_size);
        int result = callback(element_ptr, index, arr->rank, context);
        free(index);

        if (result != 0) break;
    }

    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_apply_to_all(apl_array_t* arr,
                                          apl_array_element_op op,
                                          void* context) {
    if (!arr || !op) return APL_ERROR_UNSPECIFIED;

    size_t count = arr->total_elements;
    for (size_t i = 0; i < count; i++) {
        char* element_ptr = (char*)arr->data + (i * arr->element_size);
        op(element_ptr, arr->rank, context);
    }

    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_fill(apl_array_t* arr, const void* value) {
    if (!arr || !value) return APL_ERROR_UNSPECIFIED;

    size_t count = arr->total_elements;
    for (size_t i = 0; i < count; i++) {
        char* element_ptr = (char*)arr->data + (i * arr->element_size);
        memcpy(element_ptr, value, arr->element_size);
    }

    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_compute_extent(const apl_array_t* arr,
                                            int64_t start_index[],
                                            int64_t extent[]) {
    if (!arr || !start_index || !extent) return APL_ERROR_UNSPECIFIED;

    for (int i = 0; i < arr->rank; i++) {
        extent[i] = arr->shape[i] - start_index[i];
        if (extent[i] < 0) return APL_ERROR_SEMANTIC;
    }

    return APL_SUCCESS;
}

APL_API int64_t apl_compute_array_index(int linear_index, int rank, const int64_t* shape) {
    int64_t index = linear_index;
    int64_t* coords = (int64_t*)malloc(rank * sizeof(int64_t));
    if (!coords) return -1;

    int tmp_index = linear_index;
    int64_t multiplier = 1;

    for (int i = rank - 1; i >= 0; i--) {
        coords[i] = tmp_index / multiplier;
        multiplier *= shape[i];
    }

    memcpy(index, coords, rank * sizeof(int64_t));
    free(coords);
    return index;
}

APL_API apl_error_t apl_array_set_element(apl_array_t* arr, const int64_t* index,
                                         const void* value, size_t element_size) {
    if (!arr || !index || !value) return APL_ERROR_UNSPECIFIED;

    int linear_index = apl_compute_array_index((int)index, arr->rank, arr->shape);
    if (linear_index < 0) return APL_ERROR_SEMANTIC;

    if (element_size != arr->element_size) return APL_ERROR_SEMANTIC;

    char* element_ptr = (char*)arr->data + (linear_index * arr->element_size);
    memcpy(element_ptr, value, element_size);

    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_get_element(void* value, apl_array_t* arr,
                                         const int64_t* index, size_t element_size) {
    if (!value || !arr || !index || element_size != arr->element_size) {
        return APL_ERROR_UNSPECIFIED;
    }

    int linear_index = apl_compute_array_index((int)index, arr->rank, arr->shape);
    if (linear_index < 0) return APL_ERROR_SEMANTIC;

    char* element_ptr = (char*)arr->data + (linear_index * arr->element_size);
    memcpy(value, element_ptr, element_size);

    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_apply_to_array(apl_array_t* arr, apl_array_element_op op) {
    if (!arr || !op) return APL_ERROR_UNSPECIFIED;

    size_t count = arr->total_elements;
    for (size_t i = 0; i < count; i++) {
        char* element_ptr = (char*)arr->data + (i * arr->element_size);
        op(element_ptr, arr->rank, NULL);
    }

    return APL_SUCCESS;
}

APL_API apl_error_t apl_array_shape_apply_to_all(apl_array_t* arr, apl_array_element_op op) {
    if (!arr || !op) return APL_ERROR_UNSPECIFIED;

    int64_t coords[APL_MAX_RANK];
    memset(coords, 0, arr->rank * sizeof(int64_t));

    bool more = true;
    while (more) {
        char* element_ptr = arr->data;
        size_t offset = 0;
        for (int i = 0; i < arr->rank; i++) {
            offset += coords[i] * arr->strides[i];
        }
        element_ptr += offset * arr->element_size;

        op(element_ptr, arr->rank, coords);

        more = apl_array_increment_coords(coords, arr->shape, arr->rank);
    }

    return APL_SUCCESS;
}

APL_API bool apl_array_increment_coords(int64_t* coords, const int64_t* shape, int rank) {
    for (int i = rank - 1; i >= 0; i--) {
        coords[i]++;
        if (coords[i] < shape[i]) {
            return true;
        }
        coords[i] = 0;
    }
    return false;
}
