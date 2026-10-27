
function startGame() {
  alert(
    "게임을 실행하려면 Windows 런처 설치가 필요합니다."
  );
}

function downloadGame() {
  alert(
    "현재 게임 파일을 준비 중입니다. 빌드가 완료되면 다운로드 기능을 연결합니다."
  );
}

function showInfo() {
  const info = document.getElementById("information");
  info.classList.toggle("hidden");
}
