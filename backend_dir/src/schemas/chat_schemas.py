from pydantic import BaseModel, ConfigDict
from typing import Optional 

class Chat_Base (BaseModel) : 
    message : str