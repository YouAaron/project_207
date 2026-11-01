
import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ========================================
// SUPABASE 설정
// ========================================

const SUPABASE_URL =
  "https://nmlskhsnravjbugudttu.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_-UFrRu--FWlEm73T4sYz2A_QPuLjgl8";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ========================================
// 다운로드 주소
// ========================================

const GAME_DOWNLOAD_URL =
  "https://github.com/YouAaron/project_207_game/releases/download/v1.0/FPSGAME207.zip";

const LAUNCHER_DOWNLOAD_URL =
  "https://github.com/YouAaron/project_207_launcher/releases/download/1.0V/FPSLauncher.zip";

// ========================================
// 기본 설정
// ========================================

const $ = (id) => document.getElementById(id);

let authMode = "login";
let pendingAction = null;
let launchTimer = null;

// 로그인 상태 변경 횟수
let authStateRevision = 0;

// ========================================
// 로그인 창
// ========================================

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

  $("authTitle").textContent =
    signup ? "회원가입" : "로그인";

  $("authSubtitle").textContent =
    signup
      ? "계정을 만들고 게임을 시작하세요."
      : "계정에 로그인하고 전장에 참여하세요.";

  $("authSubmitBtn").textContent =
    signup ? "회원가입" : "로그인";

  $("showLoginTab").classList.toggle("active", !signup);
  $("showSignupTab").classList.toggle("active", signup);

  $("usernameInput").classList.toggle("hidden", !signup);
  $("usernameLabel").classList.toggle("hidden", !signup);

  $("usernameInput").required = signup;

  $("passwordInput").autocomplete =
    signup ? "new-password" : "current-password";

  $("passwordHint").textContent =
    signup
      ? "비밀번호는 8자 이상 입력해 주세요."
      : "가입할 때 사용한 비밀번호를 입력하세요.";
}

// ========================================
// 로그인 상태 화면 표시
// ========================================

function showSignedInUser(user) {
  if (!user) return;

  const email = user.email ?? "";

  const displayName =
    user.user_metadata?.display_name || email;

  $("userBadge").textContent =
    `로그인: ${displayName}`;

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

// ========================================
// 로그인 확인
// ========================================

async function requireLogin(action) {
  const { data, error } =
    await supabase.auth.getSession();

  if (error) {
    alert("로그인 상태를 확인하지 못했습니다.");
    return false;
  }

  if (!data.session) {
    openAuth("login", action);

    setAuthMessage(
      "이 기능을 이용하려면 먼저 로그인해 주세요."
    );

    return false;
  }

  return true;
}

// ========================================
// 게임 실행
// ========================================

async function startGame() {
  const loggedIn = await requireLogin("start");

  if (!loggedIn) return;

  $("launchStatus").classList.remove("hidden");
  $("launcherHelp").classList.add("hidden");

  $("launchStatus").textContent =
    "런처 실행을 요청하고 있습니다...";

  try {
    window.location.href = "fpsgame://start";
  } catch (error) {
    console.error(error);
  }

  clearTimeout(launchTimer);

  launchTimer = setTimeout(() => {
    $("launchStatus").textContent =
      "런처가 실행되지 않았을 수 있습니다.";

    $("launcherHelp").classList.remove("hidden");
  }, 2000);
}

// ========================================
// 게임 다운로드
// ========================================

async function downloadGame() {
  const loggedIn = await requireLogin("download");

  if (!loggedIn) return;

  if (
    !GAME_DOWNLOAD_URL ||
    GAME_DOWNLOAD_URL.includes("PASTE_YOUR")
  ) {
    alert("실제 게임 다운로드 주소를 설정해 주세요.");
    return;
  }

  window.location.href = GAME_DOWNLOAD_URL;
}

// ========================================
// 런처 다운로드
// ========================================

async function downloadLauncher() {
  const loggedIn = await requireLogin("launcher");

  if (!loggedIn) return;

  if (
    !LAUNCHER_DOWNLOAD_URL ||
    LAUNCHER_DOWNLOAD_URL.includes("PASTE_YOUR")
  ) {
    alert("런처 다운로드 주소를 설정해 주세요.");
    return;
  }

  window.location.href = LAUNCHER_DOWNLOAD_URL;
}

// ========================================
// 게임 정보
// ========================================

function showInfo() {
  $("information").classList.toggle("hidden");
}

// ========================================
// 로그인 상태 복구
// ========================================

async function refreshSession() {
  // 확인을 시작할 때의 로그인 상태 변경 횟수 저장
  const revisionAtStart = authStateRevision;

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  // 확인하는 동안 로그인 상태가 변경되었다면
  // 오래된 결과로 화면을 덮어쓰지 않음
  if (revisionAtStart !== authStateRevision) {
    return;
  }

  if (error || !session) {
    showSignedOutUser();
    return;
  }

  showSignedInUser(session.user);
}

// ========================================
// 로그인 / 회원가입 버튼
// ========================================

$("loginOpenBtn").addEventListener("click", () => {
  openAuth("login");
});

$("showLoginTab").addEventListener("click", () => {
  authMode = "login";
  updateAuthMode();
  setAuthMessage();
});

$("showSignupTab").addEventListener("click", () => {
  authMode = "signup";
  updateAuthMode();
  setAuthMessage();
});

$("authCloseBtn").addEventListener("click", closeAuth);

$("authOverlay").addEventListener("click", (event) => {
  if (event.target === $("authOverlay")) {
    closeAuth();
  }
});

// ========================================
// 메인 버튼 연결
// ========================================

$("startBtn").addEventListener("click", startGame);
$("downloadBtn").addEventListener("click", downloadGame);

$("launcherDownloadBtn").addEventListener(
  "click",
  downloadLauncher
);

$("helpDownloadBtn").addEventListener(
  "click",
  downloadLauncher
);

$("infoBtn").addEventListener("click", showInfo);

// ========================================
// 로그아웃
// ========================================

$("logoutBtn").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    alert("로그아웃에 실패했습니다.");
    return;
  }

  showSignedOutUser();
  alert("로그아웃되었습니다.");
});

// ========================================
// 로그인 및 회원가입 처리
// ========================================

$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  setAuthMessage();

  const email = $("emailInput").value.trim();
  const password = $("passwordInput").value;
  const displayName = $("usernameInput").value.trim();

  const submitButton = $("authSubmitBtn");

  submitButton.disabled = true;

  try {
    // 회원가입
    if (authMode === "signup") {
      if (password.length < 8) {
        setAuthMessage(
          "비밀번호를 8자 이상 입력해 주세요.",
          "error"
        );
        return;
      }

      if (!displayName) {
        setAuthMessage(
          "닉네임을 입력해 주세요.",
          "error"
        );
        return;
      }

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName
            }
          }
        });

      if (error) throw error;

      if (data.session) {
        authStateRevision++;
        showSignedInUser(data.user);

        setAuthMessage(
          "회원가입이 완료되었습니다.",
          "success"
        );

        await executePendingAction();

      } else {
        setAuthMessage(
          "회원가입 요청이 완료되었습니다. 이메일 인증 후 로그인해 주세요.",
          "success"
        );

        authMode = "login";
        updateAuthMode();
      }
    }

    // 로그인
    else {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      // 로그인 성공 즉시 화면 갱신
      authStateRevision++;

      showSignedInUser(data.user);

      setAuthMessage(
        "로그인 성공!",
        "success"
      );

      await executePendingAction();
    }

  } catch (error) {
    console.error("인증 오류:", error);

    setAuthMessage(
      error?.message || "인증 중 오류가 발생했습니다.",
      "error"
    );

  } finally {
    submitButton.disabled = false;
  }
});

// ========================================
// 로그인 후 대기 중인 작업 실행
// ========================================

async function executePendingAction() {
  const action = pendingAction;

  pendingAction = null;

  $("authOverlay").classList.add("hidden");

  if (action === "start") {
    await startGame();
  }

  if (action === "download") {
    await downloadGame();
  }

  if (action === "launcher") {
    await downloadLauncher();
  }
}

// ========================================
// 인증 상태 변화 감지
// ========================================

// 초기 세션 확인보다 먼저 등록
supabase.auth.onAuthStateChange((_event, session) => {
  authStateRevision++;

  if (session?.user) {
    showSignedInUser(session.user);
  } else {
    showSignedOutUser();
  }
});

// ========================================
// 처음 페이지 접속 시
// ========================================

updateAuthMode();
refreshSession();
