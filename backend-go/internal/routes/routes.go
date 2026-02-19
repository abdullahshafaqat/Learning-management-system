package routes

import (
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/middlewares"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")

	// Auth
	auth := api.Group("/auth")
	auth.POST("/Signup", Signup)
	auth.POST("/Login", Login)
	auth.POST("/Logout", middlewares.AuthMiddleware(), Logout)
	auth.POST("/Refresh", RefreshToken)
	auth.GET("/me", middlewares.AuthMiddleware(), GetMe)

	// Protected Routes
	protected := api.Group("/")
	protected.Use(middlewares.AuthMiddleware())

	// Courses
	courses := protected.Group("/courses")
	// Teacher create course
	courses.POST("", middlewares.RoleMiddleware("teacher", "admin"), CreateCourse)
	// Teacher get own courses
	courses.GET("/teacher", middlewares.RoleMiddleware("teacher", "admin"), GetTeacherCourses)
	// Admin or Students: get all courses (Course Catalog)
	courses.GET("", middlewares.RoleMiddleware("student", "teacher", "admin"), GetAllCourses)
	// Update course
	courses.PUT("/:id", middlewares.RoleMiddleware("teacher", "admin"), UpdateCourse)
	// Delete course
	courses.DELETE("/:id", middlewares.RoleMiddleware("teacher", "admin"), DeleteCourse)

	// Lectures
	lectures := protected.Group("/lectures")
	// Add lecture
	lectures.POST("/courses/:courseId", middlewares.RoleMiddleware("teacher", "admin"), AddLecture)
	// Get lectures
	lectures.GET("/courses/:courseId", middlewares.RoleMiddleware("student", "teacher", "admin"), GetLectures)
	// Update lecture
	lectures.PUT("/:id", middlewares.RoleMiddleware("teacher", "admin"), UpdateLecture)
	// Reorder
	lectures.PUT("/reorder/:courseId", middlewares.RoleMiddleware("teacher", "admin"), ReorderLectures)
	// Delete
	lectures.DELETE("/:id", middlewares.RoleMiddleware("teacher", "admin"), DeleteLecture)

	// Enrollments
	enrollments := protected.Group("/enrollments")
	// Enroll in course (Student)
	enrollments.POST("/courses/:courseId/enroll", middlewares.RoleMiddleware("student"), EnrollStudent)
	// Get my enrollments (Student)
	enrollments.GET("/student/enrollments", middlewares.RoleMiddleware("student"), GetStudentEnrollments)
	// Admin: Get all
	enrollments.GET("", middlewares.RoleMiddleware("admin"), GetAllEnrollments)
	// Admin: Enroll manually
	enrollments.POST("/admin/enroll", middlewares.RoleMiddleware("admin"), AdminEnrollStudent)
	// Admin: Remove
	enrollments.POST("/admin/remove", middlewares.RoleMiddleware("admin"), RemoveEnrollment)

	// Admin Users
	users := protected.Group("/users")
	users.Use(middlewares.RoleMiddleware("admin"))
	users.GET("", GetAllUsers)
	users.PUT("/:id/role", UpdateUserRole)
	users.PUT("/:id/block", ToggleUserBlock)

	// Quizzes
	quizzes := protected.Group("/quizzes")
	// Get Quiz (Student, Teacher, Admin)
	quizzes.GET("/:quizId", middlewares.RoleMiddleware("student", "teacher", "admin"), GetQuiz)
	// Submit Quiz (Student)
	quizzes.POST("/:quizId/submit", middlewares.RoleMiddleware("student"), SubmitQuiz)
	// Get Results (Teacher, Admin)
	quizzes.GET("/:quizId/results", middlewares.RoleMiddleware("teacher", "admin"), GetQuizResults)

	// Create Quiz (Teacher, Admin) - under lectures or independent if using lectureId param?
	// Plan said POST /lectures/:lectureId/quizzes
	// So let's add it there or just use the lectures group?
	// Existing lectures group is `protected.Group("/lectures")`
	// New endpoint: POST /lectures/:lectureId/quizzes
	lectures.POST("/:lectureId/quizzes", middlewares.RoleMiddleware("teacher", "admin"), CreateQuiz)
	// Progress Routes
	progress := r.Group("/api/progress")
	progress.Use(middlewares.AuthMiddleware())
	{
		progress.POST("/courses/:courseId/lectures/:lectureId", middlewares.RoleMiddleware("student"), MarkLectureCompleted)
		progress.GET("/courses/:courseId", middlewares.RoleMiddleware("student", "teacher", "admin"), GetStudentProgress)
		progress.GET("/courses/:courseId/admin", middlewares.RoleMiddleware("teacher", "admin"), GetAdminCourseProgress)
	}
}
