export function isProbablyImage(fileName, urlPath = "") {
  const base = (fileName || urlPath || "").split("?")[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif|ico)$/i.test(base);
}
