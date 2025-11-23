# Mahram System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Setup Database (5 minutes)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire content from: `scripts/mahram_system.sql`
5. Paste it into the SQL editor
6. Click **Run**
7. Wait for "Query successful" message

✅ **Done!** Your database now has mahram functions and triggers.

---

### Step 2: Test the Feature (10 minutes)

#### Create Test Accounts:
1. Sign up as **"Ahmed"** (this will be your male account)
2. Sign up as **"Fatima"** (this will be your female account)

#### Set Genders (In Database):
Since gender settings UI isn't built yet, update the database:

```sql
-- Get Ahmed's user ID
SELECT id FROM users WHERE username = 'ahmed';

-- Copy the ID and run this:
UPDATE users SET gender = 'male' WHERE username = 'ahmed';
UPDATE users SET gender = 'female' WHERE username = 'fatima';
```

#### Test Male→Female Access:
1. Login as **Ahmed**
2. Go to `/profile/fatima`
3. You should see a **modal with a lock** 🔐
4. The modal says: "Profile Protected"
5. Click **"Send Mahram Request"**
6. You should see: "Mahram request sent!"

#### Test Female Approval:
1. Login as **Fatima**
2. Open **Notifications** (bell icon)
3. You should see: "{Ahmed} sent you a mahram request"
4. Select a relation type (e.g., "Father")
5. Click **Approve**
6. You should see: "Mahram request approved"

#### Test Access Granted:
1. Login as **Ahmed** again
2. Go to `/profile/fatima`
3. Now you should see **Fatima's full profile!** ✅

---

### Step 3: Verify Everything Works (5 minutes)

#### Check Feature 1: Gender-Based Access
- [ ] Male views female profile → Modal appears
- [ ] Female views male profile → Profile loads
- [ ] Male views male profile → Profile loads
- [ ] Female views female profile → Profile loads

#### Check Feature 2: Share Profile Button
- [ ] Login to own profile
- [ ] See "Share Profile" button
- [ ] Click button → Alert: "Profile link copied"
- [ ] Paste URL in browser → Your profile loads

#### Check Feature 3: Cooldown (7-day limit)
- [ ] Ahmed sends request to Fatima ✅
- [ ] Ahmed immediately tries again → Error: "You can only send one mahram request per 7 days"

#### Check Feature 4: Notification System
- [ ] Fatima gets notification when Ahmed sends request ✅
- [ ] Ahmed gets notification when Fatima approves ✅
- [ ] Notifications show in NotificationCenter ✅

---

## 📋 What's Been Implemented

### Database Layer
✅ Gender-based access control  
✅ Mahram request tracking  
✅ Approval workflow  
✅ Notification triggers  
✅ 7-day cooldown system  
✅ 9 RPC functions  
✅ 2 automatic triggers  

### Frontend Components
✅ Access protection modal  
✅ Mahram request notifications  
✅ Share profile button  
✅ Profile access checks  
✅ Notification integration  

### Features Ready
✅ Males can request mahram from females  
✅ Females approve/reject requests  
✅ Females select relation type  
✅ Both parties get notifications  
✅ Approved mahram can view profile  
✅ Cooldown prevents spam  
✅ Share profile link on own profile  

---

## 📝 Key Files

| File | Purpose | Type |
|------|---------|------|
| `scripts/mahram_system.sql` | Database setup | SQL |
| `components/profile/mahram-access-modal.tsx` | Protected profile modal | Component |
| `components/profile/mahram-notification.tsx` | Approval handler | Component |
| `components/profile/profile-header.tsx` | Share button | Component |
| `app/profile/[username]/page.tsx` | Access control | Page |
| `components/notifications/NotificationCenter.tsx` | Notifications | Component |

---

## 🔧 Configuration

### For Development:
```tsx
// Test with gender column set to 'male' or 'female'
// Default: allow_mahram_requests_from_strangers = TRUE
```

### For Production:
1. Add settings page to let users set gender
2. Add settings page to let users toggle mahram requests
3. Monitor mahram request metrics
4. Set up email notifications (optional)

---

## 🧪 Common Test Scenarios

### Scenario: Male Sends First Request
```
1. Male: /profile/female → See modal
2. Male: Click "Send Mahram Request"
3. Female: Get notification
4. Female: Approve + select "Father"
5. Male: Get approval notification
6. Male: /profile/female → See full profile
```

### Scenario: Cooldown Blocks Second Request
```
1. Male: Send request to Female2
2. Male: Immediately try again
3. Error: "7 days must pass"
4. (Wait 7 days OR modify DB timestamp)
5. Male: Try again → Success
```

### Scenario: Female Rejects Request
```
1. Female: Get mahram notification
2. Female: Click "Reject"
3. Mahram record deleted
4. Male: Still cannot view profile
5. Male: Can send new request (no cooldown)
```

### Scenario: Female Disables Requests
```
1. Update DB: allow_mahram_requests_from_strangers = FALSE
2. Male: Send request
3. Error: "User does not accept requests"
```

---

## 🐛 Troubleshooting

### "Modal doesn't appear when viewing female profile"
**Solution**: 
1. Verify gender columns in database
2. Make sure profile owner gender = 'female'
3. Make sure viewer gender = 'male'

### "Send button shows error"
**Solution**:
1. Check that RPC functions exist: 
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name LIKE '%mahram%';
   ```
2. Verify no duplicate mahram request exists

### "Notification doesn't appear"
**Solution**:
1. Check triggers are created:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name LIKE '%mahram%';
   ```
2. Verify notification was inserted:
   ```sql
   SELECT * FROM NOTIFICATION WHERE verb = 'mahram_request' 
   ORDER BY created_at DESC LIMIT 1;
   ```

### "Can approve but profile still protected"
**Solution**:
1. Check page reload - might be cached
2. Verify approved status: 
   ```sql
   SELECT * FROM MAHRAM WHERE approved = TRUE;
   ```

---

## 📊 Database Queries to Know

```sql
-- View all mahram relationships
SELECT * FROM MAHRAM;

-- View pending requests
SELECT * FROM MAHRAM WHERE approved = FALSE;

-- View approved relationships
SELECT * FROM MAHRAM WHERE approved = TRUE;

-- View user genders
SELECT id, username, gender FROM users;

-- View mahram notifications
SELECT * FROM NOTIFICATION 
WHERE verb IN ('mahram_request', 'mahram_approved') 
ORDER BY created_at DESC;

-- Count requests by user
SELECT user_id, COUNT(*) FROM MAHRAM 
GROUP BY user_id 
ORDER BY COUNT(*) DESC;

-- Check cooldown for specific user pair
SELECT * FROM MAHRAM 
WHERE user_id = 'uuid1' 
AND related_user_id = 'uuid2' 
ORDER BY created_at DESC LIMIT 1;
```

---

## ✅ Checklist for Go-Live

- [ ] Database script executed successfully
- [ ] No errors in SQL console
- [ ] Test male→female access control works
- [ ] Test female→male access works
- [ ] Test same gender access works
- [ ] Test notification system works
- [ ] Test cooldown prevents duplicate requests
- [ ] Test share profile button works
- [ ] No console errors in browser
- [ ] Mobile responsive (test on phone)
- [ ] Light theme works
- [ ] Dark theme works
- [ ] Performance acceptable (< 2s load)

---

## 🚀 What Happens Next

1. **Users Sign Up** - Create accounts
2. **Set Gender** - In settings (UI not yet built)
3. **Cross-Gender Profile View** - Gets modal if male→female
4. **Send Mahram Request** - Click button in modal
5. **Receive Notification** - Target user gets notification
6. **Approve Request** - Target selects relation type
7. **Profile Access Granted** - Requester can view profile
8. **Share Profile** - Users can copy link on own profile

---

## 📞 Need Help?

- **Technical Details**: Read `MAHRAM_SYSTEM_GUIDE.md`
- **Deployment**: Read `MAHRAM_DEPLOYMENT_CHECKLIST.md`
- **Implementation**: Read `MAHRAM_COMPLETE_SUMMARY.md`

---

## 🎯 Success Indicators

You'll know it's working when:
1. ✅ Modal appears when males view female profiles
2. ✅ Females get notifications for requests
3. ✅ Females can approve with relation selector
4. ✅ Males get approval notifications
5. ✅ Approved males can view profiles
6. ✅ Duplicate requests are blocked (7-day cooldown)
7. ✅ Share button copies profile URL

---

**Status**: Ready for deployment 🚀

All 6 requirements implemented. Database, frontend, and notifications complete.

Just execute the SQL script and start testing!
