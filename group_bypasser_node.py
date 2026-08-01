class AleGroupBypasser:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {}}

    RETURN_TYPES = ()
    RETURN_NAMES = ()
    FUNCTION = "noop"
    CATEGORY = "utils"

    def noop(self):
        return ()


NODE_CLASS_MAPPINGS = {
    "Ale-Group-Bypasser": AleGroupBypasser,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Ale-Group-Bypasser": "Group Bypasser",
}
