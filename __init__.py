# __init__.py

# 1. Define a dummy Python class structure so ComfyUI accepts the node
class AleGroupBypasser:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {}}
    
    RETURN_TYPES = ()
    RETURN_NAMES = ()
    FUNCTION = "noop"
    CATEGORY = "utils"

    def noop(self):
        return ()

# 2. Map the Python backend stub to your exact JS frontend string identifier
NODE_CLASS_MAPPINGS = {
    "AleGroupBypassControllerNode": AleGroupBypasser
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AleGroupBypassController": "Group Toggle Node"
}

# 3. Explicitly tell ComfyUI where your frontend web directory sits
WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
