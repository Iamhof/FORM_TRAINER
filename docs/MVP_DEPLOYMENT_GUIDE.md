# MVP Deployment Guide - Complete Walkthrough

## What We've Done Already ✅

The app code is now ready for MVP launch:
- ✅ Backend features replaced with "Coming Soon" screens
- ✅ Home screen simplified to core features only
- ✅ Unused context providers removed
- ✅ Database gender error fixed
- ✅ app.json configured for production
- ✅ eas.json configured with build profiles
- ✅ Privacy policy created

## What You Need to Do Next

### Step 1: Create App Assets (2-4 hours)

#### A. App Icon (1024x1024px)

**Requirements:**
- Square PNG image, 1024x1024 pixels
- No transparency (must have solid background)
- Simple, recognizable design
- Works at small sizes

**Options:**
1. **DIY:** Use Canva (free) - Search "app icon templates"
2. **Quick:** Use an AI generator like Midjourney, DALL-E
3. **Professional:** Hire on Fiverr ($20-50) - Search "app icon design"

**Save as:** `assets/images/icon.png`

#### B. Adaptive Icon (Android)

Same design as app icon, saved as: `assets/images/adaptive-icon.png`

#### C. Splash Screen (1284x2778px)

**Simple Design:**
- Black background (#1A1A1A)
- App icon centered
- Optional: App name below icon

**Save as:** `assets/images/splash-icon.png`

#### D. Screenshots (5-6 per platform)

**How to capture:**
1. Run app on your iPhone with Expo Go
2. Navigate to key screens
3. Take screenshots
4. Edit to remove status bar/indicators

**Screens to capture:**
1. Home screen (with active programme)
2. Programmes list
3. Programme creation screen
4. Workout in progress (logging exercises)
5. Exercise library
6. Profile/settings

**Requirements:**
- iOS: 1290x2796px (iPhone 6.7" display)
- Android: Any modern phone resolution

**Pro Tips:**
- Use clean, sample data (not your real workouts)
- Show the app being actively used
- Highlight key features
- Use consistent theme/accent color

### Step 2: Host Privacy Policy (15 minutes)

Your privacy policy is in `docs/PRIVACY_POLICY.md`. You need to host it online.

**Easiest Option - GitHub Pages:**

1. Create a new GitHub repository (can be private initially)
2. Enable GitHub Pages in Settings → Pages
3. Upload your privacy policy as `index.md`
4. Get the URL: `https://yourusername.github.io/reponame`

**Alternative - Simple HTML hosting:**
- Use Netlify Drop (drag & drop)
- Use Vercel
- Use any web hosting service

**Update in app stores:** Use this URL when submitting apps

### Step 3: EAS Build Setup (15 minutes)

#### Install EAS CLI

Open PowerShell:

```bash
npm install -g eas-cli
```

#### Login to Expo

```bash
eas login
```

Create an Expo account if you don't have one (free).

#### Initialize EAS in Project

```bash
cd "C:\My Apps\FORM_APP\rork-OJ-form-main"
eas build:configure
```

This will:
- Create/update your project ID in app.json
- Link your project to Expo's build service
- Set up project on Expo servers

### Step 4: Build iOS App (30 minutes + 20 min build time)

#### Build Command

```bash
eas build --platform ios --profile production
```

#### What You'll Be Asked:

1. **Apple ID:** Your Apple Developer account email
2. **Apple ID Password:** Your password (or app-specific password if using 2FA)
3. **Distribution Certificate:** EAS will generate automatically (choose "Yes")
4. **Provisioning Profile:** EAS will generate automatically (choose "Yes")

#### During Build:

- Build runs in Expo's cloud (not on your PC)
- Takes 15-20 minutes
- You'll get a link to monitor progress
- Download link provided when complete

#### Download & Test:

1. Download the `.ipa` file
2. Install via TestFlight:
   - Go to App Store Connect
   - TestFlight section
   - Upload the `.ipa`
   - Invite yourself as tester
   - Test on your iPhone

### Step 5: Submit to App Store (1-2 hours setup)

#### In App Store Connect:

1. **Go to:** https://appstoreconnect.apple.com
2. **Click:** "My Apps" → "+" → "New App"
3. **Fill in:**
   - Platform: iOS
   - Name: "Form - Workout Tracker" (or your chosen name)
   - Primary Language: English
   - Bundle ID: Select `com.rork.form`
   - SKU: `FORM001` (any unique identifier)

4. **App Information:**
   - Category: Health & Fitness
   - Subcategory: (optional)

5. **Pricing:**
   - Select "Free"

6. **App Privacy:**
   - Link your hosted privacy policy URL

7. **Upload Screenshots:**
   - 6.7" display: 1290x2796px (mandatory)
   - 5.5" display: 1242x2208px (optional)

8. **Description:**
```
Build custom workout programmes and track your training progress.

FEATURES
• Create personalized training programmes
• Log exercises with sets, reps, and weight
• Browse comprehensive exercise library
• Track your workout history

Perfect for weightlifters and gym-goers who want simple, effective workout tracking.
```

9. **Keywords:**
```
workout, fitness, gym, training, weightlifting, exercise, programme, program, tracker, log, strength
```

10. **Build:**
   - Use EAS submit command OR
   - Upload manually via Transporter app

11. **App Review Information:**
   - Create a test account
   - Provide contact information
   - Add notes for reviewer if needed

12. **Submit for Review**

**Approval Time:** 1-3 days typically

### Step 6: Build Android App (30 minutes + 15 min build time)

#### Build Command

```bash
eas build --platform android --profile production
```

#### What You'll Be Asked:

1. **Keystore:** EAS generates automatically (choose "Yes")
2. **Keystore credentials:** EAS manages securely

#### During Build:

- Builds in cloud
- Takes 10-15 minutes
- Creates `.aab` file for Play Store

#### Download & Test:

EAS also creates an `.apk` for testing:
- Download the `.apk`
- Install on Android device or emulator
- Test core features

### Step 7: Submit to Google Play (1-2 hours setup)

#### In Google Play Console:

1. **Go to:** https://play.google.com/console
2. **Click:** "Create app"
3. **Fill in:**
   - App name: "Form - Workout Tracker"
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
   - Accept declarations

4. **Dashboard Tasks:**

**A. Store Listing:**
   - App name
   - Short description (80 chars): "Build workout programmes and track your training progress"
   - Full description (use the template from the plan)
   - App icon (512x512px)
   - Feature graphic (1024x500px) - optional but recommended
   - Screenshots (at least 2)
   - Category: Health & Fitness

**B. Content Rating:**
   - Complete questionnaire
   - Should get "Everyone" rating

**C. Target Audience:**
   - Age groups: 13+
   - Not directed to children

**D. Store Presence > Privacy Policy:**
   - Add your hosted privacy policy URL

**E. App Content:**
   - Privacy & security questionnaire
   - Data safety form:
     - Collects: Email, workout data
     - Data encrypted in transit: Yes
     - Users can request deletion: Yes
     - Data not shared with third parties

**F. Create Release:**
   - Go to "Production" → "Create new release"
   - Upload `.aab` file OR use `eas submit --platform android`
   - Add release notes:
```
Initial release of Form - Workout Tracker

Features:
- Create custom training programmes
- Log workouts with exercises, sets, and reps
- Track your training progress
- Browse exercise library
```

5. **Review and Rollout:**
   - Review all sections (must be green checkmarks)
   - Send for review
   - Once approved, select rollout percentage (start with 100%)

**Approval Time:** 1-7 days typically

## Step 8: Beta Testing (Before Public Launch)

### iOS - TestFlight

1. Build is automatically available in TestFlight after App Store Connect upload
2. **Invite testers:**
   - App Store Connect → TestFlight → Internal Testing
   - Add up to 100 testers (Apple IDs)
3. **Testers install:**
   - Download TestFlight app from App Store
   - Accept invitation
   - Install your app
4. **Gather feedback:**
   - Ask testers to try core features
   - Report bugs
   - Share thoughts

### Android - Internal Testing

1. **Go to:** Play Console → Internal testing
2. **Create release:**
   - Upload same `.aab` as production
   - Add testers by email
3. **Share link:** Copy testing opt-in link
4. **Testers install:**
   - Click link on Android device
   - Accept invitation
   - Download from Play Store
5. **Gather feedback**

## Step 9: Monitor After Launch

### Week 1 Checklist:

- [ ] Check App Store Connect for crashes
- [ ] Check Play Console for crashes
- [ ] Monitor Supabase usage dashboard
- [ ] Respond to user reviews
- [ ] Track download numbers
- [ ] Ask friends/family for feedback

### Key Metrics:

**App Stores:**
- Downloads per day
- Crash-free rate (should be >99%)
- Rating/reviews

**Supabase:**
- Active users
- Database queries per day
- Storage usage

## Troubleshooting Common Issues

### Build Fails

**iOS:**
- Check Apple Developer account is paid ($99)
- Verify you have proper access level
- Try revoking and regenerating certificates

**Android:**
- Usually works first time
- Check package name is unique

### App Rejected

**Common reasons:**
- Missing privacy policy
- Incomplete app information
- Crashbugs during review
- Misleading screenshots/description

**Fix:** Address feedback, resubmit (usually quick second review)

### Low Downloads

**Expected for MVP:**
- First month: 10-50 downloads (from personal network)
- Organic growth is slow
- Focus on feedback quality, not quantity

## Cost Summary

| Item | Cost | When |
|------|------|------|
| App Icon Design | $0-50 | Before build |
| Privacy Policy Hosting | $0 | Before submission |
| Apple Developer | $99/year | Already paid |
| Google Play | $25 one-time | Already paid |
| EAS Build | $0 | During build (30 free/month) |
| Total | ~$99-174 | |

## Timeline Summary

| Phase | Time Required |
|-------|--------------|
| Create assets | 2-4 hours |
| Host privacy policy | 15 minutes |
| EAS build iOS | 30 min setup + 20 min build |
| App Store submission | 1-2 hours |
| EAS build Android | 30 min setup + 15 min build |
| Play Store submission | 1-2 hours |
| **Total Active Work** | 6-9 hours |
| Store review wait | 1-7 days |
| **Total to Launch** | 1-2 weeks |

## Next Steps

### Immediate (This Week):

1. **Create app icon** using Canva or hire on Fiverr
2. **Take screenshots** of your app on iPhone
3. **Host privacy policy** on GitHub Pages
4. **Run EAS builds** (requires the assets above)

### Near Term (Next Week):

5. **Submit to both stores**
6. **Invite 5-10 beta testers**
7. **Monitor feedback**

### Future (Month 2-3):

8. **Deploy backend** (if users want those features)
9. **Add analytics, body metrics, etc.**
10. **Release version 1.1**

## Questions or Issues?

If you get stuck:
1. Check Expo documentation: https://docs.expo.dev/build/setup/
2. EAS Build docs: https://docs.expo.dev/build/introduction/
3. App Store Connect help: https://developer.apple.com/help/app-store-connect/
4. Play Console help: https://support.google.com/googleplay/android-developer

## Important Reminders

- ✅ Your app's core features work perfectly without backend
- ✅ Users can create programmes and log workouts
- ✅ Coming Soon screens set proper expectations
- ✅ You can add features later based on user feedback
- ✅ Launch fast, iterate based on real usage

**You're ready to launch!** 🚀

The hardest part (coding) is done. Now it's just assets, builds, and submissions!
