#!/usr/bin/env python3
"""
Unit tests for MountVacation MCP Server
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path to import the module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mountvacation_mcp import MountVacationAPI, search_accommodations

class TestMountVacationAPI:
    """Test cases for MountVacationAPI class"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.api = MountVacationAPI()
    
    def test_validate_dates_valid(self):
        """Test date validation with valid dates"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        next_week = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")
        
        result = self.api._MountVacationAPI__validate_dates(tomorrow, next_week)
        assert result == {}
    
    def test_validate_dates_invalid_format(self):
        """Test date validation with invalid format"""
        result = self.api._MountVacationAPI__validate_dates("2024-13-01", "2024-13-08")
        assert "error" in result
        assert "Invalid date format" in result["error"]
    
    def test_validate_dates_past_date(self):
        """Test date validation with past date"""
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        result = self.api._MountVacationAPI__validate_dates(yesterday, tomorrow)
        assert "error" in result
        assert "cannot be in the past" in result["error"]
    
    def test_validate_dates_departure_before_arrival(self):
        """Test date validation with departure before arrival"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        today = datetime.now().strftime("%Y-%m-%d")
        
        result = self.api._MountVacationAPI__validate_dates(tomorrow, today)
        assert "error" in result
        assert "must be after arrival date" in result["error"]
    
    def test_format_results_empty(self):
        """Test result formatting with empty data"""
        data = {
            "accommodations": [],
            "arrival": "2024-06-15",
            "departure": "2024-06-22",
            "nights": 7,
            "personsAges": [18, 18],
            "currency": "EUR"
        }
        
        result = self.api._format_results(data, 5)
        assert "message" in result
        assert "No accommodations found" in result["message"]
        assert result["search_info"]["nights"] == 7
    
    def test_format_results_with_data(self):
        """Test result formatting with accommodation data"""
        data = {
            "accommodations": [
                {
                    "title": "Test Chalet",
                    "city": "Chamonix",
                    "country": "France",
                    "resort": "Chamonix Mont-Blanc",
                    "category": "Chalet",
                    "type": "Apartment",
                    "currency": "EUR",
                    "internetWifi": True,
                    "parking": True,
                    "pets": False,
                    "distResort": 500,
                    "distRuns": 200,
                    "distCentre": 300,
                    "url": "https://example.com/property",
                    "offers": [
                        {
                            "totalPrice": 1400,
                            "beds": 4,
                            "bedrooms": 2,
                            "sizeSqM": 80,
                            "maxPersons": 6,
                            "reservationUrl": "https://example.com/book",
                            "freeCancellationBefore": "2024-06-10",
                            "breakfastIncluded": False
                        }
                    ]
                }
            ],
            "arrival": "2024-06-15",
            "departure": "2024-06-22",
            "nights": 7,
            "personsAges": [18, 18],
            "currency": "EUR"
        }
        
        result = self.api._format_results(data, 5)
        
        assert "accommodations" in result
        assert len(result["accommodations"]) == 1
        
        acc = result["accommodations"][0]
        assert acc["name"] == "Test Chalet"
        assert acc["location"]["city"] == "Chamonix"
        assert acc["pricing"]["total_price"] == 1400
        assert acc["pricing"]["price_per_night"] == 200.0  # 1400 / 7 nights
        assert acc["amenities"]["wifi"] is True
        assert acc["amenities"]["parking"] is True
        assert acc["booking"]["reservation_url"] == "https://example.com/book"
    
    @patch('requests.Session.get')
    def test_make_api_request_success(self, mock_get):
        """Test successful API request"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"accommodations": []}
        mock_get.return_value = mock_response
        
        result = self.api._MountVacationAPI__make_api_request({"city": "Chamonix"})
        
        assert result == {"accommodations": []}
        mock_get.assert_called_once()
    
    @patch('requests.Session.get')
    def test_make_api_request_auth_error(self, mock_get):
        """Test API request with authentication error"""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_get.return_value = mock_response
        
        result = self.api._MountVacationAPI__make_api_request({"city": "Chamonix"})
        
        assert "error" in result
        assert "Authentication failed" in result["error"]
    
    @patch('requests.Session.get')
    def test_make_api_request_rate_limit(self, mock_get):
        """Test API request with rate limit error"""
        mock_response = Mock()
        mock_response.status_code = 429
        mock_get.return_value = mock_response
        
        result = self.api._MountVacationAPI__make_api_request({"city": "Chamonix"})
        
        assert "error" in result
        assert "Rate limit exceeded" in result["error"]
    
    @patch('requests.Session.get')
    def test_make_api_request_timeout(self, mock_get):
        """Test API request timeout"""
        import requests
        mock_get.side_effect = requests.exceptions.Timeout()
        
        result = self.api._MountVacationAPI__make_api_request({"city": "Chamonix"})
        
        assert "error" in result
        assert "timeout" in result["error"].lower()


class TestSearchAccommodationsFunction:
    """Test cases for the main search_accommodations function"""
    
    @patch('mountvacation_mcp.api_client')
    def test_search_accommodations_success(self, mock_api_client):
        """Test successful search"""
        mock_api_client.search_accommodations.return_value = {
            "search_summary": {
                "arrival_date": "2024-06-15",
                "departure_date": "2024-06-22",
                "nights": 7,
                "persons_count": 2,
                "total_found": 1,
                "currency": "EUR"
            },
            "accommodations": [
                {
                    "name": "Test Chalet",
                    "location": {"city": "Chamonix", "country": "France"},
                    "pricing": {"total_price": 1400, "currency": "EUR"}
                }
            ]
        }
        
        result = search_accommodations(
            location="Chamonix",
            arrival_date="2024-06-15",
            departure_date="2024-06-22",
            persons_ages="18,18",
            currency="EUR",
            max_results=5
        )
        
        assert "accommodations" in result
        assert len(result["accommodations"]) == 1
        assert result["accommodations"][0]["name"] == "Test Chalet"
    
    @patch('mountvacation_mcp.api_client')
    def test_search_accommodations_error(self, mock_api_client):
        """Test search with error"""
        mock_api_client.search_accommodations.return_value = {
            "error": "No accommodations found"
        }
        
        result = search_accommodations(
            location="NonExistentPlace",
            arrival_date="2024-06-15",
            departure_date="2024-06-22",
            persons_ages="18,18"
        )
        
        assert "error" in result
        assert "No accommodations found" in result["error"]
    
    @patch('mountvacation_mcp.api_client')
    def test_search_accommodations_exception(self, mock_api_client):
        """Test search with exception"""
        mock_api_client.search_accommodations.side_effect = Exception("Network error")
        
        result = search_accommodations(
            location="Chamonix",
            arrival_date="2024-06-15",
            departure_date="2024-06-22",
            persons_ages="18,18"
        )
        
        assert "error" in result
        assert "Search failed" in result["error"]
    
    def test_max_results_validation(self):
        """Test max_results parameter validation"""
        with patch('mountvacation_mcp.api_client') as mock_api_client:
            mock_api_client.search_accommodations.return_value = {"accommodations": []}
            
            # Test with max_results over limit
            search_accommodations(
                location="Chamonix",
                arrival_date="2024-06-15",
                departure_date="2024-06-22",
                persons_ages="18,18",
                max_results=50  # Over the limit of 20
            )
            
            # Should be called with the limit (20)
            args, kwargs = mock_api_client.search_accommodations.call_args
            assert kwargs["max_results"] == 20


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
