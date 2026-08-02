class AleGroupBypasser:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": {
                # Ensure backend system recognizes the incoming js connection string
                "boolean_1": ("BOOLEAN", {"default": True}),
            }
        }

    RETURN_TYPES = ()
    RETURN_NAMES = ()
    FUNCTION = "noop"
    CATEGORY = "utils"

    def noop(self):
        return ()


NODE_CLASS_MAPPINGS = {
    "AleGroupBypasser": AleGroupBypasser,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AleGroupBypasser": "Ale Group Bypasser",
}
