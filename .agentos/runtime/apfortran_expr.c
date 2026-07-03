// APL Expression Core - AST representation, parsing, and manipulation
// Supports APL-specific operations including arrays and scalar operations

#include "apfortran_internal.h"

// Expression factory functions
APL_API apl_expr_t* apl_expr_create(AplExprType type) {
    apl_expr_t* expr = (apl_expr_t*)malloc(sizeof(apl_expr_t));
    if (!expr) return NULL;

    memset(expr, 0, sizeof(apl_expr_t));
    expr->type = type;
    expr->ref_count = 1;

    return expr;
}

APL_API apl_expr_t* apl_expr_literal(double value) {
    apl_expr_t* expr = apl_expr_create(APL_EXPR_LITERAL);
    if (!expr) return NULL;

    expr->literal.value = value;
    return expr;
}

APL_API apl_error_t apl_expr_binary(apl_expr_t** expr, apl_expr_t* left,
                                    char op, apl_expr_t* right) {
    if (!expr || !left || !right) {
        return APL_ERROR_UNSPECIFIED;
    }

    apl_expr_t* binary_expr = apl_expr_create(APL_EXPR_BINARY);
    if (!binary_expr) {
        return APL_ERROR_MEMORY;
    }

    binary_expr->binary.left = left;
    binary_expr->binary.right = right;
    binary_expr->binary.op = op;

    // Increment ref counts for children
    left->ref_count++;
    right->ref_count++;

    *expr = binary_expr;
    return APL_SUCCESS;
}

APL_API apl_error_t apl_expr_unary(apl_expr_t** expr, char op, apl_expr_t* operand) {
    if (!expr || !operand) {
        return APL_ERROR_UNSPECIFIED;
    }

    apl_expr_t* unary_expr = apl_expr_create(APL_EXPR_UNARY);
    if (!unary_expr) {
        return APL_ERROR_MEMORY;
    }

    unary_expr->unary.op = op;
    unary_expr->unary.operand = operand;

    operand->ref_count++;

    *expr = unary_expr;
    return APL_SUCCESS;
}

APL_API apl_error_t apl_expr_free(apl_expr_t* expr) {
    if (!expr) {
        return APL_SUCCESS;
    }

    expr->ref_count--;
    if (expr->ref_count <= 0) {
        // Recursively free children
        switch (expr->type) {
            case APL_EXPR_BINARY:
                apl_expr_free(expr->binary.left);
                apl_expr_free(expr->binary.right);
                break;
            case APL_EXPR_UNARY:
                apl_expr_free(expr->unary.operand);
                break;
            default:
                break;
        }
        free(expr);
    }

    return APL_SUCCESS;
}

APL_API apl_error_t apl_print_expr(apl_expr_t* expr) {
    if (!expr) {
        printf("(null expression)\n");
        return APL_SUCCESS;
    }

    switch (expr->type) {
        case APL_EXPR_LITERAL:
            printf("%g", expr->literal.value);
            break;
        case APL_EXPR_BINARY: {
            printf("(");
            apl_print_expr(expr->binary.left);
            printf(" %c ", expr->binary.op);
            apl_print_expr(expr->binary.right);
            printf(")");
            break;
        }
        case APL_EXPR_UNARY:
            printf("(%c", expr->unary.op);
            apl_print_expr(expr->unary.operand);
            printf(")");
            break;
        case APL_EXPR_ARRAY:
            printf("array(");
            // Print array elements
            printf(")");
            break;
        case APL_EXPR_SCALAR:
            printf("scalar(");
            apl_print_expr(expr->scalar.expr);
            printf(")");
            break;
        case APL_EXPR_ATOM:
            printf("atom(\"%s\")", expr->atom.name);
            break;
        case APL_EXPR_CALL:
            printf("%s(", expr->call.func.name);
            for (int i = 0; i < expr->call.args_count; i++) {
                if (i > 0) printf(", ");
                apl_print_expr(expr->call.args[i]);
            }
            printf(")");
            break;
        default:
            printf("(unknown)");
    }

    printf("\n");
    return APL_SUCCESS;
}

APL_API apl_error_t apl_print_expr_internal(apl_expr_t* expr, int indent) {
    if (!expr) {
        return APL_SUCCESS;
    }

    for (int i = 0; i < indent; i++) printf("  ");

    switch (expr->type) {
        case APL_EXPR_LITERAL:
            printf("APLExpr_LITERAL(%g)\n", expr->literal.value);
            break;
        case APL_EXPR_BINARY:
            for (int i = 0; i < indent; i++) printf("  ");
            printf("APL_EXPR_BINARY(%c)\n", expr->binary.op);
            apl_print_expr_internal(expr->binary.left, indent + 1);
            apl_print_expr_internal(expr->binary.right, indent + 1);
            break;
        case APL_EXPR_UNARY:
            for (int i = 0; i < indent; i++) printf("  ");
            printf("APL_EXPR_UNARY(%c)\n", expr->unary.op);
            apl_print_expr_internal(expr->unary.operand, indent + 1);
            break;
        case APL_EXPR_ARRAY:
            for (int i = 0; i < indent; i++) printf("  ");
            printf("APL_EXPR_ARRAY(%d)\n", expr->array.rank);
            apl_print_expr_internal(expr->array.base_expr, indent + 1);
            break;
        case APL_EXPR_SCALAR:
            for (int i = 0; i < indent; i++) printf("  ");
            printf("APL_EXPR_SCALAR\n");
            apl_print_expr_internal(expr->scalar.expr, indent + 1);
            break;
        case APL_EXPR_ATOM:
            for (int i = 0; i < indent; i++) printf("  ");
            printf("APL_EXPR_ATOM(%s)\n", expr->atom.name);
            break;
        case APL_EXPR_CALL:
            for (int i = 0; i < indent; i++) printf("  ");
            printf("APL_EXPR_CALL(%s)\n", expr->call.func.name);
            for (int i = 0; i < expr->call.args_count; i++) {
                apl_print_expr_internal(expr->call.args[i], indent + 1);
            }
            break;
        case APL_EXPR_NOFREE:
            for (int i = 0; i < indent; i++) printf("  ");
            printf("APL_EXPR_NOFREE(%p)\n", expr->nofree.ptr);
            break;
        default:
            for (int i = 0; i < indent; i++) printf("  ");
            printf("APL_EXPR_UNKNOWN(%d)\n", expr->type);
    }

    return APL_SUCCESS;
}

APL_API apl_error_t apl_copy_expr(apl_expr_t** dest, apl_expr_t* src) {
    if (!dest || !src) {
        return APL_ERROR_UNSPECIFIED;
    }

    *dest = src;
    src->ref_count++;

    return APL_SUCCESS;
}

APL_API int apl_expr_ref_count(apl_expr_t* expr) {
    return expr ? expr->ref_count : 0;
}

APL_API AplExprType apl_expr_get_type(apl_expr_t* expr) {
    return expr ? expr->type : APL_EXPR_UNKNOWN;
}
