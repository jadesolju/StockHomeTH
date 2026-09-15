import unittest
import pytest
from main import format_ticker_with_country, COUNTRY_SUFFIX


class TestFormatTickerWithCountry(unittest.TestCase):
    def test_default_country_is_us(self):
        """Test default country parameter defaults to 'us' with no suffix."""
        self.assertEqual(format_ticker_with_country("AAPL"), "AAPL")
        self.assertEqual(format_ticker_with_country("nvda"), "NVDA")

    def test_supported_countries(self):
        """Test format_ticker_with_country for all supported countries in COUNTRY_SUFFIX."""
        expected_results = {
            "th": "PTT.BK",
            "us": "AAPL",
            "jp": "7203.T",
            "hk": "0700.HK",
            "uk": "VOD.L",
            "sg": "D05.SI",
        }
        sample_tickers = {
            "th": "PTT",
            "us": "AAPL",
            "jp": "7203",
            "hk": "0700",
            "uk": "VOD",
            "sg": "D05",
        }
        for country, ticker in sample_tickers.items():
            result = format_ticker_with_country(ticker, country)
            self.assertEqual(
                result,
                expected_results[country],
                f"Failed for country: {country}",
            )

    def test_case_and_whitespace_normalization(self):
        """Test that ticker and country parameters are stripped and normalized to proper case."""
        self.assertEqual(format_ticker_with_country("  ptt  ", "th"), "PTT.BK")
        self.assertEqual(format_ticker_with_country("aapl", "US"), "AAPL")
        self.assertEqual(format_ticker_with_country("  7203 ", "Jp"), "7203.T")
        self.assertEqual(format_ticker_with_country("0700", "Hk"), "0700.HK")

    def test_ticker_with_existing_dot_or_carat(self):
        """Test that tickers already containing '.' or '^' are returned without appending country suffix."""
        # Ticker already having country suffix
        self.assertEqual(format_ticker_with_country("PTT.BK", "th"), "PTT.BK")
        # Class share ticker with dot
        self.assertEqual(format_ticker_with_country("BRK.B", "us"), "BRK.B")
        self.assertEqual(format_ticker_with_country("BRK.B", "th"), "BRK.B")
        # Market index symbol starting with '^'
        self.assertEqual(format_ticker_with_country("^GSPC", "us"), "^GSPC")
        self.assertEqual(format_ticker_with_country("  ^set.bk  ", "th"), "^SET.BK")

    def test_unsupported_or_unknown_country(self):
        """Test that unknown or empty country codes return upper-case stripped ticker without suffix."""
        self.assertEqual(format_ticker_with_country("AAPL", "unknown"), "AAPL")
        self.assertEqual(format_ticker_with_country("ptt", "de"), "PTT")
        self.assertEqual(format_ticker_with_country("aapl", ""), "AAPL")


@pytest.mark.parametrize(
    "ticker, country, expected",
    [
        ("AAPL", "us", "AAPL"),
        ("ptt", "th", "PTT.BK"),
        ("7203", "jp", "7203.T"),
        ("0700", "hk", "0700.HK"),
        ("vod", "uk", "VOD.L"),
        ("d05", "sg", "D05.SI"),
        ("  nvda  ", "US", "NVDA"),
        ("BRK.B", "us", "BRK.B"),
        ("^GSPC", "us", "^GSPC"),
        ("MSFT", "invalid_country", "MSFT"),
    ],
)
def test_format_ticker_with_country_parametrized(ticker, country, expected):
    """Parametrized test for format_ticker_with_country using pytest."""
    assert format_ticker_with_country(ticker, country) == expected
