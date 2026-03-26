export async function sendPushNotification(userId: string, title: string, message: string, link?: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, message, link }),
    });
  } catch (err) {
    console.error("Push notification error:", err);
  }
}