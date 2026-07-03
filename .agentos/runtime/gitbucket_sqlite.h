// GitBucket SQLite - Git + SQLite Memory System
// Integrates Git's version control with SQLite for fast queries
// Enables WORM memory buckets, multi-dimensional indexing, and fast context assembly

#include <sqlite3.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#ifdef _WIN32
#include <windows.h>
#else
#include <sys/stat.h>
#endif

// GitBucket SQLite Core - Main integration layer
typedef struct {
    sqlite3* db;
    char repo_path[MAX_PATH];
    char git_path[MAX_PATH];
    int64_t index_version;
    unsigned char gitbucket_version[16];
    int cache_enabled;
    time_t last_gc;
} GitBucketSQLite;

// Memory bucket schema
typedef struct {
    char* memory_ref;
    char* memory_bucket_v2_path;
    unsigned char signature[64];
    char* previous_seal;
    time_t created_at;
    uint64_t commit_timestamp;
    char* commit_hash;
    char* author;
    char* message;
    char* topic;
    uint32_t entity_id;
    uint32_t agent_id;
    uint32_t problem_id;
    char* data_hash;
    uint64_t data_size;
    int entity_version;
    int entity_count;
} MemoryBucket;

// Context assembly specification
typedef struct {
    char* spec_id;
    char* spec_hash;
    uint32_t agent_id;
    uint32_t problem_id;
    time_t since;
    time_t until;
    char** required_topics;
    int topic_count;
    char** required_entities;
    int entity_count;
    char** required_agents;
    int agent_count;
    char** excluded_topics;
    int excluded_topic_count;
    char* proof_requirement;
    int max_memory_buckets;
    int max_entity_size;
    int verify_seals;
} AssembleContextSpec;

// Query result
typedef struct {
    MemoryBucket* buckets;
    int bucket_count;
    char** file_paths;
    int file_count;
    uint64_t total_size;
    char* proof;
} AssembleContextResult;

// GitBucket SQLite API
GitBucketSQLite* gitbucket_sqlite_init(const char* repo_path);
void gitbucket_sqlite_free(GitBucketSQLite* gb);

// Database setup and maintenance
int gitbucket_sqlite_create_schema(GitBucketSQLite* gb);
int gitbucket_sqlite_extract_from_git(GitBucketSQLite* gb, const char* from_ref);
int gitbucket_sqlite_gc_memory_buckets(GitBucketSQLite* gb);
int gitbucket_sqlite_build_index(GitBucketSQLite* gb);

// Memory bucket operations
int gitbucket_sqlite_insert_memory_bucket(GitBucketSQLite* gb, const MemoryBucket* bucket);
MemoryBucket* gitbucket_sqlite_get_memory_bucket(GitBucketSQLite* gb, const char* memory_ref);
int gitbucket_sqlite_update_memory_bucket_metadata(GitBucketSQLite* gb, const MemoryBucket* bucket);
int gitbucket_sqlite_delete_memory_bucket(GitBucketSQLite* gb, const char* memory_ref);

// Query operations
AssembleContextResult gitbucket_sqlite_assemble_context(GitBucketSQLite* gb, const AssembleContextSpec* spec);
MemoryBucket* gitbucket_sqlite_query_memory_buckets(GitBucketSQLite* gb, const char* where_clause);
int gitbucket_sqlite_count_memory_buckets(GitBucketSQLite* gb, const char* topic_filter);

// Search and indexing
int gitbucket_sqlite_index_for_search(GitBucketSQLite* gb, const char* query);
MemoryBucket* gitbucket_sqlite_search_memory_buckets(GitBucketSQLite* gb, const char* keyword);

// Cache and performance
void gitbucket_sqlite_enable_cache(GitBucketSQLite* gb);
void gitbucket_sqlite_disable_cache(GitBucketSQLite* gb);
void gitbucket_sqlite_clear_cache(GitBucketSQLite* gb);

// File system utilities
int gitbucket_sqlite_copy_file(const char* src, const char* dst);
int gitbucket_sqlite_makedirs(const char* path);
char* gitbucket_sqlite_get_git_dir(const char* repo_path);
char* gitbucket_sqlite_get_gitworktree(const char* repo_path);

// Commit processing
int gitbucket_sqlite_process_commit(GitBucketSQLite* gb, const char* commit_hash, const char* message);
MemoryBucket* gitbucket_sqlite_extract_bucket_from_commit(GitBucketSQLite* gb, const char* commit_hash);

// Memory bucket versioning
int gitbucket_sqlite_create_memory_bucket(GitBucketSQLite* gb, const MemoryBucket* bucket);
MemoryBucket* gitbucket_sqlite_get_latest_memory_bucket(GitBucketSQLite* gb, const char* entity_type, uint32_t entity_id);
int gitbucket_sqlite_update_memory_bucket_with_version(GitBucketSQLite* gb, MemoryBucket* bucket, int new_version);

// Proof and seal handling
int gitbucket_sqlite_verify_memory_bucket_seal(GitBucketSQLite* gb, const MemoryBucket* bucket);
int gitbucket_sqlite_create_memory_bucket_seal(GitBucketSQLite* gb, MemoryBucket* bucket, const char* previous_seal);
char* gitbucket_sqlite_sign_memory_bucket(GitBucketSQLite* gb, const MemoryBucket* bucket);

// Context compilation
int gitbucket_sqlite_assemble_context_components(GitBucketSQLite* gb, AssembleContextResult* result, const AssembleContextSpec* spec);
int gitbucket_sqlite_verify_assembled_context(GitBucketSQLite* gb, const AssembleContextResult* result);

// Cleanup and resource management
void gitbucket_sqlite_free_memory_bucket(MemoryBucket* bucket);
void gitbucket_sqlite_free_assemble_context_result(AssembleContextResult* result);

// Platform-specific functions
#ifdef _WIN32
HMODULE gitbucket_sqlite_load_plasma_gate(void);
void gitbucket_sqlite_unload_plasma_gate(HMODULE module);
int gitbucket_sqlite_sign_data_windows(BYTE* data, DWORD data_size, BYTE* signature, DWORD* signature_size);
#else
int gitbucket_sqlite_sign_data_posix(const void* data, size_t data_size, void* signature, size_t* signature_size);
#endif

// Helper functions for working with GitBucket schema
const char* gitbucket_sqlite_get_memory_bucket_schema_path(void);
const char* gitbucket_sqlite_get_memory_bucket_index_schema_path(void);
const char* gitbucket_sqlite_get_memory_bucket_schema_filename(void);

// Utility functions
int gitbucket_sqlite_string_endswith(const char* str, const char* suffix);
char* gitbucket_sqlite_string_concat(const char* str1, const char* str2, const char* str3);
char* gitbucket_sqlite_string_slice(const char* str, size_t start, size_t end);
int gitbucket_sqlite_safe_remove(const char* path);

// Version information
const char* gitbucket_sqlite_get_version(void);
int gitbucket_sqlite_get_api_version(void);

// Debug and logging
void gitbucket_sqlite_log_error(const char* format, ...);
void gitbucket_sqlite_log_info(const char* format, ...);
void gitbucket_sqlite_log_warning(const char* format, ...);
void gitbucket_sqlite_enable_debug_logging(int enabled);

// CSV export/import for analysis
int gitbucket_sqlite_export_memory_buckets_to_csv(GitBucketSQLite* gb, const char* output_file);
int gitbucket_sqlite_import_memory_buckets_from_csv(GitBucketSQLite* gb, const char* input_file);

// Branch and tag operations
int gitbucket_sqlite_create_branch(GitBucketSQLite* gb, const char* branch_name, const char* source_branch);
int gitbucket_sqlite_tag_memory_bucket(GitBucketSQLite* gb, const char* tag_name, const char* memory_ref);
int gitbucket_sqlite_list_branches(GitBucketSQLite* gb, char*** branches);
int gitbucket_sqlite_list_tags(GitBucketSQLite* gb, char*** tags);

// Checkpoint management
int gitbucket_sqlite_create_checkpoint(GitBucketSQLite* gb, const char* checkpoint_id, time_t timestamp);
int gitbucket_sqlite_restore_checkpoint(GitBucketSQLite* gb, const char* checkpoint_id);
int gitbucket_sqlite_list_checkpoints(GitBucketSQLite* gb, char*** checkpoints);

// Conflict resolution
int gitbucket_sqlite_detect_memory_bucket_conflicts(GitBucketSQLite* gb, MemoryBucket* bucket);
int gitbucket_sqlite_resolve_memory_bucket_conflicts(GitBucketSQLite* gb, MemoryBucket* bucket, const char* resolution_strategy);

// Performance monitoring
typedef struct {
    uint64_t queries_executed;
    uint64_t queries_failed;
    uint64_t memory_buckets_inserted;
    uint64_t memory_buckets_updated;
    uint64_t memory_buckets_retrieved;
    uint64_t cache_hits;
    uint64_t cache_misses;
    double average_query_time;
    double average_insert_time;
    double average_retrieval_time;
} GitBucketStats;

GitBucketStats gitbucket_sqlite_get_stats(GitBucketSQLite* gb);
void gitbucket_sqlite_reset_stats(GitBucketSQLite* gb);

// Initialize GitBucket SQLite from a Git repository
GitBucketSQLite* gitbucket_sqlite_init(const char* repo_path) {
    if (!repo_path) {
        return NULL;
    }

    GitBucketSQLite* gb = (GitBucketSQLite*)calloc(1, sizeof(GitBucketSQLite));
    if (!gb) {
        gitbucket_sqlite_log_error("Failed to allocate memory for GitBucketSQLite");
        return NULL;
    }

    // Initialize version
    gb->index_version = 2;
    snprintf(gb->gitbucket_version, sizeof(gb->gitbucket_version), "memory-bucket-v2");
    gb->cache_enabled = 1;
    gb->last_gc = time(NULL);

    // Store repository path
    strncpy(gb->repo_path, repo_path, sizeof(gb->repo_path) - 1);

    // Determine Git directory
    char* git_dir = gitbucket_sqlite_get_git_dir(repo_path);
    if (git_dir) {
        strncpy(gb->git_path, git_dir, sizeof(gb->git_path) - 1);
        free(git_dir);
    } else {
        strncpy(gb->git_path, repo_path, sizeof(gb->git_path) - 1);
    }

    // Initialize SQLite database
    char db_path[MAX_PATH];
    snprintf(db_path, sizeof(db_path), "%s/.gitbucket/gitbucket.db", repo_path);

    int rc = sqlite3_open_v2(db_path, &gb->db, SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE, NULL);
    if (rc != SQLITE_OK) {
        gitbucket_sqlite_log_error("Failed to open SQLite database: %s", sqlite3_errmsg(gb->db));
        gitbucket_sqlite_free(gb);
        return NULL;
    }

    // Enable WAL mode for better concurrency
    rc = sqlite3_exec(gb->db, "PRAGMA journal_mode = WAL;", NULL, NULL, NULL);
    if (rc != SQLITE_OK) {
        gitbucket_sqlite_log_warning("Failed to set WAL journal mode: %s", sqlite3_errmsg(gb->db));
    }

    // Set cache size for better performance
    rc = sqlite3_exec(gb->db, "PRAGMA cache_size = 10000;", NULL, NULL, NULL);
    if (rc != SQLITE_OK) {
        gitbucket_sqlite_log_warning("Failed to set cache size: %s", sqlite3_errmsg(gb->db));
    }

    // Create schema if needed
    if (gitbucket_sqlite_create_schema(gb) != SQLITE_OK) {
        gitbucket_sqlite_free(gb);
        return NULL;
    }

    gitbucket_sqlite_log_info("GitBucket SQLite initialized in %s", repo_path);
    return gb;
}

// Cleanup GitBucket SQLite resources
void gitbucket_sqlite_free(GitBucketSQLite* gb) {
    if (!gb) {
        return;
    }

    if (gb->db) {
        sqlite3_close(gb->db);
        gb->db = NULL;
    }

    free(gb);
}

// Create all necessary SQLite tables
int gitbucket_sqlite_create_schema(GitBucketSQLite* gb) {
    if (!gb) {
        return SQLITE_ERROR;
    }

    const char* schema_sql =
        "BEGIN TRANSACTION;"

        "CREATE TABLE IF NOT EXISTS memory_buckets ("
            "memory_ref TEXT PRIMARY KEY,"
            "memory_bucket_v2_path TEXT NOT NULL,"
            "signature BLOB(64) NOT NULL,"
            "previous_seal TEXT,"
            "created_at INTEGER NOT NULL,"
            "commit_timestamp INTEGER NOT NULL,"
            "commit_hash TEXT NOT NULL,"
            "author TEXT NOT NULL,"
            "message TEXT NOT NULL,"
            "topic TEXT,"
            "entity_id INTEGER,"
            "agent_id INTEGER,"
            "problem_id INTEGER,"
            "data_hash TEXT NOT NULL,"
            "data_size INTEGER NOT NULL,"
            "entity_version INTEGER NOT NULL,"
            "entity_count INTEGER NOT NULL"
            ");"

        "CREATE INDEX IF NOT EXISTS idx_memory_buckets_topic ON memory_buckets(topic);"
        "CREATE INDEX IF NOT EXISTS idx_memory_buckets_entity_id ON memory_buckets(entity_id);"
        "CREATE INDEX IF NOT EXISTS idx_memory_buckets_agent_id ON memory_buckets(agent_id);"
        "CREATE INDEX IF NOT EXISTS idx_memory_buckets_problem_id ON memory_buckets(problem_id);"
        "CREATE INDEX IF NOT EXISTS idx_memory_buckets_created_at ON memory_buckets(created_at);"
        "CREATE INDEX IF NOT EXISTS idx_memory_buckets_commit_hash ON memory_buckets(commit_hash);"

        "COMMIT;"

        "PRAGMA foreign_keys = ON;"
        ";"

        "CREATE TABLE IF NOT EXISTS checkpoints ("
            "checkpoint_id TEXT PRIMARY KEY,"
            "timestamp INTEGER NOT NULL,"
            "git_commit_hash TEXT NOT NULL,"
            "checkpoint_data TEXT NOT NULL"
            ");"

        "CREATE INDEX IF NOT EXISTS idx_checkpoints_timestamp ON checkpoints(timestamp);"

        "CREATE TABLE IF NOT EXISTS agent_thoughts ("
            "thought_id TEXT PRIMARY KEY,"
            "agent_id TEXT NOT NULL,"
            "commit_hash TEXT NOT NULL,"
            "thought_type TEXT NOT NULL,"
            "thought_data TEXT NOT NULL,"
            "timestamp INTEGER NOT NULL,"
            "related_entity_type TEXT,"
            "related_entity_id INTEGER"
            ");"

        "CREATE INDEX IF NOT EXISTS idx_agent_thoughts_agent_id ON agent_thoughts(agent_id);"
        "CREATE INDEX IF NOT EXISTS idx_agent_thoughts_timestamp ON agent_thoughts(timestamp);"

        "CREATE TABLE IF NOT EXISTS proofs ("
            "proof_id TEXT PRIMARY KEY,"
            "proof_type TEXT NOT NULL,"
            "verified BOOLEAN NOT NULL,"
            "proof_data TEXT NOT NULL,"
            "target_memory_ref TEXT NOT NULL,"
            "verified_at INTEGER NOT NULL,"
            "verifier_id TEXT NOT NULL"
            ");"

        "CREATE INDEX IF NOT EXISTS idx_proofs_target_memory_ref ON proofs(target_memory_ref);"

        "CREATE TABLE IF NOT EXISTS problem_registry ("
            "problem_id TEXT PRIMARY KEY,"
            "spec_hash TEXT NOT NULL,"
            "verify_fn TEXT NOT NULL,"
            "difficulty TEXT NOT NULL,"
            "reward TEXT NOT NULL,"
            "status TEXT NOT NULL,"
            "claimed_by TEXT,"
            "claimed_at INTEGER,"
            "solved_by TEXT,"
            "solved_at INTEGER,"
            "solution_ref TEXT"
            ");"

        "CREATE INDEX IF NOT EXISTS idx_problem_registry_status ON problem_registry(status);"

        "CREATE TABLE IF NOT EXISTS claim_ledger ("
            "claim_id TEXT PRIMARY KEY,"
            "problem_id TEXT NOT NULL,"
            "agent_id TEXT NOT NULL,"
            "nonce TEXT NOT NULL,"
            "timestamp INTEGER NOT NULL,"
            "expires_at INTEGER NOT NULL,"
            "proof TEXT NOT NULL"
            ");"

        "CREATE INDEX IF NOT EXISTS idx_claim_ledger_problem_id ON claim_ledger(problem_id);"

        "CREATE TABLE IF NOT EXISTS convergence_log ("
            "log_id TEXT PRIMARY KEY,"
            "event TEXT NOT NULL,"
            "problem_id TEXT NOT NULL,"
            "solver TEXT NOT NULL,"
            "solution_ref TEXT NOT NULL,"
            "universe_sum_delta REAL NOT NULL,"
            "timestamp INTEGER NOT NULL"
            ");"

        "CREATE INDEX IF NOT EXISTS idx_convergence_log_event ON convergence_log(event);"

        "CREATE TABLE IF NOT EXISTS skills_registry ("
            "skill_id TEXT PRIMARY KEY,"
            "memory_ref TEXT NOT NULL,"
            "provides TEXT NOT NULL,"
            "requires TEXT NOT NULL,"
            "verify_fn TEXT NOT NULL,"
            "input_schema TEXT NOT NULL,"
            "output_schema TEXT NOT NULL,"
            "trust TEXT NOT NULL,"
            "created INTEGER NOT NULL,"
            "author TEXT NOT NULL"
            ");"

        "COMMIT;"
        ";"
        "PRAGMA foreign_keys = ON;"
        ";"
        "CREATE TABLE IF NOT EXISTS checkpoints ("
            "checkpoint_id TEXT PRIMARY KEY,"
            "timestamp INTEGER NOT NULL,"
            "git_commit_hash TEXT NOT NULL,"
            "checkpoint_data TEXT NOT NULL"
            ");"

        "CREATE INDEX IF NOT EXISTS idx_checkpoints_timestamp ON checkpoints(timestamp);"

        "CREATE TABLE IF NOT EXISTS agent_thoughts ("
            "thought_id TEXT PRIMARY KEY,"
            "agent_id TEXT NOT NULL,"
            "commit_hash TEXT NOT NULL,"
            "thought_type TEXT NOT NULL,"
            "thought_data TEXT NOT NULL,"
            "timestamp INTEGER NOT NULL,"
            "related_entity_type TEXT,"
            "related_entity_id INTEGER"
            ");"

        "CREATE INDEX IF NOT EXISTS idx_agent_thoughts_agent_id ON agent_thoughts(agent_id);"
        "CREATE INDEX IF NOT EXISTS idx_agent_thoughts_timestamp ON agent_thoughts(timestamp);"
        \n        "CREATE TABLE IF NOT EXISTS proofs (\"\n            \"proof_id TEXT PRIMARY KEY,\"\n            \"proof_type TEXT NOT NULL,\"\n            \"verified BOOLEAN NOT NULL,\"\n            \"proof_data TEXT NOT NULL,\"\n            \"target_memory_ref TEXT NOT NULL,\"\n            \"verified_at INTEGER NOT NULL,\"\n            \"verifier_id TEXT NOT NULL\"\n            \");\"\n        \n        \"CREATE INDEX IF NOT EXISTS idx_proofs_target_memory_ref ON proofs(target_memory_ref);\"\n        \n        \"CREATE TABLE IF NOT EXISTS problem_registry (\"\n            \"problem_id TEXT PRIMARY KEY,\"\n            \"spec_hash TEXT NOT NULL,\"\n            \"verify_fn TEXT NOT NULL,\"\n            \"difficulty TEXT NOT NULL,\"\n            \"reward TEXT NOT NULL,\"\n            \"status TEXT NOT NULL,\"\n            \"claimed_by TEXT,\"\n            \"claimed_at INTEGER,\"\n            \"solved_by TEXT,\"\n            \"solved_at INTEGER,\"\n            \"solution_ref TEXT\"\n            \");\"\n        \n        \"CREATE INDEX IF NOT EXISTS idx_problem_registry_status ON problem_registry(status);\"\n        \n        \"CREATE TABLE IF NOT EXISTS claim_ledger (\"\n            \"claim_id TEXT PRIMARY KEY,\"\n            \"problem_id TEXT NOT NULL,\"\n            \"agent_id TEXT NOT NULL,\"\n            \"nonce TEXT NOT NULL,\"\n            \"timestamp INTEGER NOT NULL,\"\n            \"expires_at INTEGER NOT NULL,\"\n            \"proof TEXT NOT NULL\"\n            \");\"\n        \n        \"CREATE INDEX IF NOT EXISTS idx_claim_ledger_problem_id ON claim_ledger(problem_id);\"\n        \n        \"CREATE TABLE IF NOT EXISTS convergence_log (\"\n            \"log_id TEXT PRIMARY KEY,\"\n            \"event TEXT NOT NULL,\"\n            \"problem_id TEXT NOT NULL,\"\n            \"solver TEXT NOT NULL,\"\n            \"solution_ref TEXT NOT NULL,\"\n            \"universe_sum_delta REAL NOT NULL,\"\n            \"timestamp INTEGER NOT NULL\"\n            \");\"\n        \n        \"CREATE INDEX IF NOT EXISTS idx_convergence_log_event ON convergence_log(event);\"\n        \n        \"CREATE TABLE IF NOT EXISTS skills_registry (\"\n            \"skill_id TEXT PRIMARY KEY,\"\n            \"memory_ref TEXT NOT NULL,\"\n            \"provides TEXT NOT NULL,\"\n            \"requires TEXT NOT NULL,\"\n            \"verify_fn TEXT NOT NULL,\"\n            \"input_schema TEXT NOT NULL,\"\n            \"output_schema TEXT NOT NULL,\"\n            \"trust TEXT NOT NULL,\"\n            \"created INTEGER NOT NULL,\"\n            \"author TEXT NOT NULL\"\n            \");\"\n        \n        \"COMMIT;\";", NULL, NULL, NULL);

    if (rc != SQLITE_OK) {
        gitbucket_sqlite_log_error("Failed to create tables: %s", sqlite3_errmsg(gb->db));
        return rc;
    }

    gitbucket_sqlite_log_info("GitBucket SQLite schema created successfully");
    return SQLITE_OK;
}
\n// Process a new Git commit and extract memory buckets\nint gitbucket_sqlite_process_commit(GitBucketSQLite* gb, const char* commit_hash, const char* message) {\n    if (!gb || !commit_hash) {\n        return SQLITE_ERROR;\n    }\n\n    gitbucket_sqlite_log_info(\"Processing commit: %s\", commit_hash);\n\n    // Get commit timestamp\n    time_t commit_timestamp = time(NULL);\n\n    // Find the memory bucket file in the commit\n    // This is a simplified version - in practice you'd use git archive or similar\n    char bucket_path[MAX_PATH];\n    snprintf(bucket_path, sizeof(bucket_path), \"%s/.agentos/gitbucket/buckets/%s.json\", gb->repo_path, commit_hash);\n\n    if (!checkFileExists(bucket_path)) {\n        gitbucket_sqlite_log_warning(\"No memory bucket found for commit: %s\", commit_hash);\n        return SQLITE_OK; // Not an error, just no bucket\n    }\n\n    // Read the memory bucket\n    FILE* bucket_file = fopen(bucket_path, \"rb\");\n    if (!bucket_file) {\n        gitbucket_sqlite_log_error(\"Failed to open memory bucket: %s\", bucket_path);\n        return SQLITE_ERROR;\n    }\n\n    fseek(bucket_file, 0, SEEK_END);\n    uint64_t bucket_size = ftell(bucket_file);\n    rewind(bucket_file);\n\n    char* bucket_data = (char*)malloc(bucket_size + 1);\n    if (!bucket_data) {\n        fclose(bucket_file);\n        gitbucket_sqlite_log_error(\"Failed to allocate memory for bucket data\");\n        return SQLITE_ERROR;\n    }\n\n    size_t read_size = fread(bucket_data, 1, bucket_size, bucket_file);\n    fclose(bucket_file);\n\n    if (read_size != bucket_size) {\n        free(bucket_data);\n        gitbucket_sqlite_log_error(\"Failed to read memory bucket data\");\n        return SQLITE_ERROR;\n    }\n\n    bucket_data[bucket_size] = '\\0';\n\n    // Parse bucket JSON to extract metadata\n    MemoryBucket bucket;\n    memset(&bucket, 0, sizeof(MemoryBucket));\n\n    // For now, create a simple bucket entry\n    bucket.memory_ref = (char*)malloc(strlen(commit_hash) + 1);\n    if (!bucket.memory_ref) {\n        free(bucket_data);\n        gitbucket_sqlite_log_error(\"Failed to allocate memory for memory_ref\");\n        return SQLITE_ERROR;\n    }\n    strcpy(bucket.memory_ref, commit_hash);\n\n    bucket.memory_bucket_v2_path = (char*)malloc(bucket_size + 1);\n    if (!bucket.memory_bucket_v2_path) {\n        free(bucket_data);\n        free(bucket.memory_ref);\n        gitbucket_sqlite_log_error(\"Failed to allocate memory for memory_bucket_v2_path\");\n        return SQLITE_ERROR;\n    }\n    strcpy(bucket.memory_bucket_v2_path, bucket_path);\n\n    bucket.created_at = commit_timestamp;\n    bucket.commit_timestamp = commit_timestamp;\n    bucket.commit_hash = (char*)malloc(strlen(commit_hash) + 1);\n    if (!bucket.commit_hash) {\n        free(bucket_data);\n        free(bucket.memory_ref);\n        free(bucket.memory_bucket_v2_path);\n        gitbucket_sqlite_log_error(\"Failed to allocate memory for commit_hash\");\n        return SQLITE_ERROR;\n    }\n    strcpy(bucket.commit_hash, commit_hash);\n\n    bucket.author = (char*)malloc(64);\n    if (!bucket.author) {\n        free(bucket_data);\n        free(bucket.memory_ref);\n        free(bucket.memory_bucket_v2_path);\n        free(bucket.commit_hash);\n        gitbucket_sqlite_log_error(\"Failed to allocate memory for author\");\n        return SQLITE_ERROR;\n    }\n    snprintf(bucket.author, 64, \"git_commit\");\n\n    bucket.message = (char*)malloc(strlen(message) + 1);\n    if (!bucket.message) {\n        free(bucket_data);\n        free(bucket.memory_ref);\n        free(bucket.memory_bucket_v2_path);\n        free(bucket.commit_hash);\n        free(bucket.author);\n        gitbucket_sqlite_log_error(\"Failed to allocate memory for message\");\n        return SQLITE_ERROR;\n    }\n    strcpy(bucket.message, message);\n\n    bucket.topic = NULL;\n    bucket.entity_id = 0;\n    bucket.agent_id = 0;\n    bucket.problem_id = 0;\n\n    // Calculate hash of bucket data (simplified)\n    bucket.data_hash = (char*)malloc(65);\n    if (!bucket.data_hash) {\n        free(bucket_data);\n        free(bucket.memory_ref);\n        free(bucket.memory_bucket_v2_path);\n        free(bucket.commit_hash);\n        free(bucket.author);\n        free(bucket.message);\n        gitbucket_sqlite_log_error(\"Failed to allocate memory for data_hash\");\n        return SQLITE_ERROR;\n    }\n    // Simple hash for demonstration\n    snprintf(bucket.data_hash, 65, \"%016llx\", (unsigned long long)bucket_size);\n\n    bucket.data_size = bucket_size;\n    bucket.entity_version = 1;\n    bucket.entity_count = 1;\n\n    bucket.previous_seal = NULL;\n\n    // Insert into database\n    int rc = gitbucket_sqlite_insert_memory_bucket(gb, &bucket);\n\n    // Cleanup\n    free(bucket_data);\n    gitbucket_sqlite_free_memory_bucket(&bucket);\n\n    if (rc == SQLITE_OK) {\n        gitbucket_sqlite_log_info(\"Successfully processed and stored memory bucket: %s\", commit_hash);\n    }\n\n    return rc;\n}\n\n// Insert a memory bucket into the SQLite database\nint gitbucket_sqlite_insert_memory_bucket(GitBucketSQLite* gb, const MemoryBucket* bucket) {\n    if (!gb || !bucket) {\n        return SQLITE_ERROR;\n    }\n\n    sqlite3_stmt* stmt;\n    const char* sql =\n        \"INSERT INTO memory_buckets (\"\n        \"memory_ref, memory_bucket_v2_path, signature, previous_seal, created_at, commit_timestamp, \"\n        \"commit_hash, author, message, topic, entity_id, agent_id, problem_id, data_hash, data_size, \"\n        \"entity_version, entity_count)\"\n        \"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\";\n\n    int rc = sqlite3_prepare_v2(gb->db, sql, -1, &stmt, NULL);\n    if (rc != SQLITE_OK) {\n        gitbucket_sqlite_log_error(\"Failed to prepare insert statement: %s\", sqlite3_errmsg(gb->db));\n        return rc;\n    }\n\n    // Bind parameters\n    sqlite3_bind_text(stmt, 1, bucket->memory_ref, -1, SQLITE_STATIC);\n    sqlite3_bind_text(stmt, 2, bucket->memory_bucket_v2_path, -1, SQLITE_STATIC);\n    sqlite3_bind_blob(stmt, 3, bucket->signature, sizeof(bucket->signature), SQLITE_STATIC);\n    sqlite3_bind_text(stmt, 4, bucket->previous_seal, -1, SQLITE_STATIC);\n    sqlite3_bind_int64(stmt, 5, bucket->created_at);\n    sqlite3_bind_int64(stmt, 6, bucket->commit_timestamp);\n    sqlite3_bind_text(stmt, 7, bucket->commit_hash, -1, SQLITE_STATIC);\n    sqlite3_bind_text(stmt, 8, bucket->author, -1, SQLITE_STATIC);\n    sqlite3_bind_text(stmt, 9, bucket->message, -1, SQLITE_STATIC);\n    sqlite3_bind_text(stmt, 10, bucket->topic, -1, SQLITE_STATIC);\n    sqlite3_bind_int(stmt, 11, bucket->entity_id);\n    sqlite3_bind_int(stmt, 12, bucket->agent_id);\n    sqlite3_bind_int(stmt, 13, bucket->problem_id);\n    sqlite3_bind_text(stmt, 14, bucket->data_hash, -1, SQLITE_STATIC);\n    sqlite3_bind_int64(stmt, 15, bucket->data_size);\n    sqlite3_bind_int(stmt, 16, bucket->entity_version);\n    sqlite3_bind_int(stmt, 17, bucket->entity_count);\n\n    rc = sqlite3_step(stmt);\n    sqlite3_finalize(stmt);\n\n    if (rc != SQLITE_DONE) {\n        gitbucket_sqlite_log_error(\"Failed to insert memory bucket: %s\", sqlite3_errmsg(gb->db));\n        return rc;\n    }\n\n    gitbucket_sqlite_log_info(\"Memory bucket inserted: %s\", bucket->memory_ref);\n    return SQLITE_OK;\n}\n\n// Free a MemoryBucket structure\nvoid gitbucket_sqlite_free_memory_bucket(MemoryBucket* bucket) {\n    if (!bucket) {\n        return;\n    }\n\n    free(bucket->memory_ref);\n    free(bucket->memory_bucket_v2_path);\n    free(bucket->commit_hash);\n    free(bucket->author);\n    free(bucket->message);\n    free(bucket->topic);\n    free(bucket->data_hash);\n    free(bucket->previous_seal);\n\n    free(bucket);\n}\n\n// Build SQLite index from Git history\nint gitbucket_sqlite_build_index(GitBucketSQLite* gb) {\n    if (!gb) {\n        return SQLITE_ERROR;\n    }\n\n    gitbucket_sqlite_log_info(\"Building GitBucket index from Git history...\");\n\n    // Execute git log to get commits\n    // This is a simplified version - in practice you'd use a more efficient approach\n    char command[MAX_PATH * 2];\n    snprintf(command, sizeof(command),\n             \"cd %s && git log --pretty=format:'%H|%ad|%an|%s' --date=iso-strict --all\",\n             gb->repo_path);\n\n    FILE* git_log = popen(command, \"r\");\n    if (!git_log) {\n        gitbucket_sqlite_log_error(\"Failed to execute git log command\");\n        return SQLITE_ERROR;\n    }\n\n    char line[1024];\n    int processed_count = 0;\n    while (fgets(line, sizeof(line), git_log) != NULL) {\n        // Parse the git log line\n        char commit_hash[65];\n        char date_str[32];\n        char author[128];\n        char message[512];\n\n        // Parse the line (format: commit_hash|date|author|message)\n        if (sscanf(line, \"%64[^|]|%31[^|]|%127[^|]|%511[^\"]\", \n                   commit_hash, date_str, author, message) == 4) {\n\n            // Process the commit\n            int rc = gitbucket_sqlite_process_commit(gb, commit_hash, message);\n            if (rc == SQLITE_OK) {\n                processed_count++;\n            }\n        }\n    }\n\n    pclose(git_log);\n\n    gitbucket_sqlite_log_info(\"Processed %d commits, built index successfully\", processed_count);\n    return SQLITE_OK;\n}\n\n// Assemble context according to specifications\nAssembleContextResult gitbucket_sqlite_assemble_context(GitBucketSQLite* gb, const AssembleContextSpec* spec) {\n    AssembleContextResult result;\n    memset(&result, 0, sizeof(result));\n\n    if (!gb || !spec) {\n        gitbucket_sqlite_log_error(\"Invalid parameters for context assembly\");\n        return result;\n    }\n\n    // Build SQL query based on specification\n    char where_clause[2048];\n    snprintf(where_clause, sizeof(where_clause), \"1=1\");\n\n    // Apply topic filter\n    if (spec->required_topics && spec->topic_count > 0) {\n        char topic_conditions[1024];\n        snprintf(topic_conditions, sizeof(topic_conditions), \"topic IN (\");\n        for (int i = 0; i < spec->topic_count; i++) {\n            if (i > 0) {\n                strncat(topic_conditions, \",\", sizeof(topic_conditions) - strlen(topic_conditions) - 1);\n            }\n            strncat(topic_conditions, \"'\", sizeof(topic_conditions) - strlen(topic_conditions) - 1);\n            strncat(topic_conditions, spec->required_topics[i], sizeof(topic_conditions) - strlen(topic_conditions) - 1);\n            strncat(topic_conditions, \"'\", sizeof(topic_conditions) - strlen(topic_conditions) - 1);\n        }\n        strncat(topic_conditions, \")\", sizeof(topic_conditions) - strlen(topic_conditions) - 1);\n\n        char temp[2048];\n        snprintf(temp, sizeof(temp), \"%s AND %s\", where_clause, topic_conditions);\n        strncpy(where_clause, temp, sizeof(where_clause) - 1);\n    }\n\n    // Apply entity filter\n    if (spec->required_entities && spec->entity_count > 0) {\n        // Similar logic for entity filtering\n    }\n\n    // Apply agent filter\n    if (spec->required_agents && spec->agent_count > 0) {\n        // Similar logic for agent filtering\n    }\n\n    // Apply time range filter\n    if (spec->since) {\n        char temp[2048];\n        snprintf(temp, sizeof(temp), \"%s AND created_at >= %ld\", where_clause, spec->since);\n        strncpy(where_clause, temp, sizeof(where_clause) - 1);\n    }\n\n    if (spec->until) {\n        char temp[2048];\n        snprintf(temp, sizeof(temp), \"%s AND created_at <= %ld\", where_clause, spec->until);\n        strncpy(where_clause, temp, sizeof(where_clause) - 1);\n    }\n\n    // Execute query\n    char sql[3072];\n    snprintf(sql, sizeof(sql),\n             \"SELECT * FROM memory_buckets WHERE %s ORDER BY created_at DESC LIMIT %d\",\n             where_clause, spec->max_memory_buckets);\n\n    sqlite3_stmt* stmt;\n    int rc = sqlite3_prepare_v2(gb->db, sql, -1, &stmt, NULL);\n    if (rc != SQLITE_OK) {\n        gitbucket_sqlite_log_error(\"Failed to prepare query: %s\", sqlite3_errmsg(gb->db));\n        return result;\n    }\n\n    // Execute query and build results\n    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {\n        result.bucket_count++;\n        result.total_size += sqlite3_column_int64(stmt, 13);  // data_size column\n    }\n\n    sqlite3_finalize(stmt);\n\n    gitbucket_sqlite_log_info(\"Assembled context with %d memory buckets, %llu bytes total\", \n                               result.bucket_count, (unsigned long long)result.total_size);\n\n    return result;\n}\n\n// Cleanup assemble context result\nvoid gitbucket_sqlite_free_assemble_context_result(AssembleContextResult* result) {\n    if (!result) {\n        return;\n    }\n\n    free(result->buckets);\n    free(result->file_paths);\n    result->bucket_count = 0;\n    result->file_count = 0;\n    result->total_size = 0;\n}\n\n// Get statistics about GitBucket\nGitBucketStats gitbucket_sqlite_get_stats(GitBucketSQLite* gb) {\n    GitBucketStats stats;\n    memset(&stats, 0, sizeof(stats));\n\n    if (!gb) {\n        return stats;\n    }\n\n    // Execute simple queries to get statistics\n    sqlite3_stmt* stmt;\n\n    // Query count\n    const char* query_sql = \"SELECT COUNT(*) FROM memory_buckets\";\n    int rc = sqlite3_prepare_v2(gb->db, query_sql, -1, &stmt, NULL);\n    if (rc == SQLITE_OK) {\n        rc = sqlite3_step(stmt);\n        if (rc == SQLITE_ROW) {\n            stats.memory_buckets_inserted = sqlite3_column_int64(stmt, 0);\n        }\n        sqlite3_finalize(stmt);\n    }\n\n    // Agent thoughts count\n    query_sql = \"SELECT COUNT(*) FROM agent_thoughts\";\n    rc = sqlite3_prepare_v2(gb->db, query_sql, -1, &stmt, NULL);\n    if (rc == SQLITE_OK) {\n        rc = sqlite3_step(stmt);\n        if (rc == SQLITE_ROW) {\n            stats.memory_buckets_updated = sqlite3_column_int64(stmt, 0);\n        }\n        sqlite3_finalize(stmt);\n    }\n\n    return stats;\n}\n\n// Enable cache for performance\nvoid gitbucket_sqlite_enable_cache(GitBucketSQLite* gb) {\n    if (!gb) {\n        return;\n    }\n    gb->cache_enabled = 1;\n}\n\n// Disable cache\nvoid gitbucket_sqlite_disable_cache(GitBucketSQLite* gb) {\n    if (!gb) {\n        return;\n    }\n    gb->cache_enabled = 0;\n}\n\n// Main entry point for GitBucket SQLite\ndefault void gitbucket_sqlite_entry_point(const char* repo_path) {\n    if (!repo_path) {\n        gitbucket_sqlite_log_error(\"Repository path is required\");\n        return;\n    }\n\n    gitbucket_sqlite_log_info(\"Initializing GitBucket SQLite in %s\", repo_path);\n\n    GitBucketSQLite* gb = gitbucket_sqlite_init(repo_path);\n    if (!gb) {\n        gitbucket_sqlite_log_error(\"Failed to initialize GitBucket SQLite\");\n        return;\n    }\n\n    // Enable cache for better performance\n    gitbucket_sqlite_enable_cache(gb);\n\n    // Build initial index\n    if (gitbucket_sqlite_build_index(gb) != SQLITE_OK) {\n        gitbucket_sqlite_log_error(\"Failed to build GitBucket index\");\n        gitbucket_sqlite_free(gb);\n        return;\n    }\n\n    gitbucket_sqlite_log_info(\"GitBucket SQLite initialization complete\");\n\n    // Cleanup\n    gitbucket_sqlite_free(gb);\n}\n"}