# CRITICAL: Import patches first
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import patch_imports

import json
import re
import os
import torch

# CRITICAL: Import unsloth BEFORE transformers/peft  
from unsloth import FastLanguageModel
from peft import PeftModel
import google.generativeai as genai
from typing import Dict, Any, Tuple

# Configuration
GEMINI_API_KEY = "AIzaSyCBa1NSK5h3y2JgCFBT8kkflqNEBT1GeOk"#   AIzaSyCcvq2X51D3855uZGFEdH9CzRV8yTUKYYs
genai.configure(api_key=GEMINI_API_KEY)

# ==================== 1. HELPERS & CLEANUP ====================

def clean_t5_output(text: str) -> str:
    """Removes T5 sentinel tokens like <extra_id_0> or <extra_id_1>."""
    text = re.sub(r'<extra_id_\d+>', '', text)
    return text.strip()

def parse_dfa_text(text: str) -> Dict[str, Any]:
    """Parses DFA from the model's text format: start: q0; final: {q2}; transitions: q0,0->q1;..."""
    try:
        # Clean the text
        text = clean_t5_output(text)
        text = text.split('\n')[0]  # Take first line only
        
        # Extract components using regex
        start_match = re.search(r'start:\s*(\w+)', text)
        final_match = re.search(r'final:\s*\{([^}]+)\}', text)
        transitions_match = re.search(r'transitions:\s*(.+?)(?:extra_id|$)', text)
        
        if not (start_match and final_match and transitions_match):
            raise ValueError("Could not parse DFA format")
        
        start_state = start_match.group(1)
        final_states = [s.strip() for s in final_match.group(1).split(',')]
        transitions_text = transitions_match.group(1)
        
        # Parse transitions: q0,0->q1; q0,1->q0; ...
        transitions = []
        states_set = set([start_state] + final_states)
        
        for trans in transitions_text.split(';'):
            trans = trans.strip()
            if not trans or 'extra_id' in trans:
                continue
            match = re.match(r'(\w+),(\w+)->(\w+)', trans)
            if match:
                from_state, symbol, to_state = match.groups()
                states_set.add(from_state)
                states_set.add(to_state)
                transitions.append({
                    "from_state_id": from_state,
                    "to_state_id": to_state,
                    "symbol": symbol
                })
        
        # Build states list
        states = []
        for state_id in sorted(states_set):
            states.append({
                "state_id": state_id,
                "label": state_id,
                "position_x": 200,  # Will be set by Gemini layout
                "position_y": 250,
                "is_initial": (state_id == start_state),
                "is_final": (state_id in final_states)
            })
        
        return {
            "name": "Generated DFA",
            "type": "DFA",
            "description": "DFA generated from text description",
            "states": states,
            "transitions": transitions
        }
    except Exception as e:
        print(f"❌ DFA parsing error: {e}")
        raise ValueError(f"Failed to parse DFA: {e}")

def extract_json(text: str) -> Dict[str, Any]:
    """Extracts JSON object from a string, handling markdown or chat noise."""
    # First try to parse as JSON
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except:
            pass
    
    # If JSON parsing fails, try text format
    return parse_dfa_text(text)

def validate_automata(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures states stay within the 850x550 canvas (Clamping logic)."""
    for state in data.get("states", []):
        # Clamp X to 100-750 and Y to 100-450
        state["position_x"] = max(100, min(750, float(state.get("position_x", 200))))
        state["position_y"] = max(100, min(450, float(state.get("position_y", 250))))
    return data

def _get_sample_automata() -> Dict[str, Any]:
    """Safety fallback if the model or API fails."""
    return {
        "name": "Even 1s (Fallback)",
        "type": "DFA",
        "description": "Fallback: Accepts even number of 1s",
        "states": [
            {"state_id": "q0", "label": "q0", "position_x": 200, "position_y": 250, "is_initial": True, "is_final": True},
            {"state_id": "q1", "label": "q1", "position_x": 550, "position_y": 250, "is_initial": False, "is_final": False}
        ],
        "transitions": [
            {"from_state_id": "q0", "to_state_id": "q1", "symbol": "1"},
            {"from_state_id": "q1", "to_state_id": "q0", "symbol": "1"},
            {"from_state_id": "q0", "to_state_id": "q0", "symbol": "0"},
            {"from_state_id": "q1", "to_state_id": "q1", "symbol": "0"}
        ]
    }

# ==================== 2. GATEKEEPER & REFINER ====================

def refine_user_prompt(user_input: str) -> Tuple[bool, str]:
    """
    Stage 1: Gemini Gatekeeper.
    Refines prompt to the dataset format (e.g., 'odd number of 1s').
    Blocks non-DFA requests with an error message.
    """
    # DEBUG: Print what we received
    print(f"🚪 Gatekeeper: Validating user prompt...")
    print(f"🚪 User input received: '{user_input}'")
    print(f"🚪 User input type: {type(user_input)}")
    print(f"🚪 User input length: {len(user_input)}")
    
    refiner_prompt = f"""
You are an expert DFA Prompt Refiner.
User Input: "{user_input}"

TASK:
1. Determine if this is a request to build a Deterministic Finite Automata (DFA).
2. If YES: Rephrase it into a short mathematical statement matching this style:
   "accepts strings with even 0s", "odd number of 1's", "ends with aba", "contains substring 101".
3. If NO: Return exactly "ERROR: This tool only supports DFA creation. Please describe a binary language (e.g., 'ends with 01')."

REFINED PROMPT:
"""
    
    # DEBUG: Print the full prompt being sent to Gemini
    print(f"🚪 Full prompt being sent to Gemini:")
    print(f"{'='*60}")
    print(refiner_prompt)
    print(f"{'='*60}")
    
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        res = model.generate_content(refiner_prompt)
        text = res.text.strip()
        
        print(f"🚪 Gatekeeper Response: {text}")
        
        if "ERROR:" in text:
            return False, text.replace("ERROR:", "").strip()
        return True, text

    except Exception as e:
        print(f"❌ Gatekeeper Exception: {e}")
        import traceback
        traceback.print_exc()
        return False, "Validation service unavailable."

# ==================== 3. MODEL LOADERS & INFERENCE ====================

def load_local_model():
    base_model_path = r"D:/base_gemma2_2b"
    adapter_path = r"D:/T5_gemma2_model"

    try:
        # Load with Unsloth optimizations
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=base_model_path,
            max_seq_length=512,
            load_in_4bit=True,
            local_files_only=True,
            device_map="cuda:0"
        )

        # Attach adapter
        model = PeftModel.from_pretrained(model, adapter_path)
        
        # Prepare for inference
        FastLanguageModel.for_inference(model)
        
        print("✅ System Ready: Base Model + Local Adapter fully merged.")
        return model, tokenizer
        
    except Exception as e:
        print(f"❌ Model loading failed: {e}")
        raise

def call_local_model_logic(model, tokenizer, refined_prompt: str) -> str:
    """Stage 2: Local Logic Generation (Gemma 2)."""
    prompt = (
        f"### Instruction:\nConvert the FSM description into a DFA structure.\n\n"
        f"### Input:\nfsm description: \"{refined_prompt}\"\n\n"
        f"### Response:\n"
    )
    
    try:
        # Tokenize input
        inputs = tokenizer(
            prompt, 
            return_tensors="pt",
            truncation=True,
            max_length=512
        ).to("cuda")
        
        # Generate with safe parameters
        with torch.inference_mode():
            outputs = model.generate(
                input_ids=inputs["input_ids"],
                attention_mask=inputs.get("attention_mask"),
                max_new_tokens=256,  # Reduced from 512
                temperature=0.1,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                use_cache=True
            )
        
        # Decode output
        decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract response
        raw_response = decoded.split("### Response:")[-1].strip()
        cleaned_response = clean_t5_output(raw_response)
        
        print(f"🧠 Local Model Output: {cleaned_response[:200]}...")
        return cleaned_response
        
    except Exception as e:
        print(f"❌ Generation error: {e}")
        import traceback
        traceback.print_exc()
        raise

# ==================== 4. THE HYBRID PIPELINE ====================

def generate_automata_from_text(request, user_input: str) -> Dict[str, Any]:
    """Coordinates: Gemini Router -> Local Logic -> Gemini Layout."""
    
    # DEBUG: Print what we received in the main function
    print(f"\n{'='*60}")
    print(f"📥 MAIN FUNCTION: generate_automata_from_text called")
    print(f"📥 user_input parameter: '{user_input}'")
    print(f"📥 user_input type: {type(user_input)}")
    print(f"📥 user_input length: {len(user_input)}")
    print(f"{'='*60}\n")
    
    try:
        # Step A: Gemini Gatekeeper & Prompt Normalization
        is_valid, content = refine_user_prompt(user_input)
        if not is_valid:
            raise ValueError(content)
        
        print(content)
        # Clean the refined prompt
        refined = content.replace("REFINED PROMPT:", "").strip()
        print(f"✅ Refined Prompt: {refined}")
        
        # Step B: Check if local model is available
        if not hasattr(request.app.state, 'model') or request.app.state.model is None:
            print("⚠️ Local model not available, falling back to sample")
            return _get_sample_automata()
        
        # Step C: Local Gemma 2 Logic Generation
        logic_text = call_local_model_logic(
            request.app.state.model,
            request.app.state.tokenizer,
            refined
        )
        
        # Step D: Parse the text format into DFA structure
        dfa_data = parse_dfa_text(logic_text)
        
        # Step E: Gemini Visual Layout Calculation
        layout_prompt = f"""
        Assign position_x (100-750) and position_y (100-450) to this DFA for an 850x550 canvas.
        Arrange states in a visually pleasing way with good spacing.
        
        States: {[s['state_id'] for s in dfa_data['states']]}
        Initial state: {[s['state_id'] for s in dfa_data['states'] if s['is_initial']][0]}
        Final states: {[s['state_id'] for s in dfa_data['states'] if s['is_final']]}
        
        Return ONLY a JSON object with this exact structure:
        {{
            "states": [
                {{"state_id": "q0", "position_x": 200, "position_y": 250}},
                {{"state_id": "q1", "position_x": 550, "position_y": 250}}
            ]
        }}
        """
        
        model = genai.GenerativeModel('gemini-flash-latest')
        layout_res = model.generate_content(layout_prompt)
        
        # Step F: Extract positions and merge with DFA data
        try:
            layout_data = extract_json(layout_res.text)
            # Update positions
            for state in dfa_data['states']:
                for layout_state in layout_data.get('states', []):
                    if layout_state['state_id'] == state['state_id']:
                        state['position_x'] = layout_state.get('position_x', 200)
                        state['position_y'] = layout_state.get('position_y', 250)
        except:
            print("⚠️ Layout parsing failed, using default positions")
            # Use default layout
            num_states = len(dfa_data['states'])
            for i, state in enumerate(dfa_data['states']):
                state['position_x'] = 150 + (i * 200)
                state['position_y'] = 250
        
        # Step G: Final validation and clamping
        return validate_automata(dfa_data)
        
    except ValueError as ve:
        return {"error": str(ve), "success": False}
    except Exception as e:
        print(f"⚠️ Hybrid Pipeline Error: {e}")
        import traceback
        traceback.print_exc()
        return _get_sample_automata()