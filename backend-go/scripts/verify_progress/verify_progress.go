package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"net/http/cookiejar"
	"time"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
)

const baseURL = "http://localhost:5000/api"

func main() {
	jar, _ := cookiejar.New(nil)
	client := &http.Client{Jar: jar}

	// 1. Signup/Login Student
	ts := time.Now().Unix()
	studentUID := fmt.Sprintf("prog_student%d", ts)
	studentEmail := fmt.Sprintf("%s@test.com", studentUID)

	fmt.Printf("--- Signing up Student (%s) ---\n", studentEmail)
	signupBody, _ := json.Marshal(map[string]string{
		"username": studentUID,
		"email":    studentEmail,
		"password": "password123",
		"role":     "student",
	})
	resp, _ := client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(signupBody))
	if resp.StatusCode != http.StatusCreated {
		body, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("Signup Failed: %s\n", string(body))
		return
	}
	fmt.Println("Signup Successful.")

	// 2. Setup (Teacher creates course and lecture)
	teacherUID := fmt.Sprintf("prog_teacher%d", ts)
	teacherEmail := fmt.Sprintf("%s@test.com", teacherUID)
	fmt.Printf("--- Signing up Teacher (%s) ---\n", teacherEmail)
	signupBody, _ = json.Marshal(map[string]string{
		"username": teacherUID,
		"email":    teacherEmail,
		"password": "password123",
		"role":     "teacher",
	})
	resp, _ = client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(signupBody))

	// Get teacher token (manual parse if needed, but client.Jar handles it)

	fmt.Println("\n--- Creating Course (Teacher) ---")
	courseBody, _ := json.Marshal(map[string]string{
		"title":       "Progress Test Course",
		"code":        fmt.Sprintf("PROG%d", ts),
		"description": "Testing progress tracking",
	})
	req, _ := http.NewRequest("POST", baseURL+"/courses", bytes.NewBuffer(courseBody))
	resp, _ = client.Do(req)
	var courseResp struct {
		Success bool          `json:"success"`
		Course  models.Course `json:"course"`
	}
	body, _ := ioutil.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		fmt.Printf("Course Creation Failed: %s, Body: %s\n", resp.Status, string(body))
		return
	}
	json.Unmarshal(body, &courseResp)
	courseID := courseResp.Course.ID.Hex()
	fmt.Printf("Course Created: %s\n", courseID)

	fmt.Println("\n--- Creating Lecture (Teacher) ---")

	// Multipart form for lecture
	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	_ = w.WriteField("title", "Lecture 1")
	fw, _ := w.CreateFormFile("file", "test.txt")
	fw.Write([]byte("dummy content"))
	w.Close()

	req, _ = http.NewRequest("POST", baseURL+"/lectures/courses/"+courseID, &b)
	req.Header.Set("Content-Type", w.FormDataContentType())
	resp, _ = client.Do(req)

	var lectureResp struct {
		Success bool           `json:"success"`
		Lecture models.Lecture `json:"lecture"`
	}
	body, _ = ioutil.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		fmt.Printf("Lecture Creation Failed: %s, Body: %s\n", resp.Status, string(body))
		return
	}
	json.Unmarshal(body, &lectureResp)
	lectureID := lectureResp.Lecture.ID.Hex()
	fmt.Printf("Lecture Created: %s\n", lectureID)

	// 3. Mark Lecture Completed (Student)
	fmt.Println("\n--- Logging in Student ---")
	loginBody, _ := json.Marshal(map[string]string{"email": studentEmail, "password": "password123"})
	resp, _ = client.Post(baseURL+"/auth/Login", "application/json", bytes.NewBuffer(loginBody))
	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("Student Login Failed: %s, Body: %s\n", resp.Status, string(body))
		return
	}
	fmt.Println("Student Login Successful.")

	fmt.Println("\n--- Marking Lecture Completed (Student) ---")
	req, _ = http.NewRequest("POST", baseURL+"/progress/courses/"+courseID+"/lectures/"+lectureID, nil)
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
	fmt.Printf("Status: %s, Body: %s\n", resp.Status, string(body))

	// 4. Check Progress
	fmt.Println("\n--- Checking Progress (Student) ---")
	req, _ = http.NewRequest("GET", baseURL+"/progress/courses/"+courseID, nil)
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
	fmt.Printf("Status: %s, Body: %s\n", resp.Status, string(body))

	// 5. Submit Quiz & Check Progress
	fmt.Println("\n--- Creating Quiz (Teacher) ---")
	// Re-login teacher
	resp, _ = client.Post(baseURL+"/auth/Login", "application/json", bytes.NewBuffer([]byte(fmt.Sprintf(`{"email":"%s","password":"password123"}`, teacherEmail))))
	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("Teacher Re-Login Failed: %s, Body: %s\n", resp.Status, string(body))
		return
	}
	fmt.Println("Teacher Re-Login Successful.")

	quizBody := []byte(`{
		"title": "Module Quiz",
		"questions": [
			{"question": "Is Go cool?", "options": ["Yes", "No"], "correct": 0}
		]
	}`)
	req, _ = http.NewRequest("POST", baseURL+"/lectures/"+lectureID+"/quizzes", bytes.NewBuffer(quizBody))
	resp, _ = client.Do(req)
	var quizResp struct {
		Success bool        `json:"success"`
		Quiz    models.Quiz `json:"quiz"`
	}
	body, _ = ioutil.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		fmt.Printf("Quiz Creation Failed: %s, Body: %s\n", resp.Status, string(body))
		return
	}
	json.Unmarshal(body, &quizResp)
	quizID := quizResp.Quiz.ID.Hex()
	fmt.Printf("Quiz Created: %s\n", quizID)

	fmt.Println("\n--- Submitting Quiz (Student) ---")
	resp, _ = client.Post(baseURL+"/auth/Login", "application/json", bytes.NewBuffer(loginBody))
	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("Student Login Failed before quiz submit: %s, Body: %s\n", resp.Status, string(body))
		return
	}
	submitBody := []byte(`{"answers": [0]}`)
	req, _ = http.NewRequest("POST", baseURL+"/quizzes/"+quizID+"/submit", bytes.NewBuffer(submitBody))
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
	fmt.Printf("Quiz Submission Status: %s, Body: %s\n", resp.Status, string(body))

	fmt.Println("\n--- Checking Progress again (Student) ---")
	req, _ = http.NewRequest("GET", baseURL+"/progress/courses/"+courseID, nil)
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
	fmt.Printf("Status: %s, Body: %s\n", resp.Status, string(body))
}
