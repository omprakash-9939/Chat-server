export const CHAT_USER_KEY = "chatUser";
export const CHAT_TOKEN_KEY = "token";

export function readAuthToken() {
  return localStorage.getItem(CHAT_TOKEN_KEY);
}

export function writeAuthToken(token) {
  localStorage.setItem(CHAT_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(CHAT_TOKEN_KEY);
}

export function readChatUser() {
  try {
    const raw = localStorage.getItem(CHAT_USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u && typeof u === "object" && u.id && u.username) return u;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeChatUser(user) {
  if (user && user.id) {
    localStorage.setItem(CHAT_USER_KEY, JSON.stringify(user));
  }
}

export function clearChatUser() {
  localStorage.removeItem(CHAT_USER_KEY);
}

export function clearAuthState() {
  clearAuthToken();
  clearChatUser();
}
