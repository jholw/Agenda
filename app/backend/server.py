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
from datetime import datetime, date
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ...existing code...
# Conexão MongoDB
mongo_url = os.getenv('MONGO_URL')
db_name = os.getenv('DB_NAME')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Crie o aplicativo principal sem um prefixo
app = FastAPI()

# Crie um roteador com o prefixo /api
api_router = APIRouter(prefix="/api")

# Enumeracao
class TaskStatus(str, Enum):
    TODO = "todo"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class ProjectStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"

# Modelos
class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[date] = None
    estimated_time: Optional[int] = None  # in minutes
    tags: List[str] = []
    project_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[date] = None
    estimated_time: Optional[int] = None
    tags: List[str] = []
    project_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[date] = None
    estimated_time: Optional[int] = None
    tags: Optional[List[str]] = None
    project_id: Optional[str] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None

# Tarefas das Rotas
@api_router.get("/test-db")
async def test_db():
    try:
        # Tenta listar os bancos disponíveis
        dbs = await client.list_database_names()
        return {"success": True, "databases": dbs}
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(status: Optional[TaskStatus] = None, project_id: Optional[str] = None):
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    if project_id:
        filter_dict["project_id"] = project_id
    
    tasks = await db.tasks.find(filter_dict).to_list(1000)
    return [Task(**task) for task in tasks]

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**task)

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate):
    task = Task(**task_data.dict())
    await db.tasks.insert_one(task.dict())
    return task

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: TaskUpdate):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    updated_task = await db.tasks.find_one({"id": task_id})
    return Task(**updated_task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# Rotas do Projeto
@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find().to_list(1000)
    return [Project(**project) for project in projects]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**project)

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate):
    project = Project(**project_data.dict())
    await db.projects.insert_one(project.dict())
    return project

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_data: ProjectUpdate):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {k: v for k, v in project_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    updated_project = await db.projects.find_one({"id": project_id})
    return Project(**updated_project)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

# estatisticas de rotas
@api_router.get("/stats")
async def get_stats():
    total_tasks = await db.tasks.count_documents({})
    todo_tasks = await db.tasks.count_documents({"status": TaskStatus.TODO})
    scheduled_tasks = await db.tasks.count_documents({"status": TaskStatus.SCHEDULED})
    completed_tasks = await db.tasks.count_documents({"status": TaskStatus.COMPLETED})
    
    high_priority = await db.tasks.count_documents({"priority": TaskPriority.HIGH})
    overdue_tasks = await db.tasks.count_documents({
        "due_date": {"$lt": datetime.utcnow().date()},
        "status": {"$ne": TaskStatus.COMPLETED}
    })
    
    total_projects = await db.projects.count_documents({})
    active_projects = await db.projects.count_documents({"status": ProjectStatus.ACTIVE})
    
    return {
        "total_tasks": total_tasks,
        "todo_tasks": todo_tasks,
        "scheduled_tasks": scheduled_tasks,
        "completed_tasks": completed_tasks,
        "high_priority_tasks": high_priority,
        "overdue_tasks": overdue_tasks,
        "total_projects": total_projects,
        "active_projects": active_projects
    }

# Root route
@api_router.get("/")
async def root():
    return {"message": "Task Management API"}

# Incluir o roteador no aplicativo principal
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar o registro em log
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()