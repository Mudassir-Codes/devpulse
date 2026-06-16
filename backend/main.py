from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
from sklearn.linear_model import LinearRegression
import numpy as np
from datetime import datetime

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"}


@app.get("/")
def root():
    return {"message": "DevPulse API is running!"}


@app.get("/api/stats")
def get_stats():
    url = f"https://api.github.com/users/{GITHUB_USERNAME}"
    response = requests.get(url, headers=HEADERS)
    user = response.json()
    return {
        "username": user["login"],
        "name": user.get("name", ""),
        "public_repos": user["public_repos"],
        "followers": user["followers"],
        "avatar": user["avatar_url"]
    }


@app.get("/api/commits")
def get_commits():
    url = f"https://api.github.com/users/{GITHUB_USERNAME}/events?per_page=100"
    response = requests.get(url, headers=HEADERS)
    events = response.json()

    commit_data = []
    for event in events:
        if event["type"] == "PushEvent" and "size" in event.get("payload", {}):
            date = event["created_at"][:10]
            num_commits = event["payload"]["size"]
            repo = event["repo"]["name"]
            commit_data.append({
                "date": date,
                "commits": num_commits,
                "repo": repo
            })

    return {"commits": commit_data}


@app.get("/api/predict")
def predict_productivity():
    url = f"https://api.github.com/users/{GITHUB_USERNAME}/events?per_page=100"
    response = requests.get(url, headers=HEADERS)
    events = response.json()

    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_counts = {i: 0 for i in range(7)}

    for event in events:
        if event["type"] == "PushEvent" and "size" in event.get("payload", {}):
            date_str = event["created_at"][:10]
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            day_of_week = date_obj.weekday()
            day_counts[day_of_week] += event["payload"]["size"]

    X = np.array(list(day_counts.keys())).reshape(-1, 1)
    y = np.array(list(day_counts.values()))

    model = LinearRegression()
    model.fit(X, y)
    predictions = model.predict(X)

    result = []
    for i in range(7):
        result.append({
            "day": day_names[i],
            "actual_commits": int(day_counts[i]),
            "predicted_score": round(float(predictions[i]), 2)
        })

    best_day = max(result, key=lambda x: x["actual_commits"])

    if best_day["actual_commits"] == 0:
        insight = "No commits found yet — start coding and your patterns will appear here!"
    else:
        insight = f"You code most on {best_day['day']}s — schedule your hardest tasks then!"

    return {
        "weekly_pattern": result,
        "best_day": best_day["day"],
        "insight": insight
    }