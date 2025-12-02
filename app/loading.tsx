import { Loader2 } from "lucide-react";
import Header from "@/components/ui/header";
import { ProfileAnimatedBackground } from "@/components/background/profile-animated-background";

export default function Loading() {
  return (
    <div className="min-h-screen w-full">
      <ProfileAnimatedBackground />
      <Header />
      
      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            <Loader2 className="w-12 h-12 text-primary relative animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Loading...
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Please wait while we fetch your content
          </p>
        </div>
      </div>
    </div>
  );
}
