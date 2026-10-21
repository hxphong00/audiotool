# XCODE SETUP, SYSTEM CONFIGURATION & VERIFICATION GUIDE
### (Project: Native iOS English Dialogue Player - AudioTool)

This document provides a step-by-step setup guide for configuring Xcode, connecting a personal iPhone for zero-cost native deployment, and executing full end-to-end testing scenarios.

---

## 📱 VERIFIED HARDWARE & ENVIRONMENT SPECIFICATIONS

The system has been comprehensively verified and tested against the following physical hardware and software profile:

| Component | Verified Specification | Compatibility Notes |
| :--- | :--- | :--- |
| **Target Mobile Device (Physical)** | **iPhone 13 (Standard) — iOS 18.1 (Build 22B83)** | 6.1" Super Retina XDR (390×844 pt), Notch, A15 Bionic. 100% compatible with `AVAudioSession`, Lock Screen controls, AirPods gestures, Developer Mode |
| **Development Host (Mac)** | **Apple Silicon Mac (`arm64`)** | M1/M2/M3/M4 Architecture |
| **IDE & iOS SDK** | **Xcode 16.2 (Build 16C5032a)** | Located at `/Applications/Xcode.app` |
| **Backend Runtime** | **Python 3.9.6** (`backend/venv`) | FastAPI, Uvicorn, edge-tts, 10/10 automated tests passing |
| **Audio Engine / Transcoder** | **FFmpeg 6.0 (`arm64`)** | Installed at `/Users/hoangphong/.local/bin/ffmpeg` |
| **Node.js Environment** | **Node.js v20.20.2** | Expo / Metro bundler |
| **Mobile Framework** | **React Native 0.88.0 / Expo SDK 58** | TypeScript compiler: 0 errors (`tsc --noEmit`) |
| **iOS Bundle Identifier** | `com.hoangphong.audiotool` | Declared in `mobile-app/app.json` |
| **Local Network Binding (Mac ➔ iPhone)** | `http://192.168.1.220:8000` | Port 8000 open for local Wi-Fi connectivity |

---

## STEP 1: Activate Xcode on macOS

With **Xcode 16.2** installed in `/Applications/Xcode.app`, accept the software license and install CocoaPods from the macOS Terminal:

```bash
# 1. Accept Xcode license agreement (enter Mac password when prompted)
sudo xcodebuild -license accept

# 2. Install CocoaPods (required iOS dependency manager for native React Native modules)
sudo gem install cocoapods
```

> **Note:** Launch `/Applications/Xcode.app` once from Launchpad so it can finish installing required system platform components (iOS SDK components).

---

## STEP 2: Configure Free Apple ID & Enable Developer Mode on iPhone

### 1. Add Free Apple ID to Xcode
1. Open **Xcode** on your Mac.
2. In the top menu, go to **Xcode > Settings...** (or press `⌘ ,`).
3. Select the **Accounts** tab.
4. Click the **`+`** button in the bottom-left corner ➔ Select **Apple ID** ➔ Log in with your personal Apple ID / iCloud credentials.
5. Once signed in, you will see a **Personal Team** listed. This allows free code-signing directly to your physical iPhone without paying the $99/year Apple Developer fee.

### 2. Enable Developer Mode on iPhone
1. Connect your iPhone to the Mac using a USB cable.
2. If prompted on the iPhone with "Trust This Computer?", tap **Trust** and enter your passcode.
3. On the iPhone, navigate to **Settings ➔ Privacy & Security**.
4. Scroll to the bottom and select **Developer Mode**.
5. Toggle Developer Mode **ON** ➔ The iPhone will prompt to restart.
6. After rebooting, tap **Turn On** and enter your passcode to confirm.

---

## STEP 3: Start the Backend & Verify APIs

The Python FastAPI backend synthesizes multi-speaker audio via Microsoft Edge Neural TTS, extracts millisecond word boundaries, translates to Vietnamese, and provides RFC 7233 byte-range streaming.

### 1. Start the Server
Open a Terminal window:

```bash
cd /Users/hoangphong/Documents/audiotool/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Verify Backend Endpoints
* In a web browser:
  * Health check: `http://localhost:8000/api/health` ➔ Returns `{"status":"ok"}`.
  * Dialogue list: `http://localhost:8000/api/dialogue`.
* **Local LAN IP:** The Mac is currently reachable at `http://192.168.1.220:8000` (pre-configured in the mobile app).

### 3. Run Automated Pytest Suite
In the `backend` directory, run:

```bash
pytest tests/ -v
```
*(All 10 tests across TTS, audio stitching, cumulative timestamps, and HTTP 206 streaming must pass).*

---

## STEP 4: Build & Deploy to Physical iPhone

### 1. Generate Native iOS Project (Prebuild)
Open a second Terminal window:

```bash
cd /Users/hoangphong/Documents/audiotool/mobile-app

# Generates the native ios/ project directory
npx expo prebuild --platform ios
```

### 2. Configure Code Signing in Xcode
1. Open the generated Xcode workspace:
   ```bash
   open ios/AudioTool.xcworkspace
   ```
2. In Xcode's left sidebar, select the root project **AudioTool** (blue icon).
3. Select the **Signing & Capabilities** tab.
4. Check **Automatically manage signing**.
5. Under **Team**, select your **Personal Team** (your Apple ID account from Step 2).
6. If the Bundle Identifier is taken, slightly modify it (e.g. `com.hoangphong.audiotool.app`).

### 3. Deploy App to Physical iPhone
Keeping the iPhone connected via USB cable, run:

```bash
npx expo run:ios --device
```
* Select your iPhone when prompted in the Terminal list.
* Xcode compiles the native binary and installs **AudioTool** directly onto your iPhone home screen.

### 4. Trust the Developer Certificate (First Launch Only)
On first launch, if iOS displays an "Untrusted Developer" alert:
* Go to **Settings ➔ General ➔ VPN & Device Management**.
* Under *Developer App*, tap your Apple ID email.
* Tap **Trust "[Your Email]"**.
* Return to the Home Screen and open **AudioTool**.

---

## STEP 5: Verification & Test Scenarios

### ✅ Scenario 1: Spotify-like Live Lyrics Sync
1. Open the pre-seeded lesson *"Morning Commute & Highway Traffic"*.
2. Press **Play ▶**:
   * Audio streams cleanly through the iPhone speaker or headphones.
   * Words light up in Spotify Green (`#1DB954`) in real time as they are spoken.
   * Subdued Vietnamese translation is visible beneath each sentence.
   * The list auto-scrolls to keep the speaking sentence centered.
3. Tap any sentence in the list ➔ Playback immediately seeks to that sentence.

### ✅ Scenario 2: Tap-to-Translate
1. While audio is playing, tap on any English word (e.g. `highway` or `traffic`).
2. **Expected Behavior:**
   * Audio automatically pauses.
   * The iOS bottom sheet pops up displaying the word and its Vietnamese definition.
3. Tap **Resume ▶** or dismiss the sheet ➔ Audio resumes immediately.

### ✅ Scenario 3: Screen-Locked Background Playback & AirPods Controls
1. Connect Bluetooth headphones (AirPods or any wireless headset).
2. Press the power button to **Lock the iPhone screen** and pocket the device.
3. **Expected Behavior:**
   * Audio continues playing smoothly without interruption.
   * The iOS Lock Screen widget displays the lesson title, speaker name, and progress scrubber.
4. **AirPods Hands-Free Rewind:** Press the rewind button on AirPods or car steering wheel:
   * Instead of rewinding 10s mechanically, the audio jumps back to the **start of the current sentence**, allowing instant hands-free review.

### ✅ Scenario 4: Saved Library Replay
1. In the app header, tap **`📚 Saved Lessons`**.
2. A list of all previously created dialogues on the server will appear with durations and sentence counts.
3. Tap any dialogue to load its audio, lyrics, and translations instantly without re-generating.

### ✅ Scenario 5: Generate a New Dialogue On-the-Fly
1. Tap the **`⚙ Settings`** button.
2. Paste any conversational English text into the input field:
   ```text
   Alex: Hi Sarah, are you going to the tech conference this weekend?
   Sarah: Yes I am! I bought my ticket yesterday.
   Alex: Awesome, let's go together!
   ```
3. Tap **`Create & Sync Dialogue`**.
4. The backend synthesizes multi-speaker audio, extracts word boundaries, and loads the new lesson into your iPhone within seconds.
