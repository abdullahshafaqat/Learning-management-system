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
	signupBody, _ := json.Marshal(map[string]string{
		"username": fmt.Sprintf("media_teacher%d", ts),
		"email":    teacherEmail,
		"password": "password123",
		"role":     "teacher",
	})
	client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(signupBody))
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
	uploadMedia(client, courseID, "My Video", "video.mp4", "video/mp4", "fake video data")
	uploadMedia(client, courseID, "Course Syllabus", "syllabus.pdf", "application/pdf", "fake pdf data")
	uploadMedia(client, courseID, "Lecture Audio", "audio.mp3", "audio/mpeg", "fake audio data")
	resp, _ = client.Get(baseURL + "/lectures/courses/" + courseID)
	var lecturesResp struct {
		Data []models.Lecture `json:"data"`
	}
	body, _ = ioutil.ReadAll(resp.Body)
	json.Unmarshal(body, &lecturesResp)

	studentEmail := fmt.Sprintf("media_student%d@test.com", ts)
	signupBody, _ = json.Marshal(map[string]string{
		"username": fmt.Sprintf("media_student%d", ts),
		"email":    studentEmail,
		"password": "password123",
		"role":     "student",
	})
	client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(signupBody))
	enrollBody, _ := json.Marshal(map[string]string{"courseId": courseID})
	client.Post(baseURL+"/student/enroll", "application/json", bytes.NewBuffer(enrollBody))

	for _, l := range lecturesResp.Data {
		reqInner, _ := http.NewRequest("POST", baseURL+"/progress/courses/"+courseID+"/lectures/"+l.ID.Hex(), nil)
		respInner, _ := client.Do(reqInner)
		if respInner.StatusCode != http.StatusOK {
			_, _ = ioutil.ReadAll(respInner.Body)
		}
	}
	reqFinal, _ := http.NewRequest("GET", baseURL+"/progress/courses/"+courseID, nil)
	respFinal, _ := client.Do(reqFinal)
	_, _ = ioutil.ReadAll(respFinal.Body)
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
		return
	}
	_, _ = ioutil.ReadAll(resp.Body)
}
