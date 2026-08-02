class AleGroupBypasser:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {},
            "optional": {}
        }

    RETURN_TYPES = ()
    FUNCTION = "execute"
    CATEGORY = "utils"

    def execute(self, **kwargs):
        print("Received dynamic inputs:")
        for key, value in kwargs.items():
            if key.startswith("boolean_"):
                print(f"-> {key}: {value} (Type: {type(value)})")
        return ()


NODE_CLASS_MAPPINGS = {
    "AleGroupBypasser": AleGroupBypasser,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AleGroupBypasser": "Ale Group Bypasser",
}
