import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="SurakshaNet AI Service", version="1.0.0")

SYSTEM_PROMPT = """You are SurakshaNet AI, an emergency safety assistant.
Prioritize preservation of life, verified public alerts, nearby shelters/hospitals/police/fire stations, and clear steps.
Never claim certainty about a route unless official routing confirms it. Tell users to call local emergency services for immediate danger.
Return calm, concise instructions in the user's requested language."""

PLAYBOOKS = {
    "flood": ["Move to higher ground.", "Avoid walking or driving through floodwater.", "Shut off electricity if safe."],
    "earthquake": ["Drop, cover, and hold on.", "Move away from damaged buildings after shaking stops.", "Expect aftershocks."],
    "cyclone": ["Stay indoors away from windows.", "Move to an official cyclone shelter.", "Keep emergency supplies ready."],
    "tsunami": ["Move inland and to higher ground immediately.", "Do not wait for visible waves.", "Follow tsunami authority alerts."],
    "fire": ["Move upwind and away from smoke.", "Cover nose and mouth.", "Call fire emergency services."],
    "riot": ["Avoid crowds and conflict zones.", "Move to a secure public building or police station.", "Share your location."],
    "medical": ["Call emergency medical services.", "Go to the nearest suitable hospital.", "Keep airway and bleeding under control if trained."],
    "weather": ["Monitor official alerts.", "Avoid exposed areas.", "Prepare power, water, medication, and documents."]
}


class Coordinates(BaseModel):
    lat: float
    lng: float


class SafePlace(BaseModel):
    id: str
    name: str
    type: str
    coordinates: Coordinates
    distanceMeters: float
    safetyScore: float
    reasons: list[str] = []


class Alert(BaseModel):
    id: str
    source: str
    title: str
    type: str
    severity: str
    area: str | None = None
    instructions: list[str] | None = None


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    lat: float | None = None
    lng: float | None = None
    alerts: list[Alert] = []
    places: list[SafePlace] = []


class PredictRequest(BaseModel):
    lat: float
    lng: float
    alerts: list[Alert] = []
    places: list[SafePlace] = []


def infer_disaster(message: str, alerts: list[Alert]) -> str:
    text = message.lower()
    for disaster in PLAYBOOKS:
        if disaster in text:
            return disaster
    if alerts:
        return alerts[0].type
    return "weather"


def danger_score(alerts: list[Alert]) -> int:
    weights = {"minor": 15, "moderate": 35, "severe": 65, "extreme": 90}
    if not alerts:
        return 20
    return min(100, max(weights.get(alert.severity, 45) for alert in alerts))


def rank_places(places: list[SafePlace]) -> list[SafePlace]:
    return sorted(places, key=lambda place: (place.safetyScore, -place.distanceMeters), reverse=True)


async def call_llm(req: ChatRequest, disaster: str, ranked: list[SafePlace]) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key)
        context = {
            "active_alerts": [alert.model_dump() for alert in req.alerts[:6]],
            "ranked_safe_places": [place.model_dump() for place in ranked[:5]],
            "playbook": PLAYBOOKS.get(disaster, PLAYBOOKS["weather"])
        }
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Language: {req.language}\nUser: {req.message}\nContext: {context}"}
            ],
            temperature=0.2,
            max_tokens=450
        )
        return completion.choices[0].message.content
    except Exception:
        return None


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "surakshanet-ai"}


@app.post("/chat")
async def chat(req: ChatRequest) -> dict[str, Any]:
    disaster = infer_disaster(req.message, req.alerts)
    ranked = rank_places(req.places)
    best = ranked[0] if ranked else None
    llm_answer = await call_llm(req, disaster, ranked)
    fallback = " ".join(PLAYBOOKS.get(disaster, PLAYBOOKS["weather"]))
    if best:
        fallback = (
            f"Recommended safe place: {best.name} ({best.type}), about {round(best.distanceMeters)} meters away, "
            f"safety score {round(best.safetyScore)}/100. {fallback}"
        )
    return {
        "answer": llm_answer or fallback,
        "disasterType": disaster,
        "dangerScore": danger_score(req.alerts),
        "recommendedPlace": best.model_dump() if best else None,
        "actions": PLAYBOOKS.get(disaster, PLAYBOOKS["weather"]),
        "promptTemplate": SYSTEM_PROMPT
    }


@app.post("/predict")
def predict(req: PredictRequest) -> dict[str, Any]:
    ranked = rank_places(req.places)
    risk = danger_score(req.alerts)
    zones = [
        {
            "placeId": place.id,
            "name": place.name,
            "predictedSafety": max(0, min(100, place.safetyScore - risk * 0.12)),
            "confidence": 0.72,
            "reason": ", ".join(place.reasons[:3])
        }
        for place in ranked[:10]
    ]
    return {"areaDangerScore": risk, "safeZones": zones}
