# 📚 BookHaven

A full-stack **Book Review Platform** built using the **MERN stack (MongoDB, Express, React, Node.js)**.  
Users can sign up, log in, add books, write reviews, and explore books with ratings — all in one place.

---

## 🎯 Objective
Build a Book Review Platform where users can:
- Sign up & log in securely
- Add, edit, and delete their own books
- Write and manage reviews
- Explore all books with pagination and average ratings

---

## 🚀 Features

### 🔐 User Authentication
- Sign up with **Name, Email, and Password (hashed with bcrypt)**
- Log in using Email & Password
- JWT-based authentication
- Protected routes for logged-in users

### 📘 Book Management
- Add books with **Title, Author, Description, Genre, and Published Year**
- Edit/Delete only your own books
- View all books with **pagination (5 per page)**
- **Auto-seeding:** On first run, the platform automatically adds around **20 random sample books** with realistic details so the homepage isn’t empty.

### ⭐ Review System
- Add reviews with **Rating (1–5 stars)** and **Review Text**
- Edit/Delete your own reviews
- View all reviews and average rating on each book’s details page

---

## 🧠 Tech Stack

**Frontend:**
- React  
- React Router  
- Context API  
- Axios / Fetch  
- Tailwind CSS or Bootstrap  

**Backend:**
- Node.js  
- Express.js  
- MongoDB (MongoDB Atlas)  
- Mongoose  
- bcrypt  
- JWT Authentication  

---

## 🗄️ Database Schema Design

### 👤 User Schema
```js
{
  name: String,
  email: String,
  password: String
}

**Book Schema**
```js
{
  title: String,
  author: String,
  description: String,
  genre: String,
  year: Number,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}

**Review Schema**
```js
{
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: Number,
  reviewText: String
}

