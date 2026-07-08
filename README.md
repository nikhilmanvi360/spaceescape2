
<div align="center">

# 🚀 MISSION OVERRIDE

### *A Story-Driven Browser-Based Coding Adventure*

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?logo=firebase)
![Render](https://img.shields.io/badge/Hosted_on-Render-46E3B7?logo=render)

**Mission Override** is a browser-based coding adventure built for a college cluster event where players solve programming challenges to save a failing spacecraft.

🌐 **Live Demo:** https://mission-override.onrender.com/  
💻 **GitHub:** https://github.com/nikhilmanvi360/spaceescape2

</div>

---

# 📚 Table of Contents
- Overview
- Story
- Features
- Gameplay
- Screenshots
- Tech Stack
- Architecture
- Folder Structure
- Installation
- Firebase
- Learning Outcomes
- Roadmap
- Author

---

# 📖 Overview

Mission Override transforms coding challenges into a science-fiction mission. Instead of answering questions in a traditional quiz interface, players enter a futuristic command center and complete engineering missions. Every solved challenge restores a damaged spacecraft subsystem, creating a more engaging and memorable learning experience.

The project was developed for a **college-level cluster technical event** to encourage students to practice programming through gamification.

---

# 🌌 Story

The spacecraft **USCSS Aegis** has suffered a catastrophic systems failure.

You are the chief systems engineer. Navigation, reactor control and communication modules are offline. Every subsystem is protected by engineering protocols that can only be unlocked by solving programming challenges.

Your objective is simple:

> **Restore every system before total mission failure.**

---

# ✨ Features

## 🎮 Player Experience
- Story-driven gameplay
- Interactive coding challenges
- Mission timer
- Progress tracking
- Score calculation
- Responsive futuristic UI
- Mission completion summary

## 🛡️ Admin Dashboard
- Team monitoring
- Performance analytics
- Player statistics
- Mission progress
- Event management

---

# 🎯 Gameplay Flow

```text
Landing Page
    │
    ▼
Team Login
    │
    ▼
Mission Briefing
    │
    ▼
Mission Selection
    │
    ▼
Solve Coding Challenge
    │
 ┌──┴────────────┐
 │               │
Correct       Incorrect
 │               │
 ▼               ▼
Next Mission   Retry
 │
 ▼
Mission Complete
 │
 ▼
Leaderboard
```

---

# 📸 Screenshots

> Replace the image paths with your uploaded screenshots if needed.

## 🚀 Landing Page

<img width="1920" height="1200" alt="Screenshot 2026-07-08 214950" src="https://github.com/user-attachments/assets/1d6d713e-4e0a-46dc-acef-af8e5b7c383d" />


The introduction screen presents the emergency aboard the USCSS Aegis and prepares players for the mission.

## 🛰️ Mission Selection

<img width="1920" height="1200" alt="Screenshot 2026-07-08 215027" src="https://github.com/user-attachments/assets/072d0fa1-1a0d-4cd8-817b-693366b2ed52" />


Players choose engineering tasks and progress through the storyline.

## 💻 Gameplay

<img width="1920" height="1200" alt="Screenshot 2026-05-08 100625" src="https://github.com/user-attachments/assets/61866b06-8238-4239-b974-5a4df2f87107" />


The core interface where users solve programming challenges while tracking progress and remaining time.

## 🏆 Mission Complete

<img width="1920" height="1200" alt="Screenshot 2026-07-08 215123" src="https://github.com/user-attachments/assets/a78a0a6a-e87c-401b-ad03-a6c246c952b0" />


Displays mission statistics, score and completion status.

## 📊 Admin Dashboard

<img width="1920" height="1200" alt="Screenshot 2026-07-08 215149" src="https://github.com/user-attachments/assets/61b1edf0-241c-4276-9798-967508b0fc49" />

Allows organizers to monitor participants and event analytics.

---

# 🛠️ Tech Stack

| Category | Technology |
|-----------|------------|
| Frontend | React |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS, CSS |
| Backend | Firebase |
| Database | Firestore |
| Hosting | Render |
| Version Control | Git & GitHub |

---

# 🏗️ Architecture

```text
Player
   │
   ▼
React Application
   ├── Components
   ├── Pages
   ├── Hooks
   ├── Context
   └── Services
          │
          ▼
      Firebase
      ├── Authentication
      ├── Firestore
      └── Analytics
```

---

# 📁 Folder Structure

```text
src/
├── assets/
├── components/
├── contexts/
├── firebase/
├── hooks/
├── lib/
├── pages/
├── services/
├── App.tsx
└── main.tsx
```

---

# ⚙️ Installation

```bash
git clone https://github.com/nikhilmanvi360/spaceescape2.git
cd spaceescape2
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

---

# 🔥 Firebase

Mission Override uses Firebase for authentication, Firestore storage, player records, mission progress and leaderboard management.

Create a `.env` file with your Firebase credentials before running locally.

---

# 📚 What I Learned

- Building scalable React applications
- Component-based architecture
- TypeScript development
- Firebase integration
- Responsive UI design
- Gamification concepts
- State management
- Deployment using Render

---

# 🛣️ Future Roadmap

- [x] Mission-based gameplay
- [x] Leaderboard
- [x] Admin dashboard
- [ ] Multiplayer mode
- [ ] AI-generated coding challenges
- [ ] Built-in code editor
- [ ] Achievement badges
- [ ] Difficulty levels

---

# 👨‍💻 Author

**Nikhil Manvi**

- GitHub: https://github.com/nikhilmanvi360
- Live Demo: https://mission-override.onrender.com/

---

<div align="center">

### ⭐ If you found this project interesting, consider giving it a Star!

*"Programming isn't just writing code—it's completing the mission."*

</div>
