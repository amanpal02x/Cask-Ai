import requests

def generate_feedback(feedback):

    prompt = f"""
    You are a physiotherapy assistant.

    Convert this feedback into a short coaching sentence:

    {feedback}
    """

    try:
        res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            },
            timeout=1
        )
        return res.json()["response"].strip().replace('"', '')
    except Exception:
        if isinstance(feedback, list) and len(feedback) > 0:
            return feedback[0]
        return str(feedback)