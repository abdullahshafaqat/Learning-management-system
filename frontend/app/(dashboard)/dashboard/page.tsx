'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Courses',
      value: '12',
      description: 'Enrolled courses',
      gradient: 'gradient-primary',
    },
    {
      title: 'Completed',
      value: '8',
      description: 'Courses finished',
      gradient: 'gradient-success',
    },
    {
      title: 'In Progress',
      value: '4',
      description: 'Currently learning',
      gradient: 'gradient-accent',
    },
    {
      title: 'Certificates',
      value: '6',
      description: 'Earned certificates',
      gradient: 'gradient-secondary',
    },
  ];

  const recentCourses = [
    {
      id: 1,
      title: 'Advanced React Patterns',
      progress: 75,
      instructor: 'John Doe',
      category: 'Development',
    },
    {
      id: 2,
      title: 'UI/UX Design Fundamentals',
      progress: 45,
      instructor: 'Jane Smith',
      category: 'Design',
    },
    {
      id: 3,
      title: 'Node.js Backend Development',
      progress: 90,
      instructor: 'Mike Johnson',
      category: 'Development',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome back!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Continue your learning journey and achieve your goals
        </p>
      </div>

      {/* Stats Grid */}
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

      {/* Recent Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Continue Learning</h2>
          <Button variant="outline" className="hover-lift">
            View All Courses
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentCourses.map((course) => (
            <Card
              key={course.id}
              className="hover-lift border-0 shadow-lg overflow-hidden group cursor-pointer"
            >
              <div className="h-40 gradient-animated"></div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-purple-600 transition-smooth">
                    {course.title}
                  </CardTitle>
                  <Badge variant="secondary">{course.category}</Badge>
                </div>
                <CardDescription>by {course.instructor}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-semibold text-purple-600">
                      {course.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="gradient-primary h-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
                <Button className="w-full gradient-primary hover:opacity-90 transition-smooth text-white">
                  Continue Learning
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Explore new courses and manage your learning
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button className="gradient-primary hover:opacity-90 transition-smooth text-white">
            Browse Courses
          </Button>
          <Button variant="outline" className="hover-lift">
            My Certificates
          </Button>
          <Button variant="outline" className="hover-lift">
            Learning Path
          </Button>
          <Button variant="outline" className="hover-lift">
            Community
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
