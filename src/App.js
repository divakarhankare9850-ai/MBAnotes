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
  { name: "Marketing Management", id: "marketing", icon: "📊", color: "linear-gradient(135deg, #ff7e5f, #feb47b)" },
  { name: "Financial Management", id: "finance", icon: "💰", color: "linear-gradient(135deg, #43cea2, #185a9d)" },
  { name: "Human Resource Management", id: "hrm", icon: "👥", color: "linear-gradient(135deg, #ff9966, #ff5e62)" },
  { name: "Operations Techniques and Management", id: "operations", icon: "⚙️", color: "linear-gradient(135deg, #36d1dc, #5b86e5)" },
  { name: "Basics of Strategic Management", id: "strategy", icon: "🎯", color: "linear-gradient(135deg, #c471f5, #fa71cd)" },
  { name: "Research Methodology", id: "research", icon: "🔬", color: "linear-gradient(135deg, #00c6ff, #0072ff)" },
  { name: "Decision Analysis Techniques for Managers", id: "decision", icon: "📈", color: "linear-gradient(135deg, #f7971e, #ffd200)" },
  { name: "Business Environment", id: "business", icon: "🏢", color: "linear-gradient(135deg, #654ea3, #eaafc8)" },
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
    <div style={styles.container}>
      <Navbar user={user} role={role} logout={logout} />

      {!selectedSubject ? (
        <div style={styles.grid}>
          {SUBJECTS.map((sub) => (
            <div
              key={sub.id}
              style={{ ...styles.card, background: sub.color }}
              onClick={() => {
                setSelectedSubject(sub);
                fetchNotes(sub.id);
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.06)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <h2 style={{ fontSize: 32 }}>{sub.icon}</h2>
              <p style={{ fontWeight: "600" }}>{sub.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: 25 }}>
          <button style={styles.backBtn} onClick={() => setSelectedSubject(null)}>
            ← Back
          </button>

          <h2 style={{ marginBottom: 10 }}>
            {selectedSubject.icon} {selectedSubject.name}
          </h2>

          {role === "admin" && (
            <div style={styles.uploadBox}>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} />
              <button onClick={uploadNote} style={styles.btn}>
                Upload
              </button>
            </div>
          )}

          {loading && <p>Loading...</p>}
          {!loading && notes.length === 0 && <p>No notes available</p>}

          <div style={styles.notesList}>
            {notes.map((note) => (
              <div key={note.id} style={styles.noteCard}>
                <div>
                  <p style={{ fontWeight: "600" }}>{note.name}</p>
                  <small>{note.createdAt}</small>
                </div>

                <div>
                  <a href={note.url} target="_blank" rel="noreferrer">
                    Open
                  </a>

                  {role === "admin" && (
                    <button onClick={() => deleteNote(note)} style={styles.deleteBtn}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* LOGIN */
function Login({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  return (
    <div style={styles.login}>
      <h2 style={{ marginBottom: 10 }}>📚 College Notes Portal</h2>
      <input style={styles.input} placeholder="Username" onChange={(e) => setU(e.target.value)} />
      <input style={styles.input} type="password" placeholder="Password" onChange={(e) => setP(e.target.value)} />
      <button style={styles.btn} onClick={() => onLogin(u, p)}>
        Login
      </button>
    </div>
  );
}

/* NAVBAR */
function Navbar({ user, role, logout }) {
  return (
    <div style={styles.nav}>
      <h3>📘 Notes SaaS</h3>
      <div>
        {user} ({role})
        <button onClick={logout} style={styles.logout}>Logout</button>
      </div>
    </div>
  );
}

/* STYLES */
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1f4037, #99f2c8)",
    color: "white",
    fontFamily: "Poppins, sans-serif",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: 15,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(10px)",
  },
  logout: {
    marginLeft: 10,
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))",
    gap: 25,
    padding: 30,
  },
  card: {
    padding: 25,
    borderRadius: 16,
    cursor: "pointer",
    textAlign: "center",
    color: "white",
    transition: "0.3s",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },
  uploadBox: {
    margin: "20px 0",
  },
  btn: {
    marginLeft: 10,
    padding: "10px 18px",
    border: "none",
    borderRadius: 8,
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    cursor: "pointer",
  },
  backBtn: {
    marginBottom: 10,
  },
  notesList: {
    display: "grid",
    gap: 15,
  },
  noteCard: {
    background: "rgba(255,255,255,0.9)",
    color: "#333",
    padding: 15,
    borderRadius: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteBtn: {
    marginLeft: 10,
    background: "#ff4b5c",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },
  login: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    background: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  input: {
    padding: 12,
    width: 260,
    borderRadius: 8,
    border: "none",
  },
};
