# Quick Reference: Deployment Commands

## Setup (One Time)

### Install EAS CLI
```bash
npm install -g eas-cli
```

### Login to Expo
```bash
eas login
```

### Configure Project
```bash
cd "C:\My Apps\FORM_APP\rork-OJ-form-main"
eas build:configure
```

This generates a project ID and updates your app.json.

---

## Building

### iOS Production Build
```bash
eas build --platform ios --profile production
```

**Build time:** ~15-20 minutes  
**Output:** `.ipa` file (download link provided)

### Android Production Build
```bash
eas build --platform android --profile production
```

**Build time:** ~10-15 minutes  
**Output:** `.aab` file for Play Store

### Build Both Platforms
```bash
eas build --platform all --profile production
```

---

## Submitting to Stores

### Submit iOS to App Store
```bash
eas submit --platform ios --profile production
```

**Requirements:**
- Apple ID credentials
- App created in App Store Connect
- Screenshots and metadata ready

### Submit Android to Play Store
```bash
eas submit --platform android --profile production
```

**Requirements:**
- Google Play service account JSON file
- App created in Play Console
- Store listing complete

### Submit Both
```bash
eas submit --platform all --profile production
```

---

## Testing Builds

### Preview Build (Internal Testing)
```bash
eas build --platform all --profile preview
```

Creates builds for internal distribution (not store submission).

### Download Latest Build
```bash
eas build:list
```

Shows your recent builds with download links.

---

## Over-the-Air Updates

### Push Update to Users
```bash
eas update --branch production --message "Bug fixes and improvements"
```

**Use for:**
- JavaScript/TypeScript changes
- UI tweaks
- Bug fixes
- Non-native updates

**Cannot update:**
- Native code changes (need new build)
- Package.json dependencies (need new build)
- app.json major changes (need new build)

---

## Monitoring

### View Build Status
```bash
eas build:view [build-id]
```

### View Project Info
```bash
eas project:info
```

### View Update Branches
```bash
eas update:list
```

---

## Common Workflows

### Make a Bug Fix (JavaScript only)
```bash
# 1. Fix the bug in your code
# 2. Push update (no build needed!)
eas update --branch production --message "Fixed workout logging bug"
```

**Users get it:** Next time they open the app!

### Add New Feature (Requires Build)
```bash
# 1. Add feature to code
# 2. Update version in app.json (e.g., 1.0.0 → 1.1.0)
# 3. Build new version
eas build --platform all --profile production
# 4. Submit to stores
eas submit --platform all --profile production
```

**Users get it:** After store approval (1-7 days)

### Release Version 1.1 with Backend
```bash
# 1. Uncomment backend providers in app/_layout.tsx
# 2. Update Coming Soon screens with real features
# 3. Deploy backend to Vercel/Railway
# 4. Add EXPO_PUBLIC_RORK_API_BASE_URL to .env.production
# 5. Update version to 1.1.0 in app.json
# 6. Build and submit
eas build --platform all --profile production
eas submit --platform all --profile production
```

---

## Troubleshooting

### Build Fails - iOS

**Check:**
- Apple Developer account active ($99 paid)
- Correct Apple ID credentials
- Bundle identifier unique and properly configured

**Fix:**
```bash
eas build --platform ios --profile production --clear-cache
```

### Build Fails - Android

**Usually rare. If fails:**
```bash
eas build --platform android --profile production --clear-cache
```

### Submission Rejected

**Common reasons:**
- Missing privacy policy
- Incomplete app information
- Bug found during review
- Misleading screenshots

**Fix and resubmit:**
- Address feedback from Apple/Google
- No need to rebuild unless code changes
- Resubmission usually faster (1-2 days)

---

## Cost Tracking

### Build Minutes (EAS Free Tier)

**Free tier includes:**
- 30 builds per month
- Unlimited over-the-air updates

**Each build uses:**
- iOS: ~15-20 minutes
- Android: ~10-15 minutes

**Track usage:**
```bash
eas build:list --limit 30
```

If you exceed 30 builds/month, upgrade to:
- **Production Plan:** $99/month (unlimited builds)

---

## Environment Variables

### For EAS Builds

Set secrets that EAS uses during build:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your-url" --scope project
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key" --scope project
```

### List Secrets
```bash
eas secret:list
```

---

## Version Management

### Increment Version
Before each release, update `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",  // Semantic versioning
    "ios": {
      "buildNumber": "1"  // Auto-incremented by EAS
    },
    "android": {
      "versionCode": 1  // Auto-incremented by EAS
    }
  }
}
```

**Versioning scheme:**
- `1.0.0` → `1.0.1`: Bug fixes
- `1.0.0` → `1.1.0`: New features
- `1.0.0` → `2.0.0`: Major changes/breaking

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| **Build iOS** | `eas build -p ios --profile production` |
| **Build Android** | `eas build -p android --profile production` |
| **Build Both** | `eas build -p all --profile production` |
| **Submit iOS** | `eas submit -p ios` |
| **Submit Android** | `eas submit -p android` |
| **Push Update** | `eas update --branch production --message "..."` |
| **View Builds** | `eas build:list` |
| **Project Info** | `eas project:info` |

---

## Help & Resources

### Official Docs
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/
- EAS Update: https://docs.expo.dev/eas-update/introduction/

### Support
- Expo Forums: https://forums.expo.dev/
- Expo Discord: https://chat.expo.dev/
- Stack Overflow: Tag `expo`

### Your Guides
- Full Deployment: `docs/MVP_DEPLOYMENT_GUIDE.md`
- Store Listings: `docs/STORE_LISTINGS.md`
- MVP Overview: `docs/MVP_README.md`

---

**Happy deploying!** 🚀
