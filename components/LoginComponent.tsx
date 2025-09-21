"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Github, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

// OAuth providers mapped to Spring Boot OAuth2 endpoints
const oauthProviders = [
  {
    id: "google",
    name: "Google",
    icon: Chrome,
    description: "Continue with Google",
  },
  {
    id: "github",
    name: "GitHub",
    icon: Github,
    description: "Continue with GitHub",
  },
];

export default function LoginComponent() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/me`,
          { credentials: "include" }
        );

        if (res.ok) {
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    };

    checkAuth();
  }, [router]);

  const handleOAuthLogin = async (providerId: string, providerName: string) => {
    setIsLoading(providerId);

    try {
      const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/oauth2/authorization/${providerId}`;
      window.location.href = backendUrl;
    } catch (error) {
      console.error(`[OAuth] Login error for ${providerId}:`, error);
      toast({
        title: "Authentication Failed",
        description: `Could not authenticate with ${providerName}. Please try again.`,
        variant: "destructive",
      });
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="gradient-card border-0 glow-primary">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gradient-text-primary text-2xl">
              DSA Tracker
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to access your DSA practice dashboard and track your
              progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OAuth Provider Buttons */}
            <div className="space-y-3">
              {oauthProviders.map((provider) => {
                const Icon = provider.icon;
                const isLoadingProvider = isLoading === provider.id;

                return (
                  <Button
                    key={provider.id}
                    type="button"
                    variant="outline"
                    className="w-full h-12 justify-start gap-3 bg-transparent hover:gradient-primary hover:text-white transition-all duration-200"
                    onClick={() => handleOAuthLogin(provider.id, provider.name)}
                    disabled={!!isLoading}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isLoadingProvider ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                      <span className="font-medium">
                        {provider.description}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
