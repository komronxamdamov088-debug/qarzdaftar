import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 flex-col pb-2">{children}</div>
      <BottomNav />
    </div>
  );
}
