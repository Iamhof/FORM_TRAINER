# Testing Checklist - Form-PT-App on Expo Go

Use this checklist while testing the app on your phone. Check off each item as you complete it and note any issues you find.

## Connection Setup

- [ ] Expo Go app installed on phone
- [ ] Expo dev server started with `npx expo start --tunnel`
- [ ] QR code visible in terminal
- [ ] Successfully scanned QR code with phone
- [ ] App loading on phone
- [ ] No connection errors

## Authentication Flow

### Sign Up
- [ ] Navigate to sign up screen
- [ ] Enter email address
- [ ] Enter password
- [ ] Confirm password
- [ ] Click "Sign Up"
- [ ] No errors displayed
- [ ] Redirects to profile setup or home
- [ ] **Verify in Supabase:** User appears in Authentication → Users
- [ ] **Verify in Supabase:** Profile auto-created in Table Editor → profiles

**Issues Found:**
```
[Document any issues here]
```

### Sign In
- [ ] Sign out (if already signed in)
- [ ] Navigate to sign in screen
- [ ] Enter email
- [ ] Enter password
- [ ] Click "Sign In"
- [ ] No errors displayed
- [ ] Successfully logged in
- [ ] Redirects to home screen

**Issues Found:**
```
[Document any issues here]
```

### Session Persistence
- [ ] Close app completely (swipe away from recent apps)
- [ ] Reopen Expo Go app
- [ ] App reopens
- [ ] Still signed in (no need to sign in again)
- [ ] User data still available

**Issues Found:**
```
[Document any issues here]
```

## Profile & Settings

### Profile Setup (After Sign Up)
- [ ] Profile setup screen appears
- [ ] Enter name
- [ ] Select accent color
- [ ] Save profile
- [ ] Profile saves successfully
- [ ] **Verify in Supabase:** Profile updated in profiles table

**Issues Found:**
```
[Document any issues here]
```

### Profile Editing
- [ ] Navigate to profile/settings screen
- [ ] Current name displays
- [ ] Current accent color displays
- [ ] Update name
- [ ] Change accent color
- [ ] Save changes
- [ ] Changes persist after reload
- [ ] **Verify in Supabase:** Changes saved in database

**Issues Found:**
```
[Document any issues here]
```

## Programme Management

### Creating Programme
- [ ] Navigate to create programme screen
- [ ] Enter programme name
- [ ] Set number of days
- [ ] Set number of weeks
- [ ] Add exercises to programme
- [ ] Save programme
- [ ] Programme appears in programmes list
- [ ] **Verify in Supabase:** Programme saved in programmes table

**Issues Found:**
```
[Document any issues here]
```

### Viewing Programme
- [ ] Open created programme
- [ ] Programme name displays correctly
- [ ] All exercises display
- [ ] Day/week structure correct
- [ ] Can navigate between days/weeks
- [ ] Exercise details visible

**Issues Found:**
```
[Document any issues here]
```

### Deleting Programme
- [ ] Open programme list
- [ ] Select programme to delete
- [ ] Delete programme
- [ ] Programme removed from list
- [ ] **Verify in Supabase:** Programme deleted from database

**Issues Found:**
```
[Document any issues here]
```

## Workout Logging

### Starting Workout
- [ ] Select a programme
- [ ] Start workout session
- [ ] Workout screen loads
- [ ] Exercises from programme display
- [ ] Can see sets, reps, weight fields
- [ ] Rest timer works (if applicable)

**Issues Found:**
```
[Document any issues here]
```

### Logging Workout Data
- [ ] Enter sets completed
- [ ] Enter reps completed
- [ ] Enter weight used
- [ ] Complete all exercises
- [ ] Finish workout
- [ ] Workout saves successfully
- [ ] **Verify in Supabase:** Workout saved in workouts table

**Issues Found:**
```
[Document any issues here]
```

### Workout History
- [ ] Navigate to workout history
- [ ] Completed workouts appear in list
- [ ] Dates are correct
- [ ] Workout details are correct
- [ ] Can view individual workout details

**Issues Found:**
```
[Document any issues here]
```

## Leaderboard Feature

### Opt-In Process
- [ ] Navigate to Leaderboard tab
- [ ] See "Join Leaderboard" or "Get Started" button
- [ ] Click to join
- [ ] Opt-in screen appears
- [ ] Enter display name
- [ ] Select gender (Male/Female)
- [ ] Click "Join Leaderboard"
- [ ] No errors displayed
- [ ] Navigates to leaderboard screen
- [ ] **Verify in Supabase:** Entry created in leaderboard_profiles table

**Issues Found:**
```
[Document any issues here]
```

### Leaderboard Display
- [ ] Leaderboard screen loads
- [ ] Can see leaderboard tabs (Total Volume, Monthly Volume, etc.)
- [ ] Can switch between leaderboard types
- [ ] Gender filters work (All, Men, Women)
- [ ] Rankings display (may be empty if no data)
- [ ] "Your Rank" card displays (if applicable)
- [ ] Rankings update when filters change

**Issues Found:**
```
[Document any issues here]
```

### Leaderboard Settings
- [ ] Navigate to leaderboard settings
- [ ] Current display name shows
- [ ] Can update display name
- [ ] Privacy settings visible
- [ ] Can change privacy settings
- [ ] Changes save successfully
- [ ] **Verify in Supabase:** Changes saved in leaderboard_profiles

**Issues Found:**
```
[Document any issues here]
```

## Analytics & Progress

### Analytics Overview
- [ ] Navigate to Analytics tab
- [ ] Analytics screen loads
- [ ] Charts/graphs display
- [ ] Volume data shows correctly
- [ ] Data updates after logging workouts
- [ ] No errors loading analytics

**Issues Found:**
```
[Document any issues here]
```

### Progress Tracking
- [ ] Navigate to Progress tab
- [ ] Workout history visible
- [ ] Statistics display correctly
- [ ] Progress over time visible
- [ ] Data accurate

**Issues Found:**
```
[Document any issues here]
```

## UI/UX Testing

### Visual Appearance
- [ ] App looks good on phone screen
- [ ] Text is readable
- [ ] Colors display correctly
- [ ] Icons are visible
- [ ] Spacing looks good
- [ ] No overlapping elements
- [ ] Dark mode works (if applicable)

**Issues Found:**
```
[Document any issues here]
```

### Navigation
- [ ] Bottom navigation works
- [ ] Can switch between tabs
- [ ] Back buttons work
- [ ] Navigation is smooth
- [ ] No navigation errors

**Issues Found:**
```
[Document any issues here]
```

### Interactions
- [ ] All buttons respond to taps
- [ ] Input fields work correctly
- [ ] Keyboard doesn't cover inputs
- [ ] Scrollable areas scroll smoothly
- [ ] Loading indicators show when needed
- [ ] Error messages display clearly

**Issues Found:**
```
[Document any issues here]
```

## Performance Testing

### Loading Times
- [ ] App loads quickly on startup
- [ ] Screens load without long delays
- [ ] Data loads reasonably fast
- [ ] No excessive waiting times

**Issues Found:**
```
[Document any issues here]
```

### Responsiveness
- [ ] App responds quickly to taps
- [ ] Animations are smooth
- [ ] No lag when scrolling
- [ ] App doesn't freeze

**Issues Found:**
```
[Document any issues here]
```

## Error Handling

### Network Errors
- [ ] Test with poor connection
- [ ] Error messages display appropriately
- [ ] App doesn't crash on network errors
- [ ] Can retry failed operations

**Issues Found:**
```
[Document any issues here]
```

### Validation Errors
- [ ] Invalid inputs show error messages
- [ ] Error messages are clear
- [ ] Can correct errors and retry

**Issues Found:**
```
[Document any issues here]
```

## Console/Log Monitoring

### Check Terminal Logs
- [ ] No critical errors in terminal
- [ ] Supabase connection successful
- [ ] API calls completing successfully
- [ ] No authentication errors

**Errors Found:**
```
[Document any errors here]
```

## Summary of Issues

### Critical Bugs (App crashes, data loss)
1. 
2. 
3. 

### Major Issues (Features not working)
1. 
2. 
3. 

### Minor Issues (Small bugs, cosmetic)
1. 
2. 
3. 

### Enhancements (Nice-to-have improvements)
1. 
2. 
3. 

## Overall Assessment

**What works well:**
- 
- 
- 

**What needs improvement:**
- 
- 
- 

**Priority fixes needed:**
1. 
2. 
3. 



