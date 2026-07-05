import os
from flask import Flask, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from sqlalchemy import text
from flasgger import Swagger

from app.extensions import db, migrate, jwt
from app.routes import register_routes
from app.swagger import swagger_template

load_dotenv()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # JWT config (tokens replace the old session cookie auth)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", app.config["SECRET_KEY"])
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = int(os.getenv("JWT_EXPIRES_SECONDS", 60 * 60 * 24 * 30))  # 30 days

    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    CORS(app, supports_credentials=True, origins=[o.strip() for o in cors_origins.split(",")])
    Swagger(app, template=swagger_template())

    db.init_app(app)
    migrate.init_app(app, db)

    jwt.init_app(app)

    register_routes(app)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "backend"}), 200

    @app.get("/health/db")
    def health_db():
        try:
            with db.engine.connect() as conn:
                result = conn.execute(text("SELECT 1;")).scalar()
            return jsonify({"status": "ok", "service": "db", "result": result}), 200
        except Exception as e:
            return jsonify({"status": "error", "service": "db", "message": str(e)}), 500

    return app
