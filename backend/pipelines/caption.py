# Photo captioning pipeline — uses GPT-4o Vision to caption uploaded patient photos
import os
import base64
from openai import AsyncOpenAI
from db.supabase_client import store_embedding


async def caption_photos(user_id: str, photo_files: list) -> list:
    """Send photos to GPT-4o Vision, generate descriptive captions, and store results in Supabase."""
    openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    captions = []

    for photo_bytes in photo_files:
        b64 = base64.b64encode(photo_bytes).decode("utf-8")
        response = await openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe this photo in 2-3 warm sentences as if talking to an elderly person about their memory. Include any visible people, places, or activities.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                        },
                    ],
                }
            ],
            max_tokens=150,
        )
        caption = response.choices[0].message.content
        captions.append(caption)

        # Store caption as a biography chunk for RAG
        embedding_response = await openai.embeddings.create(
            model="text-embedding-3-small",
            input=caption,
        )
        embedding = embedding_response.data[0].embedding
        await store_embedding(
            user_id=user_id,
            chunk=caption,
            embedding=embedding,
            metadata={"source": "photo_caption"},
        )

    return captions
