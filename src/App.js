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
  { name: "Marketing Management", id: "marketing", icon: "📊" },
  { name: "Financial Management", id: "finance", icon: "💰" },
  { name: "Human Resource Management", id: "hrm", icon: "👥" },
  { name: "Operations Techniques and Management", id: "operations", icon: "⚙️" },
  { name: "Basics of Strategic Management", id: "strategy", icon: "🎯" },
  { name: "Research Methodology", id: "research", icon: "🔬" },
  { name: "Decision Analysis Techniques for Managers", id: "decision", icon: "📈" },
  { name: "Business Environment", id: "business", icon: "🏢" },
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
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h3 style={styles.logo}>Notes</h3>
          <div style={styles.userSection}>
            <span style={styles.userText}>{user} ({role})</span>
            <button onClick={logout} style={styles.secondaryBtn}>Logout</button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {!selectedSubject ? (
          <div style={styles.grid}>
            {SUBJECTS.map((sub) => (
              <div
                key={sub.id}
                style={styles.card}
                onClick={() => {
                  setSelectedSubject(sub);
                  fetchNotes(sub.id);
                }}
              >
                <div style={styles.cardIcon}>{sub.icon}</div>
                <div style={styles.cardText}>{sub.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.content}>
            <button style={styles.backBtn} onClick={() => setSelectedSubject(null)}>
              ← Back
            </button>

            <h2 style={styles.heading}>
              {selectedSubject.icon} {selectedSubject.name}
            </h2>

            {role === "admin" && (
              <div style={styles.upload}>
                <input
                  type="file"
                  style={styles.input}
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <button onClick={uploadNote} style={styles.primaryBtn}>
                  Upload
                </button>
              </div>
            )}

            {loading && <p style={styles.meta}>Loading...</p>}
            {!loading && notes.length === 0 && (
              <p style={styles.meta}>No notes available</p>
            )}

            <div style={styles.notes}>
              {notes.map((note) => (
                <div key={note.id} style={styles.note}>
                  <div>
                    <p style={styles.noteTitle}>{note.name}</p>
                    <span style={styles.meta}>{note.createdAt}</span>
                  </div>

                  <div style={styles.actions}>
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.link}
                    >
                      Open
                    </a>

                    {role === "admin" && (
                      <button
                        onClick={() => deleteNote(note)}
                        style={styles.dangerBtn}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
        <h2 style={styles.loginTitle}>Sign in</h2>
        <input style={styles.input} placeholder="Username" onChange={(e) => setU(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password" onChange={(e) => setP(e.target.value)} />
        <button style={styles.primaryBtn} onClick={() => onLogin(u, p)}>
          Continue
        </button>
      </div>
    </div>
  );
}

/* ================= DESIGN SYSTEM ================= */
const styles = {
  app: {
    minHeight: "100vh",
    background: "#f9fafb",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  header: {
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
  },

  headerContent: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
  },

  logo: {
    fontWeight: 600,
  },

  userSection: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },

  userText: {
    color: "#6b7280",
    fontSize: 14,
  },

  main: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: 32,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: 20,
  },

  card: {
    background: "#ffffff",
    padding: 24,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  cardIcon: {
    fontSize: 28,
    marginBottom: 10,
  },

  cardText: {
    fontWeight: 500,
  },

  content: {
    maxWidth: 700,
    margin: "0 auto",
  },

  heading: {
    marginBottom: 20,
  },

  upload: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    outline: "none",
  },

  primaryBtn: {
    background: "#4f46e5",
    color: "white",
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },

  secondaryBtn: {
    background: "#f3f4f6",
    padding: "8px 12px",
    borderRadius: 6,
    border: "none",
  },

  dangerBtn: {
    background: "#ef4444",
    color: "white",
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
  },

  notes: {
    display: "grid",
    gap: 12,
  },

  note: {
    background: "#fff",
    padding: 16,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
  },

  noteTitle: {
    fontWeight: 500,
  },

  meta: {
    fontSize: 12,
    color: "#6b7280",
  },

  actions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  link: {
    color: "#4f46e5",
    fontWeight: 500,
  },

  backBtn: {
    marginBottom: 10,
  },

  login: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f3f4f6",
  },

  loginCard: {
    background: "#fff",
    padding: 32,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: 280,
  },

  loginTitle: {
    marginBottom: 10,
    textAlign: "center",
  },
};
