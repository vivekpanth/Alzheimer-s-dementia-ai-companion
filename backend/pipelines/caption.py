# Photo captioning pipeline — combines caregiver descriptions with GPT-4o Vision analysis
import os
import base64
from openai import AsyncOpenAI
from db.supabase_client import store_embedding


async def caption_photos(user_id: str, photo_pairs: list) -> list:
    """For each photo, combine the caregiver's description with GPT-4o Vision caption, then store as a RAG chunk."""
    openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    captions = []

    for pair in photo_pairs:
        photo_bytes = pair["bytes"]
        caregiver_desc = pair.get("description", "")
        b64 = base64.b64encode(photo_bytes).decode("utf-8")

        # Build the prompt — include caregiver description if provided
        if caregiver_desc:
            prompt = (
                f"The caregiver described this photo as: \"{caregiver_desc}\"\n\n"
                "Using this context, describe the photo in 2-3 warm sentences as if helping an elderly person "
                "remember this moment. Include the people, place, and activity mentioned by the caregiver, "
                "plus any additional visual details you can see."
            )
        else:
            prompt = (
                "Describe this photo in 2-3 warm sentences as if talking to an elderly person about their memory. "
                "Include any visible people, places, or activities."
            )

        response = await openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    ],
                }
            ],
            max_tokens=200,
        )
        vision_caption = response.choices[0].message.content

        # Combine caregiver description + vision caption into one rich memory chunk
        if caregiver_desc:
            combined = f"Photo memory: {caregiver_desc}. {vision_caption}"
        else:
            combined = f"Photo memory: {vision_caption}"

        captions.append(combined)

        # Embed and store in Supabase for RAG retrieval
        embedding_response = await openai.embeddings.create(
            model="text-embedding-3-small",
            input=combined,
        )
        embedding = embedding_response.data[0].embedding
        await store_embedding(
            user_id=user_id,
            chunk=combined,
            embedding=embedding,
            metadata={
                "source": "photo_caption",
                "caregiver_description": caregiver_desc,
            },
        )

    return captions
