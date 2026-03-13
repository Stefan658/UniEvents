from flask import Blueprint, jsonify

events_bp = Blueprint("events", __name__)

@events_bp.route("/api/events")
def events():
    return jsonify([])