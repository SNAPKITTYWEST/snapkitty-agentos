// Objective-C Bridging Layer for APL Fortran
// Platform: Windows, iOS, macOS
// Architecture: C API + Objective-C/Swift compatibility for APL-to-Fortran compilation

#import <Foundation/Foundation.h>
#import "apfortran.h"

// Forward declarations
@class APLExpression;
@class APLArray;
@class APLFortranBackend;
@class APLCompilerOptions;
@class APLFortranManager;
@class APLUtilityFunctions;

// APLExpression Objective-C wrapper
@interface APLExpression : NSObject
@property (nonatomic, readonly) apl_expr_t* underlyingExpression;
@property (nonatomic, readonly) APLExprTypeOC type;
@property (nonatomic, readonly) NSArray<APLExpression*>* children;
+ (instancetype)expressionWithLiteral:(double)value;
+ (instancetype)expressionWithBinaryOp:(APLExpression*)left
                            operator:(char)op
                           right:(APLExpression*)right;
+ (instancetype)expressionWithUnaryOp:(char)op
                        operand:(APLExpression*)operand;
+ (instancetype)expressionWithCallFunction:(NSString*)functionName
                                      args:(NSArray<APLExpression*>*)args;
- (NSString*)descriptionOC;
@end

// APLArray Objective-C wrapper
@interface APLArray : NSObject
@property (nonatomic, readonly) apl_array_t* underlyingArray;
@property (nonatomic, readonly) int rank;
@property (nonatomic, readonly) NSArray<NSNumber*>* shape;
@property (nonatomic, readonly) NSString* dtype;
@property (nonatomic, readonly) size_t totalElements;
+ (instancetype)arrayWithShape:(NSArray<NSNumber*>*)shape
                       dtype:(NSString*)dtype
elementSize:(NSUInteger)elementSize
data:(void*)data;
- (id)getElementAtIndex:(NSInteger)index;
- (BOOL)applyOperation:(NSString*)operation
              withArray:(APLArray*)rightArray;
- (APLArray*)copy;
@end

// APLFortranBackend Objective-C wrapper
@interface APLFortranBackend : NSObject
@property (nonatomic, readonly) apl_fortran_backend_t* underlyingBackend;
@property (nonatomic, readwrite) NSString* outputDirectory;
@property (nonatomic, readwrite) NSString* optimizationLevel;
@property (nonatomic, readwrite) NSNumber* tileSize;
@property (nonatomic, readwrite) NSNumber* threadCount;
+ (instancetype)backendWithExpression:(APLExpression*)expression;
- (APLArray*)compileWithInput:(APLArray*)input;
- (APLArray*)executeWithInput:(APLArray*)input;
- (NSData*)generateFortranCode;
- (BOOL)writeFortranToFile:(NSString*)path;
@end

// APLCompilerOptions Objective-C wrapper
@interface APLCompilerOptions : NSObject
@property (nonatomic, readwrite) BOOL enableVectorization;
@property (nonatomic, readwrite) BOOL enableFusion;
@property (nonatomic, readwrite) BOOL enableTiling;
@property (nonatomic, readwrite) BOOL enableParallelization;
@property (nonatomic, readwrite) NSNumber* tileSize;
@property (nonatomic, readwrite) NSNumber* threadCount;
@property (nonatomic, readwrite) NSString* optimizationLevel;
+ (instancetype)options;
@end

// APLFortranManager Objective-C wrapper
@interface APLFortranManager : NSObject
+ (instancetype)sharedManager;
- (void)initializeWithOptions:(APLCompilerOptions*)options;
- (APLExpression*)parseExpression:(NSString*)source;
- (APLArray*)evaluateExpression:(NSString*)source;
- (APLFortranBackend*)compileExpression:(APLExpression*)expression;
- (APLArray*)compileAndExecute:(NSString*)source input:(APLArray*)input;
- (APLExpression*)createLiteral:(double)value;
- (APLExpression*)createVariable:(NSString*)name;
- (APLExpression*)createBinaryOp:(APLExpression*)left operator:(NSString*)op right:(APLExpression*)right;
- (APLArray*)createArrayWithData:(NSData*)data shape:(NSArray<NSNumber*>*)shape dtype:(NSString*)dtype;
@end

// APLUtilityFunctions Objective-C wrapper
@interface APLUtilityFunctions : NSObject
+ (APLExpression*)sumOfArray:(APLExpression*)array;
+ (APLExpression*)productOfArray:(APLExpression*)array;
+ (APLExpression*)meanOfArray:(APLExpression*)array;
@end

// APLRuntimeError Objective-C wrapper
@interface APLRuntimeError : NSError
+ (instancetype)errorWithAPLError:(apl_error_t)errorCode message:(NSString*)message;
@end

// Helper functions for bridging
extern "C" {
    apl_error_t APL_CDECL apl_parse_oc(const char* source, apl_expr_t** expr);
    apl_error_t APL_CDECL apl_free_expr_oc(apl_expr_t* expr);
    apl_array_t* APL_CDECL apl_array_create_oc(int rank, const int64_t* shape, const char* dtype, size_t element_size, void* data);
    void APL_CDECL apl_array_free_oc(apl_array_t* arr);
    apl_error_t APL_CDECL apl_compile_oc(apl_expr_t* expr, apl_fortran_backend_t** backend);
    apl_error_t APL_CDECL apl_execute_oc(apl_fortran_backend_t* backend, apl_array_t* input, apl_array_t** output);
    apl_error_t APL_CDECL apl_evaluate_oc(const char* expression, apl_array_t** result);
}

// Utility classes and functions
@interface NSArray (APLArrayUtils)
- (NSString*)joinWithDelimiter:(NSString*)delimiter;
@end

@interface APLExpression (InternalMethods)
- (APLExpression*)addChild:(APLExpression*)child;
@end

@interface APLFortranManager (InternalMethods)
- (void)setupWindowsRuntime;
- (void)setupCocoaRuntime;
@end

// Macros and utilities
#define APL_EXPR_LITERAL(X) [APLExpression expressionWithLiteral:X]
#define APL_EXPR_BINARY(L, O, R) [APLExpression expressionWithBinaryOp:L operator:O right:R]
#define APL_EXPR_UNARY(O, V) [APLExpression expressionWithUnaryOp:O operand:V]

#if TARGET_OS_IOS || TARGET_OS_MAC
#define APL_PLATFORM_UI YES
#else
#define APL_PLATFORM_UI NO
#endif

#endif /* APL_OBJC_BRIDGING_H */