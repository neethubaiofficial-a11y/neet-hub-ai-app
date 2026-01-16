from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== Models ====================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    prepLevel: str = "class12"  # class11, class12, dropper
    weakAreas: List[str] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str
    prepLevel: str = "class12"

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correctAnswer: int
    explanation: str
    subject: str  # Physics, Chemistry, Biology
    chapter: str
    topic: str
    difficulty: str = "medium"  # easy, medium, hard
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class PracticeSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    subject: str
    chapter: str
    questionsAttempted: int = 0
    questionsCorrect: int = 0
    timeSpent: int = 0  # in seconds
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class MockTest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    testType: str  # full, subject, chapter
    subject: Optional[str] = None
    chapter: Optional[str] = None
    totalQuestions: int
    correctAnswers: int
    score: float
    timeSpent: int  # in seconds
    accuracy: float
    weakChapters: List[str] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class SyllabusProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    classType: str  # class11, class12
    subjectId: str
    chapterId: str
    topicId: str
    status: str  # not_started, in_progress, completed, revision
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class PreGeneratedQuestions(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str
    chapter: str
    questions: List[dict]
    questionCount: int
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class StudyPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    title: str
    duration: int  # days
    dailyHours: int
    subjects: List[str]
    plan: dict  # AI-generated daily plan
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    message: str
    response: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)


# ==================== AI Helper Functions ====================

async def generate_with_ai(prompt: str, system_message: str = "You are an expert NEET exam question creator and tutor.") -> str:
    """Generate content using Emergent LLM"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logging.error(f"AI generation failed: {e}")
        raise HTTPException(status_code=500, detail="AI generation failed")


# ==================== User Routes ====================

@api_router.post("/users", response_model=User)
async def create_user(input: UserCreate):
    """Create a new user"""
    user_dict = input.dict()
    user_obj = User(**user_dict)
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_obj.email})
    if existing_user:
        return User(**existing_user)
    
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)


# ==================== AI Routes ====================

@api_router.get("/ai/motivation")
async def get_daily_motivation():
    """Get AI-generated daily motivation for NEET preparation"""
    try:
        prompt = """Generate a short, powerful motivational message (max 2 sentences) for a NEET aspirant. 
        Focus on: consistency, hard work, NCERT importance, or exam strategy. 
        Make it uplifting and actionable. No emojis."""
        
        motivation = await generate_with_ai(prompt, "You are a motivational NEET mentor.")
        return {"message": motivation.strip()}
    except Exception as e:
        # Fallback motivation
        return {"message": "Success in NEET comes from consistent practice and deep NCERT understanding. Make every question count today!"}


# ==================== Question Routes ====================

@api_router.get("/questions/daily")
async def get_daily_question():
    """Get or generate daily NEET question"""
    try:
        # Check if we have a question for today
        today = datetime.utcnow().date()
        existing_question = await db.daily_questions.find_one({
            "date": {"$gte": datetime.combine(today, datetime.min.time())}
        })
        
        if existing_question:
            return Question(**existing_question['question'])
        
        # Generate new question using AI
        prompt = """Create a NEET-level MCQ question. Return ONLY in this exact JSON format:
{
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Detailed explanation with NCERT reference",
  "subject": "Physics/Chemistry/Biology",
  "chapter": "Chapter name",
  "topic": "Topic name",
  "difficulty": "medium"
}

Make the question from a random important NEET chapter. Use proper medical exam standards."""
        
        response = await generate_with_ai(prompt)
        
        # Parse the response (it should be JSON)
        import json
        try:
            question_data = json.loads(response)
            question = Question(**question_data)
            
            # Save to database
            await db.daily_questions.insert_one({
                "date": datetime.utcnow(),
                "question": question.dict()
            })
            
            return question
        except json.JSONDecodeError:
            # Fallback question if AI response is not valid JSON
            fallback = Question(
                question="What is the SI unit of force?",
                options=["Newton", "Joule", "Watt", "Pascal"],
                correctAnswer=0,
                explanation="Newton is the SI unit of force, named after Sir Isaac Newton. Force = mass × acceleration.",
                subject="Physics",
                chapter="Laws of Motion",
                topic="Force and Newton's Laws",
                difficulty="easy"
            )
            return fallback
            
    except Exception as e:
        logging.error(f"Failed to get daily question: {e}")
        # Return a fallback question
        fallback = Question(
            question="What is the SI unit of force?",
            options=["Newton", "Joule", "Watt", "Pascal"],
            correctAnswer=0,
            explanation="Newton is the SI unit of force, named after Sir Isaac Newton. Force = mass × acceleration.",
            subject="Physics",
            chapter="Laws of Motion",
            topic="Force and Newton's Laws",
            difficulty="easy"
        )
        return fallback


@api_router.post("/questions/generate")
async def generate_questions(subject: str, chapter: str, topic: Optional[str] = None, count: int = 10):
    """Generate practice questions using AI"""
    try:
        topic_text = f"on topic '{topic}'" if topic else ""
        prompt = f"""Generate {count} NEET-level MCQ questions from {subject}, chapter: {chapter} {topic_text}.
        
Return as a JSON array in this exact format:
[
  {{
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation",
    "subject": "{subject}",
    "chapter": "{chapter}",
    "topic": "Topic name",
    "difficulty": "medium"
  }}
]

Important:
- All questions must be NCERT-based
- Include detailed explanations
- Mix difficulty levels
- Return ONLY valid JSON array"""

        response = await generate_with_ai(prompt)
        
        import json
        questions_data = json.loads(response)
        questions = [Question(**q) for q in questions_data]
        
        # Save to database
        for question in questions:
            await db.questions.insert_one(question.dict())
        
        return {"questions": [q.dict() for q in questions]}
        
    except Exception as e:
        logging.error(f"Failed to generate questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate questions")


# ==================== Practice Routes ====================

@api_router.post("/practice/session", response_model=PracticeSession)
async def create_practice_session(session: PracticeSession):
    """Create a new practice session"""
    await db.practice_sessions.insert_one(session.dict())
    return session

@api_router.get("/practice/sessions/{user_id}", response_model=List[PracticeSession])
async def get_user_practice_sessions(user_id: str):
    """Get all practice sessions for a user"""
    sessions = await db.practice_sessions.find({"userId": user_id}).to_list(100)
    return [PracticeSession(**session) for session in sessions]


# ==================== Test Routes ====================

@api_router.post("/tests", response_model=MockTest)
async def create_mock_test(test: MockTest):
    """Create a mock test record"""
    await db.mock_tests.insert_one(test.dict())
    return test

@api_router.get("/tests/{user_id}", response_model=List[MockTest])
async def get_user_tests(user_id: str):
    """Get all mock tests for a user"""
    tests = await db.mock_tests.find({"userId": user_id}).to_list(100)
    return [MockTest(**test) for test in tests]


# ==================== Include Router ====================
app.include_router(api_router)

# ==================== CORS Middleware ====================
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
