// header.manager.js
// 모든 페이지의 헤더 UI를 메인 페이지와 동일하게 동기화합니다.

async function updateHeaderUI(user) {
    if (!user) return;
    
    try {
        const docSnap = await db.collection("users").doc(user.uid).get();
        if (docSnap.exists) {
            const data = docSnap.data();
            
            // 1. 닉네임 업데이트
            const nameEl = document.getElementById("userName");
            if (nameEl) nameEl.textContent = data.nickname || "User";
            
            // 2. 프로필 사진 업데이트 (메인 페이지 로직과 동일)
            const photoEl = document.getElementById("userPhoto");
            if (photoEl) {
                photoEl.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nickname || 'U')}&background=2a3242&color=f4c430&bold=true`;
            }
            
            // 3. 권한 배지 업데이트 (메인 페이지의 뱃지 디자인 적용)
            const badgeEl = document.getElementById("myRoleBadge");
            if (badgeEl) {
                if (data.role === "admin" || data.role === "manager") {
                    badgeEl.style.display = "inline-block";
                    badgeEl.textContent = data.role.toUpperCase();
                    badgeEl.className = `role-badge role-${data.role.toUpperCase()}`;
                } else {
                    badgeEl.style.display = "none";
                }
            }
            
            // 4. 네비게이션 관리자 메뉴 노출 여부
            const adminNav = document.getElementById("navAdminMenu");
            if (adminNav) {
                if (data.role === "admin" || data.role === "manager") {
                    adminNav.style.display = "inline-block";
                } else {
                    adminNav.style.display = "none";
                }
            }

            // 현재 페이지 활성화 표시 (nav-link active 처리)
            const currentPage = window.location.pathname.split("/").pop();
            document.querySelectorAll(".nav-link").forEach(link => {
                if (link.getAttribute("href") === currentPage) {
                    link.classList.add("active");
                }
            });
        }
    } catch (error) {
        console.error("Header Sync Error:", error);
    }
}

// 로그아웃 공통 함수
function logout() {
    if (confirm("로그아웃 하시겠습니까?")) {
        auth.signOut().then(() => {
            location.href = "login.html";
        });
    }
}

// 파이어베이스 인증 상태 감시 (모든 페이지 공통 적용)
auth.onAuthStateChanged(user => {
    if (user) {
        updateHeaderUI(user);
    } else {
        if (!window.isLoginPage) location.href = "login.html";
    }
});