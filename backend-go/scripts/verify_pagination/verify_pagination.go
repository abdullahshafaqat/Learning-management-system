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
	email := fmt.Sprintf("student%d@test.com", ts)
	username := fmt.Sprintf("student%d", ts)
	password := "password123"
	authBody, _ := json.Marshal(map[string]string{
		"username": username,
		"email":    email,
		"password": password,
		"role":     "student",
	})

	resp, err := client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(authBody))
	if err != nil {
		return
	}
	defer resp.Body.Close()
	var tokenCookie *http.Cookie
	for _, cookie := range resp.Cookies() {
		if cookie.Name == "token" {
			tokenCookie = cookie
			break
		}
	}

	if tokenCookie == nil {
		_, _ = ioutil.ReadAll(resp.Body)
		return
	}
	doRequest := func(method, url string) {
		req, _ := http.NewRequest(method, url, nil)
		req.AddCookie(tokenCookie)

		resp, err := client.Do(req)
		if err != nil {
			return
		}
		defer resp.Body.Close()

		_, _ = ioutil.ReadAll(resp.Body)
	}
	doRequest("GET", baseURL+"/courses?page=1&limit=2")
	doRequest("GET", baseURL+"/courses?search=go&published=true&limit=1")
}
