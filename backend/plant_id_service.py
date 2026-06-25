import httpx
import logging
from typing import List

logger = logging.getLogger("plant_id")

API_KEY = "jsgUNceGWpmTJ3tt5DcuzDB01IklNVLk61VBqBXFAbrGjKIlw8"
API_URL = "https://plant.id/api/v3/identification"

async def identify_plant(base64_images: List[str]):
    """
    Calls the Plant.id API v3 to identify a plant and assess its health.
    Returns the parsed JSON response.
    """
    headers = {
        "Api-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "images": base64_images,
        "similar_images": True,
        "health": "all" # Request disease assessment as well
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(API_URL, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Plant.id API error: {e}")
            if hasattr(e, "response") and e.response is not None:
                logger.error(f"Response body: {e.response.text}")
            raise ValueError(f"Plant.id API isteği başarısız oldu: {str(e)}")
