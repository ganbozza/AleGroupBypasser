class AleGroupController:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {}}

    RETURN_TYPES = ()
    FUNCTION = "anis"
    CATEGORY = "custom"
       
    def anis(self):
        return ()


NODE_CLASS_MAPPINGS = {
    "AleGroupController": AleGroupController,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AleGroupController": "Ale Group Controller",
}
