'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Sparkles, Users } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Image 
                src="/SociaSync.png" 
                alt="SocioSync Logo" 
                width={32} 
                height={32} 
                className="h-8 w-8" 
              />
              <span className="text-xl font-bold text-gray-900">SocioSync</span>
            </div>
            <div className="space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AI-Powered Social Media
              <span className="text-blue-600 block">Scheduling Made Easy</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create engaging content with AI, schedule posts across platforms, and grow your social media presence effortlessly.
            </p>
            <div className="space-x-4">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                Start Free Trial
              </Link>
              <Link
                href="#features"
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="mt-32">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Everything you need to succeed
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Content Generation</h3>
                <p className="text-gray-600">
                  Generate engaging captions and images with advanced AI. Get multiple variations and platform-optimized content.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
                <p className="text-gray-600">
                  Schedule posts across Twitter, LinkedIn, and Instagram. Set it and forget it with our reliable job queue.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Platform</h3>
                <p className="text-gray-600">
                  Connect multiple social media accounts and publish to all platforms simultaneously from one dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-32 text-center bg-white rounded-2xl p-12 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to transform your social media strategy?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of creators and businesses using SocioSync to grow their online presence.
            </p>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Get Started Free
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-12 text-center text-gray-600">
          <p>&copy; 2025 SocioSync. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}