class AleGroupBypasser:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {}}

    RETURN_TYPES = ()
    FUNCTION = "execute"
    CATEGORY = "Example"

    def execute(self, **kwargs):
        return ()


NODE_CLASS_MAPPINGS = {
    "AleGroupBypasser": AleGroupBypasser,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AleGroupBypasser": "Ale Group Bypasser",
}
