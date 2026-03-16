export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {children}
        <footer className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          {' · '}
          <a href="/terms" className="hover:underline">Terms of Service</a>
        </footer>
      </div>
    </div>
  );
}
