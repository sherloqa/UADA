#!/bin/bash

# 🔍 MongoDB Atlas Configuration Verification Script
# Verifies that the project is correctly configured for MongoDB Atlas only

set -e

echo "════════════════════════════════════════════════════════════"
echo "🔍 MongoDB Atlas Configuration Verification"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: .env file exists
echo "1️⃣  Checking .env file..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file found"
else
    echo -e "${RED}✗${NC} .env file not found"
    echo "  Please create .env with MONGODB_URI"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: MONGODB_URI is set
echo ""
echo "2️⃣  Checking MONGODB_URI environment variable..."
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs 2>/dev/null || true)
fi

if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}✗${NC} MONGODB_URI is not set"
    echo "  Please set MONGODB_URI in your .env file"
    ERRORS=$((ERRORS + 1))
else
    MASKED_URI=$(echo "$MONGODB_URI" | sed 's/:[^:]*@/@[MASKED]/g')
    echo -e "${GREEN}✓${NC} MONGODB_URI is set"
    echo "  $MASKED_URI"
fi

# Check 3: MongoDB URI format
echo ""
echo "3️⃣  Checking MongoDB URI format..."
if [[ "$MONGODB_URI" =~ ^mongodb\+srv:// ]]; then
    echo -e "${GREEN}✓${NC} MongoDB Atlas URI format (mongodb+srv://)"
elif [[ "$MONGODB_URI" =~ ^mongodb:// ]]; then
    echo -e "${YELLOW}⚠${NC} Local MongoDB URI format detected (mongodb://)"
    echo "  This project requires MongoDB Atlas (mongodb+srv://)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}✗${NC} Invalid MongoDB URI format"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: No localhost references in config
echo ""
echo "4️⃣  Checking for localhost fallbacks in code..."
LOCALHOST_REFS=$(grep -r "mongodb://localhost" src/ 2>/dev/null || true)
if [ -z "$LOCALHOST_REFS" ]; then
    echo -e "${GREEN}✓${NC} No localhost MongoDB references in src/"
else
    echo -e "${RED}✗${NC} Found localhost references:"
    echo "$LOCALHOST_REFS"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Key files have MONGODB_URI validation
echo ""
echo "5️⃣  Checking for MONGODB_URI validation..."

FILES_TO_CHECK=(
    "src/config/db.ts"
    "src/seed/seedDatabase.ts"
    "seed-mongodb.sh"
    "test-integration.sh"
)

ALL_VALID=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "MONGODB_URI.*required\|MONGODB_URI.*not set" "$file" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $file has MONGODB_URI validation"
        else
            echo -e "${YELLOW}⚠${NC} $file might need MONGODB_URI validation"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done

# Check 6: Try to connect (if mongosh available)
echo ""
echo "6️⃣  Testing MongoDB Atlas connection..."
if command -v mongosh &> /dev/null; then
    if [ -n "$MONGODB_URI" ]; then
        echo "  Attempting connection (this may take a few seconds)..."
        if timeout 10 mongosh "$MONGODB_URI" --eval "console.log('✓ Connected successfully')" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Successfully connected to MongoDB Atlas"
        else
            echo -e "${YELLOW}⚠${NC} Could not connect to MongoDB Atlas"
            echo "  Possible issues:"
            echo "  - Invalid credentials"
            echo "  - IP not whitelisted"
            echo "  - Cluster not running"
            echo "  - Network connectivity issue"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC} mongosh not installed (cannot test connection)"
    echo "  Install mongosh: brew install mongosh (macOS)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 7: npm packages
echo ""
echo "7️⃣  Checking npm dependencies..."
if [ -f "package.json" ]; then
    if grep -q "mongoose" package.json; then
        echo -e "${GREEN}✓${NC} mongoose package present"
    else
        echo -e "${RED}✗${NC} mongoose package missing"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} package.json not found"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "════════════════════════════════════════════════════════════"
echo "📊 Verification Summary"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "✅ MongoDB Atlas Only Configuration: READY"
    echo ""
    echo "Next steps:"
    echo "  1. Install dependencies: npm install"
    echo "  2. Build project: npm run build"
    echo "  3. Seed database: ./seed-mongodb.sh"
    echo "  4. Start API: npm run dev"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Warnings found (but no errors)${NC}"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "You may continue, but review the warnings above."
    exit 0
else
    echo -e "${RED}✗ Errors found${NC}"
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Please fix the errors above before proceeding."
    exit 1
fi
