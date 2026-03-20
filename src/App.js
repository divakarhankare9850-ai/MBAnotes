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
  appId: "1:969677120738:web:617750a5c8e1bdd6722abb",
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

  // ✅ Optional validations
  if (file.type !== "application/pdf") {
    return alert("Only PDF allowed");
  }

  setLoading(true);

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "mba_notes");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dn90codg9/raw/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
console.log("Cloudinary response:", data);

// ❗ STOP if upload failed
if (!data.secure_url) {
  alert(data.error?.message || "Upload failed");
  setLoading(false);
  return;
}

const fileUrl = data.secure_url;

    // Save in Firestore
    await addDoc(collection(db, "notes_" + selectedSubject.id), {
      name: file.name,
      url: fileUrl,
      public_id: data.public_id,
      createdAt: new Date().toLocaleString(),
    });

    setFile(null);
    fetchNotes(selectedSubject.id);

  } catch (error) {
    console.error(error);
    alert("Upload failed");
  }

  setLoading(false);
};

 const deleteNote = async (note) => {
  const confirmDelete = window.confirm("Delete this file?");
  if (!confirmDelete) return;

  try {
    await deleteDoc(
      doc(db, "notes_" + selectedSubject.id, note.id)
    );

    // Refresh notes list
    fetchNotes(selectedSubject.id);

  } catch (error) {
    console.error(error);
    alert("Delete failed");
  }
};

  if (page === "login") return <Login onLogin={handleLogin} />;

  return (
    <div style={styles.app}>
      <style>{globalStyles}</style>
      
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>📚</div>
            <div>
              <h1 style={styles.logoText}>Notes Portal</h1>
              <p style={styles.logoSubtext}>MBA Course Materials</p>
            </div>
          </div>
          <div style={styles.userSection}>
            <div style={styles.userInfo}>
              <p style={styles.userName}>{user}</p>
              <p style={styles.userRole}>{role === "admin" ? "Instructor" : "Student"}</p>
            </div>
            <button onClick={logout} style={styles.logoutBtn}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {!selectedSubject ? (
          <div style={styles.dashboardContainer}>
            <div style={styles.pageHeader}>
              <h2 style={styles.pageTitle}>Course Materials</h2>
              <p style={styles.pageSubtitle}>
                Access all course notes and materials organized by subject
              </p>
            </div>

            <div style={styles.grid}>
              {SUBJECTS.map((sub, idx) => (
                <div
                  key={sub.id}
                  style={{
                    ...styles.card,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                  onClick={() => {
                    setSelectedSubject(sub);
                    fetchNotes(sub.id);
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.cardIconContainer}>{sub.icon}</div>
                  </div>
                  <div style={styles.cardBody}>
                    <h3 style={styles.cardTitle}>{sub.name}</h3>
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardFooterText}>View materials</span>
                    <span style={styles.cardArrow}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.contentView}>
            <div style={styles.breadcrumb}>
              <button
                style={styles.backBtn}
                onClick={() => setSelectedSubject(null)}
              >
                <span style={styles.backArrow}>←</span>
                Back to Courses
              </button>
            </div>

            <div style={styles.contentHeader}>
              <div style={styles.contentTitleSection}>
                <div style={styles.contentIcon}>{selectedSubject.icon}</div>
                <div>
                  <h2 style={styles.contentTitle}>{selectedSubject.name}</h2>
                  <p style={styles.contentSubtitle}>
                    {notes.length} {notes.length === 1 ? "material" : "materials"} available
                  </p>
                </div>
              </div>
            </div>

            {role === "admin" && (
              <div style={styles.uploadContainer}>
                <div style={styles.uploadBox}>
                  <div style={styles.uploadInputWrapper}>
                    <input
                      type="file"
                      style={styles.fileInput}
                      onChange={(e) => setFile(e.target.files[0])}
                      id="fileUpload"
                    />
                    <label htmlFor="fileUpload" style={styles.uploadLabel}>
                      <span style={styles.uploadIcon}>📎</span>
                      <span style={styles.uploadText}>
                        {file ? file.name : "Choose a file or drag and drop"}
                      </span>
                    </label>
                  </div>
                  <button
                    onClick={uploadNote}
                    disabled={!file}
                    style={{
                      ...styles.uploadBtn,
                      ...(loading ? styles.uploadBtnLoading : {}),
                      ...(!file ? styles.uploadBtnDisabled : {}),
                    }}
                  >
                    {loading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>
            )}

            <div style={styles.notesSection}>
              {loading && (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  <p style={styles.loadingText}>Loading materials...</p>
                </div>
              )}

              {!loading && notes.length === 0 && (
                <div style={styles.emptyState}>
                  <p style={styles.emptyIcon}>📭</p>
                  <p style={styles.emptyTitle}>No materials yet</p>
                  <p style={styles.emptyText}>
                    Materials will appear here once uploaded
                  </p>
                </div>
              )}

              {!loading && notes.length > 0 && (
                <div style={styles.notesList}>
                  {notes.map((note, idx) => (
                    <div
                      key={note.id}
                      style={{
                        ...styles.noteItem,
                        animationDelay: `${idx * 0.05}s`,
                      }}
                    >
                      <div style={styles.noteItemLeft}>
                        <div style={styles.noteItemIcon}>📄</div>
                        <div style={styles.noteItemContent}>
                          <p style={styles.noteItemTitle}>{note.name}</p>
                          <span style={styles.noteItemMeta}>
                            Added on {note.createdAt}
                          </span>
                        </div>
                      </div>

                      <div style={styles.noteItemActions}>
                        <a
                          href={note.url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.openBtn}
                        >
                          Open
                        </a>

                        {role === "admin" && (
                          <button
                            onClick={() => deleteNote(note)}
                            style={styles.deleteBtn}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    onLogin(u, p);
    setIsSubmitting(false);
  };

  return (
    <div style={styles.loginContainer}>
      <style>{globalStyles}</style>
      <div style={styles.loginBackground}></div>
      
      <div style={styles.loginContent}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <div style={styles.loginLogo}>📚</div>
            <h1 style={styles.loginTitle}>Notes Portal</h1>
            <p style={styles.loginSubtitle}>MBA Course Materials</p>
          </div>

          <form
            style={styles.loginForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Username</label>
              <input
                style={styles.formInput}
                placeholder="25PMB001 or admin"
                value={u}
                onChange={(e) => setU(e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Password</label>
              <input
                style={styles.formInput}
                type="password"
                placeholder="••••••••"
                value={p}
                onChange={(e) => setP(e.target.value)}
              />
            </div>

            <button
              style={{
                ...styles.loginBtn,
                ...(isSubmitting ? styles.loginBtnLoading : {}),
              }}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={styles.loginFooter}>
            <p style={styles.loginHint}>
              Demo: <code style={styles.code}>admin</code> / <code style={styles.code}>admin123</code>
            </p>
            <p style={styles.loginHint}>
              Or any student ID: <code style={styles.code}>25PMB001</code> / <code style={styles.code}>student123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Merriweather:wght@400;500&display=swap');

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: 'Instrument Sans', system-ui, sans-serif;
    background: #f8f9fa;
    color: #1a1a1a;
    line-height: 1.6;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const styles = {
  /* ========== APP ========== */
  app: {
    minHeight: "100vh",
    background: "#f8f9fa",
    fontFamily: "'Instrument Sans', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
  },

  /* ========== HEADER ========== */
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },

  headerContent: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "32px",
    width: "100%",
  },

  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logoIcon: {
    fontSize: "28px",
    lineHeight: "1",
  },

  logoText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0",
    lineHeight: "1.2",
  },

  logoSubtext: {
    fontSize: "12px",
    color: "#64748b",
    margin: "2px 0 0 0",
    fontWeight: "500",
  },

  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  userInfo: {
    textAlign: "right",
  },

  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0",
    lineHeight: "1.2",
  },

  userRole: {
    fontSize: "12px",
    color: "#64748b",
    margin: "2px 0 0 0",
    fontWeight: "500",
  },

  logoutBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },

  /* ========== MAIN ========== */
  main: {
    flex: "1",
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "32px 24px",
    width: "100%",
  },

  /* ========== DASHBOARD ========== */
  dashboardContainer: {
    animation: "fadeInUp 0.5s ease",
  },

  pageHeader: {
    marginBottom: "32px",
  },

  pageTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0",
    lineHeight: "1.3",
  },

  pageSubtitle: {
    fontSize: "15px",
    color: "#64748b",
    margin: "0",
    fontWeight: "500",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    overflow: "hidden",
    animation: "fadeInUp 0.5s ease forwards",
    opacity: 0,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
  },

  cardHeader: {
    padding: "24px 20px 16px 20px",
    background: "linear-gradient(135deg, #f8f9fa 0%, #f1f5f9 100%)",
    borderBottom: "1px solid #e5e7eb",
  },

  cardIconContainer: {
    fontSize: "36px",
    lineHeight: "1",
    display: "inline-block",
  },

  cardBody: {
    padding: "16px 20px",
    flex: "1",
  },

  cardTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0",
    lineHeight: "1.4",
  },

  cardFooter: {
    padding: "12px 20px 16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fafbfc",
    borderTop: "1px solid #f1f5f9",
  },

  cardFooterText: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },

  cardArrow: {
    color: "#6366f1",
    fontWeight: "700",
    fontSize: "16px",
  },

  /* ========== CONTENT VIEW ========== */
  contentView: {
    animation: "fadeInUp 0.5s ease",
  },

  breadcrumb: {
    marginBottom: "24px",
  },

  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#6366f1",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    borderRadius: "6px",
  },

  backArrow: {
    fontSize: "16px",
  },

  contentHeader: {
    marginBottom: "32px",
  },

  contentTitleSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  contentIcon: {
    fontSize: "40px",
    lineHeight: "1",
  },

  contentTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0",
    lineHeight: "1.2",
  },

  contentSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
    fontWeight: "500",
  },

  /* ========== UPLOAD ========== */
  uploadContainer: {
    marginBottom: "32px",
  },

  uploadBox: {
    background: "#ffffff",
    border: "2px dashed #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    transition: "all 0.2s ease",
  },

  uploadInputWrapper: {
    flex: "1",
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  fileInput: {
    display: "none",
  },

  uploadLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    flex: "1",
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },

  uploadIcon: {
    fontSize: "18px",
  },

  uploadText: {
    color: "#475569",
  },

  uploadBtn: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    background: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.2)",
  },

  uploadBtnLoading: {
    opacity: 0.8,
  },

  uploadBtnDisabled: {
    background: "#cbd5e1",
    cursor: "not-allowed",
    boxShadow: "none",
  },

  /* ========== NOTES ========== */
  notesSection: {
    animation: "fadeInUp 0.5s ease",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
  },

  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #6366f1",
    animation: "spin 0.8s linear infinite",
    marginBottom: "12px",
  },

  loadingText: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
    margin: "0",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },

  emptyIcon: {
    fontSize: "40px",
    margin: "0 0 12px 0",
  },

  emptyTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },

  emptyText: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
  },

  notesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  noteItem: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    transition: "all 0.2s ease",
    animation: "fadeInUp 0.5s ease forwards",
    opacity: 0,
  },

  noteItemLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: "1",
    minWidth: 0,
  },

  noteItemIcon: {
    fontSize: "20px",
    lineHeight: "1",
    flexShrink: 0,
  },

  noteItemContent: {
    flex: "1",
    minWidth: 0,
  },

  noteItemTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 4px 0",
    wordBreak: "break-word",
    lineHeight: "1.4",
  },

  noteItemMeta: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },

  noteItemActions: {
    display: "flex",
    gap: "8px",
    flexShrink: 0,
  },

  openBtn: {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#6366f1",
    background: "#f0f4ff",
    border: "1px solid #e0e7ff",
    borderRadius: "6px",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "inline-block",
    whiteSpace: "nowrap",
  },

  deleteBtn: {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#ffffff",
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },

  /* ========== LOGIN ========== */
  loginContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    background: "#ffffff",
    position: "relative",
    overflow: "hidden",
  },

  loginBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, #f8f9fa 0%, #f1f5f9 50%, #e8f0fe 100%)",
    zIndex: 0,
  },

  loginContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  loginCard: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
    padding: "40px",
    maxWidth: "360px",
    width: "100%",
    border: "1px solid #e5e7eb",
    animation: "fadeInUp 0.6s ease",
  },

  loginHeader: {
    textAlign: "center",
    marginBottom: "32px",
  },

  loginLogo: {
    fontSize: "48px",
    marginBottom: "12px",
    display: "block",
  },

  loginTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
    lineHeight: "1.2",
  },

  loginSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "4px 0 0 0",
    fontWeight: "500",
  },

  loginForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  formLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0",
  },

  formInput: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#0f172a",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    fontWeight: "500",
  },

  loginBtn: {
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "600",
    background: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
    marginTop: "4px",
  },

  loginBtnLoading: {
    opacity: 0.8,
  },

  loginFooter: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "16px",
    textAlign: "center",
  },

  loginHint: {
    fontSize: "12px",
    color: "#64748b",
    margin: "0 0 8px 0",
    fontWeight: "500",
    lineHeight: "1.4",
  },

  code: {
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "monospace",
    color: "#0f172a",
    fontWeight: "600",
    fontSize: "11px",
  },
};

