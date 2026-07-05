from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from email_validator import validate_email, EmailNotValidError
from flask_jwt_extended import create_access_token

from app.extensions import db, current_user
from app.models import User


def register():
    """
    Register new user
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [name, email, password]
          properties:
            name: { type: string, example: "Marko" }
            email: { type: string, example: "marko@test.com" }
            password: { type: string, example: "Pass123!" }
            role: { type: string, enum: ["user", "admin"], example: "user" }
    responses:
      201:
        description: Registered successfully
        schema:
          $ref: '#/definitions/AuthResponse'
      400:
        description: Validation error
        schema:
          $ref: '#/definitions/Error'
      409:
        description: Email already exists
        schema:
          $ref: '#/definitions/Error'
    """
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "user").strip().lower()

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required."}), 400

    try:
        validate_email(email)
    except EmailNotValidError:
        return jsonify({"error": "Invalid email address."}), 400

    if role not in {"user", "admin"}:
        role = "user"  

    exists = User.query.filter_by(email=email).first()
    if exists:
        return jsonify({"error": "Email already exists."}), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
    )

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "message": "Registered successfully.",
            "access_token": access_token,
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
        }
    ), 201


def login():
    """
    Login
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [email, password]
          properties:
            email: { type: string, example: "marko@test.com" }
            password: { type: string, example: "Pass123!" }
    responses:
      200:
        description: Logged in
        schema:
          $ref: '#/definitions/AuthResponse'
      400:
        description: Missing fields
        schema:
          $ref: '#/definitions/Error'
      401:
        description: Invalid credentials
        schema:
          $ref: '#/definitions/Error'
    """
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid credentials."}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials."}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "message": "Logged in.",
            "access_token": access_token,
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
        }
    ), 200


def logout():
    """
    Logout
    ---
    tags:
      - Auth
    security:
      - bearerAuth: []
    responses:
      200:
        description: Logged out
        schema:
          type: object
          properties:
            message: { type: string }
    """
    # JWT auth is stateless: there's no server-side session to clear.
    # The client is responsible for discarding its stored access token.
    return jsonify({"message": "Logged out."}), 200


def me():
    """
    Current user (JWT)
    ---
    tags:
      - Auth
    security:
      - bearerAuth: []
    responses:
      200:
        description: Current user or null
        schema:
          $ref: '#/definitions/MeResponse'
    """
    if not current_user.is_authenticated:
        return jsonify({"user": None}), 200

    return jsonify(
        {
            "user": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role,
            }
        }
    ), 200
