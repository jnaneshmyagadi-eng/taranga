import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/actions/notifications";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  let unreadCount = 0;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", data.user.id)
        .single();
      user = profile;
      unreadCount = await getUnreadCount();
    }
  } catch {
    // Supabase not configured yet — graceful fallback
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-60">
        <Header user={user} unreadCount={unreadCount} />
        <main className="flex-1 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
