import { lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";

const ChatLayout = lazy(() =>
  import("@/components/chat/ChatLayout").then((m) => ({ default: m.ChatLayout }))
);
const AuthScreen = lazy(() =>
  import("@/components/chat/AuthScreen").then((m) => ({ default: m.AuthScreen }))
);

function Spinner() {
  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  return (
    <Suspense fallback={<Spinner />}>
      {user ? <ChatLayout /> : <AuthScreen />}
    </Suspense>
  );
}
