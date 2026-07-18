## 2025-02-12 - Optimize DB commits in SEO engine loop
**Learning:** Database transactions (`db.commit()`) inside iterative loops severely throttle performance due to consecutive roundtrips and transaction overhead.
**Action:** Always batch database inserts or updates. Aggregate modifications within the loop and execute a single `await db.commit()` outside the loop, followed by validating records if downstream operations require generated IDs.
