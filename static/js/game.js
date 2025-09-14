// 날씨 시스템 클래스
class WeatherSystem {
    constructor(skyArea) {
        this.skyArea = skyArea;
        this.currentWeather = 'sunny';
        this.weatherEffects = [];
        this.weatherChangeInterval = null;
        
        this.weatherTypes = [
            { name: 'sunny', probability: 25, duration: 30000 },
            { name: 'cloudy', probability: 20, duration: 25000 },
            { name: 'rainy', probability: 15, duration: 20000 },
            { name: 'snowy', probability: 10, duration: 35000 },
            { name: 'stormy', probability: 8, duration: 15000 },
            { name: 'sunset', probability: 12, duration: 40000 },
            { name: 'dawn', probability: 10, duration: 30000 }
        ];
    }
    
    start() {
        this.changeWeather();
        this.weatherChangeInterval = setInterval(() => {
            this.changeWeather();
        }, Math.random() * 20000 + 15000); // 15-35초마다 날씨 변경
    }
    
    stop() {
        if (this.weatherChangeInterval) {
            clearInterval(this.weatherChangeInterval);
        }
        this.clearWeatherEffects();
    }
    
    changeWeather() {
        const randomNum = Math.random() * 100;
        let cumulativeProbability = 0;
        
        for (const weather of this.weatherTypes) {
            cumulativeProbability += weather.probability;
            if (randomNum <= cumulativeProbability) {
                if (weather.name !== this.currentWeather) {
                    this.setWeather(weather.name);
                }
                break;
            }
        }
    }
    
    setWeather(weatherType) {
        // 이전 날씨 클래스 제거
        this.skyArea.className = 'sky-area';
        this.clearWeatherEffects();
        
        // 새로운 날씨 클래스 추가
        this.skyArea.classList.add(weatherType);
        this.currentWeather = weatherType;
        
        // 날씨별 효과 시작
        switch (weatherType) {
            case 'rainy':
                this.createRainEffect();
                break;
            case 'snowy':
                this.createSnowEffect();
                break;
            case 'stormy':
                this.createStormEffect();
                break;
            case 'sunset':
            case 'dawn':
                this.createStarEffect();
                break;
        }
        
        // 날씨 변경 알림
        this.showWeatherNotification(weatherType);
    }
    
    createRainEffect() {
        const rainContainer = document.createElement('div');
        rainContainer.className = 'weather-effect rain-effect';
        this.skyArea.appendChild(rainContainer);
        
        // 모바일에서는 비 개수 줄이기
        const isMobile = window.innerWidth <= 768;
        const rainCount = isMobile ? 25 : 50;
        const rainInterval = isMobile ? 300 : 200;
        
        for (let i = 0; i < rainCount; i++) {
            setTimeout(() => {
                if (this.currentWeather === 'rainy') {
                    this.createRainDrop(rainContainer);
                }
            }, i * 100);
        }
        
        this.rainInterval = setInterval(() => {
            if (this.currentWeather === 'rainy') {
                this.createRainDrop(rainContainer);
            }
        }, rainInterval);
        
        this.weatherEffects.push(rainContainer);
    }
    
    createRainDrop(container) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = (Math.random() * 1 + 0.5) + 's';
        container.appendChild(drop);
        
        setTimeout(() => {
            if (drop.parentNode) {
                drop.parentNode.removeChild(drop);
            }
        }, 2000);
    }
    
    createSnowEffect() {
        const snowContainer = document.createElement('div');
        snowContainer.className = 'weather-effect snow-effect';
        this.skyArea.appendChild(snowContainer);
        
        const snowFlakes = ['❄', '❅', '❆', '✻', '✼', '❇', '❈', '❉'];
        
        // 모바일에서는 눈 개수 줄이기
        const isMobile = window.innerWidth <= 768;
        const snowCount = isMobile ? 15 : 30;
        const snowInterval = isMobile ? 800 : 500;
        
        for (let i = 0; i < snowCount; i++) {
            setTimeout(() => {
                if (this.currentWeather === 'snowy') {
                    this.createSnowFlake(snowContainer, snowFlakes);
                }
            }, i * 200);
        }
        
        this.snowInterval = setInterval(() => {
            if (this.currentWeather === 'snowy') {
                this.createSnowFlake(snowContainer, snowFlakes);
            }
        }, snowInterval);
        
        this.weatherEffects.push(snowContainer);
    }
    
    createSnowFlake(container, flakes) {
        const flake = document.createElement('div');
        flake.className = 'snow-flake';
        flake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
        flake.style.left = Math.random() * 100 + '%';
        flake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        flake.style.fontSize = (Math.random() * 0.8 + 0.8) + 'rem';
        container.appendChild(flake);
        
        setTimeout(() => {
            if (flake.parentNode) {
                flake.parentNode.removeChild(flake);
            }
        }, 5000);
    }
    
    createStormEffect() {
        this.createRainEffect(); // 비 효과도 함께
        
        // 번개 효과
        this.lightningInterval = setInterval(() => {
            if (this.currentWeather === 'stormy' && Math.random() < 0.3) {
                this.createLightning();
            }
        }, 3000);
    }
    
    createLightning() {
        const lightning = document.createElement('div');
        lightning.className = 'lightning';
        this.skyArea.appendChild(lightning);
        
        setTimeout(() => {
            if (lightning.parentNode) {
                lightning.parentNode.removeChild(lightning);
            }
        }, 200);
        
        // 번개 사운드 효과 (선택사항)
        if (window.soundManager) {
            // window.soundManager.play('thunder');
        }
    }
    
    createStarEffect() {
        const starContainer = document.createElement('div');
        starContainer.className = 'weather-effect star-effect';
        this.skyArea.appendChild(starContainer);
        
        // 모바일에서는 별 개수 줄이기
        const isMobile = window.innerWidth <= 768;
        const starCount = isMobile ? 10 : 20;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 80 + '%';
            star.style.animationDelay = Math.random() * 2 + 's';
            starContainer.appendChild(star);
        }
        
        this.weatherEffects.push(starContainer);
    }
    
    clearWeatherEffects() {
        // 모든 날씨 효과 제거
        this.weatherEffects.forEach(effect => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        });
        this.weatherEffects = [];
        
        // 인터벌 정리
        if (this.rainInterval) {
            clearInterval(this.rainInterval);
            this.rainInterval = null;
        }
        if (this.snowInterval) {
            clearInterval(this.snowInterval);
            this.snowInterval = null;
        }
        if (this.lightningInterval) {
            clearInterval(this.lightningInterval);
            this.lightningInterval = null;
        }
    }
    
    showWeatherNotification(weatherType) {
        const weatherNames = {
            sunny: '☀️ 맑음',
            cloudy: '☁️ 흐림',
            rainy: '🌧️ 비',
            snowy: '❄️ 눈',
            stormy: '⛈️ 폭풍',
            sunset: '🌅 석양',
            dawn: '🌄 새벽'
        };
        
        if (window.showNotification && weatherNames[weatherType]) {
            showNotification(
                `날씨가 ${weatherNames[weatherType]}로 바뀌었습니다!`, 
                'info', 
                2000
            );
        }
    }
}

// 게임 클래스 정의
class TypingGame {
    constructor(config) {
        this.config = config;
        this.words = [];
        this.activeWords = [];
        this.currentWord = '';
        this.score = 0;
        this.totalWords = 0;
        this.completedWords = 0;
        this.missedWords = 0;
        this.correctChars = 0;
        this.totalChars = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.gameInterval = null;
        this.wordInterval = null;
        
        this.gameArea = document.getElementById('gameArea');
        this.wordsContainer = document.getElementById('wordsContainer');
        this.typingInput = document.getElementById('typingInput');
        this.pauseBtn = document.getElementById('pauseBtn');
        
        // 날씨 시스템 초기화
        this.weatherSystem = new WeatherSystem(document.querySelector('.sky-area'));
        
        this.setupEventListeners();
        this.loadWords();
    }
    
    async loadWords() {
        try {
            const response = await fetch(`/api/words/${this.config.stage}`);
            const data = await response.json();
            this.words = data.words;
            this.config = { ...this.config, ...data.config };
            this.startGame();
        } catch (error) {
            console.error('단어 로딩 실패:', error);
            showNotification('게임 데이터를 로드할 수 없습니다.', 'danger');
        }
    }
    
    setupEventListeners() {
        // 타이핑 입력 처리
        this.typingInput.addEventListener('input', (e) => {
            this.handleTyping(e.target.value);
        });
        
        // 엔터 키 처리
        this.typingInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.checkCurrentWord();
            }
        });
        
        // 일시정지 버튼
        this.pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });
        
        // 게임 포커스 관리
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning && !this.isPaused) {
                this.togglePause();
            }
        });
    }
    
    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        this.typingInput.focus();
        this.updateUI();
        
        // 날씨 시스템 시작
        this.weatherSystem.start();
        
        // 첫 번째 단어 생성
        this.createWord();
        
        // 정기적으로 새 단어 생성
        this.wordInterval = setInterval(() => {
            if (!this.isPaused && this.isRunning) {
                if (this.activeWords.length < this.config.wordCount) {
                    this.createWord();
                }
            }
        }, this.config.speed);
        
        // 게임 루프
        this.gameInterval = setInterval(() => {
            if (!this.isPaused && this.isRunning) {
                this.updateGame();
            }
        }, 50); // 20 FPS
    }
    
    createWord() {
        if (this.words.length === 0) return;
        
        const word = this.words[Math.floor(Math.random() * this.words.length)];
        const wordElement = document.createElement('div');
        wordElement.className = 'falling-word';
        wordElement.textContent = word;
        wordElement.style.left = Math.random() * (this.gameArea.offsetWidth - 200) + 'px';
        wordElement.style.top = '-50px';
        
        const fallingDuration = 8000 + (this.config.stage * 200); // 단계별 조정
        wordElement.style.animationDuration = `${fallingDuration}ms`;
        
        this.wordsContainer.appendChild(wordElement);
        
        const wordData = {
            element: wordElement,
            text: word,
            startTime: Date.now(),
            duration: fallingDuration,
            typed: '',
            isActive: false
        };
        
        this.activeWords.push(wordData);
        this.totalWords++;
        
        // 애니메이션 완료 후 제거
        setTimeout(() => {
            if (wordData.element.parentNode && !wordData.completed) {
                this.missWord(wordData);
            }
        }, fallingDuration);
    }
    
    updateGame() {
        // 단어들의 위치 확인 및 바다 도달 체크
        this.activeWords.forEach((wordData, index) => {
            const rect = wordData.element.getBoundingClientRect();
            const gameRect = this.gameArea.getBoundingClientRect();
            
            // 바다에 도달했는지 확인 (게임 영역의 80% 지점)
            if (rect.top > gameRect.height * 0.8 && !wordData.completed) {
                this.missWord(wordData);
            }
        });
        
        // 완료된 단어들 제거
        this.activeWords = this.activeWords.filter(word => !word.toRemove);
        
        // 모든 단어를 처리했는지 확인
        if (this.totalWords >= 20 && this.activeWords.length === 0) {
            this.completeGame();
        }
    }
    
    handleTyping(input) {
        const trimmedInput = input.trim().toLowerCase();
        
        // 현재 타이핑 중인 단어 찾기
        let targetWord = this.activeWords.find(word => 
            !word.completed && word.text.toLowerCase().startsWith(trimmedInput)
        );
        
        if (targetWord) {
            // 단어가 일치하는 경우
            targetWord.typed = trimmedInput;
            targetWord.isActive = true;
            
            // 다른 단어들의 active 상태 해제
            this.activeWords.forEach(word => {
                if (word !== targetWord) {
                    word.isActive = false;
                    word.element.classList.remove('typing');
                }
            });
            
            targetWord.element.classList.add('typing');
            this.updateInputFeedback('correct', '올바른 입력');
            
            // 완전히 일치하는지 확인
            if (trimmedInput === targetWord.text.toLowerCase()) {
                this.completeWord(targetWord);
                this.typingInput.value = '';
            }
        } else {
            // 일치하는 단어가 없는 경우
            this.activeWords.forEach(word => {
                word.isActive = false;
                word.element.classList.remove('typing');
            });
            
            if (trimmedInput.length > 0) {
                this.updateInputFeedback('incorrect', '일치하는 단어가 없습니다');
                this.totalChars++;
            } else {
                this.updateInputFeedback('', '');
            }
        }
        
        // 사운드 효과
        if (input.length > 0) {
            window.soundManager.play(targetWord ? 'keypress' : 'wrong');
        }
    }
    
    checkCurrentWord() {
        const input = this.typingInput.value.trim().toLowerCase();
        if (input.length === 0) return;
        
        const targetWord = this.activeWords.find(word => 
            !word.completed && word.text.toLowerCase() === input
        );
        
        if (targetWord) {
            this.completeWord(targetWord);
        } else {
            this.updateInputFeedback('incorrect', '잘못된 단어입니다');
            this.totalChars += input.length;
        }
        
        this.typingInput.value = '';
    }
    
    completeWord(wordData) {
        wordData.completed = true;
        wordData.element.classList.remove('typing');
        wordData.element.classList.add('completed');
        
        this.completedWords++;
        this.correctChars += wordData.text.length;
        this.totalChars += wordData.text.length;
        
        // 점수 계산 (속도 보너스 포함)
        const timeBonus = Math.max(0, wordData.duration - (Date.now() - wordData.startTime));
        const baseScore = wordData.text.length * 10;
        const bonus = Math.floor(timeBonus / 100);
        this.score += baseScore + bonus;
        
        // 사운드 효과
        window.soundManager.play('correct');
        
        // 단어 제거
        setTimeout(() => {
            if (wordData.element.parentNode) {
                wordData.element.parentNode.removeChild(wordData.element);
            }
            wordData.toRemove = true;
        }, 500);
        
        this.updateUI();
        this.updateInputFeedback('correct', `+${baseScore + bonus} 점!`);
    }
    
    missWord(wordData) {
        wordData.completed = true;
        wordData.element.classList.add('missed');
        
        this.missedWords++;
        this.totalChars += wordData.text.length;
        
        // 게임 오버 체크
        if (this.missedWords >= 3) {
            this.gameOver();
            return;
        }
        
        // 단어 제거
        setTimeout(() => {
            if (wordData.element.parentNode) {
                wordData.element.parentNode.removeChild(wordData.element);
            }
            wordData.toRemove = true;
        }, 500);
        
        this.updateUI();
        showNotification(`단어가 바다에 빠졌습니다! (${this.missedWords}/3)`, 'warning', 2000);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseBtn.innerHTML = '<i class="fas fa-play"></i> 계속';
            this.pauseBtn.classList.remove('btn-warning');
            this.pauseBtn.classList.add('btn-success');
            showNotification('게임이 일시정지되었습니다', 'info', 1000);
            
            // 날씨 시스템 일시정지
            this.weatherSystem.stop();
        } else {
            this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 일시정지';
            this.pauseBtn.classList.remove('btn-success');
            this.pauseBtn.classList.add('btn-warning');
            this.typingInput.focus();
            
            // 날씨 시스템 재시작
            this.weatherSystem.start();
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('remaining').textContent = Math.max(0, 20 - this.totalWords);
        
        const accuracy = this.totalChars > 0 ? (this.correctChars / this.totalChars * 100) : 100;
        document.getElementById('accuracy').textContent = accuracy.toFixed(1);
    }
    
    updateInputFeedback(type, message) {
        const feedback = document.getElementById('inputFeedback');
        feedback.className = `input-feedback ${type}`;
        feedback.textContent = message;
        
        // 메시지 자동 삭제
        setTimeout(() => {
            if (feedback.textContent === message) {
                feedback.textContent = '';
                feedback.className = 'input-feedback';
            }
        }, 2000);
    }
    
    completeGame() {
        this.isRunning = false;
        clearInterval(this.gameInterval);
        clearInterval(this.wordInterval);
        
        // 날씨 시스템 정지
        this.weatherSystem.stop();
        
        const accuracy = this.totalChars > 0 ? (this.correctChars / this.totalChars * 100) : 100;
        
        // 완료 통계 표시
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalAccuracy').textContent = accuracy.toFixed(1) + '%';
        document.getElementById('wordsCompleted').textContent = this.completedWords;
        
        // 서버에 결과 전송
        this.saveProgress();
        
        // 완료 모달 표시 (modal-open 클래스 제거)
        const modalElement = document.getElementById('gameCompleteModal');
        
        // 기존 모달 인스턴스 제거
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            existingModal.dispose();
        }
        
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false,
            focus: true
        });
        
        // 모달 표시
        modal.show();
        
        // 모달이 완전히 표시된 후 버튼에 포커스 및 이벤트 리스너 추가
        modalElement.addEventListener('shown.bs.modal', () => {
            const nextBtn = document.getElementById('nextStageBtn');
            const dashboardBtn = modalElement.querySelector('.btn-secondary');
            
            if (nextBtn) {
                nextBtn.focus();
                
                // 강제로 이벤트 리스너 추가 (중복 방지)
                nextBtn.removeEventListener('click', this.handleNextStage);
                nextBtn.addEventListener('click', this.handleNextStage);
            }
            
            if (dashboardBtn) {
                dashboardBtn.removeEventListener('click', this.handleDashboard);
                dashboardBtn.addEventListener('click', this.handleDashboard);
            }
            
            console.log('모달이 표시되었고 버튼 이벤트가 설정되었습니다.');
        }, { once: true });
        
        // 진행상황 추적
        trackUserProgress(this.config.stage, this.score, accuracy);
    }
    
    // 버튼 클릭 핸들러 메서드들
    handleNextStage = (e) => {
        e.preventDefault();
        console.log('다음 단계 버튼 클릭됨 (핸들러)');
        const currentStage = this.config.stage;
        const nextStage = currentStage + 1;
        console.log('현재 단계:', currentStage, '다음 단계:', nextStage);
        
        if (nextStage <= 20) {
            window.location.href = `/game/${nextStage}`;
        } else {
            window.location.href = '/dashboard';
        }
    }
    
    handleDashboard = (e) => {
        e.preventDefault();
        console.log('대시보드 버튼 클릭됨 (핸들러)');
        window.location.href = '/dashboard';
    }
    
    handleRestart = (e) => {
        e.preventDefault();
        console.log('재시작 버튼 클릭됨 (핸들러)');
        location.reload();
    }
    
    gameOver() {
        this.isRunning = false;
        clearInterval(this.gameInterval);
        clearInterval(this.wordInterval);
        
        // 날씨 시스템 정지
        this.weatherSystem.stop();
        
        const accuracy = this.totalChars > 0 ? (this.correctChars / this.totalChars * 100) : 100;
        
        // 게임 오버 통계 표시
        document.getElementById('gameOverScore').textContent = this.score;
        document.getElementById('gameOverAccuracy').textContent = accuracy.toFixed(1) + '%';
        
        // 게임 오버 모달 표시 (modal-open 클래스 제거)
        const modalElement = document.getElementById('gameOverModal');
        
        // 기존 모달 인스턴스 제거
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            existingModal.dispose();
        }
        
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false,
            focus: true
        });
        
        // 모달 표시
        modal.show();
        
        // 모달이 완전히 표시된 후 버튼 이벤트 설정
        modalElement.addEventListener('shown.bs.modal', () => {
            const dashboardBtn = modalElement.querySelector('.btn-secondary');
            const restartBtn = modalElement.querySelector('.btn-primary');
            
            if (dashboardBtn) {
                dashboardBtn.removeEventListener('click', this.handleDashboard);
                dashboardBtn.addEventListener('click', this.handleDashboard);
            }
            
            if (restartBtn) {
                restartBtn.removeEventListener('click', this.handleRestart);
                restartBtn.addEventListener('click', this.handleRestart);
            }
            
            console.log('게임 오버 모달이 표시되었고 버튼 이벤트가 설정되었습니다.');
        }, { once: true });
    }
    
    async saveProgress() {
        const accuracy = this.totalChars > 0 ? (this.correctChars / this.totalChars * 100) : 100;
        
        try {
            await apiCall('/api/complete-stage', {
                method: 'POST',
                body: JSON.stringify({
                    stage: this.config.stage,
                    score: this.score,
                    accuracy: accuracy,
                    words_completed: this.completedWords,
                    words_missed: this.missedWords
                })
            });
        } catch (error) {
            console.error('진행상황 저장 실패:', error);
        }
    }
}

// 게임 초기화 함수
function initGame(config) {
    // 전역 게임 인스턴스 생성
    window.gameInstance = new TypingGame(config);
    
    // 게임 시작 알림
    showNotification(`Stage ${config.stage} 시작! 화이팅!`, 'success', 2000);
    
    // 모바일 최적화
    if (checkMobileDevice()) {
        // 모바일에서 입력 필드 스크롤 방지
        window.addEventListener('resize', () => {
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        });
        
        // 터치 이벤트 추가
        document.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('falling-word')) {
                // 터치로 단어 선택 (모바일 편의성)
                const wordText = e.target.textContent;
                document.getElementById('typingInput').value = wordText;
                window.gameInstance.handleTyping(wordText);
            }
        });
    }
}

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (window.gameInstance && window.gameInstance.isRunning) {
        return '게임이 진행 중입니다. 페이지를 떠나시겠습니까?';
    }
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    if (window.gameInstance) {
        switch(e.key) {
            case 'Escape':
                e.preventDefault();
                window.gameInstance.togglePause();
                break;
            case 'F1':
                e.preventDefault();
                showNotification('ESC: 일시정지, F11: 전체화면', 'info');
                break;
        }
    }
});

// 성능 최적화를 위한 RequestAnimationFrame 사용
function optimizeAnimations() {
    const words = document.querySelectorAll('.falling-word');
    words.forEach(word => {
        // GPU 가속 활성화
        word.style.transform = 'translate3d(0,0,0)';
        word.style.willChange = 'transform';
    });
}

// 주기적으로 애니메이션 최적화 적용
setInterval(optimizeAnimations, 5000);
