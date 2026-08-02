from server import PromptServer

class AleGroupBypasser:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {},
            "optional": { "dynamic_bool_input": ("BOOLEAN", {"default": False}) },
            "hidden": { "unique_id": "UNIQUE_ID" } # Captures node ID
        }

    RETURN_TYPES = ()
    FUNCTION = "execute"
    CATEGORY = "custom"

    # FIX 1: This forces ComfyUI to run the node every single time, bypassing the cache
    @classmethod
    def IS_CHANGED(s, **kwargs):
        return random.random()
        
    def execute(self, unique_id, **kwargs):
        is_enabled = kwargs.get("dynamic_bool_input", False)
        
        print(f"!!! Python executing for node ID: {unique_id} !!!")

        # FIX 2: Send data via PromptServer instance using the api structure
        PromptServer.instance.send_sync("my_custom_node_finished", {
            "node_id": unique_id,
            "resolved_value": is_enabled
        })
        return ()


NODE_CLASS_MAPPINGS = {
    "AleGroupBypasser": AleGroupBypasser,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AleGroupBypasser": "Ale Group Bypasser",
}
