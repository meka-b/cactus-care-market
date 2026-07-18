## 2024-05-24 - Optimize N+1 database queries in kg_agent
**Learning:** Checking database records one by one in a loop (N+1 query problem) is significantly slower than batching the lookups using an IN clause. This was evident when iterating through a list of diseases.
**Action:** When dealing with lists of items that need to be checked against a database, always gather the unique keys first, issue a single query using an IN clause, cache the results in memory (e.g. using a dict), and then process the original list.
