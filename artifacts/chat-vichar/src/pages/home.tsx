import { useAuth } from "@/contexts/AuthContext";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { AuthScreen } from "@/components/chat/AuthScreen";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? <ChatLayout /> : <AuthScreen />;
}
