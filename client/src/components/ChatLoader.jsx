export default function ChatLoader({ label = "Loading messages…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <div
        className="h-9 w-9 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin"
        aria-hidden
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
