package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var DB *mongo.Database

func ConnectDB(uri string) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal("Error connecting to MongoDB:", err)
	}

	// Ping the database
	log.Println("Pinging MongoDB...")
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Printf("Error pinging MongoDB: %v", err)
		log.Fatal("Could not connect to MongoDB. Check your internet connection and ensure your IP is whitelisted in MongoDB Atlas.")
	}

	Client = client
	DB = client.Database("lms") // Default database name, can be extracted if needed
	log.Println("Connected to MongoDB successfully")
}

func GetCollection(collectionName string) *mongo.Collection {
	return DB.Collection(collectionName)
}
