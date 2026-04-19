#  Online Chat Server

A full-stack web-based chat application designed to deliver a classic real-time messaging experience. This system supports user authentication, chat rooms, personal messaging, file sharing, moderation tools, and persistent message history, while maintaining scalability for moderate usage (up to 300 concurrent users).

---

#  Features Overview

## 👤 User Accounts & Authentication

* **Registration**

  * Users can register using email, username, and password
  * Email and username must be unique
  * Username is immutable after registration

* **Authentication**

  * Secure login using email and password
  * Persistent sessions across browser restarts
  * Logout affects only the current session

* **Password Management**

  * Password reset via email
  * Password change for authenticated users
  * Passwords stored securely using hashing

* **Account Deletion**

  * Users can permanently delete their account
  * Owned rooms are deleted along with all messages and files
  * Membership in other rooms is removed

---

##  Presence & Sessions

* Presence states:

  * **Online**
  * **AFK** (inactive for >1 minute across all tabs)
  * **Offline**

* Multi-tab logic:

  * Active in any tab → Online
  * All tabs inactive → AFK
  * All tabs closed → Offline

* Session Management:

  * View active sessions (IP/device)
  * Logout specific sessions independently

---

##  Contacts / Friends

* Send friend requests:

  * By username
  * From chat room participants

* Friend system:

  * Requires acceptance
  * Remove friends anytime

* User-to-user ban:

  * Blocks all communication
  * Freezes existing chat history

* Personal messaging allowed only if:

  * Users are friends
  * No bans exist between them

---

##  Chat Rooms

### Room Types

* **Public Rooms**

  * Visible in catalog
  * Searchable
  * Join freely unless banned

* **Private Rooms**

  * Invitation-only
  * Not publicly visible

### Room Properties

* Name (unique)
* Description
* Visibility
* Owner
* Admins
* Members
* Banned users list

### Roles

* **Owner**

  * Full control
  * Cannot leave the room
  * Can delete room

* **Admins**

  * Moderate users
  * Ban/unban members
  * Delete messages
  * Manage roles (except owner)

### Room Rules

* Leaving:

  * Members can leave freely
  * Owner must delete instead

* Ban behavior:

  * Removed users cannot rejoin
  * Lose access to messages and files

* Room deletion:

  * Permanently deletes all messages and files

---

##  Messaging System

* Supports:

  * Plain text (UTF-8)
  * Multiline messages
  * Emojis
  * Attachments
  * Message replies

* Features:

  * Message editing (with "edited" label)
  * Message deletion (by author or admin)
  * Chronological ordering
  * Infinite scroll for history

* Offline handling:

  * Messages are stored and delivered on next login

* Message size limit:

  * 3 KB

---

## 📎 Attachments

* Supported:

  * Images
  * Files (any type)

* Upload methods:

  * File picker
  * Copy-paste

* Limits:

  * Max file size: 20 MB
  * Max image size: 3 MB

* Access control:

  * Only accessible to current room members
  * Lost access → files become inaccessible

---

##  Notifications

* Unread indicators for:

  * Chat rooms
  * Personal chats

* Cleared when chat is opened

* Presence updates:

  * Propagated in under 2 seconds

---

# ⚙️ Non-Functional Requirements

##  Scalability

* Supports:

  * 3000 concurrent users
  * 10000 users per room
  * Unlimited rooms per user

##  Performance

* Message delivery: < 2 seconds
* Presence updates: < 2 seconds
* Smooth performance with 10,000+ messages

##  Persistence

* Long-term storage of messages
* Infinite scrolling for history

##  File Storage

* Stored on local filesystem
* Persistent unless room is deleted

## Reliability

Ensures consistency of:

* Room membership
* Ban lists
* File access
* Message history
* Roles and permissions

---

# UI/UX Design

## Layout

* Top navigation bar
* Right sidebar:
* Left Sidebar

  * Rooms
  * Contacts
* Main chat window
* Message input at bottom

## Chat Behavior

* Auto-scroll if user is at bottom
* No auto-scroll when viewing older messages
* Infinite scroll for history

## Message Input

* Multiline text
* File attachments
* Reply functionality

## Admin Panel

* Manage members
* Assign/remove admins
* Ban/unban users
* Delete messages
* Delete room

---

#  Advanced Features

## Jabber (XMPP) Integration

* External Jabber client support
* Federation between servers

### Federation Capabilities

* Cross-server messaging
* Multi-server communication setup

### Load Testing

* 500+ users per server
* Bi-directional messaging between servers

### Admin Dashboard

* Connection monitoring
* Federation traffic stats

---

#  Deployment

## Requirements

* Docker
* Docker Compose

## Run Application

```bash
docker compose up --build
```

* Application will be available on configured ports
* All services (backend, frontend, database, storage) start together

---

#  Tech Stack (Example)

* **Frontend**: React.js
* **Backend**: Node.js (Express / WebSocket)
* **Database**: PostgreSQL
* **Real-time**: WebSocket / Socket.IO 
* **Storage**: Local filesystem
* **Auth**: JWT / Session-based
* **Containerization**: Docker

---

#  Key Design Highlights

* Multi-tab presence tracking
* Strong access control for files and rooms
* Clear separation of personal vs room messaging
* Scalable architecture for moderate load
* Classic chat UX (not social-media style)

---

# 📂 Project Structure

```
/client        → Frontend (React)
/server        → Backend API & WebSocket server
/docker        → Docker configs
```

---

#  Submission

* Public GitHub repository
* Must run using:

  ```bash
  docker compose up
  ```

---

# ✅ Conclusion

This project implements a fully functional, scalable, and reliable classic web chat system with modern real-time capabilities. It covers all essential aspects including authentication, messaging, file sharing, moderation, and extensibility with federation support via Jabber protocol.

---
