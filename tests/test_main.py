import pytest
from main import format_ticker_with_country

def test_format_ticker_default_country():
    """Test default country parameter defaults to US (no suffix)."""
    assert format_ticker_with_country("aapl") == "AAPL"
    assert format_ticker_with_country("msft") == "MSFT"

def test_format_ticker_supported_countries():
    """Test country suffix formatting for all supported markets."""
    assert format_ticker_with_country("ptt", "th") == "PTT.BK"
    assert format_ticker_with_country("aapl", "us") == "AAPL"
    assert format_ticker_with_country("7203", "jp") == "7203.T"
    assert format_ticker_with_country("0700", "hk") == "0700.HK"
    assert format_ticker_with_country("vod", "uk") == "VOD.L"
    assert format_ticker_with_country("d05", "sg") == "D05.SI"

def test_format_ticker_case_insensitive_country():
    """Test country parameter is case-insensitive."""
    assert format_ticker_with_country("ptt", "TH") == "PTT.BK"
    assert format_ticker_with_country("7203", "Jp") == "7203.T"
    assert format_ticker_with_country("0700", "hK") == "0700.HK"

def test_format_ticker_whitespace_and_casing():
    """Test whitespace trimming and uppercase conversion on ticker symbols."""
    assert format_ticker_with_country("  cpall  ", "th") == "CPALL.BK"
    assert format_ticker_with_country("\tnvda\n", "us") == "NVDA"

def test_format_ticker_with_existing_dot_or_caret():
    """Test tickers that already contain '.' or '^' are returned without adding additional suffixes."""
    assert format_ticker_with_country("PTT.BK", "th") == "PTT.BK"
    assert format_ticker_with_country("AAPL.US", "th") == "AAPL.US"
    assert format_ticker_with_country("^GSPC", "us") == "^GSPC"
    assert format_ticker_with_country("  ^set  ", "th") == "^SET"

def test_format_ticker_unknown_country():
    """Test unknown or unsupported country codes fallback to no suffix."""
    assert format_ticker_with_country("ABC", "xyz") == "ABC"
    assert format_ticker_with_country("XYZ", "unknown") == "XYZ"
