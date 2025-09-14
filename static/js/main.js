// 전역 유틸리티 함수들
const Utils = {
    // 시간 포맷팅
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // WPM 계산
    calculateWPM(charactersTyped, timeInSeconds) {
        const words = charactersTyped / 5; // 평균 단어 길이 5자
        return timeInSeconds > 0 ? Math.round((words * 60) / timeInSeconds) : 0;
    },
    
    // 정확도 계산
    calculateAccuracy(totalChars, errors) {
        return totalChars > 0 ? Math.round(((totalChars - errors) / totalChars) * 100) : 100;
    },
    
    // 애니메이션 효과
    animateValue(element, start, end, duration = 1000) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.round(start + (end - start) * progress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    },
    
    // 로컬 스토리지 관리
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('로컬 스토리지 저장 실패:', e);
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('로컬 스토리지 읽기 실패:', e);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('로컬 스토리지 삭제 실패:', e);
            }
        }
    }
};

// 키보드 매핑
const KeyboardMappings = {
    // 특수 키 매핑
    special: {
        ' ': ' ',
        'Enter': 'Enter',
        'Backspace': 'Backspace',
        'Tab': 'Tab',
        'Shift': 'Shift',
        'Control': 'Ctrl',
        'Alt': 'Alt',
        'CapsLock': 'CapsLock',
        'Meta': 'Cmd'
    },
    
    // 손가락별 키 매핑 (홈로우 기준)
    fingers: {
        'leftPinky': ['q', 'a', 'z', '1', '`', 'Tab', 'CapsLock', 'Shift'],
        'leftRing': ['w', 's', 'x', '2'],
        'leftMiddle': ['e', 'd', 'c', '3'],
        'leftIndex': ['r', 'f', 'v', 't', 'g', 'b', '4', '5'],
        'rightIndex': ['y', 'h', 'n', 'u', 'j', 'm', '6', '7'],
        'rightMiddle': ['i', 'k', ',', '8'],
        'rightRing': ['o', 'l', '.', '9'],
        'rightPinky': ['p', ';', '/', '0', '-', '=', '[', ']', '\\', '\'', 'Enter', 'Shift'],
        'thumbs': [' ']
    },
    
    // 키를 DOM 요소 속성으로 변환
    getKeyAttribute(key) {
        return this.special[key] || key.toLowerCase();
    }
};

// 전역 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    // 페이지 로드 애니메이션
    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // 부드러운 스크롤
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // 툴팁 초기화 (Bootstrap)
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // 경고창 자동 닫기
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});

// 성능 모니터링
const PerformanceMonitor = {
    startTime: null,
    
    start() {
        this.startTime = performance.now();
    },
    
    end(label = 'Operation') {
        if (this.startTime) {
            const duration = performance.now() - this.startTime;
            console.log(`${label} took ${duration.toFixed(2)}ms`);
            this.startTime = null;
        }
    }
};

// API 헬퍼
const API = {
    async request(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API 요청 실패:', error);
            throw error;
        }
    },
    
    async submitTypingResult(lessonId, wpm, accuracy, timeElapsed) {
        return this.request('/api/submit_result', {
            method: 'POST',
            body: JSON.stringify({
                lesson_id: lessonId,
                wpm: wpm,
                accuracy: accuracy,
                time_taken: timeElapsed
            })
        });
    },
    
    async getLessons() {
        return this.request('/api/lessons');
    }
};

// 소리 효과 (선택사항)
const SoundEffects = {
    enabled: Utils.storage.get('soundEnabled', true),
    
    toggle() {
        this.enabled = !this.enabled;
        Utils.storage.set('soundEnabled', this.enabled);
    },
    
    play(type) {
        if (!this.enabled) return;
        
        // Web Audio API를 사용한 간단한 소리 효과
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch (type) {
            case 'correct':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                break;
            case 'incorrect':
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                break;
            case 'complete':
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                break;
        }
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }
};

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // ESC로 모달 닫기
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }
    
    // Ctrl+R로 타이핑 리셋 (타이핑 페이지에서만)
    if (e.ctrlKey && e.key === 'r' && typeof resetTyping === 'function') {
        e.preventDefault();
        resetTyping();
    }
});

// 에러 핸들링
window.addEventListener('error', function(e) {
    console.error('JavaScript 에러:', e.error);
    
    // 사용자에게 에러 표시 (개발 모드에서만)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
        errorDiv.style.zIndex = '9999';
        errorDiv.innerHTML = `
            <strong>JavaScript 에러:</strong> ${e.error.message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(errorDiv);
        
        // 10초 후 자동 제거
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
    }
});

// 브라우저 호환성 체크
function checkBrowserSupport() {
    const features = {
        localStorage: typeof Storage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined',
        audioContext: typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined'
    };
    
    const unsupported = Object.keys(features).filter(feature => !features[feature]);
    
    if (unsupported.length > 0) {
        console.warn('지원되지 않는 기능:', unsupported);
        
        // 사용자에게 브라우저 업데이트 권장
        const warningDiv = document.createElement('div');
        warningDiv.className = 'alert alert-warning text-center';
        warningDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            일부 기능이 제한될 수 있습니다. 최신 브라우저를 사용해주세요.
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(warningDiv, container.firstChild);
        }
    }
    
    return unsupported.length === 0;
}

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    checkBrowserSupport();
});
