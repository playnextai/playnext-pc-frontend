export default function Thumb({ url, w = 44, h = 58 }: { url: string | null; w?: number; h?: number }) {
  return url
    ? <img src={url} alt="" width={w} height={h} style={{ borderRadius: 8, objectFit: "cover", flex: "none" }} />
    : <span aria-hidden="true" style={{ width: w, height: h, borderRadius: 8, background: "var(--cover)", flex: "none", display: "inline-block" }} />;
}
