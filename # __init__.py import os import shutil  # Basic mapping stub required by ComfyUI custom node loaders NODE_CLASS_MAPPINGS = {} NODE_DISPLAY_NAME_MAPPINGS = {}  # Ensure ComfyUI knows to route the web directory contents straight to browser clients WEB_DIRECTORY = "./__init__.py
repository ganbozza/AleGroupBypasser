# __init__.py
import os
import shutil

# Basic mapping stub required by ComfyUI custom node loaders
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

# Ensure ComfyUI knows to route the web directory contents straight to browser clients
WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
