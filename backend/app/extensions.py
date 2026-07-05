from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, verify_jwt_in_request, get_jwt_identity
from flask_login import AnonymousUserMixin
from flask import g
from werkzeug.local import LocalProxy

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

_anonymous_user = AnonymousUserMixin()


def _load_current_user():
    """Resolve the current user from the JWT in the request (if any).

    Mimics flask_login's `current_user`: returns the User model instance
    when a valid JWT is present, otherwise an AnonymousUserMixin instance
    (which has `.is_authenticated == False`), so existing code that calls
    `current_user.is_authenticated` keeps working unchanged.
    """
    if "current_user" not in g:
        # Imported here to avoid circular imports (models -> extensions)
        from app.models import User

        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            g.current_user = User.query.get(int(user_id)) if user_id else _anonymous_user
        except Exception:
            g.current_user = _anonymous_user

    return g.current_user


current_user = LocalProxy(_load_current_user)
