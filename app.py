from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, abort
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, EqualTo
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///typing_practice.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# 데이터베이스 모델
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    current_level = db.Column(db.Integer, default=1)
    total_lessons_completed = db.Column(db.Integer, default=0)
    
    # 관계
    progress = db.relationship('UserProgress', backref='user', lazy=True)
    typing_stats = db.relationship('TypingStats', backref='user', lazy=True)

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text, nullable=False)
    target_keys = db.Column(db.String(50))  # 연습할 키들
    min_wpm = db.Column(db.Integer, default=20)  # 통과 기준 WPM
    min_accuracy = db.Column(db.Float, default=85.0)  # 통과 기준 정확도

class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    best_wpm = db.Column(db.Integer, default=0)
    best_accuracy = db.Column(db.Float, default=0.0)
    attempts = db.Column(db.Integer, default=0)
    last_attempt = db.Column(db.DateTime, default=datetime.utcnow)

class TypingStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    wpm = db.Column(db.Integer, nullable=False)
    accuracy = db.Column(db.Float, nullable=False)
    time_taken = db.Column(db.Integer, nullable=False)  # 초 단위
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# 폼 클래스
class LoginForm(FlaskForm):
    username = StringField('사용자명', validators=[DataRequired()])
    password = PasswordField('비밀번호', validators=[DataRequired()])
    submit = SubmitField('로그인')

class RegisterForm(FlaskForm):
    username = StringField('사용자명', validators=[DataRequired()])
    email = StringField('이메일', validators=[DataRequired(), Email()])
    password = PasswordField('비밀번호', validators=[DataRequired()])
    password2 = PasswordField('비밀번호 확인', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('회원가입')

# 라우트
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        # 사용자명과 이메일 중복 확인
        if User.query.filter_by(username=form.username.data).first():
            flash('이미 존재하는 사용자명입니다.')
            return render_template('register.html', form=form)
        
        if User.query.filter_by(email=form.email.data).first():
            flash('이미 등록된 이메일입니다.')
            return render_template('register.html', form=form)
        
        # 새 사용자 생성
        user = User(
            username=form.username.data,
            email=form.email.data,
            password_hash=generate_password_hash(form.password.data)
        )
        db.session.add(user)
        db.session.commit()
        
        flash('회원가입이 완료되었습니다!')
        return redirect(url_for('login'))
    
    return render_template('register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and check_password_hash(user.password_hash, form.password.data):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('잘못된 사용자명 또는 비밀번호입니다.')
    
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    # 사용자 진행상황 가져오기
    progress = UserProgress.query.filter_by(user_id=current_user.id).all()
    completed_lessons = len([p for p in progress if p.completed])
    
    # 다음 레슨 찾기
    next_lesson = Lesson.query.filter_by(level=current_user.current_level).first()
    
    # 최근 통계
    recent_stats = TypingStats.query.filter_by(user_id=current_user.id)\
                                  .order_by(TypingStats.created_at.desc())\
                                  .limit(5).all()
    
    return render_template('dashboard.html', 
                         user=current_user,
                         completed_lessons=completed_lessons,
                         next_lesson=next_lesson,
                         recent_stats=recent_stats)

@app.route('/lesson/<int:lesson_id>')
@login_required
def lesson(lesson_id):
    lesson = db.session.get(Lesson, lesson_id)
    if not lesson:
        abort(404)
    
    # 사용자가 이 레슨에 접근할 수 있는지 확인
    if lesson.level > current_user.current_level:
        flash('이전 레슨을 먼저 완료해주세요.')
        return redirect(url_for('dashboard'))
    
    # 사용자의 이 레슨 진행상황
    progress = UserProgress.query.filter_by(
        user_id=current_user.id, 
        lesson_id=lesson_id
    ).first()
    
    return render_template('lesson.html', lesson=lesson, progress=progress)

@app.route('/api/submit_result', methods=['POST'])
@login_required
def submit_result():
    data = request.get_json()
    lesson_id = data.get('lesson_id')
    wpm = data.get('wpm')
    accuracy = data.get('accuracy')
    time_taken = data.get('time_taken')
    
    lesson = db.session.get(Lesson, lesson_id)
    if not lesson:
        return jsonify({'error': '레슨을 찾을 수 없습니다.'}), 404
    
    # 통계 저장
    stat = TypingStats(
        user_id=current_user.id,
        lesson_id=lesson_id,
        wpm=wpm,
        accuracy=accuracy,
        time_taken=time_taken
    )
    db.session.add(stat)
    
    # 진행상황 업데이트
    progress = UserProgress.query.filter_by(
        user_id=current_user.id,
        lesson_id=lesson_id
    ).first()
    
    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            lesson_id=lesson_id
        )
        db.session.add(progress)
    
    progress.attempts += 1
    progress.last_attempt = datetime.utcnow()
    
    # 최고 기록 업데이트
    if wpm > progress.best_wpm:
        progress.best_wpm = wpm
    if accuracy > progress.best_accuracy:
        progress.best_accuracy = accuracy
    
    # 레슨 완료 조건 확인
    passed = wpm >= lesson.min_wpm and accuracy >= lesson.min_accuracy
    
    if passed and not progress.completed:
        progress.completed = True
        current_user.total_lessons_completed += 1
        
        # 다음 레벨로 진행
        next_lesson = Lesson.query.filter(Lesson.level > current_user.current_level).first()
        if next_lesson:
            current_user.current_level = next_lesson.level
    
    db.session.commit()
    
    return jsonify({
        'passed': passed,
        'message': '축하합니다! 레슨을 완료했습니다!' if passed else '다시 도전해보세요!',
        'best_wpm': progress.best_wpm,
        'best_accuracy': progress.best_accuracy
    })

@app.route('/api/lessons')
@login_required
def get_lessons():
    lessons = Lesson.query.order_by(Lesson.level, Lesson.id).all()
    user_progress = {p.lesson_id: p for p in current_user.progress}
    
    lesson_data = []
    for lesson in lessons:
        progress = user_progress.get(lesson.id)
        lesson_data.append({
            'id': lesson.id,
            'level': lesson.level,
            'title': lesson.title,
            'description': lesson.description,
            'completed': progress.completed if progress else False,
            'best_wpm': progress.best_wpm if progress else 0,
            'best_accuracy': progress.best_accuracy if progress else 0,
            'accessible': lesson.level <= current_user.current_level
        })
    
    return jsonify(lesson_data)

def init_lessons():
    """기본 레슨 데이터 초기화"""
    if Lesson.query.count() > 0:
        return
    
    lessons_data = [
        # 레벨 1: 기본 키 연습
        {
            'level': 1,
            'title': '홈 로우 키 연습 (ASDF JKL;)',
            'description': '키보드의 기본 위치인 홈 로우 키를 연습합니다.',
            'content': 'asdf jkl; asdf jkl; aaa sss ddd fff jjj kkk lll ;;; asdf jkl; fjdk slad fjdk slad',
            'target_keys': 'asdf jkl;',
            'min_wpm': 15,
            'min_accuracy': 90.0
        },
        {
            'level': 1,
            'title': '상단 키 연습 (QWER YUIO)',
            'description': '상단 키들을 홈 로우와 함께 연습합니다.',
            'content': 'qwer yuio asdf jkl; qwer yuio qwe rty uio qas wer tyu iop',
            'target_keys': 'qwer yuio',
            'min_wpm': 18,
            'min_accuracy': 88.0
        },
        {
            'level': 1,
            'title': '하단 키 연습 (ZXCV BNM)',
            'description': '하단 키들을 연습합니다.',
            'content': 'zxcv bnm, asdf jkl; zxcv bnm, zxc vbn zxc vbn mnb vcx zaq',
            'target_keys': 'zxcv bnm,',
            'min_wpm': 20,
            'min_accuracy': 85.0
        },
        
        # 레벨 2: 기본 단어 연습
        {
            'level': 2,
            'title': '기본 단어 연습',
            'description': '간단한 영어 단어들을 연습합니다.',
            'content': 'the and for are but not you all can had her was one our day get use man new now old see way may say each which she how its who oil try ask',
            'target_keys': 'all keys',
            'min_wpm': 25,
            'min_accuracy': 88.0
        },
        {
            'level': 2,
            'title': '일반적인 단어들',
            'description': '자주 사용되는 영어 단어들을 연습합니다.',
            'content': 'time work well good make will come could like what know take year look want give think most over other back after just where much find right',
            'target_keys': 'all keys',
            'min_wpm': 28,
            'min_accuracy': 87.0
        },
        
        # 레벨 3: 문장 연습
        {
            'level': 3,
            'title': '간단한 문장들',
            'description': '기본적인 영어 문장을 연습합니다.',
            'content': 'The quick brown fox jumps over the lazy dog. This is a sample sentence for typing practice. You can do this with practice.',
            'target_keys': 'all keys',
            'min_wpm': 32,
            'min_accuracy': 86.0
        },
        {
            'level': 3,
            'title': '복합 문장 연습',
            'description': '더 복잡한 문장 구조를 연습합니다.',
            'content': 'Learning to type faster requires consistent practice and patience. Many people find that regular typing exercises help improve their speed and accuracy over time.',
            'target_keys': 'all keys',
            'min_wpm': 35,
            'min_accuracy': 85.0
        },
        
        # 레벨 4: 숫자와 특수문자
        {
            'level': 4,
            'title': '숫자 키 연습',
            'description': '숫자 키를 연습합니다.',
            'content': '1234567890 123 456 789 012 1234567890 12345 67890 147 258 369 1024 2048 4096 8192',
            'target_keys': '1234567890',
            'min_wpm': 30,
            'min_accuracy': 87.0
        },
        {
            'level': 4,
            'title': '특수문자 연습',
            'description': '특수문자와 기호를 연습합니다.',
            'content': '!@#$%^&*()_+ {}|:"<>? [],./;\' !@# $%^ &*( )_+ =-[ ]\\ ;\'< >?/. ,',
            'target_keys': 'special chars',
            'min_wpm': 25,
            'min_accuracy': 83.0
        },
        
        # 레벨 5: 고급 연습
        {
            'level': 5,
            'title': '코딩 텍스트 연습',
            'description': '프로그래밍 코드와 유사한 텍스트를 연습합니다.',
            'content': 'function calculateSum(a, b) { return a + b; } const result = calculateSum(10, 20); console.log("Result:", result);',
            'target_keys': 'all keys',
            'min_wpm': 38,
            'min_accuracy': 85.0
        },
        {
            'level': 5,
            'title': '복잡한 문서 연습',
            'description': '실제 문서와 유사한 복잡한 텍스트를 연습합니다.',
            'content': 'In today\'s digital age, the ability to type quickly and accurately has become increasingly important. Whether you\'re writing emails, creating documents, or coding software, typing skills can significantly impact your productivity and efficiency.',
            'target_keys': 'all keys',
            'min_wpm': 42,
            'min_accuracy': 84.0
        }
    ]
    
    for lesson_data in lessons_data:
        lesson = Lesson(**lesson_data)
        db.session.add(lesson)
    
    db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        init_lessons()
    app.run(debug=True, host='0.0.0.0', port=8080)
