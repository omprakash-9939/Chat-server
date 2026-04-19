import { useState, useRef, useEffect } from "react";
import { socket } from "../sockets/socket";
import api from "../api/axios";

const TYPING_STOP_MS = 2000;

export default function MessageInput({
  onSend,
  disabled,
  roomId,
  readOnlyReason = "",
}) {
  const [text, setText] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const stopTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewObjectUrlRef = useRef(null);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const scheduleStopTyping = () => {
    clearStopTimer();
    if (!roomId) return;
    stopTimerRef.current = setTimeout(() => {
      socket.emit("stop_typing", roomId);
      stopTimerRef.current = null;
    }, TYPING_STOP_MS);
  };

  useEffect(() => {
    return () => {
      clearStopTimer();
      if (roomId) socket.emit("stop_typing", roomId);
    };
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  const uploadFile = async (file) => {
    if (!roomId || !file || disabled) return;
    clearStopTimer();
    if (roomId) socket.emit("stop_typing", roomId);

    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    const isImage = file.type.startsWith("image/");
    setPreview({
      objectUrl,
      name: file.name,
      isImage,
    });

    const fd = new FormData();
    fd.append("file", file);
    fd.append("roomId", roomId);
    fd.append("content", text.trim());

    setUploadBusy(true);
    try {
      await api.post("upload", fd);
      setText("");
    } catch (e) {
      window.alert(e.response?.data?.error || e.message || "Upload failed");
    } finally {
      setUploadBusy(false);
      URL.revokeObjectURL(objectUrl);
      previewObjectUrlRef.current = null;
      setPreview(null);
    }
  };

  const send = () => {
    clearStopTimer();
    if (roomId) socket.emit("stop_typing", roomId);
    if (disabled || !text.trim()) return;
    onSend(text);
    setText("");
  };

  const onChange = (e) => {
    const v = e.target.value;
    setText(v);
    if (disabled || !roomId) return;
    if (v.length > 0) {
      socket.emit("typing", roomId);
      scheduleStopTyping();
    } else {
      clearStopTimer();
      socket.emit("stop_typing", roomId);
    }
  };

  const onPaste = (e) => {
    const files = e.clipboardData?.files;
    if (!files?.length || disabled || !roomId || uploadBusy) return;
    const file = files[0];
    if (!file) return;
    e.preventDefault();
    uploadFile(file);
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) uploadFile(f);
  };

  return (
    <div className="flex flex-col border-t bg-white">
      {preview ? (
        <div className="flex items-start gap-3 border-b border-gray-100 bg-gray-50 px-3 py-2">
          {preview.isImage ? (
            <img
              src={preview.objectUrl}
              alt=""
              className="max-h-36 max-w-[min(100%,280px)] shrink-0 rounded border border-gray-200 object-contain bg-white"
            />
          ) : (
            <div className="flex min-h-19 min-w-32 items-center justify-center rounded border border-dashed border-gray-300 bg-white px-3 text-center text-sm text-gray-600">
              File: {preview.name}
            </div>
          )}
          <div className="min-w-0 flex-1 pt-1 text-xs text-gray-600">
            <p className="font-medium text-gray-800 truncate">{preview.name}</p>
            {uploadBusy ? (
              <p className="mt-1 text-gray-500">Uploading...</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex items-end p-3 gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="*/*"
          onChange={onPickFile}
        />

        <button
          type="button"
          title="Attach file"
          disabled={disabled || uploadBusy}
          className="shrink-0 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
        >
          Attach
        </button>

        <textarea
          className="flex-1 min-h-11 max-h-32 border p-2 rounded disabled:bg-gray-100 text-sm resize-y"
          value={text}
          disabled={disabled || uploadBusy}
          onChange={onChange}
          onPaste={onPaste}
          placeholder={
            disabled
              ? readOnlyReason || "Select a room first"
              : "Message... (Shift+Enter for new line, Enter to send)"
          }
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          onBlur={() => {
            clearStopTimer();
            if (roomId) socket.emit("stop_typing", roomId);
          }}
        />

        <button
          type="button"
          className="shrink-0 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 h-11"
          disabled={disabled || uploadBusy}
          onClick={send}
        >
          {uploadBusy ? "..." : "Send"}
        </button>
      </div>
      <p className="px-3 pb-2 text-[11px] text-gray-500">
        Max 20 MB per file - images show a preview - paste from clipboard
        supported
      </p>
    </div>
  );
}
