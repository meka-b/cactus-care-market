## 2024-05-18 - Safe offset pagination in SQLAlchemy
**Learning:** Using `limit()` and `offset()` in SQLAlchemy queries requires a deterministic `order_by()` clause (e.g. `order_by(DBProduct.id)`) to prevent missed or duplicated rows when iterating through large datasets in batches. Without `order_by`, SQL engines do not guarantee consistent sorting across the paginated calls.
**Action:** Always append `.order_by(Model.id)` when utilizing `limit` and `offset` for batch processing in Python backend queries.

## 2024-05-18 - Replacing Unbounded In-Memory Loads
**Learning:** Loading thousands of records directly into memory using `.all()` (e.g., `db.execute(select(Model)).scalars().all()`) consumes large amounts of application and database memory cursor space, leading to significant memory spikes and eventual OOMs under scale.
**Action:** To solve unbounded query loads, implement cursor-based or limit/offset pagination with small batch sizes, and process tasks using `asyncio.gather` on an iteration-by-iteration basis, thereby controlling maximum simultaneous footprint.
