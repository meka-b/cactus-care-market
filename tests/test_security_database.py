import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

class DatabaseConfigTest(unittest.TestCase):
    def test_database_url_fallback(self):
        # We need to temporarily remove DATABASE_URL from environment if it exists
        original_db_url = os.environ.get("DATABASE_URL")
        if "DATABASE_URL" in os.environ:
            del os.environ["DATABASE_URL"]

        import importlib

        # Now import the database module (forcing a reload to avoid flakiness)
        import database
        importlib.reload(database)

        self.assertNotIn('supersecretpassword', database.DATABASE_URL)
        self.assertIn('postgresql+asyncpg://yesil_admin@localhost:5432/yesil_dukkan', database.DATABASE_URL)

        if original_db_url:
            os.environ["DATABASE_URL"] = original_db_url

if __name__ == '__main__':
    unittest.main()
