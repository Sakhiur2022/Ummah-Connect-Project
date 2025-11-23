# Mahram System Implementation Guide

## Overview
The mahram system is an Islamic relationship verification feature that protects female user profiles from unwanted access by enforcing gender-based access controls and requiring mahram (guardian) relationships for cross-gender profile viewing.

## Architecture

### Database Schema

#### New Users Table Columns
```sql
gender TEXT CHECK (gender IN ('male', 'female'))
allow_mahram_requests_from_strangers BOOLEAN DEFAULT TRUE
```

#### MAHRAM Table Structure
```sql
mahram_id UUID PRIMARY KEY
user_id UUID (requester)
related_user_id UUID (target)
relation_id SMALLINT (foreign key to MAHRAM_RELATION_TYPE)
approved BOOLEAN DEFAULT FALSE
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### Key RPC Functions

#### 1. `can_send_mahram_request(requester_id, target_id)`
**Purpose**: Validates if a mahram request can be sent
**Checks**:
- Different genders required
- Target allows requests from strangers
- No existing request already
- Cooldown enforcement (1 request per 7 days max)

**Returns**:
```json
{
  "can_send": boolean,
  "reason": string
}
```

#### 2. `can_view_profile(viewer_id, profile_owner_id)`
**Purpose**: Determines if a user can view another user's profile
**Rules**:
- Same gender users can always view each other
- Own profile always viewable
- Cross-gender viewing requires approved mahram
- Female users can view male profiles without mahram
- Male users cannot view female profiles without approved mahram

**Returns**:
```json
{
  "can_view": boolean,
  "reason": string
}
```

#### 3. `send_mahram_request(requester_id, target_id)`
**Purpose**: Creates a new mahram request
**Process**:
1. Validates request using `can_send_mahram_request`
2. Inserts into MAHRAM table with approved=FALSE
3. Triggers notification creation

**Returns**:
```json
{
  "success": boolean,
  "message": string,
  "mahram_id": UUID
}
```

#### 4. `approve_mahram_request(mahram_id, relation_id)`
**Purpose**: Female user approves mahram request and selects relation type
**Process**:
1. Sets approved=TRUE
2. Sets relation_id to selected type
3. Triggers approval notification

**Returns**:
```json
{
  "success": boolean,
  "message": string
}
```

#### 5. `reject_mahram_request(mahram_id)`
**Purpose**: Female user rejects mahram request
**Process**:
1. Deletes the mahram record

**Returns**:
```json
{
  "success": boolean,
  "message": string
}
```

#### 6. `get_mahram_status(user_a, user_b)`
**Purpose**: Checks mahram relationship between two users
**Returns**:
```json
{
  "status": "none" | "pending" | "approved",
  "approved": boolean,
  "relation_type": string | null
}
```

### Triggers

#### `trigger_notify_mahram_request`
- **Event**: After INSERT on MAHRAM with approved=FALSE
- **Action**: Creates notification for target user
- **Verb**: 'mahram_request'
- **Data**: Includes requester name, username, and profile image

#### `trigger_notify_mahram_approved`
- **Event**: After UPDATE on MAHRAM when approved changes from FALSE to TRUE
- **Action**: Creates notification for requester
- **Verb**: 'mahram_approved'
- **Data**: Includes approver name, username, and relation type

## Frontend Implementation

### Components

#### 1. `mahram-access-modal.tsx`
**Location**: `components/profile/mahram-access-modal.tsx`
**Purpose**: Displays when cross-gender users try to view protected profiles
**Features**:
- Shows Islamic context (Quran 24:31 reference)
- "Send Mahram Request" button
- "Go Back" button
- Error message display
- Loading states

#### 2. `mahram-notification.tsx`
**Location**: `components/profile/mahram-notification.tsx`
**Purpose**: Handles mahram request notifications in notification center
**Features**:
- Displays requester information
- Relation type dropdown selector
- Approve/Reject buttons
- Sends RPC calls to backend
- Refreshes notification list on action

#### 3. Updated `profile-header.tsx`
**Features Added**:
- "Share Profile" button (visible only on own profile)
- Copies profile link to clipboard
- Share2 icon from lucide-react

#### 4. Updated `app/profile/[username]/page.tsx`
**Features Added**:
- Server-side access control check using `can_view_profile` RPC
- Shows `MahramAccessModal` if user lacks permission
- Passes profile owner info to modal

#### 5. Updated `NotificationCenter.tsx`
**Features Added**:
- Mahram request notification rendering
- Uses `MahramNotification` component
- Displays in notification center
- Separate handling from friend requests

## Implementation Steps

### Step 1: Database Setup
Execute `scripts/mahram_system.sql` in Supabase SQL Editor:
1. Adds gender and privacy columns to users table
2. Creates trigger functions for notifications
3. Creates all RPC functions

### Step 2: User Configuration
Users must set:
- Gender (male/female) - via settings page (not yet implemented)
- `allow_mahram_requests_from_strangers` (defaults to TRUE)

### Step 3: Profile Access Control
When visiting a profile, the system:
1. Checks if viewer is the profile owner (allowed)
2. Checks if same gender (allowed)
3. If cross-gender:
   - For female viewer: Always allowed
   - For male viewer: Requires approved mahram

### Step 4: Mahram Request Flow
1. Male user tries to view female profile
2. `MahramAccessModal` appears
3. User clicks "Send Mahram Request"
4. Request stored in MAHRAM table with approved=FALSE
5. Female user receives notification
6. Female user opens `MahramNotification`
7. Female user selects relation type and approves
8. Approval notification sent to male user
9. Male user can now view profile

## Cooldown System

### Implementation
- Enforced in `can_send_mahram_request` function
- One request per requester-target pair per 7 days
- Checked against `created_at` timestamp

### User Feedback
- Error message: "You can only send one mahram request per 7 days"

## Privacy Settings

### Current Settings
- `allow_mahram_requests_from_strangers` (BOOLEAN, DEFAULT TRUE)

### Future Enhancement
- Users can restrict mahram requests to friends only
- Users can disable mahram feature entirely

## Relation Types

Available mahram relations defined in `MAHRAM_RELATION_TYPE`:
1. Father
2. Mother
3. Brother
4. Sister
5. Son
6. Daughter
7. Grandfather
8. Grandmother
9. Grandson
10. Granddaughter
11. Uncle
12. Aunt
13. Nephew
14. Niece
15. Husband
16. Wife

## Security Considerations

### Row Level Security (RLS)
RPC functions use `SECURITY DEFINER` to:
- Allow users to check other users' gender
- Prevent direct table access
- Enforce business logic at database level

### Anti-Spam Measures
1. Cooldown system (1 request per 7 days)
2. Privacy settings to reject requests
3. Request deletion on rejection

### Data Privacy
- Profile images not exposed without access
- Gender only visible to friends/mahram
- Requests stored with timestamps for audit

## Testing Checklist

- [ ] Create two test accounts (male and female)
- [ ] Set genders on both accounts
- [ ] Male tries to view female profile → Should see modal
- [ ] Male clicks "Send Mahram Request" → Request stored
- [ ] Female receives notification → Notification appears
- [ ] Female opens notification → Relation dropdown visible
- [ ] Female selects relation and approves → Mahram approved
- [ ] Male receives approval notification → Notification appears
- [ ] Male revisits female profile → Profile loads normally
- [ ] Male sends second request immediately → Cooldown error
- [ ] Wait 7 days (or modify timestamp) → Second request allowed
- [ ] Female can view male profiles without approval
- [ ] Same-gender profiles always viewable
- [ ] Share profile button visible on own profile only
- [ ] Share profile button copies URL to clipboard

## Troubleshooting

### "Profile is protected" always shows
**Solution**: Check that `can_view_profile` RPC exists in database

### Notification not appearing
**Solution**: Verify `notify_mahram_request` trigger fired after INSERT

### Request rejected with cooldown error
**Solution**: This is working as intended. Edit MAHRAM timestamp to test multiple requests.

### Relation dropdown empty
**Solution**: Ensure `MAHRAM_RELATION_TYPE` table is populated with relation definitions

## Future Enhancements

1. **Admin Dashboard**: View all mahram relationships and audit logs
2. **Mahram Expiration**: Set expiration dates for mahram relationships
3. **Batch Mahram**: Multiple children can have same mahram
4. **Privacy Levels**: 0 = Public, 1 = Friends, 2 = Mahram only
5. **Mahram Search**: Find compatible mahram by relation type
6. **Notification Preferences**: Users customize when they receive mahram notifications
7. **Islamic Calendar Events**: Special privacy during Ramadan/Hajj
8. **Family Groups**: Manage multiple mahram relationships as a group
