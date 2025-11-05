"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  Search,
  Home,
  UserIcon,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import ThemeToggleButton from "@/components/header/theme-toggle-button";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  profile_image?: string;
}

interface SearchResult {
  id: string;
  type: "user" | "post";
  title: string;
  subtitle?: string;
  image?: string;
  username?: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [messages, setMessages] = useState(0);

  const router = useRouter();
  const supabase = createClient();
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        const { data: profile } = await supabase
          .from("users")
          .select("id, username, full_name, profile_image")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const { data: users } = await supabase
        .from("users")
        .select("id, username, full_name, profile_image")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);

      const userResults: SearchResult[] =
        users?.map((user) => ({
          id: user.id,
          type: "user" as const,
          title: user.full_name || user.username,
          subtitle: `@${user.username}`,
          image: user.profile_image,
          username: user.username,
        })) || [];

      setSearchResults(userResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === "user") {
      router.push(`/profile/${result.username}`);
    } else if (result.type === "post") {
      router.push(`/post/${result.id}`);
    }
    setShowSearchResults(false);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigation = [
    { icon: Home, label: "Home", href: "/dashboard" },
    {
      icon: UserIcon,
      label: "Profile",
      href: userProfile ? `/profile/${userProfile.username}` : "/profile",
    },
    {
      icon: MessageCircle,
      label: "Messages",
      href: "/messages",
      badge: messages,
    },
    {
      icon: Bell,
      label: "Notifications",
      href: "/notifications",
      badge: notifications,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 512 512"
                  fill="none"
                >
                  <circle cx="256" cy="256" r="256" fill="#070B1C" />
                  <circle
                    cx="256"
                    cy="256"
                    r="240"
                    fill="none"
                    stroke="url(#glowGradient)"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <path
                    d="M330 160C330 226.274 276.274 280 210 280C182.47 280 156.48 272 135.44 258C148.89 311.98 197.67 352 256 352C323.32 352 378 297.32 378 230C378 189.04 359.33 152.14 330 128.44C330 138.74 330 149.31 330 160Z"
                    fill="url(#moonGradient)"
                  />
                  <circle
                    cx="180"
                    cy="150"
                    r="4"
                    fill="#FFDA85"
                    opacity="0.9"
                  />
                  <circle
                    cx="320"
                    cy="180"
                    r="3"
                    fill="#FFDA85"
                    opacity="0.7"
                  />
                  <circle
                    cx="350"
                    cy="300"
                    r="3.5"
                    fill="#FFDA85"
                    opacity="0.8"
                  />
                  <circle
                    cx="150"
                    cy="250"
                    r="2.5"
                    fill="#FFDA85"
                    opacity="0.6"
                  />
                  <circle
                    cx="260"
                    cy="110"
                    r="5"
                    fill="#FFDA85"
                    opacity="0.9"
                  />
                  <circle
                    cx="240"
                    cy="230"
                    r="6"
                    fill="#FFDA85"
                    opacity="0.95"
                  />
                  <circle
                    cx="256"
                    cy="256"
                    r="256"
                    fill="url(#radialGlow)"
                    opacity="0.15"
                  />
                  <defs>
                    <linearGradient
                      id="moonGradient"
                      x1="135.44"
                      y1="240"
                      x2="378"
                      y2="240"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stopColor="#F6C561" />
                      <stop offset="1" stopColor="#D9A33E" />
                    </linearGradient>
                    <radialGradient
                      id="radialGlow"
                      cx="256"
                      cy="256"
                      r="256"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stopColor="#F6C561" stopOpacity="0.4" />
                      <stop offset="1" stopColor="#070B1C" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient
                      id="glowGradient"
                      x1="16"
                      y1="256"
                      x2="496"
                      y2="256"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stopColor="#F6C561" stopOpacity="0.2" />
                      <stop
                        offset="0.5"
                        stopColor="#F6C561"
                        stopOpacity="0.7"
                      />
                      <stop offset="1" stopColor="#F6C561" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="hidden sm:block text-xl font-bold text-chart-1">
                Ummah Connect
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search users and posts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() =>
                  searchResults.length > 0 && setShowSearchResults(true)
                }
                className="w-full pl-10 pr-4 py-2 bg-card/50 backdrop-blur border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
              />
            </div>

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors flex items-center space-x-3 border-b border-border/20 last:border-b-0"
                  >
                    {result.image ? (
                      <img
                        src={result.image || "/placeholder.svg"}
                        alt={result.title}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        {result.type === "user" ? (
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {result.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-accent/50 transition-colors group"
                title={item.label}
              >
                <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            ))}

            {/* Profile Dropdown */}
            <div className="relative ml-3" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-accent/50 transition-colors"
              >
                {userProfile?.profile_image ? (
                  <img
                    src={userProfile.profile_image || "/placeholder.svg"}
                    alt={userProfile.full_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "#070B1C" }}
                  >
                    <span className="text-white text-sm font-medium">
                      {userProfile?.full_name?.charAt(0) ||
                        user?.email?.charAt(0) ||
                        "U"}
                    </span>
                  </div>
                )}
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-border/20">
                    <p className="text-sm font-medium text-foreground">
                      {userProfile?.full_name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{userProfile?.username || "username"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      router.push(
                        userProfile
                          ? `/profile/${userProfile.username}`
                          : "/profile"
                      );
                      setShowProfileDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent/50 transition-colors flex items-center space-x-2"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Go to Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push("/settings");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent/50 transition-colors flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-border/20 mt-1 pt-1">
                    <ThemeToggleButton />
                  </div>

                  <div className="border-t border-border/20 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-accent/50 transition-colors"
          >
            {showMobileMenu ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-border/20 py-4">
            <div className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    router.push(item.href);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </button>
              ))}

              <div className="border-t border-border/20 pt-2 mt-2">
                <button
                  onClick={() => {
                    router.push("/settings");
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
