# iPad Kiosk Setup Guide for Cavali Hookah Lounge

This guide provides step-by-step instructions for locking down restaurant iPads to run the Cavali Ordering App in a dedicated, secure kiosk mode. This prevents customers from exiting the app, accessing other apps, or tampering with iOS settings.

---

## Option 1: Apple Guided Access (Manual Setup - Best for < 10 Devices)

Guided Access is a built-in iPadOS feature that locks the device into a single active app. It is simple to configure directly on the device.

### Step 1: Enable Guided Access
1. Open **Settings** on the iPad.
2. Go to **Accessibility** > **Guided Access**.
3. Toggle **Guided Access** to **ON**.
4. Tap **Passcode Settings**:
   - Tap **Set Guided Access Passcode** and enter a secure 6-digit passcode (this passcode is required to exit Kiosk mode; keep it confidential from customers!).
   - (Optional) Enable Face ID or Touch ID if you want staff to be able to unlock it quickly.
5. Tap **Time Limits**:
   - Turn off any warning sounds or speak options (kiosk iPads should stay active indefinitely).
6. Enable **Accessibility Shortcut**:
   - Toggle to **ON** (allows triple-clicking the Home or Power button to start Guided Access).

### Step 2: Configure Display Settings (Prevent Screen Sleeping)
1. Go back to **Settings** > **Display & Brightness**.
2. Tap **Auto-Lock** and set it to **Never**. (The Cavali app has `expo-keep-awake` enabled, but this setting acts as a fail-safe).

### Step 3: Launch Kiosk Mode
1. Open the **Cavali App**.
2. **Triple-click** the iPad's physical **Home button** (or **Power button** on iPads without a Home button).
3. The Guided Access configuration screen will appear.
4. Tap **Options** in the bottom-left corner and configure:
   - **Sleep/Wake Button**: Toggle **OFF** (prevents customers from turning off the screen).
   - **Volume Buttons**: Toggle **ON** or **OFF** (depending on if you want customers adjusting volume).
   - **Motion**: Toggle **OFF** (prevents screen rotation if you mounted the iPad in a fixed orientation).
   - **Keyboards**: Toggle **ON**.
   - **Touch**: Toggle **ON**.
   - **Time Limit**: Toggle **OFF**.
5. (Optional) **Disable specific screen regions**:
   - Draw circles with your finger over areas you want to block (e.g., the top status bar area to prevent dragging down the Control Center or Notifications).
6. Tap **Start** in the top-right corner. The iPad is now locked into the Cavali app.

### Step 4: Exiting Guided Access
1. **Triple-click** the Home or Power button.
2. Enter your 6-digit Guided Access passcode.
3. Tap **End** in the top-left corner.

---

## Option 2: Supervised Single App Mode (MDM - Best for Scale & Security)

If you are deploying dozens of iPads, you should use **Mobile Device Management (MDM)** and **Apple Configurator** to place the iPads in **Supervised Single App Mode**. This is the most secure method: if the iPad restarts or runs out of battery, it will boot directly back into the Cavali app automatically, with no manual intervention needed.

### Prerequisites:
- A Mac running **Apple Configurator 2** (free from the Mac App Store).
- An Apple Business Manager (ABM) account (optional, for automated enrollment).
- An MDM provider (e.g., **Jamf Now**, **SimpleMDM**, **MobileIron**, or **Scalefusion**). Many MDMs are free for the first few devices.

### Step 1: Supervise the iPads (Using a Mac)
1. Install and open **Apple Configurator 2** on your Mac.
2. Connect the iPad to your Mac via USB.
3. Select the iPad in Configurator and click **Prepare**.
4. Select **Manual Configuration**, check **Supervise devices**, and check **Allow devices to associate with other computers**. Click Next.
5. Choose **Do not enroll in MDM** (if manually configuring profiles) or select your MDM server URL.
6. Create or select your organization profile.
7. Under "Configure iOS Setup Assistant", select which screens to skip during iPad setup. Select **Don't show any of these steps** for a fast setup.
8. Click **Prepare** (Warning: this will erase the device and reinstall iPadOS with Supervisor privileges).

### Step 2: Configure Single App Mode Profile in MDM
1. Log into your MDM Dashboard.
2. Create a new **Device Profile / Restrictions Policy**.
3. Locate the **Kiosk Mode** or **Single App Mode** settings.
4. Select the target app by entering its iOS App Store URL or the App Bundle Identifier:
   - Bundle Identifier: `com.cavali.lounge`
5. Configure advanced kiosk options in MDM:
   - **Disable Touch**: No (keep enabled).
   - **Disable Screen Rotation**: Yes (lock to Landscape or Portrait depending on mounts).
   - **Disable Sleep/Wake Button**: Yes (prevents manual sleep).
   - **Disable Volume Buttons**: Optional.
   - **Disable Auto-Lock**: Yes.
6. Push the profile to the enrolled supervised iPad. The device will lock into the Cavali app immediately.

---

## Cavali App Admin Settings (Setting Kiosk Table)

The Cavali app includes a hidden administration panel to configure each iPad for its specific table:

1. Go to the **Welcome Check-in Screen** (where customers enter name/phone).
2. Tap the **"Cavali"** logo text **5 times in quick succession** (must be within 2.5 seconds).
3. An **Admin Verification** modal will appear.
4. Enter the staff passcode: **`1947`**.
5. Once unlocked, the **Kiosk Settings** will open:
   - **Kiosk Table Number**: Enter the physical table number for this iPad (e.g., `7`).
   - **Hide iOS Status Bar**: Toggle ON to hide the time, battery indicator, and Wi-Fi symbol for a clean full-screen look.
   - **Clear Kiosk**: Tap this to reset the iPad back to a standard non-kiosk device.
6. Tap **Save Settings**. The check-in screen will now be locked to the configured table, hiding the table input field from customers and defaulting all orders to that table.
