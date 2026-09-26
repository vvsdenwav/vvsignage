# VVSignage - Digital Signage User Manual

Welcome to the VVSignage system! This guide will walk you through everything you need to know to get your TVs running, organize your media, create dynamic playlists, manage your users, and monitor your network.

---

## Part 1: Setting up a New TV

When you receive a new Android TV, you need to install the Signage App and pair it with the system.

### Step 1: Install the App (APK)
1. Copy the `VVSignageApp.apk` file onto a USB Flash Drive.
2. Plug the USB drive into the back of your Android TV.
3. On the TV, open a **File Manager** app (you can download one from the Google Play Store if your TV doesn't have one).
4. Navigate to your USB drive and select the `VVSignageApp.apk` file to install it. *(Note: You may need to click 'Allow installing from unknown sources' in the TV settings if prompted).*
5. Open the app!

### Step 2: Create a TV Account
Before logging into the TV, you need to create a dedicated TV Account in the CMS.
1. Log into your CMS Dashboard.
2. Navigate to the **TV Accounts** tab.
3. Click **+ Add TV Account**, provide a username and password, and save it.

### Step 3: Log into the TV
1. On the TV app, enter the TV Account Username and Password you just created.
2. Once logged in, the screen will display: **"Device Not Configured"**. This is completely normal! It just means the TV is waiting for instructions from the Dashboard.

---

## Part 2: The CMS Dashboard

The CMS (Content Management System) is your central hub for controlling content across your entire network. You can access it from any computer or laptop.

### User Management & Roles
The system supports multiple users with granular role-based permissions.
1. Go to the **Users** tab.
2. Click **+ Add New User**.
3. Choose a role:
   - **Administrator:** Full access to all modules, settings, and network management.
   - **Content Agent:** Restricted access. You can specify exactly which modules (e.g., Media, Playlists, Reports) they are allowed to View, Edit, or Delete.

### Managing Media
The **Media Library** is where you store and organize your content.
1. Use **Folders** to cleanly organize your images and videos by campaign or location.
2. Click **Upload** to add new files. Keep an eye on your organization's storage limit! (If you run out of space, you can upgrade your plan).
3. Use the built-in **Canvas Editor** to design custom creatives directly in your browser.

### Creating Playlists
A Playlist is a collection of media and widgets that loop endlessly.
1. Go to the **Playlists** tab and click **+ Create Playlist**.
2. Click on the playlist to open the **Visual Editor**.
3. Drag and drop media from your library. You can also embed dynamic widgets such as **Weather**, **RSS News Tickers**, or **Web Embeds** (which load websites full-screen).
4. Adjust the duration (in seconds) for each slide.
5. Click **Save**.

### Assigning Playlists to Screens
Once your playlist is ready, you need to assign it to your TVs.
1. Go to the **Screens** tab.
2. Click **+ Add Screen**. *(Note: Your ability to add screens is tied to your organization's subscription plan. If you reach your limit, you will be prompted to upgrade your account).*
3. Give it a descriptive name (e.g., "Terminal 1 Arrivals").
4. Under "Assigned TV Account", select the account that is logged into the physical TV.
5. In the "Assigned Playlist" dropdown, select your newly created playlist.
6. Click **Save**.
7. **Look at the TV!** It should instantly update from "Device Not Configured" and begin playing.

---

## Part 3: Analytics, Reports, and Auditing

The CMS provides powerful tools to track your network's performance and system security.

### Dashboard & Analytics
- **Dashboard:** Provides a bird's-eye view of your network, displaying online/offline screens, total storage usage, and a feed of recent activity.
- **Analytics:** View **Proof of Play** statistics to see exactly how many times a specific media asset or campaign was shown across your network.

### Reports
- Generate custom reports based on date ranges and specific media assets.
- Export these reports to PDF or CSV to share with advertisers, stakeholders, or management.

### Audit Logs
- The **Audit Logs** tab tracks all administrative actions in the system. 
- If a user deletes a playlist, uploads media, or modifies a screen, it is permanently logged here with a timestamp and the user's name. You can export these logs for security and compliance purposes.

---

## Part 4: Offline Mode & Connectivity

The VVSignage system is incredibly resilient to network drops.
- **Offline Playback:** Once a TV downloads its assigned playlist, it **does not need the internet to play**. If the internet goes down, the TV will continue looping its current videos indefinitely without any black screens.
- **Background Updates:** When you assign new videos, the TV downloads them silently in the background while the old video is playing. It only switches over once the download is 100% complete.
- **Alerts:** If a TV loses its internet connection, its status will turn red on your CMS Dashboard so your team can investigate.

---

## Part 5: The Tablet Remote (Overrides)

Floor staff or managers can use the Tablet app to instantly change what is playing on the TVs in emergencies or special events.

1. Open the **VVTabletApp** on your Android Tablet.
2. Log in with your TV Account credentials.
3. You will see a grid of buttons pre-configured for your location.
4. Pressing a button (e.g., "Emergency Evacuation" or "Flight Delayed") will **instantly** interrupt the TV's normal loop and display the chosen override message.
5. These messages usually have a timer. Once the timer runs out, the TV will automatically resume playing its normal advertising loop.
