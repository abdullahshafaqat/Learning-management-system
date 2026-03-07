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
	ts := time.Now().Unix()
	studentUID := fmt.Sprintf("prog_student%d", ts)
	studentEmail := fmt.Sprintf("%s@test.com", studentUID)
	signupBody, _ := json.Marshal(map[string]string{
		"username": studentUID,
		"email":    studentEmail,
		"password": "password123",
		"role":     "student",
	})
	resp, _ := client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(signupBody))
	if resp.StatusCode != http.StatusCreated {
		_, _ = ioutil.ReadAll(resp.Body)
		return
	}
	teacherUID := fmt.Sprintf("prog_teacher%d", ts)
	teacherEmail := fmt.Sprintf("%s@test.com", teacherUID)
	signupBody, _ = json.Marshal(map[string]string{
		"username": teacherUID,
		"email":    teacherEmail,
		"password": "password123",
		"role":     "teacher",
	})
	resp, _ = client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(signupBody))
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
		return
	}
	json.Unmarshal(body, &courseResp)
	courseID := courseResp.Course.ID.Hex()
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
		return
	}
	json.Unmarshal(body, &lectureResp)
	lectureID := lectureResp.Lecture.ID.Hex()
	loginBody, _ := json.Marshal(map[string]string{"email": studentEmail, "password": "password123"})
	resp, _ = client.Post(baseURL+"/auth/Login", "application/json", bytes.NewBuffer(loginBody))
	if resp.StatusCode != http.StatusOK {
		_, _ = ioutil.ReadAll(resp.Body)
		return
	}
	req, _ = http.NewRequest("POST", baseURL+"/progress/courses/"+courseID+"/lectures/"+lectureID, nil)
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
	req, _ = http.NewRequest("GET", baseURL+"/progress/courses/"+courseID, nil)
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
	resp, _ = client.Post(baseURL+"/auth/Login", "application/json", bytes.NewBuffer([]byte(fmt.Sprintf(`{"email":"%s","password":"password123"}`, teacherEmail))))
	if resp.StatusCode != http.StatusOK {
		_, _ = ioutil.ReadAll(resp.Body)
		return
	}

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
		return
	}
	json.Unmarshal(body, &quizResp)
	quizID := quizResp.Quiz.ID.Hex()
	resp, _ = client.Post(baseURL+"/auth/Login", "application/json", bytes.NewBuffer(loginBody))
	if resp.StatusCode != http.StatusOK {
		_, _ = ioutil.ReadAll(resp.Body)
		return
	}
	submitBody := []byte(`{"answers": [0]}`)
	req, _ = http.NewRequest("POST", baseURL+"/quizzes/"+quizID+"/submit", bytes.NewBuffer(submitBody))
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
	req, _ = http.NewRequest("GET", baseURL+"/progress/courses/"+courseID, nil)
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
}
