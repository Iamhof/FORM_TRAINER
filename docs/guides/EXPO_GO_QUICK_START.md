# Expo Go Quick Start Guide

## Current Status

✅ **Expo development server is starting in the background**

## Step 1: Wait for Server to Start

The Expo server is starting. In your terminal, you should see:
- "Starting Metro Bundler"
- A QR code will appear
- Server URL will be displayed

**Wait for the QR code to appear before proceeding.**

## Step 2: Connect Your Phone

### For Android:
1. Open **Expo Go** app on your phone
2. Tap **"Scan QR code"** button
3. Point camera at QR code in terminal
4. App will start loading

### For iOS:
1. Open **Camera** app on your phone
2. Point camera at QR code in terminal
3. Tap the notification banner that appears
4. Opens automatically in Expo Go

## Step 3: Verify Connection

**Success indicators:**
- App starts loading on your phone
- "Building JavaScript bundle" message appears
- App loads and shows your app interface
- No error messages

**If you see errors:**
- Check terminal for error messages
- Verify phone and computer are on same network (or using tunnel)
- Try restarting: Press `r` in terminal to reload, or restart with `npx expo start -c --tunnel`

## Step 4: Start Testing

Once connected, use **[TESTING_CHECKLIST.md](../testing/TESTING_CHECKLIST.md)** to systematically test all features.

## Troubleshooting

### QR Code Not Appearing
- Wait a bit longer (server may still be starting)
- Check terminal for errors
- Try: `npx expo start --tunnel` again

### Can't Connect
- **Android:** Make sure Expo Go app is installed and updated
- **iOS:** Make sure Camera app has permission to scan QR codes
- Try tunnel mode if on different networks
- Check firewall isn't blocking Expo

### App Won't Load
- Check terminal for error messages
- Verify environment variables are set
- Try clearing cache: `npx expo start -c --tunnel`
- Check Supabase connection

### Connection Drops
- Keep terminal window open
- Don't close Expo server
- If connection lost, scan QR code again
- Check network connectivity

## Developer Menu

**On your phone:**
- **Android:** Shake device or press menu button
- **iOS:** Shake device or use 3-finger tap

**Options available:**
- Reload app
- Show performance monitor
- View error logs
- Open debugger

## Hot Reloading

- Changes to code automatically reload on phone
- No need to rescan QR code
- Fast refresh enabled by default
- If changes don't appear, shake device → "Reload"

## Next Steps

1. ✅ Server is starting
2. ⏳ Wait for QR code
3. ⏳ Scan QR code with phone
4. ⏳ Start testing with [TESTING_CHECKLIST.md](../testing/TESTING_CHECKLIST.md)



