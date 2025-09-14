from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json
import random

app = Flask(__name__)

# 환경 변수에서 설정 로드
import os

# data 디렉토리 생성
os.makedirs('data', exist_ok=True)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///data/typing_practice.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# 템플릿에서 사용할 함수들 등록
@app.context_processor
def utility_processor():
    return dict(now=datetime.utcnow)

# 데이터베이스 모델
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    current_stage = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class GameSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stage = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer, default=0)
    accuracy = db.Column(db.Float, default=0.0)
    words_completed = db.Column(db.Integer, default=0)
    words_missed = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 단계별 게임 설정
STAGE_CONFIG = {
    1: {'speed': 3000, 'word_count': 1, 'word_type': 'single'},  # 3초마다 단어 하나
    2: {'speed': 2800, 'word_count': 1, 'word_type': 'single'},
    3: {'speed': 2600, 'word_count': 1, 'word_type': 'single'},
    4: {'speed': 2400, 'word_count': 1, 'word_type': 'single'},
    5: {'speed': 2200, 'word_count': 2, 'word_type': 'single'},  # 두 개씩
    6: {'speed': 2000, 'word_count': 2, 'word_type': 'single'},
    7: {'speed': 1800, 'word_count': 2, 'word_type': 'single'},
    8: {'speed': 1600, 'word_count': 2, 'word_type': 'short'},   # 짧은 문장
    9: {'speed': 1500, 'word_count': 2, 'word_type': 'short'},
    10: {'speed': 1400, 'word_count': 3, 'word_type': 'short'},
    11: {'speed': 1300, 'word_count': 3, 'word_type': 'short'},
    12: {'speed': 1200, 'word_count': 3, 'word_type': 'medium'},  # 중간 문장
    13: {'speed': 1100, 'word_count': 3, 'word_type': 'medium'},
    14: {'speed': 1000, 'word_count': 4, 'word_type': 'medium'},
    15: {'speed': 900, 'word_count': 4, 'word_type': 'medium'},
    16: {'speed': 800, 'word_count': 4, 'word_type': 'long'},    # 긴 문장
    17: {'speed': 700, 'word_count': 5, 'word_type': 'long'},
    18: {'speed': 600, 'word_count': 5, 'word_type': 'long'},
    19: {'speed': 500, 'word_count': 6, 'word_type': 'complex'},  # 복잡한 문장
    20: {'speed': 400, 'word_count': 6, 'word_type': 'complex'},
}

# 단어/문장 데이터
WORDS_DATA = {
    'single': [
        'the', 'and', 'for', 'you', 'all', 'not', 'but', 'can', 'had', 'her',
        'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
        'man', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'its',
        'let', 'put', 'say', 'she', 'too', 'use', 'way', 'may', 'come', 'call'
    ],
    'short': [
        'hello world', 'good morning', 'how are you', 'nice to meet',
        'thank you', 'see you later', 'have a day', 'what is this',
        'where are you', 'when will you', 'why do you', 'how do you',
        'can you help', 'I am fine', 'this is good', 'that was nice'
    ],
    'medium': [
        'The quick brown fox jumps over the lazy dog',
        'Practice makes perfect in everything you do',
        'Learning to type fast requires daily practice',
        'Technology advances at an incredible pace today',
        'Communication skills are essential for success',
        'The internet connects people around the world',
        'Programming languages help solve complex problems',
        'Education opens doors to many opportunities'
    ],
    'long': [
        'In the heart of every great achievement lies a story of perseverance and dedication',
        'The advancement of artificial intelligence continues to reshape our understanding of technology',
        'Effective communication involves not just speaking clearly but also listening attentively',
        'The pursuit of knowledge requires patience, curiosity, and an open mind to new ideas',
        'Success in any field demands continuous learning and adaptation to changing circumstances'
    ],
    'complex': [
        'Despite the complexity of modern technological systems, human creativity remains the driving force behind innovation',
        'The interdisciplinary approach to problem-solving often yields the most comprehensive and sustainable solutions',
        'Globalization has fundamentally transformed the way we conduct business, communicate, and share cultural experiences',
        'The synthesis of theoretical knowledge and practical application forms the foundation of meaningful scientific progress'
    ]
}

# 라우트 정의
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': '이미 존재하는 사용자명입니다.'})
        
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': '이미 등록된 이메일입니다.'})
        
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'success': True, 'message': '회원가입이 완료되었습니다.'})
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            return jsonify({'success': True, 'message': '로그인 성공!'})
        else:
            return jsonify({'success': False, 'message': '잘못된 사용자명 또는 비밀번호입니다.'})
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('dashboard.html', user=user, max_stage=20)

@app.route('/game/<int:stage>')
def game(stage):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if stage > user.current_stage:
        flash('이전 단계를 먼저 완료해주세요.')
        return redirect(url_for('dashboard'))
    
    if stage not in STAGE_CONFIG:
        flash('유효하지 않은 단계입니다.')
        return redirect(url_for('dashboard'))
    
    config = STAGE_CONFIG[stage]
    return render_template('game.html', stage=stage, config=config)

@app.route('/api/words/<int:stage>')
def get_words(stage):
    if stage not in STAGE_CONFIG:
        return jsonify({'error': 'Invalid stage'})
    
    config = STAGE_CONFIG[stage]
    word_type = config['word_type']
    words = random.sample(WORDS_DATA[word_type], min(len(WORDS_DATA[word_type]), 10))
    
    return jsonify({
        'words': words,
        'config': config
    })

@app.route('/api/complete-stage', methods=['POST'])
def complete_stage():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    data = request.get_json()
    stage = data.get('stage')
    score = data.get('score', 0)
    accuracy = data.get('accuracy', 0.0)
    words_completed = data.get('words_completed', 0)
    words_missed = data.get('words_missed', 0)
    
    user = User.query.get(session['user_id'])
    
    # 게임 세션 저장
    game_session = GameSession(
        user_id=user.id,
        stage=stage,
        score=score,
        accuracy=accuracy,
        words_completed=words_completed,
        words_missed=words_missed
    )
    db.session.add(game_session)
    
    # 다음 단계 해금
    if stage == user.current_stage and stage < 20:
        user.current_stage = stage + 1
    
    db.session.commit()
    
    return jsonify({'success': True, 'next_stage': user.current_stage})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    # 도커 환경을 위한 설정
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    app.run(host=host, port=port, debug=debug)
