import { ImageResponse } from "next/og"

export const alt = "Samfunnet i Bergen"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#fff7e4",
        border: "24px solid #182038",
        color: "#182038",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Georgia, serif",
        height: "100%",
        justifyContent: "center",
        padding: "64px",
        width: "100%",
      }}
    >
      <div
        style={{
          color: "#b56d00",
          fontFamily: "monospace",
          fontSize: 28,
          letterSpacing: "0.18em",
          marginBottom: 30,
          textTransform: "uppercase",
        }}
      >
        Studentersamfunnet i Bergen
      </div>
      <div
        style={{
          fontSize: 86,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        Samfunnet i Bergen
      </div>
    </div>,
    size,
  )
}
