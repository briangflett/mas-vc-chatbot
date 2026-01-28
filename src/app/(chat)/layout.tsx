export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for chat list - future */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
