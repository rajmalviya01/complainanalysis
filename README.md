# 🎓 College Complaint Management System

A web-based complaint management system for colleges where students can submit complaints and authorities can track, prioritize, and resolve them efficiently.

The system includes an **intelligent priority engine** that automatically determines complaint priority based on content, category, and time delay.

---

## 🚀 Features

### 👨‍🎓 Student Panel
- Signup & Login using School ID
- Submit complaints with title, description, and category
- View **only their own complaints**
- Track complaint status (Pending / Resolved)
- Complaints are color-coded by priority

### 🧑‍💼 Authority Panel
- View all complaints in one dashboard
- Complaints split into:
  - Active Complaints
  - Resolved Complaints
- Click any complaint to view full details in a popup
- Mark complaints as **Resolved**
- Resolved complaints automatically move to a separate section

---

## 🧠 Intelligent Priority Engine (Rule-Based)

The system automatically assigns and updates complaint priority based on:

### 1️⃣ Keyword Severity (Title + Description)
- **Critical keywords** (fire, electric shock, gas leak, accident, etc.)
- **High severity keywords** (power cut, water supply, exam issue, etc.)
- **Medium / Low severity keywords**

### 2️⃣ Category Weight
- Infrastructure → Higher priority
- Hostel → Medium-high
- Academics → Medium
- Other → Low

### 3️⃣ Time-Based Escalation
- Complaints unresolved for longer durations automatically increase in priority
- Prevents complaints from being ignored

### 🎯 Priority Levels
| Priority | Color |
|--------|-------|
| Low | Gray |
| Medium | Yellow |
| High | Red |
| Resolved | Green |

> ⚠️ This is an **intelligent rule-based system**, not machine learning.  
> It is designed to be reliable, explainable, and easy to extend.

---

## 🛠️ Tech Stack

- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Backend / Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Authentication**: Custom role-based logic (Student / Authority)

---

## 📁 Project Structure

/public
├── index.html
├── app.js
└── firebase.json

## 🔧 Firebase Setup Instructions

1. Create a Firebase project
2. Enable **Firestore Database**
3. Set Firestore rules (for development):
   ```js
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }


   🌐 Hosting the Project
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
