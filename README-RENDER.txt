DAVE BOT - RENDER SETUP
=======================

IMPORTANT
---------
This bot uses Baileys multi-file authentication. On Render, the auth_info folder
must be stored on a persistent disk if you want the WhatsApp login to survive
restarts/deploys.

RENDER SERVICE SETTINGS
-----------------------
Service type: Web Service
Language: Node
Build command: npm install
Start command: npm start

For a persistent WhatsApp session, use a PAID Render service and add a persistent
Disk with a mount path such as:
    /data

Then add this environment variable:
    AUTH_DIR=/data/auth_info

The bot will print the WhatsApp QR code in the Render service logs when a new
login is required. Scan it from WhatsApp > Linked devices > Link a device.

Do NOT upload the auth_info folder to GitHub. It is intentionally ignored by
.gitignore.

FREE RENDER LIMITATION
----------------------
Render Free web services can spin down after inactivity and do not support
persistent disks. That means the Free plan is not suitable for keeping this
WhatsApp bot reliably online 24/7 with a persistent local Baileys session.
