import unittest
from datetime import datetime

from app.api.v1.auth import serialize_user_detail


class DummyRole:
    def __init__(self, name: str):
        self.name = name


class DummyUser:
    def __init__(self):
        self.id = 1
        self.username = "owner01"
        self.email = "owner@example.com"
        self.full_name = "Alice Owner"
        self.phone_number = "0123456789"
        self.avatar = None
        self.role_id = 2
        self.role = DummyRole("OWNER")
        self.is_active = True
        self.created_at = datetime(2024, 1, 1, 12, 0, 0)


class DummyOwnerProfile:
    def __init__(self):
        self.id = 10
        self.user_id = 1
        self.company_name = "Lucky Farm"
        self.age = 35
        self.experience_years = 8
        self.occupation = "Business"
        self.address = "Ha Noi"
        self.nationality = "Vietnam"
        self.social_link = "https://example.com"
        self.bio = "Owner profile"


class AuthFeatureTests(unittest.TestCase):
    def test_serialize_user_detail_includes_account_and_profile_info(self):
        user = DummyUser()
        profile = DummyOwnerProfile()

        payload = serialize_user_detail(user, profile)

        self.assertEqual(payload["id"], 1)
        self.assertEqual(payload["role_name"], "OWNER")
        self.assertEqual(payload["profile"]["company_name"], "Lucky Farm")
        self.assertEqual(payload["profile"]["occupation"], "Business")


if __name__ == "__main__":
    unittest.main()
