import { toast } from "react-toastify";

function StatusDot({ status }) {
  const color =
    status === "online"
      ? "bg-emerald-500"
      : status === "afk"
        ? "bg-amber-400"
        : "bg-gray-400";

  const label =
    status === "online" ? "Online" : status === "afk" ? "AFK" : "Offline";

  return (
    <span
      title={label}
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${color}`}
      aria-label={label}
    />
  );
}

export default function UsersSidebar({
  users,
  currentUserId,
  loadError,
  onAddFriend,
  onBanUser,
  onMessageUser,
}) {
  const sorted = [...users].sort((a, b) => {
    const rank = (s) => (s === "online" ? 0 : s === "afk" ? 1 : 2);
    const d = rank(a.status) - rank(b.status);
    if (d !== 0) return d;
    return (a.username ?? "").localeCompare(b.username ?? "");
  });

  return (
    <aside className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col h-full">
      <div className="px-3 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">All users</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {users.length} registered · presence live
        </p>
        {loadError ? (
          <p className="text-xs text-amber-700 mt-2 leading-snug">
            {loadError}
          </p>
        ) : null}
      </div>

      <ul className="flex-1 overflow-y-auto p-2 space-y-2">
        {sorted.length === 0 && !loadError ? (
          <li className="px-2 py-6 text-center text-xs text-gray-500">
            No users in the directory yet. Register another account or refresh
            after the API is running.
          </li>
        ) : null}
        {sorted.length === 0 && loadError ? (
          <li className="px-2 py-4 text-center text-xs text-gray-500">
            Fix the error above, then reload the page. Use the same terminal for
            Vite and ensure the backend is on port 3000 (or set{" "}
            <code className="text-[10px]">VITE_API_URL</code>).
          </li>
        ) : null}
        {sorted.map((u) => (
          <li
            key={u.id}
            className={`rounded-md border px-2 py-2 text-sm ${
              u.id === currentUserId
                ? "border-blue-200 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <StatusDot status={u.status} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">
                  {u.username}
                  {u.id === currentUserId ? (
                    <span className="text-xs font-normal text-blue-600 ml-1">
                      (you)
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] text-gray-500 capitalize">
                  {u.status}
                </div>
              </div>
            </div>

            {u.id !== currentUserId ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  className="rounded bg-blue-600 px-2 py-1 text-white disabled:opacity-50"
                  disabled={u.isBlocked}
                  // onClick={() => onMessageUser(u.id)}
                  onClick={() => {
                    onMessageUser(u.id);
                    toast.info(`Opening chat with ${u.username}`);
                  }}
                >
                  Message
                </button>
                <button
                  type="button"
                  className="rounded bg-gray-900 px-2 py-1 text-white disabled:opacity-50"
                  disabled={
                    u.isBlocked ||
                    u.isFriend ||
                    u.hasPendingRequestToThem ||
                    u.hasPendingRequestFromThem
                  }
                  // onClick={() =>
                  //   onAddFriend(
                  //     u.username,
                  //     window.prompt(
                  //       `Optional note for ${u.username}`,
                  //       "Let's connect on chat.",
                  //     ) || "",
                  //   )
                  // }

                  onClick={() => {
                    onAddFriend(u.username, "");
                  }}
                >
                  {u.isFriend
                    ? "Friend"
                    : u.hasPendingRequestToThem
                      ? "Requested"
                      : u.hasPendingRequestFromThem
                        ? "Needs reply"
                        : "Add friend"}
                </button>
                <button
                  type="button"
                  className="rounded bg-red-600 px-2 py-1 text-white disabled:opacity-50"
                  disabled={u.isBlocked}
                  // onClick={() => onBanUser(u.id)}
                  onClick={() => {
                    onBanUser(u.id);
                    toast.error(`${u.username} has been blocked`);
                  }}
                >
                  {u.isBlocked ? "Blocked" : "Ban"}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
