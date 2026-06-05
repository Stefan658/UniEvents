import pytest


def is_valid_usv_student_email(email: str) -> bool:
    """
    Verifică dacă emailul aparține subdomeniului student.usv.ro.
    În proiectul UniEvents, autentificarea studentului se face doar pentru conturi USV.
    """
    return isinstance(email, str) and email.endswith("@student.usv.ro")


def test_valid_student_email():
    email = "stefan@student.usv.ro"

    assert is_valid_usv_student_email(email) is True


def test_invalid_non_usv_email():
    email = "stefan@gmail.com"

    assert is_valid_usv_student_email(email) is False


def test_invalid_empty_email():
    email = ""

    assert is_valid_usv_student_email(email) is False


def test_invalid_none_email():
    email = None

    assert is_valid_usv_student_email(email) is False