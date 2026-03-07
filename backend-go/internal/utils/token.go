package utils

import (
	"errors"
	"time"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Claims struct {
	ID   string `json:"id"`
	Role string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateTokens(userID primitive.ObjectID, role string) (string, string, error) {
	cfg := config.LoadConfig()

	accessClaims := Claims{
		ID:   userID.Hex(),
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		return "", "", err
	}

	refreshClaimsStruct := Claims{
		ID:   userID.Hex(),
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaimsStruct)
	refreshTokenString, err := refreshToken.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

func VerifyToken(tokenString string) (*Claims, error) {
	cfg := config.LoadConfig()

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func SetTokenCookie(c *gin.Context, accessToken, refreshToken string) {

	c.SetCookie("token", accessToken, 900, "/", "", false, true)
	c.SetCookie("refreshToken", refreshToken, 3600*24*7, "/", "", false, true)
}

func ClearTokenCookie(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", "", false, true)
	c.SetCookie("refreshToken", "", -1, "/", "", false, true)
}

func ValidateRefreshToken(tokenString string) (*Claims, error) {
	return VerifyToken(tokenString)
}
