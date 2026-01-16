#!/usr/bin/env python3
"""
NEET HUB.AI Backend API Testing Suite
Tests all backend APIs systematically according to the review request.
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://aimedprep.preview.emergentagent.com/api"
TIMEOUT = 30  # seconds for AI endpoints

class NEETHubAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_user_id = None
        self.results = {
            "passed": [],
            "failed": [],
            "warnings": []
        }
    
    def log_result(self, test_name: str, success: bool, details: str, warning: bool = False):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        
        if warning:
            self.results["warnings"].append(result)
        elif success:
            self.results["passed"].append(result)
        else:
            self.results["failed"].append(result)
        
        status = "⚠️ WARNING" if warning else ("✅ PASS" if success else "❌ FAIL")
        print(f"{status} {test_name}: {details}")
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, timeout: int = 10) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, timeout=timeout)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, timeout=timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except requests.exceptions.Timeout:
            return {"status_code": 408, "data": {"error": "Request timeout"}, "success": False}
        except requests.exceptions.ConnectionError:
            return {"status_code": 503, "data": {"error": "Connection error"}, "success": False}
        except Exception as e:
            return {"status_code": 500, "data": {"error": str(e)}, "success": False}
    
    def test_user_registration(self):
        """Test 1: User Registration (POST /api/users)"""
        test_data = {
            "name": "Test Student",
            "email": "test@student.com",
            "prepLevel": "class12"
        }
        
        result = self.make_request("POST", "/users", test_data)
        
        if result["success"]:
            user_data = result["data"]
            if "id" in user_data and "name" in user_data and "email" in user_data:
                self.test_user_id = user_data["id"]
                self.log_result(
                    "User Registration", 
                    True, 
                    f"User created successfully with ID: {self.test_user_id}"
                )
                return True
            else:
                self.log_result(
                    "User Registration", 
                    False, 
                    f"Invalid response structure: {user_data}"
                )
        else:
            self.log_result(
                "User Registration", 
                False, 
                f"HTTP {result['status_code']}: {result['data']}"
            )
        return False
    
    def test_get_user(self):
        """Test 2: Get User (GET /api/users/{user_id})"""
        if not self.test_user_id:
            self.log_result("Get User", False, "No user ID available from registration test")
            return False
        
        result = self.make_request("GET", f"/users/{self.test_user_id}")
        
        if result["success"]:
            user_data = result["data"]
            if user_data.get("id") == self.test_user_id and user_data.get("email") == "test@student.com":
                self.log_result("Get User", True, "User retrieved successfully")
                return True
            else:
                self.log_result("Get User", False, f"User data mismatch: {user_data}")
        else:
            self.log_result("Get User", False, f"HTTP {result['status_code']}: {result['data']}")
        return False
    
    def test_daily_motivation(self):
        """Test 3: Daily Motivation (GET /api/ai/motivation)"""
        result = self.make_request("GET", "/ai/motivation", timeout=TIMEOUT)
        
        if result["success"]:
            data = result["data"]
            if "message" in data and isinstance(data["message"], str) and len(data["message"]) > 0:
                self.log_result(
                    "Daily Motivation", 
                    True, 
                    f"Motivation received: '{data['message'][:50]}...'"
                )
                return True
            else:
                self.log_result("Daily Motivation", False, f"Invalid response format: {data}")
        else:
            # Check if it's a fallback response (should still work)
            if result["status_code"] == 200:
                self.log_result(
                    "Daily Motivation", 
                    True, 
                    "Fallback motivation working", 
                    warning=True
                )
                return True
            else:
                self.log_result("Daily Motivation", False, f"HTTP {result['status_code']}: {result['data']}")
        return False
    
    def test_daily_question(self):
        """Test 4: Daily Question (GET /api/questions/daily)"""
        result = self.make_request("GET", "/questions/daily", timeout=TIMEOUT)
        
        if result["success"]:
            data = result["data"]
            required_fields = ["question", "options", "correctAnswer", "explanation", "subject", "chapter"]
            
            if all(field in data for field in required_fields):
                # Validate structure
                if (isinstance(data["options"], list) and len(data["options"]) == 4 and
                    isinstance(data["correctAnswer"], int) and 0 <= data["correctAnswer"] <= 3):
                    self.log_result(
                        "Daily Question", 
                        True, 
                        f"Question received: {data['subject']} - {data['chapter']}"
                    )
                    return True
                else:
                    self.log_result("Daily Question", False, f"Invalid question structure: {data}")
            else:
                missing = [f for f in required_fields if f not in data]
                self.log_result("Daily Question", False, f"Missing fields: {missing}")
        else:
            self.log_result("Daily Question", False, f"HTTP {result['status_code']}: {result['data']}")
        return False
    
    def test_generate_practice_questions(self):
        """Test 5: Generate Practice Questions (POST /api/questions/generate)"""
        # Test with query parameters as specified in the review request
        endpoint = "/questions/generate?subject=Physics&chapter=Laws of Motion&count=5"
        result = self.make_request("POST", endpoint, timeout=TIMEOUT)
        
        if result["success"]:
            data = result["data"]
            if "questions" in data and isinstance(data["questions"], list):
                questions = data["questions"]
                if len(questions) == 5:
                    # Validate first question structure
                    if questions and all(field in questions[0] for field in 
                                       ["question", "options", "correctAnswer", "explanation", "subject", "chapter"]):
                        self.log_result(
                            "Generate Practice Questions", 
                            True, 
                            f"Generated {len(questions)} questions successfully"
                        )
                        return True
                    else:
                        self.log_result("Generate Practice Questions", False, "Invalid question structure in response")
                else:
                    self.log_result("Generate Practice Questions", False, f"Expected 5 questions, got {len(questions)}")
            else:
                self.log_result("Generate Practice Questions", False, f"Invalid response format: {data}")
        else:
            self.log_result("Generate Practice Questions", False, f"HTTP {result['status_code']}: {result['data']}")
        return False
    
    def test_create_practice_session(self):
        """Test 6: Create Practice Session (POST /api/practice/session)"""
        if not self.test_user_id:
            self.log_result("Create Practice Session", False, "No user ID available")
            return False
        
        session_data = {
            "userId": self.test_user_id,
            "subject": "Physics",
            "chapter": "Laws of Motion",
            "questionsAttempted": 10,
            "questionsCorrect": 7,
            "timeSpent": 600
        }
        
        result = self.make_request("POST", "/practice/session", session_data)
        
        if result["success"]:
            data = result["data"]
            if "id" in data and data.get("userId") == self.test_user_id:
                self.log_result("Create Practice Session", True, f"Session created with ID: {data['id']}")
                return True
            else:
                self.log_result("Create Practice Session", False, f"Invalid response: {data}")
        else:
            self.log_result("Create Practice Session", False, f"HTTP {result['status_code']}: {result['data']}")
        return False
    
    def test_get_practice_sessions(self):
        """Test 7: Get Practice Sessions (GET /api/practice/sessions/{user_id})"""
        if not self.test_user_id:
            self.log_result("Get Practice Sessions", False, "No user ID available")
            return False
        
        result = self.make_request("GET", f"/practice/sessions/{self.test_user_id}")
        
        if result["success"]:
            data = result["data"]
            if isinstance(data, list):
                self.log_result(
                    "Get Practice Sessions", 
                    True, 
                    f"Retrieved {len(data)} practice sessions"
                )
                return True
            else:
                self.log_result("Get Practice Sessions", False, f"Expected list, got: {type(data)}")
        else:
            self.log_result("Get Practice Sessions", False, f"HTTP {result['status_code']}: {result['data']}")
        return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting NEET HUB.AI Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().isoformat()}")
        print("=" * 60)
        
        # Run tests in order
        tests = [
            self.test_user_registration,
            self.test_get_user,
            self.test_daily_motivation,
            self.test_daily_question,
            self.test_generate_practice_questions,
            self.test_create_practice_session,
            self.test_get_practice_sessions
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                test_name = test.__name__.replace("test_", "").replace("_", " ").title()
                self.log_result(test_name, False, f"Test execution error: {str(e)}")
            
            # Small delay between tests
            time.sleep(1)
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results["passed"]) + len(self.results["failed"]) + len(self.results["warnings"])
        passed = len(self.results["passed"])
        failed = len(self.results["failed"])
        warnings = len(self.results["warnings"])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        
        if self.results["failed"]:
            print("\n🔴 FAILED TESTS:")
            for result in self.results["failed"]:
                print(f"  • {result['test']}: {result['details']}")
        
        if self.results["warnings"]:
            print("\n🟡 WARNINGS:")
            for result in self.results["warnings"]:
                print(f"  • {result['test']}: {result['details']}")
        
        if self.results["passed"]:
            print("\n🟢 PASSED TESTS:")
            for result in self.results["passed"]:
                print(f"  • {result['test']}: {result['details']}")
        
        success_rate = (passed / total_tests * 100) if total_tests > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        print(f"⏰ Completed at: {datetime.now().isoformat()}")


if __name__ == "__main__":
    tester = NEETHubAPITester()
    tester.run_all_tests()