from flask import Blueprint
from app.controllers.recipe_controller import (
    create_recipe, update_recipe, delete_recipe, get_recipe, list_recipes,
    add_favorite, remove_favorite, rate_recipe, delete_rating,
)
from app.middlewares.auth import require_role, require_auth

recipes_bp = Blueprint("recipes", __name__, url_prefix="/api/recipes")

recipes_bp.get("")(list_recipes)
recipes_bp.get("/<int:recipe_id>")(get_recipe)

recipes_bp.post("")(require_role("admin")(create_recipe))
recipes_bp.put("/<int:recipe_id>")(require_role("admin")(update_recipe))
recipes_bp.delete("/<int:recipe_id>")(require_role("admin")(delete_recipe))

# Favorites — only regular users
recipes_bp.post("/<int:recipe_id>/favorite")(require_role("user")(add_favorite))
recipes_bp.delete("/<int:recipe_id>/favorite")(require_role("user")(remove_favorite))

# Ratings — only regular users
recipes_bp.post("/<int:recipe_id>/rating")(require_role("user")(rate_recipe))
recipes_bp.delete("/<int:recipe_id>/rating")(require_role("user")(delete_rating))