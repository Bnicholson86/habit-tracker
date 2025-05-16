# 📋 To‑Do Master Web App  
React • React Router • Bootstrap • Firebase (Auth + Firestore)

## 1 — Project Goal
Create a responsive, single‑page productivity app with **five tabs**:
1. **To‑Do** – today’s tasks, estimations, timers, push‑to‑tomorrow, reminders  
2. **Goals** – long‑term goals with progress, subtasks, reward points  
3. **Habits** – positive & negative habit tracker with streaks, misses, notes  
4. **Pomodoro** – custom work/break cycles; link sessions to to‑dos  
5. **Schedule** – visual time‑block view of today’s tasks + breaks  

Everything is **per‑user**. Store data in Firestore and authenticate with Firebase Auth.  
The final build will be deployed as a standalone web app (can be iframed inside WordPress later).

---

## 2 — Tech Stack

| Layer        | Tech                                                    |
|--------------|---------------------------------------------------------|
| Front‑end    | React, React Router (`react-router-dom`), Bootstrap |
| State Mgmt   | React Context or Redux Toolkit (Cursor may choose)      |
| Backend      | Firebase: **Auth** + **Firestore** (scaffold with **Firebase Studio**) |
| Hosting      | Firebase Hosting, Vercel, Netlify, or any static host   |
| Notifications| `serviceWorker` + Web Notifications API (for task alerts)|

---

## 3 — Firestore Collections (one document tree **per user**)  

users/{uid}/
├─ todos (collection of today’s & future tasks)
├─ goals (collection)
├─ habits (collection)
├─ pomodoroPrefs (doc) ← custom work/break lengths
└─ sessions (collection of completed pomodoros & time blocks)


> **Security rules:** user may only read/write `users/{uid}/**` where `request.auth.uid == uid`.

---

## 4 — Folder Structure (React)

/to-do-master-app
├─ /public
│ └─ index.html
├─ /src
│ ├─ /components
│ │ ├─ Todo.jsx
│ │ ├─ Goals.jsx
│ │ ├─ Habits.jsx
│ │ ├─ Pomodoro.jsx
│ │ └─ Schedule.jsx
│ ├─ /firebase ← Firebase init & helpers
│ │ ├─ config.js
│ │ ├─ auth.js
│ │ └─ db.js
│ ├─ /hooks ← custom React hooks for Firestore ops
│ ├─ /context ← global state / user provider
│ ├─ /styles ← Bootstrap overrides or Tailwind config
│ ├─ App.jsx ← routes + layout
│ └─ index.jsx ← React entry
├─ .env ← Firebase keys (not committed)
├─ package.json
└─ README.md


---

## 5 — Cursor Prompt Series

**Prompt 1 — Skeleton**  
> “Generate a React app with React Router (`BrowserRouter`). Create five routes: `/todo`, `/goals`, `/habits`, `/pomodoro`, `/schedule`. Use Bootstrap NavTabs for navigation. Provide placeholder components.”

**Prompt 2 — Firebase Setup**  
> “Add Firebase SDK. Create `firebase/config.js` loaded from `.env`. Initialize Auth and Firestore. Build helper functions: `signInWithEmail`, `signOut`, and generic CRUD for any `{collection}` under `users/{uid}`.”

**Prompt 3 — Firestore Rules**  
> “Output Firestore security rules enforcing that a user can only read/write docs under their own `users/{uid}` path.”

**Prompt 4 — To‑Do Page**  
> “Implement `/todo`:  
>  • List today’s tasks (`where date == today`)  
>  • ‘Add Task’ modal (name, estimate mins, reminder toggle)  
>  • Start/Stop timer saving `actualTime`  
>  • Dropdown to ‘Push to Tomorrow’ (updates `date` field)  
>  • Browser notification on reminder time.”

**Prompt 5 — Goals Page**  
> “Implement `/goals`:  
>  • Create goal (title, rewardPoints, targetHours)  
>  • Progress slider (% complete) stored in doc  
>  • Subtasks array (each with time estimate + notes)  
>  • Button to send subtask to To‑Do collection.”

**Prompt 6 — Habits Page**  
> “Implement `/habits`:  
>  • Add habit (positive/negative flag, target per day)  
>  • Increment/decrement buttons per day, auto‑streak calc  
>  • ‘Missed’ counter + textarea for reason  
>  • Save to Firestore in real time.”

**Prompt 7 — Pomodoro Page**  
> “Implement `/pomodoro`:  
>  • Form to save default workMinutes & breakMinutes in `pomodoroPrefs`  
>  • Start session: count down work, then auto‑break, repeat  
>  • Option to pick an active To‑Do task; after session, log to `sessions` with taskId and duration.”

**Prompt 8 — Schedule Page**  
> “Implement `/schedule`:  
>  • Read `sessions` + today’s tasks to build a timeline (e.g., using CSS flex)  
>  • Show blocks for work intervals & breaks, highlight ‘now’ line  
>  • Summary of total productive vs break time.”

**Prompt 9 — Styling & PWA**  
> “Apply Bootstrap classes for responsive layout. Add service worker via `create-react-app` PWA template to enable offline caching and notifications.”

---

## 6 — Deployment

```bash
# one‑time
npm i -g firebase-tools
firebase login
firebase init hosting  # select build folder
npm run build
firebase deploy
