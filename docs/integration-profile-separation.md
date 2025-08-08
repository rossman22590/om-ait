# Integration Profile Separation Guide

## Overview

This document outlines the critical requirements for preventing cross-contamination between different integration systems (Composio, Pipedream, etc.) that share the same database table for credential profiles.

## Problem Statement

**Issue**: Cross-contamination between Composio and Pipedream profiles caused "broken apps" to appear in the wrong integration sections.

**Root Cause**: The shared `user_mcp_credential_profiles` table stores profiles from different integration systems, but the Pipedream profile service was returning ALL user profiles instead of filtering to only Pipedream-specific profiles.

## MCP Qualified Name Conventions

Different integration systems use distinct naming patterns for profile identification:

- **Composio**: `composio.{toolkit_slug}` (e.g., `composio.github`)
- **Pipedream**: `pipedream:{app_slug}` (e.g., `pipedream:github`)

## Critical Fixes Applied

### 1. Backend Fix: Pipedream Profile Service

**File**: `backend/pipedream/profile_service.py`
**Location**: Lines 311-332 (get_profiles method)

```python
# CRITICAL FIX: Only return Pipedream profiles when no specific app_slug is provided
# This prevents Composio profiles (composio.*) from appearing in Pipedream section
if app_slug:
    mcp_qualified_name = f"pipedream:{app_slug}"
    query = query.eq('mcp_qualified_name', mcp_qualified_name)
else:
    query = query.like('mcp_qualified_name', 'pipedream:%')
```

### 2. Frontend Defensive Filter

**File**: `frontend/src/hooks/react-query/pipedream/utils.ts`
**Location**: Lines 293-318 (getProfiles method)

```typescript
// DEFENSIVE FILTER: Ensure only Pipedream profiles are returned
// This prevents any potential cross-contamination with Composio profiles
const profiles = result.data!;
return profiles.filter(profile => profile.mcp_qualified_name?.startsWith('pipedream:'));
```

## Prevention Guidelines

### For Backend Services

1. **Always Filter by MCP Qualified Name Pattern**
   - When retrieving profiles without a specific identifier, ALWAYS filter by the integration's naming pattern
   - Use `LIKE` queries with the appropriate prefix (e.g., `pipedream:%`, `composio.%`)

2. **Validate Profile Ownership**
   - Before returning profiles, ensure they belong to the requesting integration system
   - Never return profiles from other integration systems

### For Frontend Components

1. **Implement Defensive Filtering**
   - Always filter API responses to ensure only relevant profiles are processed
   - Use `startsWith()` checks on `mcp_qualified_name` field

2. **Type Safety**
   - Ensure TypeScript interfaces match the expected profile structure
   - Add runtime validation for critical fields

### Database Schema Considerations

1. **Naming Convention Enforcement**
   - Consider adding database constraints to enforce naming patterns
   - Use check constraints or triggers to validate `mcp_qualified_name` format

2. **Indexing**
   - Create indexes on `mcp_qualified_name` patterns for efficient filtering
   - Consider partial indexes for each integration type

## Testing Checklist

When adding new integration systems or modifying existing ones:

- [ ] Verify profile creation uses correct `mcp_qualified_name` format
- [ ] Test profile retrieval filters correctly by integration type
- [ ] Ensure no cross-contamination in UI components
- [ ] Validate that "broken apps" don't appear in wrong sections
- [ ] Test both specific and general profile queries

## Code Review Requirements

For any changes to profile services or credential management:

1. **Backend Changes**
   - Verify all profile queries include appropriate filtering
   - Check that no `SELECT *` queries return unfiltered results
   - Ensure new integration types follow naming conventions

2. **Frontend Changes**
   - Confirm defensive filtering is implemented
   - Validate that UI components handle only expected profile types
   - Test error handling for malformed profiles

## Integration-Specific Patterns

### Composio Integration
- **Pattern**: `composio.{toolkit_slug}`
- **Service**: `backend/composio_integration/composio_profile_service.py`
- **Frontend**: Uses proper filtering in credentials API

### Pipedream Integration
- **Pattern**: `pipedream:{app_slug}`
- **Service**: `backend/pipedream/profile_service.py`
- **Frontend**: `frontend/src/hooks/react-query/pipedream/utils.ts`

### Future Integrations

When adding new integration systems:

1. Define a unique `mcp_qualified_name` pattern
2. Implement proper filtering in the service layer
3. Add defensive filtering in frontend API calls
4. Update this documentation with the new pattern
5. Add integration-specific tests

## Monitoring and Alerts

Consider implementing:

- Database queries to detect cross-contamination
- Frontend error tracking for malformed profiles
- Automated tests to verify profile separation
- Alerts for unexpected profile patterns

## Related Files

- `backend/pipedream/profile_service.py` - Primary fix location
- `frontend/src/hooks/react-query/pipedream/utils.ts` - Defensive filtering
- `backend/credentials/api.py` - Reference implementation for Composio
- `backend/composio_integration/composio_profile_service.py` - Composio patterns

---

**Last Updated**: 2025-08-07
**Version**: 1.0
**Status**: Active