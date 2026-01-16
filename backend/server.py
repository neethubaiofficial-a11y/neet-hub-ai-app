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


# ==================== Syllabus Progress Routes ====================

@api_router.post("/syllabus/progress")
async def update_syllabus_progress(progress: SyllabusProgress):
    """Update or create syllabus progress"""
    # Find existing progress
    existing = await db.syllabus_progress.find_one({
        "userId": progress.userId,
        "classType": progress.classType,
        "subjectId": progress.subjectId,
        "chapterId": progress.chapterId,
        "topicId": progress.topicId
    })
    
    if existing:
        await db.syllabus_progress.update_one(
            {"id": existing["id"]},
            {"$set": {"status": progress.status, "updatedAt": datetime.utcnow()}}
        )
    else:
        await db.syllabus_progress.insert_one(progress.dict())
    
    return progress

@api_router.get("/syllabus/progress/{user_id}")
async def get_syllabus_progress(user_id: str):
    """Get all syllabus progress for a user"""
    progress = await db.syllabus_progress.find({"userId": user_id}).to_list(1000)
    return progress


# ==================== Pre-generated Questions Routes ====================

@api_router.get("/questions/pregenerated")
async def get_pregenerated_questions(subject: str, chapter: str, count: int = 10):
    """Get pre-generated questions or generate if not available"""
    # Check for existing pre-generated questions
    existing = await db.pregenerated_questions.find_one({
        "subject": subject,
        "chapter": chapter,
        "questionCount": {"$gte": count}
    })
    
    if existing and len(existing.get("questions", [])) >= count:
        return {"questions": existing["questions"][:count]}
    
    # Generate new questions
    try:
        prompt = f"""Generate {count} NEET-level MCQ questions from {subject}, chapter: {chapter}.
        
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
        questions = [Question(**q).dict() for q in questions_data]
        
        # Save to database for future use
        pregenerated = PreGeneratedQuestions(
            subject=subject,
            chapter=chapter,
            questions=questions,
            questionCount=len(questions)
        )
        await db.pregenerated_questions.insert_one(pregenerated.dict())
        
        return {"questions": questions}
        
    except Exception as e:
        logging.error(f"Failed to generate questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate questions")


# ==================== AI Buddy Routes ====================

@api_router.post("/ai/buddy")
async def ai_buddy_chat(userId: str, message: str):
    """AI Buddy - Conversational NEET tutor"""
    try:
        prompt = f"""You are an expert NEET tutor. A student asks: "{message}"

Provide a clear, concise answer:
- If it's a concept question, explain with NCERT reference
- If it's a problem, provide step-by-step solution
- If it's doubt, clarify with examples
- Keep it under 150 words
- Be encouraging and supportive"""

        response = await generate_with_ai(prompt, "You are a friendly NEET tutor helping students prepare for medical entrance exams.")
        
        # Save chat history
        chat = ChatMessage(
            userId=userId,
            message=message,
            response=response
        )
        await db.chat_messages.insert_one(chat.dict())
        
        return {"response": response}
    except Exception as e:
        return {"response": "I'm having trouble processing your question. Could you please rephrase it?"}

@api_router.get("/ai/buddy/history/{user_id}")
async def get_chat_history(user_id: str):
    """Get chat history for AI Buddy"""
    messages = await db.chat_messages.find({"userId": user_id}).sort("createdAt", -1).to_list(50)
    return messages


# ==================== Study Plan Routes ====================

@api_router.post("/study-plan/generate")
async def generate_study_plan(userId: str, dailyHours: int, duration: int, prepLevel: str, weakSubjects: List[str] = []):
    """Generate personalized AI study plan"""
    try:
        weak_text = f"Focus more on: {', '.join(weakSubjects)}" if weakSubjects else ""
        
        prompt = f"""Create a {duration}-day NEET study plan for a {prepLevel} student who can study {dailyHours} hours daily. {weak_text}

Return as JSON:
{{
  "title": "Plan title",
  "dailySchedule": [
    {{
      "day": 1,
      "subjects": ["Physics", "Chemistry", "Biology"],
      "topics": ["Topic 1", "Topic 2"],
      "hours": {dailyHours},
      "goals": ["Goal 1", "Goal 2"]
    }}
  ],
  "weeklyGoals": ["Week goal 1", "Week goal 2"],
  "tips": ["Tip 1", "Tip 2"]
}}

Make it realistic and NCERT-focused."""

        response = await generate_with_ai(prompt, "You are an expert NEET study planner.")
        
        import json
        plan_data = json.loads(response)
        
        study_plan = StudyPlan(
            userId=userId,
            title=plan_data.get("title", f"{duration}-Day NEET Study Plan"),
            duration=duration,
            dailyHours=dailyHours,
            subjects=["Physics", "Chemistry", "Biology"],
            plan=plan_data
        )
        
        await db.study_plans.insert_one(study_plan.dict())
        
        return study_plan
        
    except Exception as e:
        logging.error(f"Failed to generate study plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate study plan")

@api_router.get("/study-plan/{user_id}")
async def get_study_plans(user_id: str):
    """Get all study plans for a user"""
    plans = await db.study_plans.find({"userId": user_id}).sort("createdAt", -1).to_list(10)
    return [StudyPlan(**plan) for plan in plans]


# ==================== Progress Analytics Routes ====================

@api_router.get("/analytics/{user_id}")
async def get_user_analytics(user_id: str):
    """Get comprehensive analytics for user"""
    # Get all practice sessions
    practice_sessions = await db.practice_sessions.find({"userId": user_id}).to_list(1000)
    
    # Get all tests
    tests = await db.mock_tests.find({"userId": user_id}).to_list(1000)
    
    # Calculate stats
    total_questions = sum(s.get("questionsAttempted", 0) for s in practice_sessions)
    total_correct = sum(s.get("questionsCorrect", 0) for s in practice_sessions)
    overall_accuracy = (total_correct / total_questions * 100) if total_questions > 0 else 0
    
    # Subject-wise performance
    subject_stats = {}
    for session in practice_sessions:
        subject = session.get("subject", "Unknown")
        if subject not in subject_stats:
            subject_stats[subject] = {"attempted": 0, "correct": 0}
        subject_stats[subject]["attempted"] += session.get("questionsAttempted", 0)
        subject_stats[subject]["correct"] += session.get("questionsCorrect", 0)
    
    # Calculate subject accuracy
    for subject in subject_stats:
        attempted = subject_stats[subject]["attempted"]
        subject_stats[subject]["accuracy"] = (subject_stats[subject]["correct"] / attempted * 100) if attempted > 0 else 0
    
    # Test performance
    test_scores = [t.get("score", 0) for t in tests]
    avg_test_score = sum(test_scores) / len(test_scores) if test_scores else 0
    
    # Study time
    total_study_time = sum(s.get("timeSpent", 0) for s in practice_sessions) + sum(t.get("timeSpent", 0) for t in tests)
    
    return {
        "totalQuestions": total_questions,
        "totalCorrect": total_correct,
        "overallAccuracy": round(overall_accuracy, 1),
        "subjectStats": subject_stats,
        "testsAttempted": len(tests),
        "avgTestScore": round(avg_test_score, 1),
        "totalStudyTime": total_study_time,
        "studyTimeHours": round(total_study_time / 3600, 1),
        "recentSessions": practice_sessions[-10:],
        "recentTests": tests[-5:]
    }


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
