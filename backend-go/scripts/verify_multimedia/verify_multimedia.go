package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
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
	teacherEmail := fmt.Sprintf("media_teacher%d@test.com", ts)

	fmt.Printf("--- Signing up Teacher (%s) ---\n", teacherEmail)
	signupBody, _ := json.Marshal(map[string]string{
		"username": fmt.Sprintf("media_teacher%d", ts),
		"email":    teacherEmail,
		"password": "password123",
		"role":     "teacher",
	})
	client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(signupBody))

	// Create Course
	fmt.Println("\n--- Creating Course ---")
	courseBody, _ := json.Marshal(map[string]string{
		"title":       "Multi-Media Course",
		"code":        fmt.Sprintf("MEDIA%d", ts),
		"description": "Testing Video, PDF, and Audio support",
	})
	resp, _ := client.Post(baseURL+"/courses", "application/json", bytes.NewBuffer(courseBody))
	var courseResp struct {
		Success bool          `json:"success"`
		Course  models.Course `json:"course"`
	}
	body, _ := ioutil.ReadAll(resp.Body)
	json.Unmarshal(body, &courseResp)
	courseID := courseResp.Course.ID.Hex()
	fmt.Printf("Course Created: %s\n", courseID)

	// --- Upload 1: Video ---
	fmt.Println("\n--- Uploading Video Lecture ---")
	uploadMedia(client, courseID, "My Video", "video.mp4", "video/mp4", "fake video data")

	// --- Upload 2: PDF ---
	fmt.Println("\n--- Uploading PDF Lecture ---")
	uploadMedia(client, courseID, "Course Syllabus", "syllabus.pdf", "application/pdf", "fake pdf data")

	// --- Upload 3: Audio ---
	fmt.Println("\n--- Uploading Audio Lecture ---")
	uploadMedia(client, courseID, "Lecture Audio", "audio.mp3", "audio/mpeg", "fake audio data")

	// --- Verify Lecturs ---
	fmt.Println("\n--- Verifying Lectures in DB ---")
	resp, _ = client.Get(baseURL + "/lectures/courses/" + courseID)
	var lecturesResp struct {
		Data []models.Lecture `json:"data"`
	}
	body, _ = ioutil.ReadAll(resp.Body)
	json.Unmarshal(body, &lecturesResp)

	for _, l := range lecturesResp.Data {
		fmt.Printf("Lecture: [%s] Type: %s, File: %s, URL: %s\n", l.Title, l.MediaType, l.FileName, l.FileURL)
	}

	// --- Step 4: Verify Progress Tracking ---
	fmt.Println("\n--- Verifying Progress Tracking ---")
	studentEmail := fmt.Sprintf("media_student%d@test.com", ts)
	signupBody, _ = json.Marshal(map[string]string{
		"username": fmt.Sprintf("media_student%d", ts),
		"email":    studentEmail,
		"password": "password123",
		"role":     "student",
	})
	client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(signupBody))

	fmt.Println("Enrolling student...")
	enrollBody, _ := json.Marshal(map[string]string{"courseId": courseID})
	client.Post(baseURL+"/student/enroll", "application/json", bytes.NewBuffer(enrollBody))

	for _, l := range lecturesResp.Data {
		fmt.Printf("Marking %s (%s) as completed...\n", l.Title, l.MediaType)
		reqInner, _ := http.NewRequest("POST", baseURL+"/progress/courses/"+courseID+"/lectures/"+l.ID.Hex(), nil)
		respInner, _ := client.Do(reqInner)
		if respInner.StatusCode != http.StatusOK {
			b, _ := ioutil.ReadAll(respInner.Body)
			fmt.Printf("Failed: %s\n", string(b))
		}
	}

	fmt.Println("\n--- Final Progress Check ---")
	reqFinal, _ := http.NewRequest("GET", baseURL+"/progress/courses/"+courseID, nil)
	respFinal, _ := client.Do(reqFinal)
	bodyFinal, _ := ioutil.ReadAll(respFinal.Body)
	fmt.Printf("Result: %s\n", string(bodyFinal))
}

func uploadMedia(client *http.Client, courseID, title, filename, mime, content string) {
	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	_ = w.WriteField("title", title)
	fw, _ := w.CreateFormFile("file", filename)
	io.WriteString(fw, content)
	w.Close()

	req, _ := http.NewRequest("POST", baseURL+"/lectures/courses/"+courseID, &b)
	req.Header.Set("Content-Type", w.FormDataContentType())
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Printf("Status: %s, Result: %s\n", resp.Status, string(body))
}
