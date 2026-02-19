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

	// 0. Signup helper
	ts := time.Now().Unix()
	email := fmt.Sprintf("student%d@test.com", ts)
	username := fmt.Sprintf("student%d", ts)
	password := "password123"

	fmt.Printf("--- Signing up Student (%s / %s) ---\n", email, username)
	authBody, _ := json.Marshal(map[string]string{
		"username": username,
		"email":    email,
		"password": password,
		"role":     "student",
	})

	resp, err := client.Post(baseURL+"/auth/Signup", "application/json", bytes.NewBuffer(authBody))
	if err != nil {
		fmt.Printf("Signup Error: %v\n", err)
		return
	}
	defer resp.Body.Close()

	// Read cookies from response
	var tokenCookie *http.Cookie
	for _, cookie := range resp.Cookies() {
		if cookie.Name == "token" {
			tokenCookie = cookie
			break
		}
	}

	if tokenCookie == nil {
		body, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("Failed to get token cookie from Signup. Status: %s, Body: %s\n", resp.Status, string(body))
		return
	}
	fmt.Println("Signup Successful, Token obtained.")

	// Helper function for authorized requests
	doRequest := func(method, url string) {
		req, _ := http.NewRequest(method, url, nil)
		req.AddCookie(tokenCookie)

		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			return
		}
		defer resp.Body.Close()

		body, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("Status: %s\nBody: %s\n", resp.Status, string(body))
	}

	// 1. Test Courses Pagination
	fmt.Println("\n--- Testing Courses Pagination ---")
	doRequest("GET", baseURL+"/courses?page=1&limit=2")

	// 2. Test Courses Search and Filtering
	fmt.Println("\n--- Testing Courses Search (query='go') & Published=true ---")
	doRequest("GET", baseURL+"/courses?search=go&published=true&limit=1")
}
