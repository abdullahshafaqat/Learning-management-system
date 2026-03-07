package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"
)

func main() {
	baseURL := "http://localhost:5000/api"
	client := &http.Client{}
	ts := time.Now().Unix()
	teacherEmail := fmt.Sprintf("teacher%d@test.com", ts)
	teacherUser := fmt.Sprintf("teacher%d", ts)
	teacherToken := signupAndGetToken(client, baseURL, teacherUser, teacherEmail, "teacher")
	studentEmail := fmt.Sprintf("student%d@test.com", ts)
	studentUser := fmt.Sprintf("student%d", ts)
	studentToken := signupAndGetToken(client, baseURL, studentUser, studentEmail, "student")
	fakeLectureID := "65cf272e272e272e272e272e" // Valid 24 hex chars
	quizData := map[string]interface{}{
		"title": "Go Basics Quiz",
		"questions": []map[string]interface{}{
			{
				"question": "What is Go?",
				"options":  []string{"Language", "Car", "Food"},
				"correct":  0,
			},
			{
				"question": "Is Go statically typed?",
				"options":  []string{"Yes", "No"},
				"correct":  0,
			},
		},
	}
	quizBody, _ := json.Marshal(quizData)
	req, _ := http.NewRequest("POST", baseURL+"/lectures/"+fakeLectureID+"/quizzes", bytes.NewBuffer(quizBody))
	req.AddCookie(teacherToken)
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	body, _ := ioutil.ReadAll(resp.Body)
	var createResp struct {
		Quiz struct {
			ID string `json:"id"`
		} `json:"quiz"`
	}
	json.Unmarshal(body, &createResp)
	quizID := createResp.Quiz.ID
	if quizID == "" {
		return // Cannot proceed
	}
	req, _ = http.NewRequest("GET", baseURL+"/quizzes/"+quizID, nil)
	req.AddCookie(studentToken)
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
	submitData := map[string]interface{}{
		"answers": []int{0, 0},
	}
	submitBody, _ := json.Marshal(submitData)
	req, _ = http.NewRequest("POST", baseURL+"/quizzes/"+quizID+"/submit", bytes.NewBuffer(submitBody))
	req.AddCookie(studentToken)
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
	req, _ = http.NewRequest("POST", baseURL+"/quizzes/"+quizID+"/submit", bytes.NewBuffer(submitBody))
	req.AddCookie(teacherToken)
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusForbidden && resp.StatusCode != http.StatusInternalServerError {
	}
	req, _ = http.NewRequest("GET", baseURL+"/quizzes/"+quizID+"/results", nil)
	req.AddCookie(teacherToken)
	resp, _ = client.Do(req)
	body, _ = ioutil.ReadAll(resp.Body)

}

func signupAndGetToken(client *http.Client, baseURL, username, email, role string) *http.Cookie {
	body, _ := json.Marshal(map[string]string{
		"username": username,
		"email":    email,
		"password": "password123",
		"role":     role,
	})
	resp, err := client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	for _, cookie := range resp.Cookies() {
		if cookie.Name == "token" {
			return cookie
		}
	}
	return nil
}
