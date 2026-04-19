import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="text-center">
        <h1 className="font-heading text-8xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 font-heading text-2xl font-semibold">Page Not Found</h2>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
      </div>
      <Link
        href="/dashboard"
        className="mt-4 inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
