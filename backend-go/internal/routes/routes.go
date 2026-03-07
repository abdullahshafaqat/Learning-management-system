package routes

import (
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/middlewares"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")

	auth := api.Group("/auth")
	auth.POST("/Signup", Signup)
	auth.POST("/Login", Login)
	auth.POST("/Logout", middlewares.AuthMiddleware(), Logout)
	auth.POST("/Refresh", RefreshToken)
	auth.GET("/me", middlewares.AuthMiddleware(), GetMe)
	auth.POST("/forgot-password", ForgotPassword)
	auth.POST("/reset-password", ResetPassword)

	protected := api.Group("/")
	protected.Use(middlewares.AuthMiddleware())

	courses := protected.Group("/courses")
	courses.POST("", middlewares.RoleMiddleware("teacher", "admin"), CreateCourse)
	courses.GET("/teacher", middlewares.RoleMiddleware("teacher", "admin"), GetTeacherCourses)
	courses.GET("", middlewares.RoleMiddleware("student", "teacher", "admin"), GetAllCourses)
	courses.PUT("/:id", middlewares.RoleMiddleware("teacher", "admin"), UpdateCourse)
	courses.DELETE("/:id", middlewares.RoleMiddleware("teacher", "admin"), DeleteCourse)

	lectures := protected.Group("/lectures")
	lectures.POST("/courses/:courseId", middlewares.RoleMiddleware("teacher", "admin"), AddLecture)
	lectures.GET("/courses/:courseId", middlewares.RoleMiddleware("student", "teacher", "admin"), GetLectures)
	lectures.GET("/:id/file", middlewares.RoleMiddleware("student", "teacher", "admin"), GetLectureFileURL)
	lectures.PUT("/:id", middlewares.RoleMiddleware("teacher", "admin"), UpdateLecture)
	lectures.PUT("/reorder/:courseId", middlewares.RoleMiddleware("teacher", "admin"), ReorderLectures)
	lectures.DELETE("/:id", middlewares.RoleMiddleware("teacher", "admin"), DeleteLecture)

	enrollments := protected.Group("/enrollments")
	enrollments.POST("/courses/:courseId/enroll", middlewares.RoleMiddleware("student"), EnrollStudent)
	enrollments.GET("/student/enrollments", middlewares.RoleMiddleware("student"), GetStudentEnrollments)
	enrollments.GET("", middlewares.RoleMiddleware("admin"), GetAllEnrollments)
	enrollments.POST("/admin/enroll", middlewares.RoleMiddleware("admin"), AdminEnrollStudent)
	enrollments.POST("/admin/remove", middlewares.RoleMiddleware("admin"), RemoveEnrollment)

	admin := protected.Group("/admin")
	admin.Use(middlewares.RoleMiddleware("admin"))
	{
		admin.GET("/users", GetAllUsers)
		admin.PUT("/users/:id/role", UpdateUserRole)
		admin.PUT("/users/:id/block", ToggleUserBlock)
		admin.GET("/courses", GetAllCourses)
	}

	quizzes := protected.Group("/quizzes")
	quizzes.GET("/:quizId", middlewares.RoleMiddleware("student", "teacher", "admin"), GetQuiz)
	quizzes.GET("/courses/:courseId", middlewares.RoleMiddleware("student", "teacher", "admin"), GetCourseQuizzes)
	quizzes.POST("/:quizId/submit", middlewares.RoleMiddleware("student"), SubmitQuiz)
	quizzes.GET("/:quizId/results", middlewares.RoleMiddleware("teacher", "admin"), GetQuizResults)

	assignments := protected.Group("/assignments")
	assignments.POST("/lectures/:lectureId", middlewares.RoleMiddleware("teacher", "admin"), CreateAssignment)
	assignments.GET("/lectures/:lectureId", middlewares.RoleMiddleware("student", "teacher", "admin"), GetLectureAssignments)
	assignments.GET("/courses/:courseId", middlewares.RoleMiddleware("student", "teacher", "admin"), GetCourseAssignments)
	assignments.GET("/student", middlewares.RoleMiddleware("student"), GetStudentAssignments)
	assignments.GET("/:id", middlewares.RoleMiddleware("student", "teacher", "admin"), GetAssignment)
	assignments.POST("/:id/submit", middlewares.RoleMiddleware("student"), SubmitAssignment)
	assignments.GET("/:id/submissions", middlewares.RoleMiddleware("teacher", "admin"), GetAssignmentSubmissions)
	assignments.PUT("/submissions/:submissionId/grade", middlewares.RoleMiddleware("teacher", "admin"), GradeAssignmentSubmission)

	lectures.POST("/:lectureId/quizzes", middlewares.RoleMiddleware("teacher", "admin"), CreateQuiz)

	progress := r.Group("/api/progress")
	progress.Use(middlewares.AuthMiddleware())
	{
		progress.POST("/courses/:courseId/lectures/:lectureId", middlewares.RoleMiddleware("student"), MarkLectureCompleted)
		progress.GET("/courses/:courseId", middlewares.RoleMiddleware("student", "teacher", "admin"), GetStudentProgress)
		progress.GET("/courses/:courseId/admin", middlewares.RoleMiddleware("teacher", "admin"), GetAdminCourseProgress)
		progress.GET("/admin/analytics", middlewares.RoleMiddleware("admin"), GetGlobalAnalytics)
		progress.GET("/admin/courses", middlewares.RoleMiddleware("admin"), GetGlobalAnalytics)
		progress.GET("/teacher/analytics", middlewares.RoleMiddleware("teacher"), GetTeacherAnalytics)
	}
}
