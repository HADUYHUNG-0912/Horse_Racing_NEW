"""Timezone utility for Vietnam datetime handling"""
import datetime
from zoneinfo import ZoneInfo

# Vietnam timezone
VIETNAM_TZ = ZoneInfo("Asia/Ho_Chi_Minh")

def get_vietnam_now() -> datetime.datetime:
    """Get current datetime in Vietnam timezone (Asia/Ho_Chi_Minh)"""
    return datetime.datetime.now(VIETNAM_TZ)

def get_vietnam_now_naive() -> datetime.datetime:
    """Get current datetime in Vietnam timezone as naive datetime (without tzinfo)"""
    return get_vietnam_now().replace(tzinfo=None)
