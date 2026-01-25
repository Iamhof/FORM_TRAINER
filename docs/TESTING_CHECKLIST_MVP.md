# MVP Testing Checklist

## Before Testing

### Start the Development Server

```bash
cd "C:\My Apps\FORM_APP\rork-OJ-form-main"
npx expo start
```

### Open on Your iPhone
1. Make sure VPN is OFF on your phone
2. Phone and computer on same WiFi network
3. Open Expo Go app
4. Scan QR code from terminal

---

## Core Feature Testing

### ✅ User Authentication

- [ ] **Sign Up Flow**
  - Tap "Sign Up"
  - Enter email and password
  - Successfully creates account
  - Redirected to app

- [ ] **Sign In Flow**
  - Sign out
  - Tap "Sign In"
  - Enter credentials
  - Successfully logs in

- [ ] **Sign Out**
  - Go to Profile tab
  - Tap Sign Out
  - Returns to login screen

---

### ✅ Programme Management

- [ ] **Create Programme**
  - Tap "Create Programme" or "+" button
  - Enter programme name
  - Select number of days per week
  - Select weeks duration
  - Successfully creates programme

- [ ] **View Programme List**
  - See created programmes
  - Shows programme details (days, weeks)
  - Can tap to view details

- [ ] **Set Active Programme**
  - Mark a programme as active
  - Shows "Active" badge
  - Appears on home screen

- [ ] **Add Exercises to Programme**
  - Open programme details
  - Tap "Add Session" or "Add Day"
  - Select exercises from library
  - Successfully adds to programme

- [ ] **Delete Programme**
  - Swipe or tap delete on a programme
  - Confirms deletion
  - Programme removed from list

---

### ✅ Workout Logging

- [ ] **Start Workout**
  - From home screen or programme
  - Opens workout session
  - Shows exercises list

- [ ] **Log Exercise Sets**
  - Enter weight (kg)
  - Enter reps completed
  - Tap to save set
  - Set appears in list

- [ ] **Complete Workout**
  - Finish all exercises
  - Tap "Complete Workout"
  - Saves successfully
  - Returns to home/history

- [ ] **View Workout History**
  - Go to Workouts tab
  - See past workouts listed
  - Shows date, exercises, stats
  - Can tap to view details

---

### ✅ Exercise Library

- [ ] **Browse Exercises**
  - Go to Exercises tab
  - See list of exercises
  - Scrolls smoothly

- [ ] **Search Exercises**
  - Use search bar
  - Type exercise name
  - Results filter correctly

- [ ] **Filter by Category**
  - Tap category filters
  - Shows only matching exercises
  - Can combine multiple filters

- [ ] **View Exercise Details**
  - Tap an exercise
  - Shows description
  - Shows target muscles
  - Shows equipment needed

---

### ✅ Profile & Settings

- [ ] **View Profile**
  - See user email
  - See user name
  - Profile loads correctly

- [ ] **Change Accent Color**
  - Go to Profile tab
  - Select different accent color
  - Color changes throughout app
  - Saves preference

- [ ] **Edit Profile**
  - Update name
  - Updates successfully
  - Reflects in profile view

---

### ✅ "Coming Soon" Features

- [ ] **Analytics Tab**
  - Shows "Advanced Analytics Coming Soon"
  - Clean, professional appearance
  - Explains what feature will be
  - Says "Expected: Version 1.1"

- [ ] **Leaderboard Tab**
  - Shows "Global Leaderboard Coming Soon"
  - Clean, professional appearance
  - Explains what feature will be
  - Says "Expected: Version 1.2"

---

## Error Checking

### Console Logs (Development Mode)

**You should NOT see:**
- ❌ "column profiles.gender does not exist" (FIXED)
- ❌ "TUNNEL MODE DETECTED" (should be in LAN mode)

**You MIGHT see (Acceptable):**
- ⚠️ Some TRPC connection warnings (expected, ignored in production)
- ⚠️ Package version warnings (non-critical)

**If you see errors:** Take screenshot and review with developer.

---

## Performance Testing

### App Speed
- [ ] App launches in < 5 seconds
- [ ] Navigation between tabs is instant
- [ ] Programme creation is smooth
- [ ] Workout logging responds immediately
- [ ] No lag when scrolling lists

### Offline Mode
- [ ] Turn off WiFi on phone
- [ ] App still works for viewing data
- [ ] Can log workouts offline
- [ ] Data syncs when back online

---

## User Experience Check

### First Impression
- [ ] App looks professional
- [ ] UI is clean and intuitive
- [ ] Colors are pleasant
- [ ] Text is readable
- [ ] Buttons are clear

### Workflow
- [ ] Creating first programme is easy
- [ ] Starting workout makes sense
- [ ] Logging exercises is quick
- [ ] Completing workout is obvious
- [ ] Finding past workouts is clear

### Edge Cases
- [ ] Empty states look good (no programmes yet)
- [ ] Error messages are helpful
- [ ] Loading states are clear
- [ ] No crashes during normal use

---

## Test Scenarios

### Scenario 1: New User
1. Sign up with new account
2. Create first programme (e.g., "Push Day")
3. Add 5 exercises to it
4. Start a workout
5. Log 3-4 sets per exercise
6. Complete workout
7. View in history

**Time:** ~15 minutes  
**Pass criteria:** No errors, smooth experience

### Scenario 2: Experienced User
1. Create 3 different programmes
2. Set one as active
3. Start workout from active programme
4. Log a full session (30-45 minutes)
5. Browse exercise library
6. Create another programme with different exercises
7. Switch active programme

**Time:** ~45 minutes  
**Pass criteria:** Everything works, data persists

### Scenario 3: Power User
1. Create 5+ programmes
2. Log multiple workouts
3. Build workout history
4. Test all tabs
5. Change accent colors
6. Edit profile multiple times
7. Test offline, then online

**Time:** ~1-2 hours  
**Pass criteria:** No performance issues, no data loss

---

## Critical Issues (Must Fix Before Launch)

### Blockers
- [ ] App crashes on any core feature
- [ ] Cannot sign up/sign in
- [ ] Cannot create programmes
- [ ] Cannot log workouts
- [ ] Data doesn't save

**If any of these occur:** Must fix before building for stores.

### Major Issues (Should Fix)
- [ ] Confusing UI
- [ ] Slow performance
- [ ] Unclear error messages
- [ ] Poor offline experience

**Fix these** but won't block launch if everything else works.

### Minor Issues (Can Fix Later via Update)
- [ ] Small UI glitches
- [ ] Non-critical copy/text issues
- [ ] Minor performance tweaks
- [ ] Nice-to-have features

**Ship first, fix in updates** after gathering real user feedback.

---

## Beta Testing (Before Public Launch)

### Invite 5-10 Friends to Test

**iOS - TestFlight:**
1. Build iOS app with EAS
2. Upload to App Store Connect
3. Appears in TestFlight automatically
4. Invite testers by email
5. They install TestFlight app
6. They install your app
7. Gather feedback (3-5 days)

**Android - Internal Testing:**
1. Build Android app with EAS
2. Upload to Play Console → Internal testing
3. Add tester emails
4. Share opt-in link
5. They download from Play Store
6. Gather feedback (3-5 days)

### Questions for Testers
1. Was sign up easy?
2. Could you create a programme?
3. Was logging a workout straightforward?
4. Anything confusing?
5. Any crashes or bugs?
6. Would you use this regularly?
7. What features are you wishing for?

---

## Pre-Launch Checklist

### Technical
- [x] Core features implemented
- [x] Backend features hidden
- [x] Database errors fixed
- [x] app.json configured
- [x] eas.json configured
- [ ] Tested on iPhone (do this!)
- [ ] No critical bugs found
- [ ] Performance is acceptable

### Assets
- [ ] App icon created (1024x1024)
- [ ] Adaptive icon for Android
- [ ] Splash screen updated
- [ ] 5-6 screenshots captured
- [ ] Screenshots look professional

### Documentation
- [x] Privacy policy written
- [ ] Privacy policy hosted online
- [ ] Support email set up (optional)
- [ ] URL ready for stores

### Accounts & Access
- [ ] Apple Developer account active
- [ ] Google Play Console access
- [ ] Expo account created
- [ ] EAS CLI installed and logged in

### Store Listings
- [ ] App name decided
- [ ] Description written (use templates)
- [ ] Keywords researched
- [ ] Category selected (Health & Fitness)
- [ ] Age rating known (4+ / Everyone)

---

## Launch Day Checklist

### When Apps Are Approved:

**Hour 1: Announce**
- [ ] Share on social media
- [ ] Email friends/family
- [ ] Post in relevant communities (r/fitness, etc.)

**Day 1-7: Monitor**
- [ ] Check crash reports (should be <1%)
- [ ] Read all reviews
- [ ] Respond to feedback
- [ ] Track download numbers
- [ ] Monitor Supabase usage

**Week 2-4: Gather Data**
- [ ] Survey active users
- [ ] Analyze usage patterns
- [ ] Identify most-wanted features
- [ ] Plan version 1.1

---

## Success Criteria

### MVP Launch = Success If:
✅ Apps approved in both stores  
✅ Core features work for users  
✅ No critical crashes  
✅ 20-50 downloads in first month  
✅ 5+ pieces of actionable feedback  

### Ready for v1.1 When:
✅ 100+ active users  
✅ Clear feature priorities from feedback  
✅ 4+ star average rating  
✅ Users returning regularly  
✅ Feature requests align with backend capabilities  

---

## Need Help?

### Stuck on Testing?
- Re-read this checklist
- Check `docs/MVP_DEPLOYMENT_GUIDE.md`
- Test one feature at a time

### Stuck on Deployment?
- Follow `docs/DEPLOYMENT_COMMANDS.md`
- Read Expo docs: https://docs.expo.dev/build
- Check Expo forums for specific errors

### Stuck on Store Submission?
- Use templates in `docs/STORE_LISTINGS.md`
- Follow Apple/Google's submission wizards
- Reach out to their support

---

**Everything you need is documented. You've got this!** 🚀

**Start with Task 1: Create your app icon!**
