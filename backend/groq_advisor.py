from groq import Groq

client = Groq(api_key=<API KEY>)

def get_security_advice(repo_name, critical, high, medium, low):
    prompt = f"""
You are a cybersecurity expert reviewing a scan of the GitHub repository: {repo_name}

Scan results:
- Critical: {critical}
- High: {high}
- Medium: {medium}
- Low: {low}

Give direct, practical advice to the developer in 3-4 sentences. No headers, no titles, no bullet points, no numbered lists. Just plain conversational advice on what they should do next based on these results.
"""

    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
    )

    return chat_completion.choices[0].message.content
