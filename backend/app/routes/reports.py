from flask import Blueprint, jsonify
from backend.app.services import report_service

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@reports_bp.route("/summary", methods=["GET"])
def get_summary():
    """Returns a summary report of the application's data."""
    try:
        summary = report_service.get_summary_report()
        return jsonify(summary), 200
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@reports_bp.route("/events-by-organizer", methods=["GET"])
def get_events_by_organizer_report_route():
    """Returns a report of events count grouped by organizer."""
    try:
        report = report_service.get_events_by_organizer_report()
        return jsonify(report), 200
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@reports_bp.route("/registrations-by-event", methods=["GET"])
def get_registrations_by_event_report_route():
    """
    Returns a report of registrations grouped by event.
    """
    try:
        report = report_service.get_registrations_by_event_report()
        return jsonify(report), 200
    except Exception:
        return jsonify({"error": "An internal server error occurred"}), 500


@reports_bp.route("/feedback-by-event", methods=["GET"])
def get_feedback_by_event_report_route():
    """
    Returns a report of feedback grouped by event.
    """
    try:
        report = report_service.get_feedback_by_event_report()
        return jsonify(report), 200
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500