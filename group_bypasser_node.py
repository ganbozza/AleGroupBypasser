class AleGroupBypasser:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {}}

    RETURN_TYPES = ()
    FUNCTION = "execute"
    CATEGORY = "Example"

    def execute(self, **kwargs):
        # 1. Safely extract the boolean state. 
        # It automatically resolves to the wire's value (if connected) 
        # or falls back to the manual widget toggle state (if unconnected).
        is_enabled = kwargs.get("dynamic_bool_input", False)
        
        # 2. Adapt your execution logic directly based on the True/False state
        if is_enabled:
            print("[Backend] Logic running in TRUE mode.")
        else:
            print("[Backend] Logic running in FALSE mode.")
        return ()


NODE_CLASS_MAPPINGS = {
    "AleGroupBypasser": AleGroupBypasser,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AleGroupBypasser": "Ale Group Bypasser",
}
