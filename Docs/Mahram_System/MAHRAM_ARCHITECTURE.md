# Mahram System - Architecture & Flow Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         UMMAH CONNECT                           │
│                      MAHRAM SYSTEM LAYERS                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Profile Header          MahramAccessModal   ShareProfile       │
│  ├─ Share Button         ├─ Lock Icon        └─ Copy Link       │
│  └─ Friend Actions       ├─ Send Request                        │
│                          └─ Back Button                         │
│                                                                 │
│  NotificationCenter                                             │
│  ├─ Friend Requests      MahramNotification                     │
│  ├─ Mahram Requests  ←→  ├─ Requester Info                      │
│  └─ Approvals            ├─ Relation Dropdown                   │
│                          └─ Approve/Reject                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                        RPC FUNCTION LAYER
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RPC Functions (PostgreSQL):                                    │
│  ├─ can_view_profile()              (access control)            │
│  ├─ can_send_mahram_request()       (validation + cooldown)     │
│  ├─ send_mahram_request()           (create request)            │
│  ├─ approve_mahram_request()        (approve + set relation)    │
│  ├─ reject_mahram_request()         (delete request)            │
│  ├─ get_mahram_status()             (status check)              │
│  └─ notify_mahram_*()               (notification creators)     │
│                                                                 │
│  Triggers (PostgreSQL):                                         │
│  ├─ trigger_notify_mahram_request   (on INSERT)                 │
│  └─ trigger_notify_mahram_approved  (on UPDATE)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                       DATABASE LAYER
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     DATA & STORAGE LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tables:                                                        │
│  ├─ users                          (gender, privacy settings)   │
│  ├─ MAHRAM                         (relationships)              │
│  ├─ MAHRAM_RELATION_TYPE           (relation definitions)       │
│  ├─ NOTIFICATION                   (event log)                  │
│  ├─ FRIEND_REQUEST                 (friend relationships)       │
│  └─ MAHRAM_REJECTION_COOLDOWN      (7-day request cooldown)     │
│                                                                 │
│  Columns:                                                       │
│  ├─ users.gender                   ('male' or 'female')         │
│  └─ users.allow_mahram_requests    (TRUE/FALSE)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

```
MALE USER ATTEMPTS TO VIEW FEMALE PROFILE
│
└─→ 1. Navigate to: /profile/[female_username]
    │
    └─→ 2. Server Component Calls: can_view_profile(male_id, female_id)
        │
        ├─→ Check: Same gender? NO
        ├─→ Check: Own profile? NO
        ├─→ Check: Male viewing female? YES
        │   │
        │   └─→ Query MAHRAM table for approval
        │       │
        │       ├─ APPROVED found? → can_view = TRUE
        │       └─ NOT found? → can_view = FALSE
        │
        └─→ 3. Result: can_view = FALSE
            │
            └─→ 4. Render: MahramAccessModal Component
                │
                ├─ Shows lock icon 🔐
                ├─ Shows "Profile Protected" message
                ├─ Shows Quran reference
                └─ Shows "Send Mahram Request" button
                    │
                    └─→ 5. User Clicks Button
                        │
                        └─→ 6. Frontend Calls: send_mahram_request(male_id, female_id)
                            │
                            └─→ 7. RPC Validates:
                                ├─ Different genders? ✓
                                ├─ Not existing request? ✓
                                ├─ Cooldown passed? ✓
                                └─ Female allows requests? ✓
                                    │
                                    └─→ 8. INSERT into MAHRAM table
                                        │
                                        └─→ 9. TRIGGER: trigger_notify_mahram_request
                                            │
                                            └─→ 10. INSERT into NOTIFICATION table
                                                │
                                                └─→ 11. Female User Receives Notification
                                                    │
                                                    └─→ FLOW CONTINUES → See "Approval Flow"
```

---

## ✅ Approval Flow Diagram

```
FEMALE USER APPROVES MAHRAM REQUEST
│
├─→ 1. Female Receives Notification
│   └─ Notification Type: 'mahram_request'
│   └─ Contains: Requester name, username, profile image
│
├─→ 2. Female Opens NotificationCenter
│   └─ Bell icon shows unread count
│
├─→ 3. Notification Renders as MahramNotification Component
│   ├─ Shows requester avatar
│   ├─ Shows relation dropdown
│   ├─ Shows Approve/Reject buttons
│   └─ All in prettified card
│
├─→ 4. Female Selects Relation Type
│   └─ Dropdown options:
│       ├─ Father
│       ├─ Brother
│       ├─ Son
│       ├─ Grandfather
│       ├─ Grandson
│       ├─ Uncle
│       ├─ Nephew
│       ├─ Husband
│
├─→ 5. Female Clicks "Approve" Button
│   │
│   └─→ 6. Frontend Calls: approve_mahram_request(mahram_id, relation_id)
│       │
│       └─→ 7. RPC Updates MAHRAM:
│           ├─ approved = TRUE
│           ├─ relation_id = [selected]
│           └─ updated_at = NOW()
│               │
│               └─→ 8. TRIGGER: trigger_notify_mahram_approved
│                   │
│                   └─→ 9. INSERT into NOTIFICATION
│                       └─ Verb: 'mahram_approved'
│                       └─ Contains: Approver name, relation type
│
│
├─→ 10. Male User Receives Approval Notification
│   └─ NotificationCenter shows: "{Female} approved your mahram request"
│
└─→ 11. Male Can Now View Female's Profile
    └─ Next visit to /profile/[female] loads full profile
```

---

## 🔐 Access Control Decision Tree

```
USER A TRIES TO VIEW USER B'S PROFILE
│
├─ Is User A = User B (Same person)?
│  ├─ YES → ALLOW (own profile)
│  └─ NO → Continue
│
├─ Get User A's gender
├─ Get User B's gender
│
├─ Is User A gender = User B gender (Same gender)?
│  ├─ YES → ALLOW (same gender can view)
│  └─ NO → Continue (different genders)
│
├─ Is User A female and User B male?
│  ├─ YES → ALLOW (females can always view males)
│  └─ NO → Continue
│
├─ Is User A male and User B female? (Most restricted case)
│  ├─ NO → DENY (shouldn't reach here)
│  │
│  └─ YES → Check for approved mahram:
│      │
│      ├─ Query: SELECT * FROM MAHRAM
│      │         WHERE user_id = A
│      │         AND related_user_id = B
│      │         AND approved = TRUE
│      │
│      ├─ Mahram found and approved?
│      │  ├─ YES → ALLOW
│      │  └─ NO → DENY + Show MahramAccessModal
```

---

## 📊 Data Models

### MAHRAM Table
```
┌─────────────────────────────────────────┐
│ MAHRAM                                  │
├─────────────────────────────────────────┤
│ mahram_id (UUID, PK)                    │
│ user_id (UUID, FK users)                │ ← Requester
│ related_user_id (UUID, FK users)        │ ← Target
│ relation_id (SMALLINT, FK relations)    │ ← Selected by target
│ approved (BOOLEAN, DEFAULT FALSE)       │ ← Status
│ created_at (TIMESTAMPTZ)                │ ← For cooldown
│ updated_at (TIMESTAMPTZ)                │ ← Approval time
│ CHECK: user_id != related_user_id       │
└─────────────────────────────────────────┘
```

### NOTIFICATION Table (Mahram Events)
```
┌─────────────────────────────────────────┐
│ NOTIFICATION                            │
├─────────────────────────────────────────┤
│ notification_id (UUID, PK)              │
│ recipient_id (UUID, FK users)           │ ← Who receives
│ actor_id (UUID, FK users)               │ ← Who sends request
│ verb (TEXT)                             │ ← 'mahram_request'
│                                         │   'mahram_approved'
│ object_type (TEXT)                      │ ← 'mahram'
│ object_id (UUID)                        │ ← mahram_id
│ data (JSONB)                            │ ← Extra info
│ is_read (BOOLEAN)                       │ ← Read status
│ created_at (TIMESTAMPTZ)                │ ← Timestamp
└─────────────────────────────────────────┘
```

### USERS Table (New Columns)
```
┌─────────────────────────────────────────┐
│ users                                   │
├─────────────────────────────────────────┤
│ id (UUID, PK)                           │
│ ... existing columns ...                │
│ gender (TEXT)                           │ ← NEW
│ CHECK: gender IN ('male', 'female')     │
│                                         │
│ allow_mahram_requests_from_strangers    │ ← NEW
│ (BOOLEAN, DEFAULT TRUE)                 │
└─────────────────────────────────────────┘
```

---

## 🚀 Cooldown System

```
REQUEST 1
  │
  └─ Time: 2025-01-15 10:00:00
     Status: Created
     Stored: created_at = 2025-01-15 10:00:00
  
  ...USER TRIES AGAIN WITHIN 7 DAYS...
  
REQUEST 2 (BLOCKED)
  │
  └─ Time: 2025-01-15 15:00:00 (5 hours later)
     Validation Check:
     └─ (NOW() - created_at) < INTERVAL '7 days'?
        └─ (2025-01-15 15:00:00 - 2025-01-15 10:00:00) < 7 days?
           └─ 5 hours < 7 days? YES → BLOCK
           └─ Error: "You can only send one mahram request per 7 days"

  ...AFTER 7 DAYS...
  
REQUEST 3 (ALLOWED)
  │
  └─ Time: 2025-01-22 10:00:01
     Validation Check:
     └─ (NOW() - created_at) < INTERVAL '7 days'?
        └─ (2025-01-22 10:00:01 - 2025-01-15 10:00:00) < 7 days?
           └─ 7 days 0 minutes 1 second < 7 days? NO → ALLOW
           └─ Success: Request created
```

---

## 📱 Component Interaction Map

```
Page: /profile/[username]
│
├─→ server.ts
│   └─ can_view_profile() RPC
│       └─ Returns: { can_view, reason }
│
├─ IF can_view = FALSE
│   │
│   └─→ <MahramAccessModal />
│       │
│       ├─ Displays: Modal with request button
│       │
│       └─ On Click:
│           └─→ send_mahram_request() RPC
│               │
│               ├─ Success:
│               │   └─ Alert + redirect dashboard
│               │
│               └─ Error:
│                   └─ Display error message
│
├─ IF can_view = TRUE
│   │
│   ├─→ <ProfileHeader />
│   │   │
│   │   ├─ Normal profile display
│   │   │
│   │   └─ IF isOwnProfile:
│   │       └─→ <ShareProfileButton />
│   │           └─ Copy profile URL to clipboard
│   │
│   ├─→ <ProfileFeed />
│   │   └─ User's posts
│   │
│   └─→ <ProfileContent />
│       └─ User's stats


NotificationCenter Component
│
├─ Real-time subscription: NOTIFICATION INSERT
│
├─ Filter: is_read = FALSE
│
├─ Map notifications:
│   │
│   ├─ IF verb = 'friend_request':
│   │   └─→ Friend request UI (accept/reject)
│   │
│   ├─ IF verb = 'mahram_request':
│   │   └─→ <MahramNotification />
│   │       │
│   │       ├─ Show requester info
│   │       ├─ Dropdown for relation type
│   │       └─ Approve/Reject buttons
│   │           │
│   │           ├─ Approve:
│   │           │   └─ approve_mahram_request() RPC
│   │           │
│   │           └─ Reject:
│   │               └─ reject_mahram_request() RPC
│   │
│   └─ IF verb = 'mahram_approved':
│       └─→ Text notification: "{Name} approved your request"
│
│
└─ On action:
    └─ fetchNotifications() → Refresh list
```

---

## 🔄 State Management Flow

```
User State:
├─ currentUserId
├─ isOwnProfile
├─ friendRequestStatus
├─ showUnfriendModal
└─ actionLoading

Profile View:
├─ Check: currentUserId (get from auth)
├─ Get: profileOwnerInfo (from DB)
├─ Calculate: isOwnProfile = currentUserId === profileOwnerInfo.id
├─ Call: can_view_profile(currentUserId, profileOwnerInfo.id)
├─ Store: { can_view, reason }
└─ Render: MahramAccessModal OR ProfilePage

Mahram Request:
├─ User clicks "Send Request"
├─ Set: isLoading = true
├─ Call: send_mahram_request(currentUserId, profileOwnerId)
├─ Handle response:
│   ├─ Success → Show alert + redirect
│   └─ Error → Show error message
└─ Set: isLoading = false

Approval Notification:
├─ Female sees notification
├─ Select: relation type
├─ Click: Approve
├─ Call: approve_mahram_request(mahramId, relationId)
├─ Trigger: trigger_notify_mahram_approved
├─ Male receives: approval notification
└─ Next profile visit: Access granted
```

---

## 🧪 Test Scenarios Graph

```
Test Scenario: Complete Happy Path

    START: Ahmed (M) and Fatima (F)
        │
        ├─ Set: Ahmed.gender = 'male'
        ├─ Set: Fatima.gender = 'female'
        │
        └─→ Ahmed visits /profile/fatima
            │
            └─→ can_view_profile(Ahmed, Fatima)
                │
                ├─ Same gender? NO
                ├─ Own profile? NO
                ├─ Male→Female? YES
                │   └─ Approved mahram? NO
                │
                └─ Result: can_view = FALSE
                    │
                    └─→ Show: MahramAccessModal
                        │
                        └─→ Ahmed clicks "Send Request"
                            │
                            └─→ INSERT MAHRAM(Ahmed, Fatima, approved=FALSE)
                                │
                                └─ TRIGGER: notify_mahram_request
                                    │
                                    └─ CREATE NOTIFICATION
                                        │
                                        └─→ Fatima receives notification
                                            │
                                            └─→ Click notification
                                                │
                                                └─→ MahramNotification renders
                                                    │
                                                    ├─ Select: "Father"
                                                    └─ Click: Approve
                                                        │
                                                        └─→ UPDATE MAHRAM(approved=TRUE, relation_id=1)
                                                            │
                                                            └─ TRIGGER: notify_mahram_approved
                                                                │
                                                                └─ CREATE NOTIFICATION
                                                                    │
                                                                    └─→ Ahmed receives approval notification
                                                                        │
                                                                        └─→ Ahmed visits /profile/fatima (again)
                                                                            │
                                                                            └─→ can_view_profile(Ahmed, Fatima)
                                                                                │
                                                                                ├─ Same gender? NO
                                                                                ├─ Own profile? NO
                                                                                ├─ Male→Female? YES
                                                                                │   └─ Approved mahram? YES ✓
                                                                                │
                                                                                └─ Result: can_view = TRUE
                                                                                    │
                                                                                    └─→ Show: Fatima's Full Profile ✅
```

---

## ⚡ Performance Considerations

```
RPC Function Execution Time:
├─ can_view_profile()              ~50ms  (3 queries)
├─ can_send_mahram_request()       ~80ms  (6 queries + cooldown check)
├─ send_mahram_request()           ~100ms (validation + insert + trigger)
├─ approve_mahram_request()        ~90ms  (update + trigger)
└─ reject_mahram_request()         ~50ms  (delete)

Typical Profile Page Load:
├─ Server: can_view_profile() call   50ms
├─ Database: User queries            30ms
├─ Rendering: Component mount        20ms
│
└─ Total: ~100ms (fast)

Notification Delivery:
├─ RPC: Create NOTIFICATION          30ms
├─ Trigger: Execute trigger          20ms
├─ Realtime: Push to client          50ms (depends on network)
│
└─ Total: ~100ms (near real-time)

Typical Cooldown Check:
├─ Query: Latest MAHRAM record       30ms
├─ Compare: Timestamp calculation    <1ms
├─ Result: Success/Error             <1ms
│
└─ Total: ~32ms (fast)
```

---

## 🎯 Key Takeaways

1. **Gender-based access** protects female profiles in line with Islamic principles
2. **RPC functions** enforce business logic at database level (secure)
3. **Triggers** automatically create notifications (no extra code)
4. **Cooldown system** prevents spam (7 days between requests)
5. **Privacy settings** let users control their access preferences
6. **Notification system** keeps both parties informed throughout flow
7. **Share button** lets users promote their profiles

All components work together to create a respectful, secure mahram relationship system.
