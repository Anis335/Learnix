const { useEffect, useRef, useState } = React;

function Character({ kind, message, onHover, mouse, mode, dancing }) {
  const node = useRef(null);
  const [bubble, setBubble] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!node.current || !mouse) return;
    const rect = node.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(6, Math.hypot(dx, dy) / 45);
    // Password mode intentionally makes the characters look away.
    const direction = mode === "password" ? -1 : 1;
    setLook({ x: Math.cos(angle) * distance * direction, y: Math.sin(angle) * distance * direction });
  }, [mouse, mode]);

  const classes = ["blob", kind, mode === "email" ? "is-focused" : "", mode === "password" ? "is-password" : "", dancing ? "is-success" : ""].join(" ");
  const phrases = {
    green: "Hey there!", coral: "How are you?", blue: "Welcome back!", yellow: "Thanks for logging in!",
    pink: "Hello!", peach: "You got this!"
  };
  return (
    <div ref={node} className={classes}
      onMouseEnter={() => { setBubble(true); onHover(phrases[kind] || message); }}
      onMouseLeave={() => { setBubble(false); onHover(""); }}
      onTouchStart={() => { setBubble(true); onHover(phrases[kind] || message); }}
      onTouchEnd={() => { setBubble(false); onHover(""); }}>
      <div className="face">
        <div className="eyes">
          {[0, 1].map(i => <span className="eye" key={i}>
            <i className="pupil" style={{ transform: `translate(${look.x}px, ${look.y}px)` }} />
          </span>)}
        </div>
        <div className="mouth" />
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("login");
  const [activeField, setActiveField] = useState("");
  const [mouse, setMouse] = useState(null);
  const [message, setMessage] = useState("Hello~");
  const [dancing, setDancing] = useState(false);
  const [status, setStatus] = useState("");


  useEffect(() => {
    const onAuth = e => { if (e.detail && e.detail.user) location.href = "dashboard.html"; };
    window.addEventListener("learnix-auth", onAuth);
    if (window.__learnixAuthDetail) onAuth({ detail: window.__learnixAuthDetail });
    const move = e => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("learnix-auth", onAuth); };
  }, []);


  function switchMode(next) {
    setMode(next);
    setStatus("");
    setActiveField("");
    setMessage(next === "login" ? "Hello~" : "Nice to meet you!");
    setDancing(false);
  }

  return (
    <main className="page">
      <section className="device">
        <div className="visual-side">
          <div className="brand">Lea<span>rn</span>i<span className="brand-dot">x</span></div>
          <div className="art-stage">
            {["green", "coral", "blue", "yellow", "pink", "peach"].map(kind =>
              <Character key={kind} kind={kind} mouse={mouse} mode={activeField}
                dancing={dancing} onHover={setMessage} />
            )}
            <div className={`speech ${message ? "show" : ""}`}>{message || "Hello~"}</div>
          </div>
          <div className="art-caption">A little personality goes a long way.</div>
        </div>

        <div className="form-side">
          <div className="form-wrap">
            <div className="eyebrow">YOUR LITTLE CORNER</div>
            <h1>{mode === "login" ? "Good to see you." : "Let's get started."}</h1>
            <p className="sub">{mode === "login" ? "Sign in to pick up right where you left off." : "Create an account and make yourself at home."}</p>



            {/* <form onSubmit={handleSubmit}>
              {mode === "signup" && <div className="field">
                <label htmlFor="name">Your name</label>
                <input id="name" value={name} onChange={e => setName(e.target.value)}
                  onFocus={() => { setActiveField("email"); setMessage("Hey, nice to meet you!"); }}
                  onBlur={() => setActiveField("")} placeholder="Your name" autoComplete="name" />
              </div>}
              {/* <div className="field">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => { setActiveField("email"); setMessage("Oh, hello!"); }}
                  onBlur={() => setActiveField("")} placeholder="you@example.com" autoComplete="email" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => { setActiveField("password"); setMessage("We won't peek!"); }}
                  onBlur={() => setActiveField("")} placeholder="Enter your password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"} required />
              </div> */}
              {/* <div className="form-meta">
                <label className="remember"><input type="checkbox" /> Remember me</label>
                <button type="button" className="text-btn" onClick={() => { setMessage("Password reset coming soon!"); setStatus("Connect a password-reset flow to enable this."); }}>Forgot password?</button>
              </div>
              <button className="primary" type="submit">{mode === "login" ? "Log in" : "Create account"}</button>
            </form> */}

            <div className="auth-tabs" role="tablist" aria-label="Account access">
              <button className={`auth-tab ${mode === "login" ? "active" : ""}`} type="button" role="tab" aria-selected={mode === "login"} onClick={() => switchMode("login")}>Log in</button>
              <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} type="button" role="tab" aria-selected={mode === "signup"} onClick={() => switchMode("signup")}>Sign up</button>
            </div>
            <div className="divider">GOOGLE ACCOUNT</div>
            <button className="social" type="button" onClick={async () => { setStatus("Opening Google sign-in…"); try { if (!window.googleAuthSignIn) throw new Error("Sign-in is still loading. Please wait a moment and try again."); await window.googleAuthSignIn(); setStatus("Signed in. Opening Learnix…"); } catch (e) { setStatus((e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") ? "Sign-in was cancelled." : (e.message || "Google sign-in failed.")); } }}>
              <span className="google-mark">G</span> {mode === "login" ? "Log in with Google" : "Sign up with Google"}
            </button>
            <div className="status" aria-live="polite">{status}</div>
            <p className="note">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
