import Message from "./Message";
import MessageInput from "./MessageInput";
import ChatLoader from "./ChatLoader";

export default function ChatWindow({
  room,
  messages,
  onSend,
  loading,
  typingText,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
}) {
  const typingLine = typingText?.trim();

  return (
    <div className="flex flex-col flex-1 bg-gray-100 min-w-0 min-h-0">
      <div className="px-4 py-3 border-b bg-white text-sm text-gray-600 shrink-0">
        {room ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-gray-800">{room.displayName}</span>
              {room.isDirect ? (
                <span className="ml-2 text-xs text-gray-500">Direct chat</span>
              ) : null}
            </div>
            {room.isFrozen ? (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">
                Read only
              </span>
            ) : null}
          </div>
        ) : (
          "Select or create a room"
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {loading ? (
          <ChatLoader />
        ) : (
          <>
            {messages.map((m) => (
              <Message
                key={m.id}
                msg={m}
                currentUserId={currentUserId}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                roomOwnerId={room?.ownerId}
                roomFrozen={room?.isFrozen}
              />
            ))}
            {messages.length === 0 && room ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No messages yet. Say hello.
              </p>
            ) : null}
          </>
        )}
      </div>

      {typingLine && !loading ? (
        <div className="px-4 pb-1 text-xs italic text-gray-500 shrink-0">
          {typingLine}
        </div>
      ) : null}

      <MessageInput
        disabled={!room || room.isFrozen}
        roomId={room?.id || ""}
        onSend={onSend}
        readOnlyReason={room?.isFrozen ? "This conversation is read only." : ""}
      />
    </div>
  );
}
