import { prisma } from "./prisma";

export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "booking" | "message";
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type, link },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}