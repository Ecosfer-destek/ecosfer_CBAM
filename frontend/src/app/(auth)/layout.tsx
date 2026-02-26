export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-gradient-subtle min-h-screen">{children}</div>;
}
