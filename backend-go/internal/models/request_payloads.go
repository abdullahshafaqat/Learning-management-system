package models

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type SignupRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Token           string `json:"token" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

type UpdateUserRoleRequest struct {
	Role string `json:"role" binding:"required"`
}

type ToggleUserBlockRequest struct {
	IsBlocked bool `json:"isBlocked"`
}

type GradeAssignmentSubmissionRequest struct {
	Marks    float64 `json:"marks" binding:"required"`
	Feedback string  `json:"feedback"`
}

type CreateCourseRequest struct {
	Title       string `json:"title" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type AdminEnrollmentRequest struct {
	StudentID string `json:"studentId" binding:"required"`
	CourseID  string `json:"courseId" binding:"required"`
}

type CreateQuizRequest struct {
	Title     string     `json:"title" binding:"required"`
	Questions []Question `json:"questions" binding:"required"`
}

type SubmitQuizRequest struct {
	Answers []int `json:"answers" binding:"required"`
}

type ReorderLecturesRequest struct {
	ReorderList []map[string]interface{} `json:"reorderList" binding:"required"`
}
