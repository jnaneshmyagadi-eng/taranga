import type { Metadata } from "next";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { NotificationList } from "@/components/notifications/NotificationList";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const { notifications, unreadCount } = await getNotifications(40);

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <form
            action={async () => {
              "use server";
              await markAllNotificationsRead();
            }}
          >
            <Button type="submit" variant="secondary" size="sm" className="rounded-full">
              Mark all read
            </Button>
          </form>
        )}
      </div>

      <NotificationList
        initial={notifications as unknown as Parameters<typeof NotificationList>[0]["initial"]}
      />
    </div>
  );
}
