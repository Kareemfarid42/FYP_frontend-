"""
Compatibility patches for Windows + PyTorch 2.5.1 + Unsloth
MUST be imported BEFORE any torch/transformers/unsloth imports
"""

import sys
import os
from types import ModuleType

print("🔧 Applying compatibility patches...")

# ==================== PATCH 0: Disable torch.compile ====================
import os
os.environ["TORCH_COMPILE_DISABLE"] = "1"
os.environ["TORCHDYNAMO_DISABLE"] = "1"
print("  ✅ torch.compile disabled")

# ==================== PATCH 1: Triton for Windows ====================
try:
    import triton
    for path in ['triton.compiler', 'triton.compiler.compiler', 'triton.backends', 'triton.backends.compiler']:
        if path not in sys.modules:
            sys.modules[path] = ModuleType(path.split('.')[-1])

    from dataclasses import dataclass, field
    
    @dataclass
    class AttrsDescriptor:
        """Proper dataclass mock for Triton compatibility"""
        # Add dummy fields to make it a valid dataclass
        _dummy: str = field(default="mock")
        
        @staticmethod
        def from_dict(*args, **kwargs): 
            return AttrsDescriptor()
        
        def to_dict(self, *args, **kwargs): 
            return {}
        
        def get_property_key(self, *args, **kwargs): 
            return str(args[0]) if args and args[0] is not None else "unknown"
        
        def get_constants(self, *args, **kwargs):
            return {}
        
        def filter_out_constants(self, *args, **kwargs):
            return {}
        
        def hash(self, *args, **kwargs):
            return "mock_triton_hash"
        
        def __hash__(self):
            return hash("mock_triton_hash")
        
        def __eq__(self, other):
            return True
        
        def __getattr__(self, name):
            return lambda *args, **kwargs: None

    import triton.compiler.compiler
    import triton.backends.compiler
    triton.compiler.compiler.AttrsDescriptor = AttrsDescriptor
    triton.backends.compiler.AttrsDescriptor = AttrsDescriptor
    print("  ✅ Triton patched")
except Exception as e:
    print(f"  ⚠️ Triton patch skipped: {e}")

# ==================== PATCH 2: PyTorch int1 for TorchAO ====================
try:
    import torch
    
    # Add missing torch.int1 dtype
    if not hasattr(torch, 'int1'):
        # Create a proper dtype-like object
        class Int1Dtype:
            def __repr__(self):
                return "torch.int1"
            def __str__(self):
                return "torch.int1"
        
        torch.int1 = Int1Dtype()
        print("  ✅ torch.int1 patched")
    
except Exception as e:
    print(f"  ⚠️ torch.int1 patch failed: {e}")

# ==================== PATCH 3: Monkey-patch torchao before import ====================
try:
    # Patch torchao.quantization.quant_primitives BEFORE it gets imported
    import importlib.util
    import types
    
    # Find torchao quant_primitives module file
    torchao_path = importlib.util.find_spec('torchao').origin
    quant_primitives_path = torchao_path.replace('__init__.py', 'quantization/quant_primitives.py')
    
    # Load and patch the module
    if os.path.exists(quant_primitives_path):
        spec = importlib.util.spec_from_file_location(
            "torchao.quantization.quant_primitives",
            quant_primitives_path
        )
        module = importlib.util.module_from_spec(spec)
        
        # Pre-patch torch before executing the module
        import torch
        if not hasattr(torch, 'int1'):
            torch.int1 = torch.int8
        
        sys.modules['torchao.quantization.quant_primitives'] = module
        spec.loader.exec_module(module)
        
        print("  ✅ TorchAO quant_primitives pre-patched")
    
except Exception as e:
    print(f"  ⚠️ TorchAO pre-patch skipped: {e}")

print("✅ All patches applied\n")