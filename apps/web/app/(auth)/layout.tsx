export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Plio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Flexible management for modern studios
          </p>
        </div>
        {children}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          {' · '}
          <a href="/terms" className="hover:underline">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
