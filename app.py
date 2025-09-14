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
data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
os.makedirs(data_dir, exist_ok=True)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# 절대 경로로 데이터베이스 URI 설정
default_db_path = f"sqlite:///{os.path.join(data_dir, 'typing_practice.db')}"
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', default_db_path)
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
        # 기본 단어들
        'the', 'and', 'for', 'you', 'all', 'not', 'but', 'can', 'had', 'her',
        'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
        'man', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'its',
        'let', 'put', 'say', 'she', 'too', 'use', 'way', 'may', 'come', 'call',
        
        # 추가된 다양한 단어들
        'time', 'work', 'life', 'right', 'down', 'very', 'what', 'just', 'first',
        'over', 'think', 'also', 'back', 'after', 'good', 'want', 'through', 'many',
        'where', 'much', 'should', 'well', 'people', 'down', 'own', 'just', 'because',
        'good', 'each', 'those', 'feel', 'seem', 'these', 'free', 'little', 'human',
        'local', 'large', 'next', 'available', 'major', 'possible', 'big', 'able',
        'economic', 'argue', 'far', 'successful', 'exactly', 'step', 'discuss', 'topic',
        
        # 흥미로운 단어들
        'amazing', 'beautiful', 'creative', 'delicious', 'exciting', 'fantastic', 'gorgeous',
        'happiness', 'incredible', 'joyful', 'kindness', 'laughter', 'magnificent', 'nature',
        'optimistic', 'peaceful', 'quality', 'relaxing', 'sunshine', 'tremendous', 'unique',
        'victory', 'wonderful', 'excellent', 'youth', 'zealous', 'adventure', 'brilliant',
        'courage', 'dream', 'energy', 'freedom', 'growth', 'harmony', 'inspire', 'journey'
    ],
    'short': [
        # 기본 짧은 구문들
        'hello world', 'good morning', 'how are you', 'nice to meet', 'thank you',
        'see you later', 'have a day', 'what is this', 'where are you', 'when will you',
        'why do you', 'how do you', 'can you help', 'I am fine', 'this is good', 'that was nice',
        
        # 일상 대화
        'how was work', 'see you soon', 'take care now', 'what time is it', 'where shall we go',
        'let me think', 'that sounds great', 'I understand now', 'no problem at all', 'you are welcome',
        'excuse me please', 'I beg your pardon', 'could you repeat', 'nice weather today', 'have fun tonight',
        
        # 감정 표현
        'I feel happy', 'this is awesome', 'what a surprise', 'I am excited', 'that was funny',
        'so proud of you', 'well done today', 'keep up the work', 'never give up', 'dream big always',
        
        # 학습/업무 관련
        'let me check', 'good idea indeed', 'time to learn', 'work hard today', 'study well tonight',
        'practice makes perfect', 'knowledge is power', 'creativity flows freely', 'innovation drives progress', 'teamwork builds success'
    ],
    'medium': [
        # 기존 문장들
        'The quick brown fox jumps over the lazy dog',
        'Practice makes perfect in everything you do',
        'Learning to type fast requires daily practice',
        'Technology advances at an incredible pace today',
        'Communication skills are essential for success',
        'The internet connects people around the world',
        'Programming languages help solve complex problems',
        'Education opens doors to many opportunities',
        
        # 생활과 일상
        'Coffee shops provide a cozy atmosphere for reading and relaxation',
        'Regular exercise contributes significantly to maintaining good health and wellness',
        'Cooking homemade meals brings families together around the dinner table',
        'Reading books expands vocabulary and improves critical thinking skills dramatically',
        'Gardening teaches patience while connecting us with the natural world',
        'Music has the power to evoke emotions and create lasting memories',
        'Travel broadens perspectives and introduces us to diverse cultures worldwide',
        
        # 기술과 혁신
        'Smartphones have revolutionized the way we communicate and access information',
        'Social media platforms connect billions of people across different continents',
        'Renewable energy sources are becoming increasingly important for environmental sustainability',
        'Virtual reality technology creates immersive experiences for entertainment and education',
        'Machine learning algorithms can analyze vast amounts of data efficiently',
        
        # 자기계발과 성장
        'Setting clear goals helps maintain focus and direction in life',
        'Developing emotional intelligence improves relationships and career prospects significantly',
        'Time management skills enable better work-life balance and increased productivity',
        'Continuous learning keeps the mind sharp and adaptable to change',
        'Building strong networks opens doors to new opportunities and collaborations'
    ],
    'long': [
        # 기존 긴 문장들
        'In the heart of every great achievement lies a story of perseverance and dedication',
        'The advancement of artificial intelligence continues to reshape our understanding of technology',
        'Effective communication involves not just speaking clearly but also listening attentively',
        'The pursuit of knowledge requires patience, curiosity, and an open mind to new ideas',
        'Success in any field demands continuous learning and adaptation to changing circumstances',
        
        # 철학적이고 깊이 있는 문장들
        'The greatest discoveries often emerge from the intersection of different fields of knowledge and expertise',
        'Creativity flourishes when we embrace uncertainty and allow ourselves to explore unconventional paths',
        'Building meaningful relationships requires genuine interest in others and the ability to empathize deeply',
        'Environmental conservation demands collective action and individual responsibility from every global citizen',
        'Innovation thrives in environments that encourage experimentation and learn from both success and failure',
        
        # 사회와 문화
        'Cultural diversity enriches our understanding of human experience and promotes tolerance across communities',
        'Digital transformation has fundamentally altered how businesses operate and customers interact with brands',
        'Sustainable development balances economic growth with environmental protection and social equity considerations',
        'Educational systems must evolve to prepare students for careers that may not yet exist',
        'Leadership in the modern world requires adaptability, emotional intelligence, and ethical decision-making skills',
        
        # 과학과 미래
        'Scientific research continues to unlock mysteries about the universe and our place within it',
        'Climate change represents one of the most pressing challenges facing humanity in this century',
        'Biotechnology advances offer promising solutions for treating previously incurable diseases and conditions',
        'Space exploration expands our knowledge while inspiring future generations to pursue ambitious goals'
    ],
    'complex': [
        # 기존 복잡한 문장들
        'Despite the complexity of modern technological systems, human creativity remains the driving force behind innovation',
        'The interdisciplinary approach to problem-solving often yields the most comprehensive and sustainable solutions',
        'Globalization has fundamentally transformed the way we conduct business, communicate, and share cultural experiences',
        'The synthesis of theoretical knowledge and practical application forms the foundation of meaningful scientific progress',
        
        # 매우 복잡하고 도전적인 문장들
        'The convergence of artificial intelligence, quantum computing, and biotechnology promises to revolutionize industries while simultaneously raising profound ethical questions about privacy, autonomy, and human identity',
        'Contemporary neuroscience research has revealed that neuroplasticity allows the brain to reorganize itself throughout life, challenging long-held assumptions about cognitive development and rehabilitation possibilities',
        'The transition toward renewable energy infrastructure requires coordinated efforts among governments, private sector entities, and international organizations to overcome technical, economic, and political obstacles',
        'Philosophical debates about consciousness, free will, and moral responsibility continue to evolve as cognitive science provides new insights into the mechanisms underlying human behavior and decision-making processes',
        
        # 학술적이고 전문적인 문장들
        'Quantum mechanical principles demonstrate that observation fundamentally alters the behavior of subatomic particles, suggesting reality itself may be more fluid than classical physics previously indicated',
        'Epidemiological studies require careful consideration of confounding variables, selection bias, and statistical power to draw valid conclusions about causal relationships between exposure and disease outcomes',
        'Macroeconomic policy decisions involving fiscal and monetary instruments must balance competing objectives such as inflation control, employment maximization, and sustainable long-term economic growth',
        'Postmodern literary criticism challenges traditional notions of authorial intent and textual meaning, emphasizing instead the role of reader interpretation and cultural context in creating significance'
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

def init_database():
    """데이터베이스 초기화"""
    try:
        with app.app_context():
            # 데이터베이스 파일 경로 확인
            db_uri = app.config['SQLALCHEMY_DATABASE_URI']
            if db_uri.startswith('sqlite:///'):
                db_path = db_uri.replace('sqlite:///', '')
                db_dir = os.path.dirname(db_path)
                if db_dir and not os.path.exists(db_dir):
                    os.makedirs(db_dir, exist_ok=True)
                    print(f"Created database directory: {db_dir}")
            
            # 테이블 생성
            db.create_all()
            print("Database tables created successfully")
            
    except Exception as e:
        print(f"Error initializing database: {e}")
        print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        raise

if __name__ == '__main__':
    # 데이터베이스 초기화
    init_database()
    
    # 도커 환경을 위한 설정
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Starting server on {host}:{port}")
    print(f"Debug mode: {debug}")
    print(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    app.run(host=host, port=port, debug=debug)
