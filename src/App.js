import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDDbdNTJ-x4gyD0VsyNfX6czmTHX_fDiaM",
  authDomain: "notesmba-5379c.firebaseapp.com",
  projectId: "notesmba-5379c",
  storageBucket: "notesmba-5379c.appspot.com",
  messagingSenderId: "969677120738",
  appId: "1:969677120738:web:617750a5c8e1bdd6722abb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

/* ================= USERS ================= */
const ADMIN = { username: "admin", password: "admin123" };

const STUDENTS = Array.from({ length: 71 }, (_, i) => {
  const num = String(i + 1).padStart(3, "0");
  return `25PMB${num}`;
});

/* ================= SUBJECTS ================= */
const SUBJECTS = [
  { name: "Marketing Management", id: "marketing", icon: "📊", color: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
  { name: "Financial Management", id: "finance", icon: "💰", color: "linear-gradient(135deg, #06b6d4, #3b82f6)" },
  { name: "Human Resource Management", id: "hrm", icon: "👥", color: "linear-gradient(135deg, #f43f5e, #fb7185)" },
  { name: "Operations Techniques and Management", id: "operations", icon: "⚙️", color: "linear-gradient(135deg, #10b981, #22c55e)" },
  { name: "Basics of Strategic Management", id: "strategy", icon: "🎯", color: "linear-gradient(135deg, #8b5cf6, #ec4899)" },
  { name: "Research Methodology", id: "research", icon: "🔬", color: "linear-gradient(135deg, #0ea5e9, #6366f1)" },
  { name: "Decision Analysis Techniques for Managers", id: "decision", icon: "📈", color: "linear-gradient(135deg, #f59e0b, #f97316)" },
  { name: "Business Environment", id: "business", icon: "🏢", color: "linear-gradient(135deg, #64748b, #334155)" },
];

/* ================= APP ================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [page, setPage] = useState("login");

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const handleLogin = (username, password) => {
    if (username === ADMIN.username && password === ADMIN.password) {
      setUser(username);
      setRole("admin");
      setPage("dashboard");
    } else if (
      STUDENTS.includes(username) &&
      (password === "student123" || password === username)
    ) {
      setUser(username);
      setRole("student");
      setPage("dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setPage("login");
  };

  const fetchNotes = async (subjectId) => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "notes_" + subjectId));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotes(data);
    } catch {
      alert("Error loading notes");
    }
    setLoading(false);
  };

  const uploadNote = async () => {
    if (!file || !selectedSubject) return alert("Select file");

    setLoading(true);
    try {
      const storageRef = ref(
        storage,
        `notes/${selectedSubject.id}/${Date.now()}_${file.name}`
      );

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "notes_" + selectedSubject.id), {
        name: file.name,
        url,
        createdAt: new Date().toLocaleString(),
      });

      setFile(null);
      fetchNotes(selectedSubject.id);
    } catch {
      alert("Upload failed");
    }
    setLoading(false);
  };

  const deleteNote = async (note) => {
    if (!window.confirm("Delete this file?")) return;

    try {
      await deleteDoc(doc(db, "notes_" + selectedSubject.id, note.id));
      await deleteObject(
        ref(storage, `notes/${selectedSubject.id}/${note.name}`)
      );
      fetchNotes(selectedSubject.id);
    } catch {
      alert("Delete failed");
    }
  };

  if (page === "login") return <Login onLogin={handleLogin} />;

  return (
    <div style={styles.app}>
      <Navbar user={user} role={role} logout={logout} />

      <main style={styles.main}>
        {!selectedSubject ? (
          <section style={styles.grid}>
            {SUBJECTS.map((sub) => (
              <div
                key={sub.id}
                style={{ ...styles.card, background: sub.color }}
                onClick={() => {
                  setSelectedSubject(sub);
                  fetchNotes(sub.id);
                }}
              >
                <div style={styles.cardContent}>
                  <span style={styles.icon}>{sub.icon}</span>
                  <span style={styles.cardTitle}>{sub.name}</span>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section style={styles.content}>
            <button style={styles.backBtn} onClick={() => setSelectedSubject(null)}>
              ← Back
            </button>

            <h2 style={styles.heading}>
              {selectedSubject.icon} {selectedSubject.name}
            </h2>

            {role === "admin" && (
              <div style={styles.upload}>
                <input style={styles.input} type="file" onChange={(e) => setFile(e.target.files[0])} />
                <button style={styles.primaryBtn} onClick={uploadNote}>
                  Upload
                </button>
              </div>
            )}

            {loading && <p>Loading...</p>}
            {!loading && notes.length === 0 && <p>No notes available</p>}

            <div style={styles.notes}>
              {notes.map((note) => (
                <div key={note.id} style={styles.note}>
                  <div>
                    <p style={styles.noteTitle}>{note.name}</p>
                    <span style={styles.meta}>{note.createdAt}</span>
                  </div>

                  <div style={styles.actions}>
                    <a style={styles.link} href={note.url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                    {role === "admin" && (
                      <button style={styles.dangerBtn} onClick={() => deleteNote(note)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/* LOGIN */
function Login({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  return (
    <div style={styles.login}>
      <div style={styles.loginCard}>
        <h2 style={styles.loginTitle}>Welcome Back</h2>
        <input style={styles.input} placeholder="Username" onChange={(e) => setU(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password" onChange={(e) => setP(e.target.value)} />
        <button style={styles.primaryBtn} onClick={() => onLogin(u, p)}>
          Login
        </button>
      </div>
    </div>
  );
}

/* NAVBAR */
function Navbar({ user, role, logout }) {
  return (
    <header style={styles.nav}>
      <h3>Notes Dashboard</h3>
      <div style={styles.navRight}>
        <span>{user} ({role})</span>
        <button style={styles.secondaryBtn} onClick={logout}>Logout</button>
      </div>
    </header>
  );
}

/* ================= DESIGN SYSTEM ================= */
const styles = {
  app: { minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, sans-serif" },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px 32px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
  },

  navRight: { display: "flex", gap: 16, alignItems: "center" },

  main: { padding: 32 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: 24,
  },

  card: {
    padding: 24,
    borderRadius: 16,
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
  },

  cardContent: { display: "flex", flexDirection: "column", gap: 12 },

  icon: { fontSize: 28 },

  cardTitle: { fontWeight: 600 },

  content: { maxWidth: 900, margin: "auto" },

  heading: { marginBottom: 16 },

  upload: { display: "flex", gap: 12, marginBottom: 20 },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    outline: "none",
  },

  primaryBtn: {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
  },

  secondaryBtn: {
    background: "#e5e7eb",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },

  dangerBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
  },

  notes: { display: "grid", gap: 12 },

  note: {
    background: "#fff",
    padding: 16,
    borderRadius: 10,
    display: "flex",
    justifyContent: "space-between",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },

  noteTitle: { fontWeight: 500 },

  meta: { fontSize: 12, color: "#6b7280" },

  actions: { display: "flex", gap: 10, alignItems: "center" },

  link: { color: "#6366f1", fontWeight: 500 },

  backBtn: { marginBottom: 10, cursor: "pointer" },

  login: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  },

  loginCard: {
    background: "#fff",
    padding: 32,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: 300,
  },

  loginTitle: { textAlign: "center", marginBottom: 10 },
};
