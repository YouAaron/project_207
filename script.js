// Supabase 프로젝트를 만든 뒤 아래 두 값을 본인의 프로젝트 값으로 교체하세요.
// 공개용 anon/publishable key만 사용하세요. service_role/secret key는 절대 웹사이트에 넣지 마세요.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://nmlskhsnravjbugudttu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-UFrRu--FWlEm73T4sYz2A_QPuLjgl8";
const supabaseConfigured =
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");

const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const $ = (id) => document.getElementById(id);
let authMode = "login";
let pendingAction = null;

function setAuthMessage(message = "", type = "") {
  const element = $("authMessage");
  element.textContent = message;
  element.className = `auth-message ${type}`.trim();
}

function openAuth(mode = "login", action = null) {
  authMode = mode;
  pendingAction = action;
  $("authOverlay").classList.remove("hidden");
  setAuthMessage();
  updateAuthMode();
  $("emailInput").focus();
}

function closeAuth() {
  $("authOverlay").classList.add("hidden");
  pendingAction = null;
}

function updateAuthMode() {
  const signup = authMode === "signup";
  $("authTitle").textContent = signup ? "회원가입" : "로그인";
  $("authSubtitle").textContent = signup
    ? "계정을 만들고 게임 웹사이트를 이용하세요."
    : "계정에 로그인하고 전장에 참여하세요.";
  $("authSubmitBtn").textContent = signup ? "회원가입" : "로그인";
  $("showLoginTab").classList.toggle("active", !signup);
  $("showSignupTab").classList.toggle("active", signup);
  $("usernameInput").classList.toggle("hidden", !signup);
  $("usernameLabel").classList.toggle("hidden", !signup);
  $("usernameInput").required = signup;
  $("passwordInput").autocomplete = signup ? "new-password" : "current-password";
  $("passwordHint").textContent = signup
    ? "비밀번호는 8자 이상을 권장합니다."
    : "가입할 때 사용한 비밀번호를 입력하세요.";
}

function showSignedInUser(user) {
  const email = user?.email ?? "";
  const displayName = user?.user_metadata?.display_name || email;
  $("userBadge").textContent = `로그인: ${displayName}`;
  $("userBadge").title = email;
  $("userBadge").classList.remove("hidden");
  $("loginOpenBtn").classList.add("hidden");
  $("logoutBtn").classList.remove("hidden");
  $("loginNotice").classList.add("hidden");
}

function showSignedOutUser() {
  $("userBadge").classList.add("hidden");
  $("loginOpenBtn").classList.remove("hidden");
  $("logoutBtn").classList.add("hidden");
  $("loginNotice").classList.remove("hidden");
}

function requireLogin(action) {
  if (!supabase) {
    openAuth("login", action);
    setAuthMessage("로그인 기능을 활성화하려면 script.js에 Supabase 프로젝트 URL과 공개 키를 먼저 설정해야 합니다.", "error");
    return false;
  }
  openAuth("login", action);
  setAuthMessage("이 기능을 이용하려면 먼저 로그인해 주세요.");
  return false;
}

async function runPendingAction() {
  const action = pendingAction;
  pendingAction = null;
  closeAuth();
  if (action === "start") startGame();
  if (action === "download") downloadGame();
}

async function startGame() {
  if (!supabase) return requireLogin("start");
  const { data } = await supabase.auth.getSession();
  if (!data.session) return requireLogin("start");
  alert("로그인되었습니다. 게임 실행은 별도 Windows 런처가 연결된 뒤 사용할 수 있습니다.");
}

async function downloadGame() {
  if (!supabase) return requireLogin("download");
  const { data } = await supabase.auth.getSession();
  if (!data.session) return requireLogin("download");

  // 실제 ZIP 다운로드 주소로 교체하세요.
  const downloadUrl = "PASTE_YOUR_GAME_ZIP_DOWNLOAD_URL_HERE";
  if (downloadUrl.includes("PASTE_YOUR_GAME")) {
    alert("로그인은 완료되었습니다. script.js의 downloadUrl에 실제 게임 ZIP 다운로드 링크를 넣어 주세요.");
    return;
  }
  window.location.href = downloadUrl;
}

function showInfo() {
  $("information").classList.toggle("hidden");
}

async function refreshSession() {
  if (!supabase) {
    showSignedOutUser();
    return;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) showSignedInUser(session.user);
  else showSignedOutUser();
}

$("loginOpenBtn").addEventListener("click", () => openAuth("login"));
$("showLoginTab").addEventListener("click", () => { authMode = "login"; updateAuthMode(); setAuthMessage(); });
$("showSignupTab").addEventListener("click", () => { authMode = "signup"; updateAuthMode(); setAuthMessage(); });
$("authCloseBtn").addEventListener("click", closeAuth);
$("authOverlay").addEventListener("click", (event) => {
  if (event.target === $("authOverlay")) closeAuth();
});
$("startBtn").addEventListener("click", () => startGame());
$("downloadBtn").addEventListener("click", () => downloadGame());
$("infoBtn").addEventListener("click", showInfo);

$("logoutBtn").addEventListener("click", async () => {
  if (supabase) await supabase.auth.signOut();
  showSignedOutUser();
  alert("로그아웃되었습니다.");
});

$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  setAuthMessage();

  if (!supabase) {
    setAuthMessage("먼저 Supabase 프로젝트를 설정해야 로그인/회원가입이 실제로 작동합니다. 설정 방법은 README.md를 확인하세요.", "error");
    return;
  }

  const email = $("emailInput").value.trim();
  const password = $("passwordInput").value;
  const displayName = $("usernameInput").value.trim();
  const submitButton = $("authSubmitBtn");
  submitButton.disabled = true;

  try {
    if (authMode === "signup") {
      if (password.length < 8) {
        setAuthMessage("비밀번호를 8자 이상 입력해 주세요.", "error");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } }
      });
      if (error) throw error;

      if (data.session) {
        showSignedInUser(data.user);
        setAuthMessage("회원가입이 완료되었습니다.", "success");
        await runPendingAction();
      } else {
        setAuthMessage("가입 요청이 완료되었습니다. 이메일 인증을 마친 뒤 로그인해 주세요.", "success");
        authMode = "login";
        updateAuthMode();
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showSignedInUser(data.user);
      setAuthMessage("로그인 성공!", "success");
      await runPendingAction();
    }
  } catch (error) {
    setAuthMessage(error?.message || "인증 중 오류가 발생했습니다.", "error");
  } finally {
    submitButton.disabled = false;
  }
});

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showSignedInUser(session.user);
    else showSignedOutUser();
  });
}
refreshSession();
updateAuthMode();
