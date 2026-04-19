import { useState } from "react";
import { getPublicOrigin } from "../config";
import { isProbablyImage } from "../utils/attachmentPreview";
import { formatMessageTime } from "../utils/messageTime";

function readBySomeoneElse(msg) {
  const reads = msg.reads ?? [];
  return reads.some((r) => r.userId !== msg.senderId);
}

export default function Message({
  msg,
  currentUserId,
  onEdit,
  onDelete,
  roomOwnerId,
  roomFrozen,
}) {
  const label = msg.sender?.username || msg.senderName || "Deleted user";
  const mine = Boolean(currentUserId && msg.senderId === currentUserId);
  const canDelete =
    !roomFrozen && (mine || (currentUserId && roomOwnerId === currentUserId));
  const canEdit = !roomFrozen && mine && !msg.deletedAt;
  const fileHref = msg.fileUrl
    ? msg.fileUrl.startsWith("http")
      ? msg.fileUrl
      : `${getPublicOrigin()}${msg.fileUrl}`
    : null;

  const showImage =
    fileHref && isProbablyImage(msg.fileName, msg.fileUrl || "");

  const [imgBroken, setImgBroken] = useState(false);

  const readOthers = readBySomeoneElse(msg);
  const timeStr = formatMessageTime(msg.createdAt);
  const wasEdited = Boolean(msg.editedAt && !msg.deletedAt);

  const bubbleBase = mine
    ? "bg-blue-600 text-white rounded-2xl rounded-bl-md"
    : "bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-br-md";

  const linkMine = "text-blue-100 underline";
  const linkOther = "text-blue-600 underline";

  return (
    <div
      className={`flex w-full mb-3 ${mine ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[min(85%,28rem)] px-3 py-2 shadow-sm ${bubbleBase}`}
      >
        {!mine ? (
          <div className="text-xs font-semibold text-blue-600 mb-1">{label}</div>
        ) : null}

        {msg.deletedAt ? (
          <div className={`text-sm italic ${mine ? "text-blue-100" : "text-gray-500"}`}>
            Message deleted
          </div>
        ) : msg.content ? (
          <div
            className={`whitespace-pre-wrap text-sm ${
              mine ? "text-white" : "text-gray-800"
            }`}
          >
            {msg.content}
          </div>
        ) : null}

        {fileHref && !msg.deletedAt ? (
          <div className="mt-1 space-y-1">
            {showImage && !imgBroken ? (
              <a
                href={fileHref}
                target="_blank"
                rel="noreferrer"
                className={`inline-block max-w-full rounded-lg border p-1 shadow-sm ${
                  mine
                    ? "border-blue-400/50 bg-blue-500/30"
                    : "border-gray-200 bg-gray-50"
                }`}
                title="Open full size"
              >
                <img
                  src={fileHref}
                  alt={msg.fileName || "Image"}
                  className="max-h-64 max-w-full rounded object-contain"
                  loading="lazy"
                  onError={() => setImgBroken(true)}
                />
              </a>
            ) : null}
            {(!showImage || imgBroken) && (
              <a
                className={mine ? linkMine : linkOther}
                href={fileHref}
                target="_blank"
                rel="noreferrer"
              >
                {msg.fileName || "Attachment"}
              </a>
            )}
          </div>
        ) : null}

        <div
          className={`mt-1 flex items-center justify-end gap-2 text-[10px] select-none ${
            mine ? "text-blue-100/90" : "text-gray-500"
          }`}
        >
          {wasEdited ? <span className="text-gray-300">edited</span> : null}
          <time dateTime={msg.createdAt}>{timeStr}</time>
          {mine ? (
            <span
              className="ml-0.5 tracking-tight"
              title={readOthers ? "Read" : "Delivered"}
              aria-label={readOthers ? "Read" : "Delivered"}
            >
              {readOthers ? "✓✓" : "✓"}
            </span>
          ) : null}
        </div>
        {mine ? (
          <div className="text-[9px] text-blue-100/75 text-right">
            {readOthers ? "Read" : "Sent"}
          </div>
        ) : null}

        {(canEdit || canDelete) && !msg.deletedAt ? (
          <div className="mt-2 flex justify-end gap-2 text-[11px]">
            {canEdit ? (
              <button
                type="button"
                className={mine ? "text-blue-100 underline" : "text-blue-600 underline"}
                onClick={() => onEdit?.(msg.id, msg.content)}
              >
                Edit
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                className={mine ? "text-blue-100 underline" : "text-red-600 underline"}
                onClick={() => onDelete?.(msg.id)}
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
