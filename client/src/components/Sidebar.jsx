import { useMemo, useState } from "react";
import { toast } from "react-toastify";

export default function Sidebar({
  rooms,
  onJoinRoom,
  onCreateRoom,
  onJoinById,
  currentUser,
  contacts,
  onSignOut,
  onChangePassword,
  onDeleteAccount,
  onOpenDirectMessage,
  onRespondToRequest,
  onRemoveFriend,
  banner,
}) {
  const [newName, setNewName] = useState("");
  const [joinId, setJoinId] = useState("");

  const grouped = useMemo(
    () => ({
      groupRooms: rooms.filter((room) => !room.isDirect),
      directRooms: rooms.filter((room) => room.isDirect),
    }),
    [rooms],
  );

  return (
    <div className="w-80 bg-gray-900 text-white p-4 flex flex-col gap-4 shrink-0 min-h-0">
      <h2 className="text-lg font-bold">Rooms</h2>

      {banner ? (
        <p className="rounded bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200">
          {banner}
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs uppercase text-gray-400">Create</p>
        <div className="flex gap-2">
          <input
            className="flex-1 text-white rounded border border-gray-100 px-2 py-1 text-sm"
            placeholder="Room name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="button"
            className="bg-blue-600 px-3 py-1 rounded text-sm"
            onClick={() => {
              onCreateRoom(newName);
              setNewName("");
            }}
            // onClick={() => {
            //   if (!newName.trim()) {
            //     toast.warning("Room name cannot be empty");
            //     return;
            //   }

            //   onCreateRoom(newName);
            //   toast.success("Room created");
            //   setNewName("");
            // }}
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase text-gray-400">Join by id</p>
        <div className="flex gap-2">
          <input
            className="flex-1 text-white border border-gray-100 rounded px-2 py-1 text-sm"
            placeholder="Room UUID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
          />
          <button
            type="button"
            className="bg-emerald-600 px-3 py-1 rounded text-sm"
            onClick={() => {
              onJoinById(joinId);
              setJoinId("");
            }}
          >
            Join
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto border-t border-gray-700 pt-3 space-y-4">
        <div className="space-y-1">
          <p className="text-xs uppercase text-gray-400">Group chats</p>

          {grouped.groupRooms.map((room) => (
            <button
              type="button"
              key={room.id}
              onClick={() => {
                onJoinRoom(room.id);
                toast.info(`Joining ${room.displayName}`);
              }}
              className="w-full text-left p-2 rounded hover:bg-gray-700 text-sm"
            >
              <span className="font-medium">{room.displayName}</span>

              <span
                className="block text-xs text-gray-400 truncate cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // ❗ prevents triggering parent button click
                  navigator.clipboard.writeText(room.id);
                  toast.success("Copied room ID!");
                }}
              >
                {room.id}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase text-gray-400">Direct messages</p>
          {grouped.directRooms.length === 0 ? (
            <p className="text-xs text-gray-500">
              Start one from Friends or All users.
            </p>
          ) : null}
          {grouped.directRooms.map((room) => (
            <button
              type="button"
              key={room.id}
              // onClick={() => onJoinRoom(room.id)}
              onClick={() => {
                onJoinRoom(room.id);
                toast.info(`Opening ${room.displayName}`);
              }}
              className="w-full text-left p-2 rounded hover:bg-gray-700 text-sm"
            >
              <span className="font-medium">{room.displayName}</span>
              {room.isFrozen ? (
                <span className="block text-[11px] text-amber-300">
                  Read only
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="space-y-2 border-t border-gray-700 pt-3">
          <p className="text-xs uppercase text-gray-400">Friend requests</p>
          {contacts.incomingRequests?.length ? (
            contacts.incomingRequests.map((request) => (
              <div key={request.id} className="rounded bg-gray-800 p-2 text-xs">
                <p className="font-semibold text-white">
                  {request.user.username}
                </p>
                <p className="text-gray-400">
                  {request.message || "No message"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-emerald-600 px-2 py-1"
                    // onClick={() => onRespondToRequest(request.id, "accept")}
                    onClick={() => {
                      onRespondToRequest(request.id, "accept");
                      toast.success("Friend request accepted");
                    }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded bg-gray-700 px-2 py-1"
                    onClick={() => onRespondToRequest(request.id, "decline")}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">
              No pending incoming requests.
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-gray-700 pt-3">
          <p className="text-xs uppercase text-gray-400">Friends</p>
          {contacts.friends?.length ? (
            contacts.friends.map((friend) => (
              <div
                key={friend.id}
                className="rounded bg-gray-800 px-3 py-2 text-xs text-gray-200"
              >
                <p className="font-semibold text-white">{friend.username}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-blue-600 px-2 py-1"
                    onClick={() => onOpenDirectMessage(friend.id)}
                  >
                    Message
                  </button>
                  <button
                    type="button"
                    className="rounded bg-gray-700 px-2 py-1"
                    onClick={() => onRemoveFriend(friend.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">No friends yet.</p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-gray-700 shrink-0 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
            Signed in
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-gray-800/80 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {(currentUser?.username || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-white">
                {currentUser?.username || "Loading profile..."}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {currentUser?.email || "\u00a0"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            className="rounded bg-gray-800 px-3 py-2 hover:bg-gray-700"
            onClick={onChangePassword}
          >
            Change password
          </button>
          <button
            type="button"
            className="rounded bg-gray-800 px-3 py-2 hover:bg-gray-700"
            onClick={onSignOut}
          >
            Sign out
          </button>
          <button
            type="button"
            className="col-span-2 rounded bg-red-600/90 px-3 py-2 hover:bg-red-500"
            onClick={onDeleteAccount}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
