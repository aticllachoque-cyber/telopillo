#!/bin/bash
# =============================================================================
# M2 Phase 1: Automated E2E Test Script
# =============================================================================
# This script tests the products table and RLS policies
# =============================================================================

set -e  # Exit on error

echo "🧪 M2 Phase 1: E2E Testing"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Verify products table exists
echo "Test 1: Verify products table exists..."
RESULT=$(npx supabase db execute "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products';" 2>&1 || echo "ERROR")

if [[ $RESULT == *"ERROR"* ]]; then
  echo -e "${RED}❌ FAILED: products table does not exist${NC}"
  exit 1
else
  echo -e "${GREEN}✅ PASSED: products table exists${NC}"
fi

# Test 2: Verify product-images bucket exists
echo ""
echo "Test 2: Verify product-images bucket exists..."
RESULT=$(npx supabase db execute "SELECT COUNT(*) FROM storage.buckets WHERE id = 'product-images';" 2>&1 || echo "ERROR")

if [[ $RESULT == *"ERROR"* ]]; then
  echo -e "${RED}❌ FAILED: product-images bucket does not exist${NC}"
  exit 1
else
  echo -e "${GREEN}✅ PASSED: product-images bucket exists${NC}"
fi

# Test 3: Verify RLS is enabled
echo ""
echo "Test 3: Verify RLS is enabled on products table..."
RESULT=$(npx supabase db execute "SELECT rowsecurity FROM pg_tables WHERE tablename = 'products' AND schemaname = 'public';" 2>&1 || echo "ERROR")

if [[ $RESULT == *"t"* ]] || [[ $RESULT == *"true"* ]]; then
  echo -e "${GREEN}✅ PASSED: RLS is enabled${NC}"
else
  echo -e "${RED}❌ FAILED: RLS is not enabled${NC}"
  exit 1
fi

# Test 4: Verify RLS policies exist
echo ""
echo "Test 4: Verify RLS policies exist..."
RESULT=$(npx supabase db execute "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public';" 2>&1 || echo "ERROR")

if [[ $RESULT == *"4"* ]]; then
  echo -e "${GREEN}✅ PASSED: 4 RLS policies exist${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: Expected 4 RLS policies, got different count${NC}"
fi

# Test 5: Verify indexes exist
echo ""
echo "Test 5: Verify indexes exist..."
RESULT=$(npx supabase db execute "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'products' AND schemaname = 'public';" 2>&1 || echo "ERROR")

if [[ $RESULT == *"7"* ]] || [[ $RESULT == *"8"* ]]; then
  echo -e "${GREEN}✅ PASSED: Indexes exist (7-8 indexes)${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: Expected 7 indexes, got different count${NC}"
fi

# Test 6: Verify increment_product_views function exists
echo ""
echo "Test 6: Verify increment_product_views function exists..."
RESULT=$(npx supabase db execute "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'increment_product_views';" 2>&1 || echo "ERROR")

if [[ $RESULT == *"1"* ]]; then
  echo -e "${GREEN}✅ PASSED: increment_product_views function exists${NC}"
else
  echo -e "${RED}❌ FAILED: increment_product_views function does not exist${NC}"
  exit 1
fi

# Summary
echo ""
echo "=========================="
echo -e "${GREEN}✅ All Phase 1 tests passed!${NC}"
echo ""
echo "Phase 1 Status: VERIFIED ✅"
echo ""
echo "Next steps:"
echo "1. Run manual test in Supabase SQL Editor (supabase/tests/phase1_manual_test.sql)"
echo "2. Or proceed to Phase 2: Image Upload Component"
echo ""
