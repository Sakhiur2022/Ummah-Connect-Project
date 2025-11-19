# Friend System Implementation Guide

## Overview
The friend system has been successfully implemented for Ummah Connect with full Facebook-style friend request management, mutual friends display, and comprehensive friend listing.

## Features Implemented

### 1. **Add Friend Button (Facebook Style)**
- **Location**: Profile header and friends list sidebar
- **Functionality**: 
  - Users can send friend requests to other users
  - Button states: "Add Friend", "Pending", "Accept", "Friends"
  - Visual icons from lucide-react (UserPlus, UserCheck, Clock, X)

### 2. **Friend Request Management**
The system supports 4 states:
- **not_friends**: No request exists → Show "Add Friend" button
- **pending_sent**: Current user sent request → Show "Pending" with cancel option
- **pending_received**: Other user sent request → Show "Accept" and "Reject" buttons
- **friends**: Accepted request → Show "Friends" button with remove option

### 3. **Mutual Friends Display**
- Shows count of mutual friends between current user and profile user
- Displays up to 5 mutual friend avatars with names
- Shows "+X more" if there are more than 5 mutual friends

### 4. **Friend Request Components**
Located in:
- `components/profile/FriendsList.tsx` - Main friends list with request management
- `components/profile/profile-header.tsx` - Add friend button in header
- `components/profile/profile-content.tsx` - Integration component

## Database Schema

### Friend Request Table
```sql
CREATE TABLE FRIEND_REQUEST (
  id UUID PRIMARY KEY
  sender_id UUID NOT NULL (references users)
  receiver_id UUID NOT NULL (references users)
  status VARCHAR ('pending', 'accepted')
  created_at TIMESTAMP
)
```

### Friend Table (Auto-created)
```sql
CREATE TABLE FRIEND (
  id UUID PRIMARY KEY
  user_a UUID NOT NULL
  user_b UUID NOT NULL
  created_at TIMESTAMP
  UNIQUE(user_a, user_b)
)
```

### Key Database Features
- **Automatic Friend Creation**: When a friend request is accepted, a FRIEND record is automatically created via trigger
- **Friend Normalization**: Ensures user_a < user_b to prevent duplicates
- **Row-Level Security (RLS)**: 
  - Users can only see their own friend relationships
  - Service role can manage friend data

## API Functions Implemented

### FriendsList Component Props
```typescript
interface Props {
  userId: string;           // Profile user's ID
  currentUserId?: string;   // Currently logged-in user's ID
}
```

### FriendsList Component Functions

#### `sendFriendRequest()`
- Inserts a new FRIEND_REQUEST with status 'pending'
- Sender: currentUserId, Receiver: userId
- Updates UI to show "Pending" state

#### `cancelFriendRequest()`
- Deletes the pending friend request
- Transitions back to 'not_friends' state
- Works for outgoing requests

#### `acceptFriendRequest()`
- Updates FRIEND_REQUEST status from 'pending' to 'accepted'
- Triggers automatic FRIEND record creation
- Updates UI to show "Friends" state
- Re-fetches friends list

#### `rejectFriendRequest()`
- Deletes the incoming friend request
- Transitions back to 'not_friends' state
- Used when user rejects someone's request

#### `removeFriend()`
- Updates FRIEND_REQUEST status back to 'pending'
- Deletes associated FRIEND record via trigger
- Transitions to 'not_friends' state

#### `fetchFriends()`
- Fetches all accepted friend requests for the user
- Returns friend profiles with avatar, name, username

#### `fetchMutualFriends()`
- Compares friend lists between current user and profile user
- Returns up to 5 mutual friends with count
- Only computed for other users' profiles

#### `fetchFriendRequestStatus()`
- Checks if a friend request exists between users
- Determines if current user is sender or receiver
- Sets appropriate state

## UI Components

### Profile Header Friend Button
**File**: `components/profile/profile-header.tsx`

Features:
- Renders only on other users' profiles (not own profile)
- Theme-aware styling (light/dark mode)
- Shows appropriate button based on request status
- Located below user's bio for easy visibility
- Action buttons with loading states

Button States:
```
not_friends         → [Add Friend] button
pending_sent        → [⏱ Pending] [✕] buttons
pending_received    → [✓ Accept] [✕] buttons
friends             → [✓ Friends] button
```

### Friends List Sidebar
**File**: `components/profile/FriendsList.tsx`

Sections:
1. **Friend Request Actions** (if not own profile)
   - Add Friend button and related actions
   
2. **Mutual Friends Count**
   - Shows "X mutual friends" text
   - Only if mutual friends exist and not own profile
   
3. **Mutual Friends Preview**
   - Grid of mutual friend avatars
   - Shows first 5 with "+X more" indicator
   - Each friend is clickable (link to profile)
   
4. **Friends Grid**
   - Displays all accepted friends in 2-3 column grid
   - Shows avatar, name, and username
   - Responsive design (changes columns on mobile)
   - Each friend is clickable

### Profile Content Integration
**File**: `components/profile/profile-content.tsx`

- Fetches current user's ID on mount
- Passes userId (profile user) and currentUserId to FriendsList
- Maintains theme consistency with other profile sections

## Styling & Theme Support

### Color Scheme
- **Light Mode**: 
  - Primary button: Blue (#2563EB)
  - Secondary button: Gray
  - Text: Amber-900 for headings
  - Background: White with transparency
  
- **Dark Mode**:
  - Primary button: Blue (same)
  - Secondary button: Slate-700
  - Text: Cyan-100 for headings
  - Background: Slate-900 with transparency

### Animations
- Framer Motion for smooth transitions
- Scale animation on hover (1.03x)
- Initial fade-in on component load
- Smooth state transitions

## Error Handling

### Implemented Error Checks
1. **Network Errors**: Try-catch blocks for all Supabase operations
2. **Auth Errors**: Handles missing currentUserId gracefully
3. **Query Errors**: Logs to console, shows appropriate UI state
4. **Loading States**: Button disabled during async operations
5. **Not Found Errors**: Gracefully handles 'PGRST116' (not found) errors

### Error Logging
All errors are logged to browser console with descriptive messages:
```
Error fetching friends: [error]
Error in fetchMutualFriends: [error]
Error sending friend request: [error]
```

## User Flows

### 1. Send Friend Request
```
View Other Profile → Click "Add Friend" → Request Sent
Status: pending_sent → Shows "Pending" + Cancel option
```

### 2. Receive Friend Request
```
Incoming Request → User Sees "[Accept] [Reject]" buttons
Accept → Both users become Friends
Reject → Request deleted, back to not_friends
```

### 3. Unfriend
```
Friends → Click "Friends" button → "Unfriend"
Status changes back to not_friends
```

### 4. Cancel Sent Request
```
pending_sent → Click ✕ button → Cancel request
Status: back to not_friends
```

## Performance Considerations

### Database Queries
1. **fetchFriends**: Single query with OR clause for sender/receiver
2. **fetchFriendRequestStatus**: Single query with OR clause + conditional check
3. **fetchMutualFriends**: 2 queries (fetch both lists) + 1 profile query
4. **Individual Actions**: Single insert/update/delete operations

### Optimization Tips
- Use `.single()` to get single records (more efficient)
- Use `in()` filter for bulk data fetching
- Leverage RLS policies for automatic user scoping
- Index frequently queried columns (sender_id, receiver_id)

## Known Limitations & Future Improvements

### Current Limitations
1. Friend removal is not true deletion (changes to pending status)
   - This preserves relationship history
   - Can be changed to true deletion if needed

2. No blocking system yet
   - Can be added as additional status: 'blocked'

3. No notifications for friend requests
   - Integration with NotificationCenter is possible
   - Can be added in future

### Recommended Improvements
1. Add friend suggestions based on mutual friends
2. Implement friend groups/lists
3. Add birthday notifications for friends
4. Implement friend request notifications in NotificationCenter
5. Add activity status (who's online)
6. Add block/unblock functionality
7. Add message request screening (only from friends)

## Testing Checklist

- [ ] Send friend request to another user
- [ ] Verify "Pending" status shows for sender
- [ ] Accept friend request as receiver
- [ ] Verify "Friends" status shows for both users
- [ ] Check mutual friends count displays correctly
- [ ] Verify mutual friends grid shows up to 5 friends
- [ ] Test remove/unfriend functionality
- [ ] Cancel sent friend request
- [ ] Reject received friend request
- [ ] Verify friend lists update in real-time
- [ ] Test on mobile (responsive layout)
- [ ] Test dark mode styling
- [ ] Verify self-profile doesn't show add friend button
- [ ] Check loading states on all buttons
- [ ] Verify error handling (network errors, etc.)

## Files Modified

### New/Updated Files
1. `components/profile/FriendsList.tsx` - Complete rewrite with friend system
2. `components/profile/profile-header.tsx` - Added friend buttons and logic
3. `components/profile/profile-content.tsx` - Integrated FriendsList with current user

### No Changes Required
- Database schema (uses existing friend_system.sql)
- RLS policies (already configured)
- Authentication system

## Code Examples

### Sending a Friend Request
```typescript
const sendFriendRequest = async () => {
  setActionLoading(true);
  try {
    const { error } = await supabase.from('FRIEND_REQUEST').insert({
      sender_id: currentUserId,
      receiver_id: userId,
      status: 'pending'
    });
    if (!error) {
      setFriendRequestStatus('pending_sent');
    }
  } finally {
    setActionLoading(false);
  }
};
```

### Checking Friend Status
```typescript
const { data, error } = await supabase
  .from('FRIEND_REQUEST')
  .select('status')
  .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`)
  .single();
```

### Fetching Mutual Friends
```typescript
// Get current user's friend IDs
const { data: currentUserFriends } = await supabase
  .from('FRIEND_REQUEST')
  .select('sender_id, receiver_id')
  .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
  .eq('status', 'accepted');

// Find common IDs
const mutual = profileUserFriends.filter(req => 
  currentUserFriendIds.has(req.sender_id === userId ? req.receiver_id : req.sender_id)
);
```

## Support & Questions

For issues or questions about the friend system implementation, refer to this documentation or check the inline code comments in the component files.
