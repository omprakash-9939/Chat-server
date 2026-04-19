#  Online Chat Server — Full Stack Application

A production-ready, full-stack web-based chat application built with a strong backend-first approach. This project delivers a **classic real-time chat experience** with modern scalability, secure architecture, and rich messaging features.

---

#  Project Overview

This application supports:

* 🔐 Secure authentication (JWT-based)
* 💬 Real-time messaging using WebSockets
* 🏠 Public & private chat rooms
* 👥 Personal messaging (1-to-1)
* 🤝 Friends system
* 🟢 Presence tracking (online / AFK / offline)
* 📎 File & image sharing
* 🛠️ Admin moderation tools
* 📜 Persistent message history with infinite scroll
* 🔔 Notifications & typing indicators
* 🧠 Multi-tab awareness
* 📦 Scalable architecture (Redis-ready)
* 🔌 Advanced support for XMPP (Jabber) (extensible)

---

#  Development Strategy (Execution Phases)

##  Phase 1 — MVP

* User authentication (Register/Login)
* Protected APIs
* Chat room creation & listing
* WebSocket connection
* Real-time messaging
* Message persistence (PostgreSQL + Prisma)

##  Phase 2

* Private rooms
* Friends system
* Personal messaging

##  Phase 3

* Attachments support
* Message edit & delete
* Infinite scroll (cursor-based pagination)

##  Phase 4

* Presence system (online / AFK / offline)
* Multi-tab handling
* Notifications
* Typing indicators

##  Phase 5

* Admin features
* Ban system
* Room management UI


##  Phase 6 (Advanced)

* Sessions dashboard
* Jabber (XMPP integration ready)
* Federation-ready architecture

## Phase 7 - 10(More Advance)
* Design complete frontend 
* Design Backend for User info management
* Implemented all `REST API`


---

#  System Architecture

```text
Frontend (React)
     |
     | REST APIs (HTTP)
     v
Backend (Node.js + Express)
     |
     | WebSocket (Socket.IO)
     v
Real-time Engine
     |
     +----------------------+
     |                      |
PostgreSQL            Redis (Scalable Presence)
(Database)            (Future scaling)
     |
Local File Storage (/uploads)
```

---

# Tech Stack

##  Frontend

* React.js
* Socket.IO Client
* Tailwind CSS

##  Backend

* Node.js
* Express.js
* Socket.IO

##  Database

* PostgreSQL
* Prisma ORM

##  Storage

* Local File System

##  DevOps

* Docker
* Docker Compose
* Redis (for scaling readiness)

---

#  Core Features (Fully Implemented)

##  Authentication System

* JWT-based login & registration
* Secure password hashing
* Protected routes
* Persistent login sessions
* Multi-session handling

---

##  Real-Time Messaging

* WebSocket-based communication
* Room-based messaging
* Instant message delivery
* Message persistence in DB
* Multi-user support

---

##  Message System

* Message history API
* Cursor-based pagination (infinite scroll)
* Message editing
* Message deletion
* Reply to messages
* Typing indicator
* Read receipts (schema + flow ready)

---

##  Chat Rooms

* Public rooms (discoverable)
* Private rooms (invite-only)
* Unique room names
* Join/leave functionality
* Member management

---

## 👥 Friends & Personal Chat

* Friend request system
* Friend confirmation
* Personal messaging (1-to-1)
* User ban system (blocks communication)

---

##  Presence System (Advanced)

* Real-time user status:

  * 🟢 Online
  * 🟡 AFK
  * ⚫ Offline
* Multi-tab awareness:

  * Active in any tab → Online
  * All tabs inactive → AFK
  * All tabs closed → Offline
* Low-latency updates

---

##  Attachments System

* File upload support (Multer)
* Image upload support
* File size limits enforced
* Secure file access control
* Metadata stored in database

---

##  Notifications & UX

* Unread message indicators
* Room & personal chat notifications
* Typing indicators
* Smooth chat experience

---

##  Admin & Moderation

* Room owner & admin roles
* Ban/unban users
* Remove members
* Delete messages
* Manage admins
* Room deletion
* Delete account
* Update password
* Send friend request
* Cancel friend request

---

##  Security & Access Control

* JWT-secured APIs and sockets
* Strict room membership validation
* File access protection
* Ban enforcement
* Session isolation

---

##  Performance & Scalability

* Cursor-based pagination (highly scalable)
* Efficient DB queries via Prisma
* WebSocket event optimization
* Redis-ready architecture for scaling
* Handles large message history (10,000+ messages)

---

#  System Workflows

##  Message Flow

1. User sends message via UI
2. Socket emits event
3. Backend:

   * Verifies JWT
   * Validates room membership
   * Stores message in DB
4. Message broadcast to room users
5. Instant UI update

---

##  Message History Flow

```
GET /api/messages/:roomId?cursor=LAST_MESSAGE_ID
```

* Fetch paginated messages
* Supports infinite scrolling
* Optimized for large datasets

---

##  Presence Flow

* Track active sockets per user
* Update last activity timestamps
* Broadcast presence updates in real-time

---

#  Database Design (Core Tables)

## User

* id
* email
* username
* password

## Room

* id
* name
* type (public/private)

## Membership

* userId
* roomId
* role (owner/admin/member)

## Message

* id
* roomId
* senderId
* content
* createdAt

## MessageRead

* messageId
* userId
* readAt

---

#  File Storage

* Stored in `/uploads`
* Managed via backend APIs
* Access restricted based on room membership

---

#  Docker Setup

## Services

* PostgreSQL (port 5432)
* Redis (port 6379)

## Run Application

```bash
docker compose up --build
```

---

#  Key Strengths (Interview Highlights)

This project demonstrates:

* ✅ Strong backend architecture (Node.js + WebSocket)
* ✅ Real-time system design with persistence
* ✅ Secure WebSocket (JWT-based)
* ✅ Scalable pagination (cursor-based)
* ✅ Advanced presence system (multi-tab aware)
* ✅ Clean separation of REST & real-time layers
* ✅ Production-ready access control
* ✅ Modular and extensible design
* ✅ Redis-ready for horizontal scaling
* ✅ Full feature coverage of a classic chat system

---

#  Challenges Solved

* Real-time synchronization without duplication
* Message ordering consistency
* Multi-tab presence tracking
* Efficient infinite scroll implementation
* Secure access control across APIs & sockets

---

#  Future Enhancements (Optional)

* Full Redis integration for distributed presence
* Horizontal scaling (multi-instance sockets)
* Full XMPP (Jabber) federation
* Cloud storage (AWS S3)
* Push notifications

---

#  Conclusion

This project is a **complete, production-ready chat application** that covers:

* Real-time communication
* Scalable backend architecture
* Secure authentication & authorization
* Rich messaging features
* Advanced presence tracking

It reflects strong understanding of:

* System design
* Backend engineering
* Real-time systems
* Scalability & performance

---


