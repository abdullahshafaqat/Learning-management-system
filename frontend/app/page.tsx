import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen gradient-animated flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              LMS Platform
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Your gateway to unlimited learning. Explore courses, track progress, and achieve your goals.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/signup">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 py-6 text-lg font-semibold bg-white text-purple-600 hover:bg-gray-100 transition-smooth shadow-2xl"
            >
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8 py-6 text-lg font-semibold bg-white/10 text-white border-white/30 hover:bg-white/20 transition-smooth backdrop-blur-sm"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="glass-dark rounded-2xl p-6 space-y-3 hover-lift">
            <div className="w-12 h-12 rounded-full gradient-primary mx-auto"></div>
            <h3 className="text-xl font-semibold text-white">Expert Instructors</h3>
            <p className="text-white/80">
              Learn from industry professionals with years of experience
            </p>
          </div>
          <div className="glass-dark rounded-2xl p-6 space-y-3 hover-lift">
            <div className="w-12 h-12 rounded-full gradient-accent mx-auto"></div>
            <h3 className="text-xl font-semibold text-white">Flexible Learning</h3>
            <p className="text-white/80">
              Study at your own pace, anytime and anywhere
            </p>
          </div>
          <div className="glass-dark rounded-2xl p-6 space-y-3 hover-lift">
            <div className="w-12 h-12 rounded-full gradient-success mx-auto"></div>
            <h3 className="text-xl font-semibold text-white">Certificates</h3>
            <p className="text-white/80">
              Earn recognized certificates upon course completion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
