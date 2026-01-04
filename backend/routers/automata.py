# backend/routers/automata.py

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
from dependencies import get_current_user
from utils.validation import (
    sanitize_automata_name,
    sanitize_description,
    sanitize_state_label,
    sanitize_automata_symbol,
    validate_position
)
from utils.ai_integration import generate_automata_from_text

router = APIRouter(prefix="/automata", tags=["automata"])


@router.post("/", response_model=schemas.AutomataResponse, status_code=status.HTTP_201_CREATED)
def create_automata(
    automata_data: schemas.AutomataCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create and save a new automaton
    """
    
    # Sanitize automata name and description
    try:
        name = sanitize_automata_name(automata_data.name)
        description = sanitize_description(automata_data.description)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Validate automata type
    if automata_data.type not in ["DFA", "NFA"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Automata type must be DFA or NFA"
        )
    
    # Create automata
    db_automata = models.Automata(
        user_id=current_user.id,
        name=name,
        type=automata_data.type,
        description=description
    )
    db.add(db_automata)
    db.commit()
    db.refresh(db_automata)
    
    # Create states
    for state_data in automata_data.states:
        try:
            label = sanitize_state_label(state_data.label)
            state_id = sanitize_state_label(state_data.state_id)
            position_x, position_y = validate_position(state_data.position_x, state_data.position_y)
        except ValueError as e:
            # Rollback and raise error
            db.delete(db_automata)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid state data: {str(e)}"
            )
        
        db_state = models.State(
            automata_id=db_automata.id,
            state_id=state_id,
            label=label,
            position_x=position_x,
            position_y=position_y,
            is_initial=state_data.is_initial,
            is_final=state_data.is_final
        )
        db.add(db_state)
    
    # Create transitions
    for transition_data in automata_data.transitions:
        try:
            from_state_id = sanitize_state_label(transition_data.from_state_id)
            to_state_id = sanitize_state_label(transition_data.to_state_id)
            symbol = sanitize_automata_symbol(transition_data.symbol)
        except ValueError as e:
            # Rollback and raise error
            db.delete(db_automata)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transition data: {str(e)}"
            )
        
        db_transition = models.Transition(
            automata_id=db_automata.id,
            from_state_id=from_state_id,
            to_state_id=to_state_id,
            symbol=symbol
        )
        db.add(db_transition)
    
    db.commit()
    db.refresh(db_automata)
    
    return db_automata


@router.get("/", response_model=List[schemas.AutomataListItem])
def list_automata(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of all automata for current user
    """
    
    automata_list = db.query(models.Automata).filter(
        models.Automata.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    # Add counts for states and transitions
    result = []
    for automata in automata_list:
        states_count = db.query(models.State).filter(
            models.State.automata_id == automata.id
        ).count()
        
        transitions_count = db.query(models.Transition).filter(
            models.Transition.automata_id == automata.id
        ).count()
        
        result.append({
            "id": automata.id,
            "name": automata.name,
            "type": automata.type,
            "description": automata.description,
            "created_at": automata.created_at,
            "updated_at": automata.updated_at,
            "states_count": states_count,
            "transitions_count": transitions_count
        })
    
    return result


@router.get("/{automata_id}", response_model=schemas.AutomataResponse)
def get_automata(
    automata_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get full automata details by ID
    """
    
    automata = db.query(models.Automata).filter(
        models.Automata.id == automata_id,
        models.Automata.user_id == current_user.id
    ).first()
    
    if not automata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automata not found"
        )
    
    return automata


@router.put("/{automata_id}", response_model=schemas.AutomataResponse)
def update_automata(
    automata_id: int,
    automata_update: schemas.AutomataUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update automata (name, description, states, transitions)
    """
    
    automata = db.query(models.Automata).filter(
        models.Automata.id == automata_id,
        models.Automata.user_id == current_user.id
    ).first()
    
    if not automata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automata not found"
        )
    
    # Update name if provided
    if automata_update.name is not None:
        try:
            automata.name = sanitize_automata_name(automata_update.name)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    # Update description if provided
    if automata_update.description is not None:
        automata.description = sanitize_description(automata_update.description)
    
    # Update states if provided
    if automata_update.states is not None:
        # Delete existing states
        db.query(models.State).filter(models.State.automata_id == automata_id).delete()
        
        # Add new states
        for state_data in automata_update.states:
            try:
                label = sanitize_state_label(state_data.label)
                state_id = sanitize_state_label(state_data.state_id)
                position_x, position_y = validate_position(state_data.position_x, state_data.position_y)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid state data: {str(e)}"
                )
            
            db_state = models.State(
                automata_id=automata_id,
                state_id=state_id,
                label=label,
                position_x=position_x,
                position_y=position_y,
                is_initial=state_data.is_initial,
                is_final=state_data.is_final
            )
            db.add(db_state)
    
    # Update transitions if provided
    if automata_update.transitions is not None:
        # Delete existing transitions
        db.query(models.Transition).filter(models.Transition.automata_id == automata_id).delete()
        
        # Add new transitions
        for transition_data in automata_update.transitions:
            try:
                from_state_id = sanitize_state_label(transition_data.from_state_id)
                to_state_id = sanitize_state_label(transition_data.to_state_id)
                symbol = sanitize_automata_symbol(transition_data.symbol)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid transition data: {str(e)}"
                )
            
            db_transition = models.Transition(
                automata_id=automata_id,
                from_state_id=from_state_id,
                to_state_id=to_state_id,
                symbol=symbol
            )
            db.add(db_transition)
    
    db.commit()
    db.refresh(automata)
    
    return automata


@router.delete("/{automata_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_automata(
    automata_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete automata by ID
    """
    
    automata = db.query(models.Automata).filter(
        models.Automata.id == automata_id,
        models.Automata.user_id == current_user.id
    ).first()
    
    if not automata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automata not found"
        )
    
    db.delete(automata)
    db.commit()
    
    return None

@router.post("/generate")
def generate_automata_preview(
    request: Request, 
    ai_request: schemas.AIGenerateRequest
):
    """
    Generate automata using AI from natural language prompt
    """
    
    # 1. Validation logic (Keep your existing validation)
    if not ai_request.prompt or len(ai_request.prompt.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt must be at least 5 characters"
        )
    #print("🚀 ROUTER: Request received!")
    # ... (Keep your other validations for length and type)

    try:
        print(ai_request.prompt)
        # ✅ THE FIX: Pass 'request' first, then 'ai_request.prompt'
        # Your utility function expects: (request, prompt)
        generated_data = generate_automata_from_text(request, ai_request.prompt)
        #print(f"📦 ROUTER: Data being sent to frontend: {generated_data}")
        # 2. Handle the Gemini Gatekeeper "Out of Scope" case
        if isinstance(generated_data, dict) and generated_data.get("success") == False:
            return generated_data

        # 3. Return the real AI generated data to the frontend
        return generated_data
        
    except Exception as e:
        # Log the error so you can see it in the terminal
        print(f"❌ Generation Error in Router: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate automata: {str(e)}"
        )