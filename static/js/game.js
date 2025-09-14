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
        } else {
            this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 일시정지';
            this.pauseBtn.classList.remove('btn-success');
            this.pauseBtn.classList.add('btn-warning');
            this.typingInput.focus();
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
        
        const accuracy = this.totalChars > 0 ? (this.correctChars / this.totalChars * 100) : 100;
        
        // 완료 통계 표시
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalAccuracy').textContent = accuracy.toFixed(1) + '%';
        document.getElementById('wordsCompleted').textContent = this.completedWords;
        
        // 서버에 결과 전송
        this.saveProgress();
        
        // 완료 모달 표시
        const modal = new bootstrap.Modal(document.getElementById('gameCompleteModal'));
        modal.show();
        
        // 다음 단계 버튼 처리
        document.getElementById('nextStageBtn').onclick = () => {
            const nextStage = this.config.stage + 1;
            if (nextStage <= 20) {
                window.location.href = `/game/${nextStage}`;
            } else {
                window.location.href = '/dashboard';
            }
        };
        
        // 진행상황 추적
        trackUserProgress(this.config.stage, this.score, accuracy);
    }
    
    gameOver() {
        this.isRunning = false;
        clearInterval(this.gameInterval);
        clearInterval(this.wordInterval);
        
        const accuracy = this.totalChars > 0 ? (this.correctChars / this.totalChars * 100) : 100;
        
        // 게임 오버 통계 표시
        document.getElementById('gameOverScore').textContent = this.score;
        document.getElementById('gameOverAccuracy').textContent = accuracy.toFixed(1) + '%';
        
        // 게임 오버 모달 표시
        const modal = new bootstrap.Modal(document.getElementById('gameOverModal'));
        modal.show();
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
