from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from database import engine, Base
from routers import users, resources, communications, announcements, tutors

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="KAPEC KNUST API", description="API for the KAPEC KNUST learning platform")

# Configure CORS
origins = [
    "http://localhost:5173", # Vite dev server
    "http://127.0.0.1:5173",
    "https://kapec-knust-36365200818.us-central1.run.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(resources.router)
app.include_router(communications.router)
app.include_router(announcements.router)
app.include_router(tutors.router)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
STATIC_DIR = os.path.join(FRONTEND_DIR, "static")


# Mount static files
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

#@app.get("/")
#def read_root():
#    return {"Status": "App is running on Google Cloud"}

#app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
from create_admin import create_initial_admin # Import your script

@app.on_event("startup")
async def startup_event():
    create_initial_admin()


import uvicorn

#app = FastAPI()
#@app.get("/")
#def read_root():
#    return {"Status": "App is running on Google Cloud"}
@app.get("/")
def read_root():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/admin")
def read_admin():
    return FileResponse(os.path.join(FRONTEND_DIR, "admin.html"))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
    