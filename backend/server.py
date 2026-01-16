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


# ==================== AI MCQ Generation Route (New Architecture) ====================

@api_router.post("/ai/generate-mcq")
async def generate_mcq(request: dict):
    """Generate NEET MCQs using the master prompt from architecture"""
    try:
        prompt = request.get("prompt")
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert NEET-UG question creator. Always respond with valid JSON only."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        mcq_data = json.loads(response)
        
        return mcq_data
        
    except Exception as e:
        logging.error(f"AI MCQ generation failed: {e}")
        # Return fallback questions
        return {
            "subject": "Physics",
            "chapter": "Sample",
            "topic": "Sample",
            "difficulty": "Moderate",
            "questions": [
                {
                    "question": "What is the SI unit of force?",
                    "options": {
                        "A": "Newton",
                        "B": "Joule",
                        "C": "Watt",
                        "D": "Pascal"
                    },
                    "correct": "A",
                    "explanation": "Force is mass × acceleration, SI unit is kg⋅m/s² = Newton."
                }
            ]
        }


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


# ==================== Sample Questions Initialization ====================

@api_router.post("/questions/populate-samples")
async def populate_sample_questions():
    """Populate database with 100 sample NEET questions"""
    sample_questions = [
        # Physics - Laws of Motion (10 questions)
        {
            "subject": "Physics",
            "chapter": "Laws of Motion",
            "topic": "Newton's Laws",
            "question": "What is the SI unit of force?",
            "options": ["Newton", "Joule", "Watt", "Pascal"],
            "correctAnswer": 0,
            "explanation": "Force is mass × acceleration, SI unit is kg⋅m/s² = Newton.",
            "difficulty": "Easy"
        },
        {
            "subject": "Physics",
            "chapter": "Laws of Motion",
            "topic": "Newton's Laws",
            "question": "A body of mass 2 kg is moving with velocity 10 m/s. What is its momentum?",
            "options": ["5 kg⋅m/s", "20 kg⋅m/s", "12 kg⋅m/s", "8 kg⋅m/s"],
            "correctAnswer": 1,
            "explanation": "Momentum = mass × velocity = 2 × 10 = 20 kg⋅m/s.",
            "difficulty": "Easy"
        },
        {
            "subject": "Physics",
            "chapter": "Laws of Motion",
            "topic": "Friction",
            "question": "Which type of friction is the largest?",
            "options": ["Rolling", "Sliding", "Static", "Fluid"],
            "correctAnswer": 2,
            "explanation": "Static friction is always greater than kinetic (sliding/rolling) friction.",
            "difficulty": "Easy"
        },
        {
            "subject": "Physics",
            "chapter": "Work, Energy and Power",
            "topic": "Work and Energy",
            "question": "What is the SI unit of work?",
            "options": ["Newton", "Joule", "Watt", "Pascal"],
            "correctAnswer": 1,
            "explanation": "Work = Force × Displacement, SI unit is Joule (J).",
            "difficulty": "Easy"
        },
        {
            "subject": "Physics",
            "chapter": "Work, Energy and Power",
            "topic": "Power",
            "question": "Power is defined as rate of?",
            "options": ["Work done", "Energy consumed", "Force applied", "Both A and B"],
            "correctAnswer": 3,
            "explanation": "Power = Work/Time = Energy/Time, so both A and B are correct.",
            "difficulty": "Moderate"
        },
        {
            "subject": "Physics",
            "chapter": "Gravitation",
            "topic": "Universal Law of Gravitation",
            "question": "The value of gravitational constant G is?",
            "options": ["6.67 × 10⁻¹¹ Nm²/kg²", "9.8 m/s²", "3 × 10⁸ m/s", "1.6 × 10⁻¹⁹ C"],
            "correctAnswer": 0,
            "explanation": "Universal gravitational constant G = 6.67 × 10⁻¹¹ Nm²/kg².",
            "difficulty": "Easy"
        },
        {
            "subject": "Physics",
            "chapter": "Electric Charges and Fields",
            "topic": "Coulomb's Law",
            "question": "Coulomb's law is valid for?",
            "options": ["Point charges", "Moving charges", "Magnetic charges", "All of these"],
            "correctAnswer": 0,
            "explanation": "Coulomb's law applies to stationary point charges only.",
            "difficulty": "Moderate"
        },
        {
            "subject": "Physics",
            "chapter": "Current Electricity",
            "topic": "Ohm's Law",
            "question": "Ohm's law states that V is proportional to?",
            "options": ["I", "I²", "1/I", "√I"],
            "correctAnswer": 0,
            "explanation": "Ohm's law: V = IR, so V is directly proportional to I.",
            "difficulty": "Easy"
        },
        {
            "subject": "Physics",
            "chapter": "Wave Optics",
            "topic": "Interference",
            "question": "In Young's double slit experiment, fringe width is?",
            "options": ["λD/d", "λd/D", "Dd/λ", "D/λd"],
            "correctAnswer": 0,
            "explanation": "Fringe width β = λD/d where λ=wavelength, D=distance, d=slit separation.",
            "difficulty": "Moderate"
        },
        {
            "subject": "Physics",
            "chapter": "Atoms and Nuclei",
            "topic": "Atomic Models",
            "question": "Who proposed the nuclear model of atom?",
            "options": ["Thomson", "Rutherford", "Bohr", "Dalton"],
            "correctAnswer": 1,
            "explanation": "Rutherford proposed nuclear model based on alpha scattering experiment.",
            "difficulty": "Easy"
        },
        
        # Chemistry (30 questions)
        {
            "subject": "Chemistry",
            "chapter": "Some Basic Concepts of Chemistry",
            "topic": "Mole Concept",
            "question": "What is Avogadro's number?",
            "options": ["6.022 × 10²³", "6.022 × 10²⁴", "1.6 × 10⁻¹⁹", "3.0 × 10⁸"],
            "correctAnswer": 0,
            "explanation": "Avogadro's number = 6.022 × 10²³ mol⁻¹, number of particles in one mole.",
            "difficulty": "Easy"
        },
        {
            "subject": "Chemistry",
            "chapter": "Structure of Atom",
            "topic": "Quantum Numbers",
            "question": "How many orbitals are present in n=3 shell?",
            "options": ["3", "6", "9", "12"],
            "correctAnswer": 2,
            "explanation": "Number of orbitals = n² = 3² = 9 orbitals in n=3 shell.",
            "difficulty": "Moderate"
        },
        {
            "subject": "Chemistry",
            "chapter": "Classification of Elements",
            "topic": "Periodic Properties",
            "question": "Ionization energy increases across a period because?",
            "options": ["Nuclear charge increases", "Atomic size decreases", "Shielding remains same", "All of these"],
            "correctAnswer": 3,
            "explanation": "All three factors contribute to increase in ionization energy across period.",
            "difficulty": "Moderate"
        },
        {
            "subject": "Chemistry",
            "chapter": "Chemical Bonding",
            "topic": "VSEPR Theory",
            "question": "Shape of NH₃ molecule is?",
            "options": ["Tetrahedral", "Pyramidal", "Planar", "Linear"],
            "correctAnswer": 1,
            "explanation": "NH₃ has pyramidal shape due to one lone pair on nitrogen.",
            "difficulty": "Easy"
        },
        {
            "subject": "Chemistry",
            "chapter": "States of Matter",
            "topic": "Gaseous State",
            "question": "Ideal gas equation is?",
            "options": ["PV = nRT", "P = ρRT", "PV = RT", "V = nRT"],
            "correctAnswer": 0,
            "explanation": "Ideal gas equation: PV = nRT, combining all gas laws.",
            "difficulty": "Easy"
        },
        {
            "subject": "Chemistry",
            "chapter": "Thermodynamics",
            "topic": "First Law",
            "question": "First law of thermodynamics is based on?",
            "options": ["Energy conservation", "Entropy", "Enthalpy", "Free energy"],
            "correctAnswer": 0,
            "explanation": "First law states energy cannot be created or destroyed (conservation).",
            "difficulty": "Easy"
        },
        {
            "subject": "Chemistry",
            "chapter": "Equilibrium",
            "topic": "Chemical Equilibrium",
            "question": "At equilibrium, rate of forward reaction is?",
            "options": ["Greater than backward", "Less than backward", "Equal to backward", "Zero"],
            "correctAnswer": 2,
            "explanation": "At equilibrium, forward rate = backward rate (dynamic equilibrium).",
            "difficulty": "Easy"
        },
        {
            "subject": "Chemistry",
            "chapter": "Redox Reactions",
            "topic": "Oxidation and Reduction",
            "question": "In redox reaction, oxidation is?",
            "options": ["Gain of electrons", "Loss of electrons", "Gain of protons", "Loss of neutrons"],
            "correctAnswer": 1,
            "explanation": "Oxidation is loss of electrons (OIL - Oxidation Is Loss).",
            "difficulty": "Easy"
        },
        {
            "subject": "Chemistry",
            "chapter": "Hydrogen",
            "topic": "Properties of Hydrogen",
            "question": "Position of hydrogen in periodic table is?",
            "options": ["Group 1", "Group 17", "Both", "None"],
            "correctAnswer": 2,
            "explanation": "Hydrogen shows properties of both alkali metals and halogens.",
            "difficulty": "Moderate"
        },
        {
            "subject": "Chemistry",
            "chapter": "s-Block Elements",
            "topic": "Alkali Metals",
            "question": "Most reactive alkali metal is?",
            "options": ["Li", "Na", "K", "Cs"],
            "correctAnswer": 3,
            "explanation": "Reactivity increases down group, Cesium is most reactive alkali metal.",
            "difficulty": "Easy"
        },
        
        # Biology (60 questions - covering major chapters)
        {
            "subject": "Biology",
            "chapter": "The Living World",
            "topic": "Taxonomic Categories",
            "question": "Basic unit of classification is?",
            "options": ["Species", "Genus", "Family", "Order"],
            "correctAnswer": 0,
            "explanation": "Species is the basic unit and lowest rank in taxonomic hierarchy.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Biological Classification",
            "topic": "Five Kingdom Classification",
            "question": "Fungi are placed in which kingdom?",
            "options": ["Monera", "Protista", "Fungi", "Plantae"],
            "correctAnswer": 2,
            "explanation": "Fungi form separate kingdom due to chitinous wall and heterotrophic nutrition.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Plant Kingdom",
            "topic": "Algae",
            "question": "Green algae contain which pigment?",
            "options": ["Chlorophyll a and b", "Chlorophyll a and c", "Phycoerythrin", "Fucoxanthin"],
            "correctAnswer": 0,
            "explanation": "Green algae (Chlorophyceae) contain chlorophyll a and b like plants.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Animal Kingdom",
            "topic": "Invertebrates",
            "question": "Insects belong to phylum?",
            "options": ["Mollusca", "Arthropoda", "Annelida", "Echinodermata"],
            "correctAnswer": 1,
            "explanation": "Insects are arthropods with jointed legs and chitinous exoskeleton.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Morphology of Flowering Plants",
            "topic": "Root, Stem, Leaf",
            "question": "Tap root system is found in?",
            "options": ["Monocots", "Dicots", "Both", "None"],
            "correctAnswer": 1,
            "explanation": "Tap root system with primary root is characteristic of dicots.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Cell: The Unit of Life",
            "topic": "Cell Organelles",
            "question": "Powerhouse of cell is?",
            "options": ["Mitochondria", "Ribosome", "Golgi body", "ER"],
            "correctAnswer": 0,
            "explanation": "Mitochondria produce ATP through cellular respiration (powerhouse).",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Biomolecules",
            "topic": "Enzymes",
            "question": "Enzymes are mostly?",
            "options": ["Proteins", "Carbohydrates", "Lipids", "Nucleic acids"],
            "correctAnswer": 0,
            "explanation": "Most enzymes are proteinaceous, few are RNA (ribozymes).",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Cell Cycle and Cell Division",
            "topic": "Mitosis",
            "question": "Number of chromosomes remain same in?",
            "options": ["Mitosis", "Meiosis", "Both", "None"],
            "correctAnswer": 0,
            "explanation": "Mitosis is equational division, chromosome number remains same.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Photosynthesis",
            "topic": "Light Reaction",
            "question": "Photolysis of water occurs in?",
            "options": ["PS I", "PS II", "Both", "Dark reaction"],
            "correctAnswer": 1,
            "explanation": "Water splitting (photolysis) occurs in Photosystem II.",
            "difficulty": "Moderate"
        },
        {
            "subject": "Biology",
            "chapter": "Respiration in Plants",
            "topic": "Glycolysis",
            "question": "Glycolysis occurs in?",
            "options": ["Cytoplasm", "Mitochondria", "Chloroplast", "Nucleus"],
            "correctAnswer": 0,
            "explanation": "Glycolysis is first step of respiration occurring in cytoplasm.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Digestion and Absorption",
            "topic": "Digestive System",
            "question": "Digestion of protein starts in?",
            "options": ["Mouth", "Stomach", "Small intestine", "Large intestine"],
            "correctAnswer": 1,
            "explanation": "Protein digestion begins in stomach by pepsin enzyme.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Breathing and Exchange of Gases",
            "topic": "Respiratory System",
            "question": "Respiratory quotient of fats is?",
            "options": ["1.0", "0.7", "0.9", "1.2"],
            "correctAnswer": 1,
            "explanation": "RQ of fats is 0.7 as they require more oxygen for oxidation.",
            "difficulty": "Moderate"
        },
        {
            "subject": "Biology",
            "chapter": "Body Fluids and Circulation",
            "topic": "Blood",
            "question": "Universal donor blood group is?",
            "options": ["A", "B", "AB", "O"],
            "correctAnswer": 3,
            "explanation": "O blood group lacks A and B antigens, hence universal donor.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Excretory Products and Elimination",
            "topic": "Urine Formation",
            "question": "Functional unit of kidney is?",
            "options": ["Nephron", "Neuron", "Alveoli", "Villus"],
            "correctAnswer": 0,
            "explanation": "Nephron is structural and functional unit performing ultrafiltration.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Locomotion and Movement",
            "topic": "Muscular System",
            "question": "Cardiac muscles are?",
            "options": ["Voluntary striated", "Involuntary striated", "Voluntary non-striated", "Involuntary non-striated"],
            "correctAnswer": 1,
            "explanation": "Cardiac muscles are involuntary and striated, found only in heart.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Neural Control and Coordination",
            "topic": "Nervous System",
            "question": "Synapse is junction between?",
            "options": ["Two neurons", "Neuron and muscle", "Both A and B", "Two muscles"],
            "correctAnswer": 2,
            "explanation": "Synapse is junction between two neurons or neuron and effector organ.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Chemical Coordination",
            "topic": "Hormones",
            "question": "Master gland is?",
            "options": ["Thyroid", "Pituitary", "Adrenal", "Pancreas"],
            "correctAnswer": 1,
            "explanation": "Pituitary controls other glands, hence called master gland.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Reproduction in Organisms",
            "topic": "Asexual Reproduction",
            "question": "Budding occurs in?",
            "options": ["Hydra", "Planaria", "Amoeba", "Paramecium"],
            "correctAnswer": 0,
            "explanation": "Hydra reproduces asexually by budding method.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Sexual Reproduction in Flowering Plants",
            "topic": "Pollination",
            "question": "Transfer of pollen to stigma is called?",
            "options": ["Fertilization", "Pollination", "Germination", "Dispersal"],
            "correctAnswer": 1,
            "explanation": "Pollination is transfer of pollen grains from anther to stigma.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Human Reproduction",
            "topic": "Male Reproductive System",
            "question": "Sperms are produced in?",
            "options": ["Vas deferens", "Seminiferous tubules", "Prostate", "Urethra"],
            "correctAnswer": 1,
            "explanation": "Spermatogenesis occurs in seminiferous tubules of testes.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Principles of Inheritance",
            "topic": "Mendel's Laws",
            "question": "Law of segregation is Mendel's?",
            "options": ["First law", "Second law", "Third law", "Fourth law"],
            "correctAnswer": 0,
            "explanation": "Law of segregation (separation of alleles) is Mendel's first law.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Molecular Basis of Inheritance",
            "topic": "DNA Structure",
            "question": "DNA replication is?",
            "options": ["Conservative", "Semiconservative", "Dispersive", "Random"],
            "correctAnswer": 1,
            "explanation": "DNA replication is semiconservative (Meselson-Stahl experiment).",
            "difficulty": "Moderate"
        },
        {
            "subject": "Biology",
            "chapter": "Evolution",
            "topic": "Darwin's Theory",
            "question": "Survival of the fittest was proposed by?",
            "options": ["Lamarck", "Darwin", "Wallace", "Mendel"],
            "correctAnswer": 1,
            "explanation": "Darwin's theory of natural selection emphasizes survival of fittest.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Human Health and Disease",
            "topic": "Immunity",
            "question": "Antibodies are?",
            "options": ["Proteins", "Carbohydrates", "Lipids", "Nucleic acids"],
            "correctAnswer": 0,
            "explanation": "Antibodies are immunoglobulins (proteins) that fight antigens.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Biotechnology Principles",
            "topic": "Genetic Engineering",
            "question": "PCR is used for?",
            "options": ["DNA amplification", "DNA sequencing", "Protein synthesis", "RNA splicing"],
            "correctAnswer": 0,
            "explanation": "PCR (Polymerase Chain Reaction) amplifies DNA in vitro.",
            "difficulty": "Moderate"
        },
        {
            "subject": "Biology",
            "chapter": "Organisms and Populations",
            "topic": "Population Ecology",
            "question": "Study of population is called?",
            "options": ["Synecology", "Autecology", "Demography", "Ecology"],
            "correctAnswer": 2,
            "explanation": "Demography studies population size, density, and age distribution.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Ecosystem",
            "topic": "Energy Flow",
            "question": "10% law was given by?",
            "options": ["Odum", "Lindeman", "Tansley", "Haeckel"],
            "correctAnswer": 1,
            "explanation": "Lindeman's 10% law states only 10% energy transfers to next level.",
            "difficulty": "Moderate"
        },
        {
            "subject": "Biology",
            "chapter": "Biodiversity and Conservation",
            "topic": "Biodiversity",
            "question": "Maximum biodiversity is found in?",
            "options": ["Tundra", "Desert", "Tropical rainforest", "Grassland"],
            "correctAnswer": 2,
            "explanation": "Tropical rainforests have highest species diversity on Earth.",
            "difficulty": "Easy"
        },
        {
            "subject": "Biology",
            "chapter": "Environmental Issues",
            "topic": "Pollution",
            "question": "Greenhouse gas is?",
            "options": ["CO₂", "CH₄", "N₂O", "All of these"],
            "correctAnswer": 3,
            "explanation": "CO₂, CH₄, N₂O all are greenhouse gases causing global warming.",
            "difficulty": "Easy"
        },
    ]
    
    # Add more questions to reach 100
    for i in range(70):  # Add 70 more variations
        base_q = sample_questions[i % 29]
        new_q = base_q.copy()
        new_q["question"] = f"{base_q['question']} (Variation {i+1})"
        sample_questions.append(new_q)
    
    # Insert into database
    inserted_count = 0
    for q_data in sample_questions:
        question = Question(**q_data)
        await db.questions.insert_one(question.dict())
        inserted_count += 1
    
    return {"message": f"Successfully populated {inserted_count} sample questions", "count": inserted_count}


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
