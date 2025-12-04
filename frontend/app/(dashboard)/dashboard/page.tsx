'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Courses',
      value: '0',
      description: 'Enrolled courses',
      gradient: 'gradient-primary',
    },
    {
      title: 'Completed',
      value: '0',
      description: 'Courses finished',
      gradient: 'gradient-success',
    },
    {
      title: 'In Progress',
      value: '0',
      description: 'Currently learning',
      gradient: 'gradient-accent',
    },
    {
      title: 'Certificates',
      value: '0',
      description: 'Earned certificates',
      gradient: 'gradient-secondary',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome back, {user?.username || 'Student'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your learning dashboard - Start your journey today
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="hover-lift border-0 shadow-lg overflow-hidden relative"
          >
            <div className={`absolute inset-0 ${stat.gradient} opacity-10`}></div>
            <CardHeader className="relative">
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardDescription>
              <CardTitle className="text-4xl font-bold">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Your learning management system is ready. More features coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your dashboard. We&apos;ll be adding courses, assignments, and more features soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
