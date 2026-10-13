"""
FastAPI Router for Research Discovery & Innovation Copilot
Provides unified endpoints for conversational exploration, literature analysis,
gap matrix formulation, idea selection, and research project planning.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.copilot import CopilotSession, CopilotMessage, CopilotIdea, CopilotProjectPlan
from app.schemas.copilot import (
    CopilotSessionCreate,
    CopilotSessionOut,
    CopilotMessageOut,
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotIdeaOut,
    CopilotSelectIdeaRequest,
    CopilotProjectPlanOut,
)
from app.services.copilot_service import copilot_service

router = APIRouter(prefix="/api/copilot", tags=["innovation-copilot"])


def get_current_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Extract authenticated user identifier from headers or default to demo user."""
    if not x_user_id:
        return "demo-user-eval-01"
    return x_user_id


@router.post("/sessions", response_model=CopilotSessionOut, status_code=status.HTTP_201_CREATED)
async def create_copilot_session(
    payload: CopilotSessionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Initialize a new Research Discovery session.
    Explains domain foundations and concepts (Stage 1) automatically based on user knowledge level.
    """
    session = await copilot_service.create_session(
        db=db,
        user_id=user_id,
        topic=payload.topic,
        title=payload.title,
        domain=payload.domain or "Artificial Intelligence",
        user_level=payload.user_level or "Beginner",
        skills=payload.skills,
        resources=payload.resources,
    )
    # Refresh to load messages and relationships
    db.refresh(session)
    msg_count = db.query(CopilotMessage).filter(CopilotMessage.session_id == session.id).count()

    return CopilotSessionOut(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        topic=session.topic,
        domain=session.domain,
        user_level=session.user_level,
        skills=session.skills or [],
        resources=session.resources or {},
        current_stage=session.current_stage,
        selected_idea_id=session.selected_idea_id,
        created_at=session.created_at,
        updated_at=session.updated_at,
        ideas=[CopilotIdeaOut.model_validate(i) for i in session.ideas],
        plans=[CopilotProjectPlanOut.model_validate(p) for p in session.plans],
        message_count=msg_count,
    )


@router.get("/sessions", response_model=List[CopilotSessionOut])
def list_copilot_sessions(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Retrieve all persisted copilot sessions for the authenticated user."""
    sessions = (
        db.query(CopilotSession)
        .filter(CopilotSession.user_id == user_id)
        .order_by(CopilotSession.updated_at.desc())
        .all()
    )

    out = []
    for s in sessions:
        msg_count = db.query(CopilotMessage).filter(CopilotMessage.session_id == s.id).count()
        out.append(
            CopilotSessionOut(
                id=s.id,
                user_id=s.user_id,
                title=s.title,
                topic=s.topic,
                domain=s.domain,
                user_level=s.user_level,
                skills=s.skills or [],
                resources=s.resources or {},
                current_stage=s.current_stage,
                selected_idea_id=s.selected_idea_id,
                created_at=s.created_at,
                updated_at=s.updated_at,
                ideas=[CopilotIdeaOut.model_validate(i) for i in s.ideas],
                plans=[CopilotProjectPlanOut.model_validate(p) for p in s.plans],
                message_count=msg_count,
            )
        )
    return out


@router.get("/sessions/{session_id}")
def get_copilot_session_details(
    session_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Retrieve full session details, including complete conversational history,
    retrieved papers, candidate ideas, and generated research plans.
    """
    session = db.query(CopilotSession).filter(CopilotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Copilot session not found")

    messages = (
        db.query(CopilotMessage)
        .filter(CopilotMessage.session_id == session_id)
        .order_by(CopilotMessage.created_at.asc())
        .all()
    )
    ideas = db.query(CopilotIdea).filter(CopilotIdea.session_id == session_id).all()
    plans = db.query(CopilotProjectPlan).filter(CopilotProjectPlan.session_id == session_id).all()

    return {
        "session": CopilotSessionOut(
            id=session.id,
            user_id=session.user_id,
            title=session.title,
            topic=session.topic,
            domain=session.domain,
            user_level=session.user_level,
            skills=session.skills or [],
            resources=session.resources or {},
            current_stage=session.current_stage,
            selected_idea_id=session.selected_idea_id,
            created_at=session.created_at,
            updated_at=session.updated_at,
            ideas=[CopilotIdeaOut.model_validate(i) for i in ideas],
            plans=[CopilotProjectPlanOut.model_validate(p) for p in plans],
            message_count=len(messages),
        ),
        "messages": [CopilotMessageOut.model_validate(m) for m in messages],
        "ideas": [CopilotIdeaOut.model_validate(i) for i in ideas],
        "plans": [CopilotProjectPlanOut.model_validate(p) for p in plans],
    }


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_copilot_session(
    session_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Permanently delete a copilot session and its conversation records."""
    session = db.query(CopilotSession).filter(CopilotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Copilot session not found")

    db.delete(session)
    db.commit()
    return None


@router.post("/chat", response_model=CopilotChatResponse)
async def chat_with_copilot(
    payload: CopilotChatRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Main Conversational Interface.
    Sends prompt to the Copilot, retrieves real scientific papers, formulates gap analysis,
    evaluates candidate ideas, or updates research blueprints in one continuous journey.
    """
    session = None
    if payload.session_id:
        session = db.query(CopilotSession).filter(CopilotSession.id == payload.session_id).first()

    if not session:
        # Create a new session automatically if not provided
        session = await copilot_service.create_session(
            db=db,
            user_id=user_id,
            topic=payload.message[:80],
            domain="Artificial Intelligence",
            user_level=payload.user_level or "Beginner",
            skills=payload.skills,
            resources=payload.resources,
        )

    res = await copilot_service.process_chat(
        db=db,
        session=session,
        user_message=payload.message,
        requested_stage=payload.stage,
        user_level=payload.user_level,
        skills=payload.skills,
        resources=payload.resources,
    )

    return CopilotChatResponse(
        session_id=res["session_id"],
        message=res["message"],
        stage=res["stage"],
        structured_data=res.get("structured_data"),
        follow_up_suggestions=res.get("follow_up_suggestions", []),
    )


@router.post("/sessions/{session_id}/select-idea", response_model=CopilotProjectPlanOut)
async def select_candidate_idea(
    session_id: str,
    payload: CopilotSelectIdeaRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Selects one recommended research idea and triggers the generation of the
    complete, structured research blueprint (Stage 5).
    """
    try:
        plan = await copilot_service.select_idea_and_generate_plan(
            db=db,
            session_id=session_id,
            idea_id=payload.idea_id,
        )
        return CopilotProjectPlanOut.model_validate(plan)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions/{session_id}/export")
def export_copilot_session(
    session_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Export complete research journey for Module 11 Reports & Export aggregation."""
    export_data = copilot_service.get_session_export_data(db, session_id)
    if not export_data:
        raise HTTPException(status_code=404, detail="Copilot session not found")
    return export_data
