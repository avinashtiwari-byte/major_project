# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

-------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 📝 Online Examination System

A full-stack web application for conducting online MCQ examinations with **real-time AI proctoring**, **automatic evaluation**, and **PDF question import**.

---

## 🚀 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library for building component-based interfaces |
| **Vite 8** | Fast build tool and development server |
| **React Router DOM 7** | Client-side routing and navigation |
| **Axios** | HTTP client for API communication |
| **Tailwind CSS 4** | Utility-first CSS framework for styling |
| **Lucide React** | Modern icon library |
| **jwt-decode** | Decoding JWT tokens on the client side |
| **face-api.js** (`@vladmandic/face-api`) | Real-time face detection for AI proctoring |
| **react-webcam** | Webcam access for capturing proctoring snapshots |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime environment |
| **Express 5** | Web framework for building REST APIs |
| **MongoDB Atlas** | Cloud-hosted NoSQL database |
| **Mongoose 9** | ODM library for MongoDB |
| **JSON Web Token (JWT)** | Secure authentication and authorization |
| **bcryptjs** | Password hashing |
| **Multer** | Handling file uploads (PDF) |
| **pdf-parse** | Extracting text from uploaded PDF files |
| **dotenv** | Environment variable management |
| **CORS** | Cross-origin resource sharing |
| **cookie-parser** | Parsing cookies from requests |

---

## ✨ Features

### 🔐 Authentication & Authorization
- Student and Admin registration/login
- JWT-based session management
- Role-based access control (Admin / Student)

### 👨‍💼 Admin Panel
- Create, edit, and delete exams
- Add/update/delete individual questions
- Upload MCQ questions via PDF (auto-parsed)
- Toggle exam active/inactive status
- Set exam availability window (from/until dates)
- View detailed exam results & analytics
- Review proctoring snapshots per student

### 👨‍🎓 Student Portal
- View available active exams
- Take exams with a timer-based exam room
- Real-time face detection proctoring during exam
- Tab-switch detection and logging
- Automatic answer evaluation and scoring
- View results and performance history

### 📄 PDF Question Import
- Upload a PDF containing MCQ questions
- Text is extracted using `pdf-parse` library
- Questions are parsed using regex-based pattern matching (no external API needed)
- Supports multiple formats:
  - Numbered questions (`1.`, `1)`, `Q1.`, `Question 1:`)
  - Options (`A)`, `A.`, `(A)`, `a)`, `a.`)
  - Answer lines (`Answer: C`, `Ans: C`)
  - Answer key sections at the end of the PDF

### 🤖 AI Proctoring
- Uses **face-api.js** for real-time face detection via webcam
- Captures periodic snapshots during the exam
- Detects tab switches and records the count
- Admin can review all proctoring data per student

---

## 📁 Project Structure

```
major_project/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   └── Layout.jsx
│   │   ├── context/            # React context (Auth)
│   │   ├── pages/
│   │   │   ├── Auth/           # Login & Register pages
│   │   │   ├── Admin/          # Dashboard, ManageExam, ExamResults
│   │   │   └── Student/        # Dashboard, ExamRoom, ResultDashboard
│   │   ├── App.jsx             # Root component with routes
│   │   ├── App.css             # Global styles
│   │   └── main.jsx            # Entry point
│   └── package.json
│
├── server/                     # Backend (Node.js + Express)
│   ├── config/                 # Database configuration
│   ├── controllers/            # Route handlers (auth, exam, result)
│   ├── middleware/              # JWT auth middleware
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Exam.js
│   │   ├── Question.js
│   │   └── Result.js
│   ├── routes/                 # API route definitions
│   │   ├── authRoutes.js
│   │   ├── examRoutes.js
│   │   └── resultRoutes.js
│   ├── server.js               # Express app entry point
│   ├── .env                    # Environment variables
│   └── package.json
│
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **npm**
- **MongoDB Atlas** account (or local MongoDB)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd major_project
```

### 2. Setup the Server
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key
MONGO_URI=your_mongodb_connection_string
```

Start the server:
```bash
npm start
```

### 3. Setup the Client
```bash
cd client
npm install
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Exams
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/exams` | Get all exams |
| GET | `/api/exams/:id` | Get exam by ID |
| POST | `/api/exams` | Create a new exam (Admin) |
| POST | `/api/exams/:id/questions` | Add question to exam |
| PUT | `/api/exams/:id/questions/:qId` | Update a question |
| DELETE | `/api/exams/:id/questions/:qId` | Delete a question |
| PATCH | `/api/exams/:id/toggle` | Toggle exam active status |
| POST | `/api/exams/:id/upload-pdf` | Upload PDF to import questions |
| POST | `/api/exams/:id/submit` | Submit exam answers (Student) |

### Results
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/results` | Get results |
| GET | `/api/results/:id` | Get result by ID |

---

## 👤 Author

**Avinash Tiwari**

---

## 📄 License

This project is for educational purposes.
