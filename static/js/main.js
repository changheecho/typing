// 전역 유틸리티 함수들
document.addEventListener('DOMContentLoaded', function() {
    // 부트스트랩 툴팁 초기화
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // 애니메이션 효과 추가
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });

    // 사용자 환경설정 로드
    loadUserPreferences();
});

// 사용자 환경설정 관리
function loadUserPreferences() {
    const theme = localStorage.getItem('typing-theme') || 'light';
    const soundEnabled = localStorage.getItem('typing-sound') !== 'false';
    
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

function saveUserPreference(key, value) {
    localStorage.setItem(`typing-${key}`, value);
}

// 알림 메시지 표시
function showNotification(message, type = 'info', duration = 3000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show notification`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(alertDiv);
    
    // 자동 제거
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }
    }, duration);
}

// API 호출 헬퍼
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showNotification('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'danger');
        throw error;
    }
}

// 키보드 이벤트 처리
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // ESC 키로 게임 일시정지
        if (e.key === 'Escape' && window.gameInstance) {
            window.gameInstance.togglePause();
        }
        
        // F11 키로 전체화면
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
    });
}

// 전체화면 토글
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('전체화면 모드를 지원하지 않습니다.');
        });
    } else {
        document.exitFullscreen();
    }
}

// 성능 모니터링
function trackPerformance(action, duration) {
    if (window.gtag) {
        gtag('event', 'timing_complete', {
            name: action,
            value: duration
        });
    }
}

// 사용자 진행상황 추적
function trackUserProgress(stage, score, accuracy) {
    const progressData = {
        stage: stage,
        score: score,
        accuracy: accuracy,
        timestamp: new Date().toISOString()
    };
    
    // 로컬 스토리지에 저장
    const existingProgress = JSON.parse(localStorage.getItem('typing-progress') || '[]');
    existingProgress.push(progressData);
    
    // 최근 50개 기록만 유지
    if (existingProgress.length > 50) {
        existingProgress.splice(0, existingProgress.length - 50);
    }
    
    localStorage.setItem('typing-progress', JSON.stringify(existingProgress));
}

// 반응형 디자인 헬퍼
function checkMobileDevice() {
    return window.innerWidth <= 768;
}

function adjustForMobile() {
    if (checkMobileDevice()) {
        document.body.classList.add('mobile-device');
        
        // 모바일에서 가상 키보드 대응
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }
}

// 사운드 효과 관리
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = localStorage.getItem('typing-sound') !== 'false';
        this.loadSounds();
    }
    
    loadSounds() {
        // 키 입력 소리
        this.sounds.keypress = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfCCWH0fPTgjMGHm7A7+OZURE');
        this.sounds.correct = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfCCWH0fPTgjMGHm7A7+OZURE');
        this.sounds.wrong = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfCCWH0fPTgjMGHm7A7+OZURE');
        
        // 볼륨 조절
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3;
        });
    }
    
    play(soundName) {
        if (this.enabled && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(() => {
                // 사운드 재생 실패 시 무시
            });
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        saveUserPreference('sound', this.enabled);
        return this.enabled;
    }
}

// 전역 사운드 매니저 인스턴스
window.soundManager = new SoundManager();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    setupKeyboardShortcuts();
    adjustForMobile();
    
    // 윈도우 리사이즈 이벤트 처리
    window.addEventListener('resize', adjustForMobile);
});

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .mobile-device .typing-input {
        font-size: 16px !important; /* iOS zoom 방지 */
    }
    
    .dark-theme {
        filter: invert(1) hue-rotate(180deg);
    }
    
    .dark-theme img,
    .dark-theme video,
    .dark-theme canvas {
        filter: invert(1) hue-rotate(180deg);
    }
`;
document.head.appendChild(style);
