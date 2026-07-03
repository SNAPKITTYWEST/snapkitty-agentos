// Objective-C Bridging Layer for APL Fortran
// Platform: Windows iOS macOS (requires Objective-C compiler)
// Architecture: C API + Objective-C Swift compatibility

#import <Foundation/Foundation.h>
@import ObjectiveC;

#if __cplusplus
#define APL_EXTERN extern "C"
#else
#define APL_EXTERN extern
#endif

// Include the C header
#include "apfortran.h"

// Objective-C bridging macros and utilities
#define APL_LOG_ERROR(msg, ...) NSLog(@"[APLFortran Error] " msg, ##__VA_ARGS__)
#define APL_LOG_WARNING(msg, ...) NSLog(@"[APLFortran Warning] " msg, ##__VA_ARGS__)
#define APL_LOG_INFO(msg, ...) NSLog(@"[APLFortran Info] " msg, ##__VA_ARGS__)

// Type definitions for Objective-C compatibility
typedef NS_ENUM(NSUInteger, APLExprTypeOC) {
    APL_EXPR_LITERAL_OC = APL_EXPR_LITERAL,
    APL_EXPR_BINARY_OC = APL_EXPR_BINARY,
    APL_EXPR_UNARY_OC = APL_EXPR_UNARY,
    APL_EXPR_ARRAY_OC = APL_EXPR_ARRAY,
    APL_EXPR_SCALAR_OC = APL_EXPR_SCALAR,
    APL_EXPR_ATOM_OC = APL_EXPR_ATOM,
    APL_EXPR_CALL_OC = APL_EXPR_CALL,
    APL_EXPR_NOFREE_OC = APL_EXPR_NOFREE,
    APL_EXPR_UNKNOWN_OC = APL_EXPR_UNKNOWN
};

// Forward declarations
@class APLExpression;
@class APLArray;
@class APLFortranBackend;

// APLExpression Objective-C wrapper
@interface APLExpression : NSObject
{
    @protected
    apl_expr_t* _expr;
    NSMutableArray<APLExpression*>* _children;
}

+ (instancetype)expressionWithLiteral:(double)value;
+ (instancetype)expressionWithBinaryOp:(APLExpression*)left
                            operator:(char)op
                           right:(APLExpression*)right;
+ (instancetype)expressionWithUnaryOp:(char)op
                        operand:(APLExpression*)operand;
+ (instancetype)expressionWithArrayExpr:(APLExpression*)baseExpr
                                    rank:(int)rank;
+ (instancetype)expressionWithScalarExpr:(APLExpression*)expr;
+ (instancetype)expressionWithAtomName:(NSString*)name;
+ (instancetype)expressionWithCallFunction:(NSString*)functionName
                                      args:(NSArray<APLExpression*>*)args;

- (instancetype)initWithType:(APLExprTypeOC)type;
- (instancetype)initWithType:(APLExprTypeOC)type
c expression:(apl_expr_t*)expr;

@property (nonatomic, readonly) APLExprTypeOC type;
@property (nonatomic, readonly) double literalValue;
@property (nonatomic, readonly) NSArray<APLExpression*>* children;

- (APLExpression*)childAtIndex:(NSUInteger)index;
- (NSString*)descriptionOC;
- (void)logAST:(NSUInteger)indent;

@end

// APLArray Objective-C wrapper
@interface APLArray : NSObject
{
    @protected
    apl_array_t* _array;
}

+ (instancetype)arrayWithRank:(int)rank
shape:(const int64_t*)shape
dtype:(const char*)dtype
elementSize:(size_t)elementSize
data:(void*)data;

- (instancetype)initWithArray:(apl_array_t*)array;

@property (nonatomic, readonly) int rank;
@property (nonatomic, readonly) NSArray<NSNumber*>* shape;
@property (nonatomic, readonly) NSString* dtype;
@property (nonatomic, readonly) size_t elementSize;
@property (nonatomic, readonly) size_t totalElements;

- (id)getElementAtIndex:(NSInteger)index;
- (void)setElementAtIndex:(NSInteger)index
                     value:(id)value;
- (APLArray*)copy;
- (APLArray*)applyOperation:(NSString*)operation
                    operands:(APLArray*)rightArray;
- (APLArray*)map:(SEL)operation;
- (APLArray*)filter:(SEL)predicate
            context:(id)context;
- (id)reduce:(SEL)operation
        initial:(id)initial;

@end

// APLFortranBackend Objective-C wrapper
@interface APLFortranBackend : NSObject
{
    @protected
    apl_fortran_backend_t* _backend;
    NSMutableDictionary<NSString*, id>* _properties;
    NSMutableArray<NSString*>* _includePaths;
}

+ (instancetype)backendWithExpression:(APLExpression*)expression;

- (instancetype)initWithBackend:(apl_fortran_backend_t*)backend;

@property (nonatomic, readonly) APLExpression* expression;
@property (nonatomic, readwrite) NSString* outputDirectory;
@property (nonatomic, readwrite) NSString* optimizationLevel;
@property (nonatomic, readwrite) NSNumber* tileSize;
@property (nonatomic, readwrite) NSNumber* threadCount;

- (APLArray*)compileWithInput:(APLArray*)input;
- (APLArray*)executeWithInput:(APLArray*)input;
- (NSData*)generateFortranCode;
- (BOOL)writeFortranToFile:(NSString*)path;
- (NSArray<NSString*>*)includePaths;
- (void)addIncludePath:(NSString*)path;
- (BOOL)isVerbose;
- (void)setVerbose:(BOOL)verbose;

@end

// APL Compiler Options Objective-C wrapper
@interface APLCompilerOptions : NSObject
{
    @protected
    apl_compiler_options_t _options;
}

+ (instancetype)options;

@property (nonatomic, readwrite) BOOL enableVectorization;
@property (nonatomic, readwrite) BOOL enableFusion;
@property (nonatomic, readwrite) BOOL enableTiling;
@property (nonatomic, readwrite) BOOL enableParallelization;
@property (nonatomic, readwrite) NSNumber* tileSize;
@property (nonatomic, readwrite) NSNumber* threadCount;
@property (nonatomic, readwrite) NSString* optimizationLevel;

- (apl_compiler_options_t*)underlyingOptions;
- (void)applyToAPLFortran:(APLCompilerOptions*)options;

@end

// APL Fortran Runtime Manager (iOS/macOS compatible)
@interface APLFortranManager : NSObject
{
    @protected
    apl_memory_stats_t _memoryStats;
    apl_optimization_stats_t _optimizationStats;
    APLCompilerOptions* _compilerOptions;
    NSMutableDictionary<NSString*, APLFortranBackend*>* _backends;
    NSMutableArray<APLExpression*>* _expressionHistory;
}

+ (instancetype)sharedManager;

@property (nonatomic, readonly) APLCompilerOptions* compilerOptions;
@property (nonatomic, readonly) NSArray<APLExpression*>* expressionHistory;

- (void)initializeWithOptions:(APLCompilerOptions*)options;
- (APLExpression*)parseExpression:(NSString*)source;
- (APLArray*)evaluateExpression:(NSString*)source;
- (APLFortranBackend*)compileExpression:(APLExpression*)expression;
- (APLArray*)compileAndExecute:(NSString*)source
                         input:(APLArray*)input;
- (BOOL)loadFortranLibraryFromPath:(NSString*)libraryPath;
- (void)registerFortranCallback:(void (*)(const char*, const char*))callback;

- (APLExpression*)createLiteral:(double)value;
- (APLExpression*)createVariable:(NSString*)name;
- (APLExpression*)createBinaryOp:(APLExpression*)left
                         operator:(NSString*)op
                         right:(APLExpression*)right;
- (APLExpression*)createCall:(NSString*)functionName
                       arguments:(NSArray<APLExpression*>*)args;

- (APLArray*)createArrayWithData:(NSData*)data
                           shape:(NSArray<NSNumber*>*)shape
                           dtype:(NSString*)dtype;
- (APLArray*)createMatrixFromArray2D:(NSArray<NSArray*>*)matrix;

- (NSData*)serializeExpression:(APLExpression*)expression;
- (APLExpression*)deserializeExpressionFromData:(NSData*)data;
- (NSString*)generateDocumentationForExpression:(APLExpression*)expression;

- (void)enableVerboseLogging:(BOOL)enabled;
- (NSData*)exportExpressionHistory;
- (void)importExpressionHistory:(NSData*)data;

@end

// Convenience functions for Common APL Operations
@interface APLUtilityFunctions : NSObject

+ (APLExpression*)sumOfArray:(APLExpression*)array;
+ (APLExpression*)productOfArray:(APLExpression*)array;
+ (APLExpression*)meanOfArray:(APLExpression*)array;
+ (APLExpression*)standardDeviation:(APLExpression*)array;
+ (APLExpression*)matrixMultiply:(APLExpression*)left
                         right:(APLExpression*)right;
+ (APLExpression*)solveLinearSystem:(APLExpression*)coefficients
                           rhs:(APLExpression*)rhs;
+ (APLExpression*)eigenvalues:(APLExpression*)matrix;
+ (APLExpression*)singularValueDecomposition:(APLExpression*)matrix;

@end

// Runtime error handling for Objective-C
typedef NS_ENUM(NSInteger, APLErrorCode) {
    APLErrorCodeNone = APL_SUCCESS,
    APLErrorCodeUnspecified = APL_ERROR_UNSPECIFIED,
    APLErrorCodeParser = APL_ERROR_PARSER,
    APLErrorCodeSemantic = APL_ERROR_SEMANTIC,
    APLErrorCodeCompiler = APL_ERROR_COMPILER,
    APLErrorCodeMemory = APL_ERROR_MEMORY,
    APLErrorCodeFortran = APL_ERROR_F90
};

@interface APLRuntimeError : NSError

+ (instancetype)errorWithAPLError:(apl_error_t)errorCode message:(NSString*)message;
+ (instancetype)errorWithCode:(APLErrorCode)code
                       message:(NSString*)message
                      reason:(NSString*)reason;

@property (nonatomic, readonly) apl_error_t aplErrorCode;
@end

// Platform-specific implementations
#if defined(__APPLE__) && !defined(SWIFT_PACKAGE)
// iOS/macOS specific implementations

@interface APLExpression ()
- (APLExpression*)addChild:(APLExpression*)child;
@end

@interface APLFortranManager ()
- (void)_setupWindowsRuntime; // Only on Windows
- (void)_setupCocoaRuntime;  // Only on iOS/macOS
@end

#endif

// Bridging to C functions
extern "C" {
    // C API functions that Objective-C can call
    APL_EXTERN apl_error_t APL_CDECL apl_init_oc(const apl_compiler_options_t* options);
    APL_EXTERN void APL_CDECL apl_cleanup_oc(void);
    APL_EXTERN apl_error_t APL_CDECL apl_get_memory_stats_oc(apl_memory_stats_t* stats);
    APL_EXTERN apl_error_t APL_CDECL apl_get_optimization_stats_oc(apl_optimization_stats_t* stats);
    APL_EXTERN apl_error_t APL_CDECL apl_parse_oc(const char* source, apl_expr_t** expr);
    APL_EXTERN apl_error_t APL_CDECL apl_free_expr_oc(apl_expr_t* expr);
    APL_EXTERN apl_array_t* APL_CDECL apl_array_create_oc(int rank, const int64_t* shape, const char* dtype, size_t element_size, void* data);
    APL_EXTERN void APL_CDECL apl_array_free_oc(apl_array_t* arr);
    APL_EXTERN apl_error_t APL_CDECL apl_array_copy_oc(apl_array_t** dest, apl_array_t* src);
    APL_EXTERN apl_error_t APL_CDECL apl_compile_oc(apl_expr_t* expr, apl_fortran_backend_t** backend);
    APL_EXTERN apl_error_t APL_CDECL apl_execute_oc(apl_fortran_backend_t* backend, apl_array_t* input, apl_array_t** output);
    APL_EXTERN apl_error_t APL_CDECL apl_free_backend_oc(apl_fortran_backend_t* backend);
    APL_EXTERN apl_error_t APL_CDECL apl_evaluate_oc(const char* expression, apl_array_t** result);
}

// Helper functions for Objective-C integration
@interface APLExpression (Internal)
- (apl_expr_t*)underlyingExpression;
@end

@interface APLArray (Internal)
- (apl_array_t*)underlyingArray;
@end

@interface APLFortranBackend (Internal)
- (apl_fortran_backend_t*)underlyingBackend;
@end

// Category extensions for NSArray/NSDictionary
@interface NSArray (APLAdditions)
- (NSArray*)mapObjectsUsingSelector:(SEL)selector;
- (id)reduceObjectUsingSelector:(SEL)selector initial:(id)initial;
@end

@interface NSDictionary (APLAdditions)
- (id)objectForKeyedSubscript:(id)key;
@end

// Macros for Objective-C convenience
#define APL_EXPR_LITERAL(X) [APLExpression expressionWithLiteral:X]
#define APL_EXPR_BINARY(L, O, R) [APLExpression expressionWithBinaryOp:L operator:O right:R]
#define APL_EXPR_UNARY(O, V) [APLExpression expressionWithUnaryOp:O operand:V]
#define APL_ARRAY(shape, dtype, data) [APLArray arrayWithData:data shape:shape dtype:dtype]

// Exception handling macros
#define APL_TRY try
#define APL_CATCH catch (NSException* e) {
    APL_LOG_ERROR("Objective-C exception: %@", e);
    return [[APLRuntimeError alloc] initWithCode:APLErrorCodeUnspecified
                                           message:[NSString stringWithFormat:@"Objective-C: %@", e]
                                            reason:nil];
}
#define APL_THROW(exception) @throw(exception)

// Swift compatibility (if using Swift)
#ifdef SWIFT_PACKAGE
#define APL_EXPORT __attribute__((visibility ("default")))
#else
#define APL_EXPORT
#endif

#endif /* APL_OBJC_BRIDGING_H */