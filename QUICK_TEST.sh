#!/bin/bash

# Quick Test Script for CA Firm Management System
# This script tests the signup and login features

API_URL="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing CA Firm Management System${NC}"
echo "=================================="

# Check if backend is running
echo -e "\n${BLUE}Checking if backend is running...${NC}"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo -e "${YELLOW}Please start the backend first:${NC}"
    echo "  cd backend && npm run dev"
    exit 1
fi

# Test 1: Signup
echo -e "\n${BLUE}Test 1: Testing Signup Feature...${NC}"
SIGNUP_EMAIL="testca$(date +%s)@example.com"
SIGNUP_RESPONSE=$(curl -s -X POST "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test CA User\",
    \"email\": \"${SIGNUP_EMAIL}\",
    \"password\": \"testpass123\",
    \"phone\": \"+91-9876543210\"
  }")

if echo "$SIGNUP_RESPONSE" | grep -q '"token"'; then
    echo -e "${GREEN}✅ Signup successful${NC}"
    SIGNUP_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "   Email: ${SIGNUP_EMAIL}"
else
    echo -e "${RED}❌ Signup failed${NC}"
    echo "Response: $SIGNUP_RESPONSE"
    SIGNUP_TOKEN=""
fi

# Test 2: Duplicate Email
echo -e "\n${BLUE}Test 2: Testing Duplicate Email Validation...${NC}"
if [ ! -z "$SIGNUP_TOKEN" ]; then
    DUPLICATE_RESPONSE=$(curl -s -X POST "${API_URL}/auth/signup" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Another User\",
        \"email\": \"${SIGNUP_EMAIL}\",
        \"password\": \"testpass123\"
      }")
    
    if echo "$DUPLICATE_RESPONSE" | grep -q "already exists"; then
        echo -e "${GREEN}✅ Duplicate email correctly rejected${NC}"
    else
        echo -e "${RED}❌ Duplicate email validation failed${NC}"
        echo "Response: $DUPLICATE_RESPONSE"
    fi
fi

# Test 3: Login with test user
echo -e "\n${BLUE}Test 3: Testing Login Feature...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ramesh@cafirm.com",
    "password": "password123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
    echo -e "${GREEN}✅ Login successful${NC}"
    LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    USER_NAME=$(echo "$LOGIN_RESPONSE" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
    USER_ROLE=$(echo "$LOGIN_RESPONSE" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
    echo "   User: $USER_NAME ($USER_ROLE)"
else
    echo -e "${YELLOW}⚠️  Login failed - test user may not exist${NC}"
    echo "   Run: cd backend && node scripts/create-first-user.js \"Ramesh Kumar\" \"ramesh@cafirm.com\" \"password123\""
    LOGIN_TOKEN=""
fi

# Test 4: Get Current User
if [ ! -z "$LOGIN_TOKEN" ]; then
    echo -e "\n${BLUE}Test 4: Testing Get Current User...${NC}"
    ME_RESPONSE=$(curl -s -X GET "${API_URL}/auth/me" \
      -H "Authorization: Bearer ${LOGIN_TOKEN}")
    
    if echo "$ME_RESPONSE" | grep -q '"email"'; then
        echo -e "${GREEN}✅ Get current user successful${NC}"
    else
        echo -e "${RED}❌ Get current user failed${NC}"
        echo "Response: $ME_RESPONSE"
    fi
fi

# Test 5: Dashboard
if [ ! -z "$LOGIN_TOKEN" ]; then
    echo -e "\n${BLUE}Test 5: Testing Dashboard API...${NC}"
    DASHBOARD_RESPONSE=$(curl -s -X GET "${API_URL}/dashboard" \
      -H "Authorization: Bearer ${LOGIN_TOKEN}")
    
    if echo "$DASHBOARD_RESPONSE" | grep -q '"metrics"'; then
        echo -e "${GREEN}✅ Dashboard API working${NC}"
    else
        echo -e "${RED}❌ Dashboard API failed${NC}"
        echo "Response: $DASHBOARD_RESPONSE"
    fi
fi

# Test 6: Clients
if [ ! -z "$LOGIN_TOKEN" ]; then
    echo -e "\n${BLUE}Test 6: Testing Clients API...${NC}"
    CLIENTS_RESPONSE=$(curl -s -X GET "${API_URL}/clients" \
      -H "Authorization: Bearer ${LOGIN_TOKEN}")
    
    if echo "$CLIENTS_RESPONSE" | grep -q '\['; then
        echo -e "${GREEN}✅ Clients API working${NC}"
    else
        echo -e "${RED}❌ Clients API failed${NC}"
    fi
fi

# Test 7: Firms
if [ ! -z "$LOGIN_TOKEN" ]; then
    echo -e "\n${BLUE}Test 7: Testing Firms API...${NC}"
    FIRMS_RESPONSE=$(curl -s -X GET "${API_URL}/firms" \
      -H "Authorization: Bearer ${LOGIN_TOKEN}")
    
    if echo "$FIRMS_RESPONSE" | grep -q '\['; then
        echo -e "${GREEN}✅ Firms API working${NC}"
    else
        echo -e "${RED}❌ Firms API failed${NC}"
    fi
fi

echo -e "\n${BLUE}=================================="
echo -e "✅ Testing Complete!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Test web UI at http://localhost:3000"
echo "2. Test signup page at http://localhost:3000/auth/signup"
echo "3. Test login page at http://localhost:3000/auth/login"

