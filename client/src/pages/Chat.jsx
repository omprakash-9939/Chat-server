import { useEffect, useState, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom";
import { socket } from "../sockets/socket";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import UsersSidebar from "../components/UsersSidebar";
import api from "../api/axios";
import { formatTypingNames } from "../utils/typingLabel";
import {
  clearAuthState,
  readAuthToken,
  readChatUser,
  writeChatUser,
} from "../authStorage";

function normalizeMessage(m) {
  return {
    ...m,
    reads: m.reads ?? [],
  };
}

export default function Chat() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMessageId, setEditMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showDeleteMsgModal, setShowDeleteMsgModal] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => readChatUser());
  const [users, setUsers] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [contacts, setContacts] = useState({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    bans: [],
  });
  const [usersLoadError, setUsersLoadError] = useState(null);
  const [typers, setTypers] = useState({});
  const [banner, setBanner] = useState("");
  const roomIdRef = useRef("");
  const typingClearTimers = useRef({});
  const currentUserIdRef = useRef(null);

  const token = readAuthToken();
  const activeRoom = rooms.find((room) => room.id === roomId) || null;

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  const refreshRooms = useCallback(async () => {
    const res = await api.get("rooms");
    setRooms(Array.isArray(res.data) ? res.data : []);
    return res.data;
  }, []);

  const refreshUsers = useCallback(() => {
    api
      .get("users")
      .then((res) => {
        const data = res.data;
        setUsers(Array.isArray(data) ? data : []);
        setUsersLoadError(null);
      })
      .catch((err) => {
        const status = err?.response?.status;
        const msg =
          status === 401
            ? "Unauthorized - log in again."
            : err?.message || "Request failed";
        setUsers([]);
        setUsersLoadError(msg + (status ? ` (HTTP ${status})` : ""));
      });
  }, []);

  const refreshContacts = useCallback(() => {
    api
      .get("users/contacts")
      .then((res) => {
        setContacts(
          res.data || {
            friends: [],
            incomingRequests: [],
            outgoingRequests: [],
            bans: [],
          },
        );
      })
      .catch((err) => {
        console.error("users/contacts", err?.response?.status, err?.message);
      });
  }, []);

  const joinRoom = useCallback(async (id) => {
    roomIdRef.current = id;
    setRoomId(id);
    setMessages([]);
    setMessagesLoading(true);
    socket.emit("join_room", id);
    setTypers({});
    try {
      const res = await api.get(`messages/${id}`);
      const chronological = [...res.data.messages]
        .reverse()
        .map(normalizeMessage);
      setMessages(chronological);
    } finally {
      setMessagesLoading(false);
    }
    socket.emit("activity");
    socket.emit("mark_seen", { roomId: id });
  }, []);

  useEffect(() => {
    if (!token) return;
    const initialLoad = window.setTimeout(() => {
      refreshRooms().catch((e) =>
        console.error("rooms", e?.response?.status, e?.message),
      );
      api
        .get("users/me")
        .then((res) => {
          setCurrentUser(res.data);
          writeChatUser(res.data);
        })
        .catch((err) => {
          console.error("users/me", err?.response?.status, err?.message);
          if (!readChatUser()) {
            setCurrentUser(null);
          }
        });
      refreshUsers();
      refreshContacts();
    }, 0);
    const usersPoll = setInterval(() => {
      refreshUsers();
      refreshContacts();
    }, 30_000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(usersPoll);
    };
  }, [token, refreshRooms, refreshUsers, refreshContacts]);

  useEffect(() => {
    if (!token) return;

    socket.auth = { token };

    const onReceive = (msg) => {
      const active = roomIdRef.current;
      if (!active || msg.roomId !== active) return;
      const normalized = normalizeMessage(msg);
      setMessages((prev) => {
        if (prev.some((m) => m.id === normalized.id)) return prev;
        return [...prev, normalized];
      });
      socket.emit("mark_seen", { roomId: msg.roomId });
    };

    const onMessageUpdated = (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? normalizeMessage(msg) : m)),
      );
    };

    const onMessageDeleted = (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? normalizeMessage(msg) : m)),
      );
    };

    const onMessagesSeen = ({ roomId: rid, userId: readerId }) => {
      if (rid !== roomIdRef.current || !readerId) return;
      setMessages((prev) =>
        prev.map((m) => {
          const reads = m.reads ?? [];
          if (reads.some((r) => r.userId === readerId)) return m;
          return {
            ...m,
            reads: [
              ...reads,
              { userId: readerId, readAt: new Date().toISOString() },
            ],
          };
        }),
      );
    };

    const onPresence = ({ userId, status }) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u)),
      );
    };

    const clearTyperLater = (uid) => {
      if (typingClearTimers.current[uid]) {
        clearTimeout(typingClearTimers.current[uid]);
      }
      typingClearTimers.current[uid] = setTimeout(() => {
        setTypers((prev) => {
          const next = { ...prev };
          delete next[uid];
          return next;
        });
        delete typingClearTimers.current[uid];
      }, 4000);
    };

    const onTyping = ({ userId, username }) => {
      if (userId === currentUserIdRef.current) return;
      setTypers((prev) => ({ ...prev, [userId]: username }));
      clearTyperLater(userId);
    };

    const onStopTyping = ({ userId }) => {
      if (typingClearTimers.current[userId]) {
        clearTimeout(typingClearTimers.current[userId]);
        delete typingClearTimers.current[userId];
      }
      setTypers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    socket.on("receive_message", onReceive);
    socket.on("message_updated", onMessageUpdated);
    socket.on("message_deleted", onMessageDeleted);
    socket.on("messages_seen", onMessagesSeen);
    socket.on("presence_update", onPresence);
    socket.on("user_typing", onTyping);
    socket.on("user_stop_typing", onStopTyping);
    const onSocketConnect = () => {
      refreshUsers();
      refreshContacts();
    };
    socket.on("connect", onSocketConnect);
    socket.connect();

    const ping = () => socket.emit("activity");
    const interval = setInterval(ping, 20_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", ping);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", ping);
      Object.values(typingClearTimers.current).forEach(clearTimeout);
      typingClearTimers.current = {};
      socket.off("receive_message", onReceive);
      socket.off("message_updated", onMessageUpdated);
      socket.off("message_deleted", onMessageDeleted);
      socket.off("messages_seen", onMessagesSeen);
      socket.off("presence_update", onPresence);
      socket.off("user_typing", onTyping);
      socket.off("user_stop_typing", onStopTyping);
      socket.off("connect", onSocketConnect);
      socket.disconnect();
    };
  }, [token, refreshUsers, refreshContacts]);

  if (!token) {
    return <Navigate to="/" replace />;
  }
  const signOut = async () => {
    try {
      await api.post("auth/logout");
    } catch (err) {
      console.error("logout", err?.response?.status, err?.message);
    } finally {
      toast.info("Signed out");

      socket.disconnect();
      clearAuthState();
      window.location.href = "/";
    }
  };

  const sendMessage = (content) => {
    if (!roomId || !content.trim() || activeRoom?.isFrozen) return;
    socket.emit("send_message", {
      roomId,
      content,
    });
  };

  const createRoom = async (name) => {
    if (!name.trim()) {
      toast.warning("Room name cannot be empty");
      return;
    }
    try {
      const res = await api.post("rooms", { name: name.trim() });
      await refreshRooms();
      await joinRoom(res.data.id);
      toast.success("Room created successfully");
    } catch (error) {
      toast.error("Failed to create room");
    }
  };

  const joinRoomById = async (id) => {
    if (!id.trim()) {
      toast.warning("Room ID is required");
      return;
    }
    try {
      const res = await api.post(`rooms/join/${id.trim()}`);
      await refreshRooms();
      await joinRoom(res.data.id);
      toast.success("Joined room");
    } catch (error) {
      toast.error("Failed to join room");
    }
  };

  const startDirectMessage = async (userId) => {
    const res = await api.post(`rooms/direct/${userId}`);
    await refreshRooms();
    await joinRoom(res.data.id);
  };

  const sendFriendRequest = async (username, message = "") => {
    if (!username?.trim()) return;

    try {
      await api.post("users/friend-requests", {
        username: username.trim(),
        message: message.trim() || undefined,
      });
      toast.success(`Request sent to ${username}`);
      refreshUsers();
      refreshContacts();
    } catch (error) {
      toast.error("Failed to send request");
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      await api.post(`users/friend-requests/${requestId}/respond`, { action });
      toast.success(
        action === "accept" ? "Friend request accepted " : "Request declined",
      );
      refreshUsers();
      refreshContacts();
    } catch (error) {
      toast.error("Failed to respond");
    }
  };

  const removeFriend = async (friendId) => {
    try {
      await api.delete(`users/friends/${friendId}`);
      toast.warning("Friend removed");
      refreshUsers();
      refreshContacts();
    } catch (error) {
      toast.error("Failed to remove friend");
    }
  };

  const banUser = async (userId) => {
    try {
      await api.post(`users/bans/${userId}`);
      toast.error("User banned ");
      refreshUsers();
      refreshContacts();
      await refreshRooms();
      if (roomId) {
        await joinRoom(roomId);
      }
    } catch (error) {
      toast.error("Failed to ban user");
    }
  };

  const editMessage = (messageId, currentContent) => {
    setEditMessageId(messageId);
    setEditContent(currentContent);
    setShowEditModal(true);
  };

  const updateMessage = async () => {
    if (!editContent.trim()) {
      toast.warning("Message cannot be empty");
      return;
    }

    try {
      const res = await api.patch(`messages/item/${editMessageId}`, {
        content: editContent,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === res.data.id ? normalizeMessage(res.data) : m,
        ),
      );

      toast.success("Message updated");
      setShowEditModal(false);
    } catch {
      toast.error("Failed to update message");
    }
  };
  const openDeleteMessageModal = (messageId) => {
    setDeleteMessageId(messageId);
    setShowDeleteMsgModal(true);
  };

  const confirmDeleteMessage = async () => {
    try {
      const res = await api.delete(`messages/item/${deleteMessageId}`);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === res.data.id ? normalizeMessage(res.data) : m,
        ),
      );

      toast.error("Message deleted");
      setShowDeleteMsgModal(false);
    } catch {
      toast.error("Failed to delete message");
    }
  };
  const updatePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.warning("Fill all fields");
      return;
    }

    try {
      await api.post("users/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password updated");
      setShowPasswordModal(false);
    } catch {
      toast.error("Failed to change password");
    }
  };
  const deleteAccount = async () => {
    try {
      await api.post("users/delete-account", { password: deletePassword });

      toast.success("Account deleted");

      clearAuthState();
      socket.disconnect();
      window.location.href = "/";
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const typingText = formatTypingNames(typers);

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-gray-100">
      <Sidebar
        rooms={rooms}
        onJoinRoom={joinRoom}
        onCreateRoom={createRoom}
        onJoinById={joinRoomById}
        currentUser={currentUser}
        contacts={contacts}
        onSignOut={signOut}
        // onChangePassword={changePassword}
        onChangePassword={() => setShowPasswordModal(true)}
        // onDeleteAccount={deleteAccount}
        onDeleteAccount={() => setShowDeleteModal(true)}
        onOpenDirectMessage={startDirectMessage}
        onRespondToRequest={respondToRequest}
        onRemoveFriend={removeFriend}
        banner={banner}
      />
      <ChatWindow
        room={activeRoom}
        messages={messages}
        onSend={sendMessage}
        loading={messagesLoading}
        typingText={typingText}
        currentUserId={currentUser?.id}
        onEditMessage={editMessage}
        // onDeleteMessage={deleteMessage}
        onDeleteMessage={openDeleteMessageModal}
      />
      <UsersSidebar
        users={users}
        currentUserId={currentUser?.id}
        loadError={usersLoadError}
        onAddFriend={sendFriendRequest}
        onBanUser={banUser}
        onMessageUser={startDirectMessage}
        
      />

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-semibold mb-3">Delete Account</h2>

            <input
              type="password"
              placeholder="Enter password"
              className="w-full border p-2 rounded mb-3"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                className="bg-red-600 text-white px-3 py-1 rounded"
                onClick={deleteAccount}
              >
                Delete
              </button>

              <button
                className="bg-gray-300 px-3 py-1 rounded"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-semibold mb-3">Edit Message</h2>

            <textarea
              className="w-full border p-2 rounded mb-3"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={updateMessage}
              >
                Save
              </button>

              <button
                className="bg-gray-300 px-3 py-1 rounded"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteMsgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-semibold mb-3">Delete this message?</h2>

            <div className="flex gap-2">
              <button
                className="bg-red-600 text-white px-3 py-1 rounded"
                onClick={confirmDeleteMessage}
              >
                Delete
              </button>

              <button
                className="bg-gray-300 px-3 py-1 rounded"
                onClick={() => setShowDeleteMsgModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-semibold mb-3">Change Password</h2>

            <input
              type="password"
              placeholder="Current password"
              className="w-full border p-2 rounded mb-2"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="New password"
              className="w-full border p-2 rounded mb-3"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={updatePassword}
              >
                Update
              </button>

              <button
                className="bg-gray-300 px-3 py-1 rounded"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
