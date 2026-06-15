export async function POST(request: Request) {
  const webhookUrl = process.env.SLACK_FEEDBACK_WEBHOOK

  if (!webhookUrl) {
    return Response.json({ detail: "Webhook not configured" }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ detail: "Invalid body" }, { status: 400 })
  }

  const message =
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).message === "string"
      ? (body as { message: string }).message.trim()
      : null

  if (!message) {
    return Response.json({ detail: "Message is required" }, { status: 400 })
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
      signal: AbortSignal.timeout(5_000),
    })

    if (!response.ok) {
      console.error("[slack-feedback] Slack responded with", response.status)
      return Response.json({ detail: "Failed to send" }, { status: 502 })
    }

    return Response.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("[slack-feedback]", error)
    return Response.json({ detail: "Failed to send" }, { status: 502 })
  }
}
