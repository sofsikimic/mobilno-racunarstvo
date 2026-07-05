from flask import request, jsonify
from sqlalchemy.exc import IntegrityError
from sqlalchemy import asc, desc, func

from app.extensions import db, current_user
from app.models import Recipe, RecipeIngredient, Product, RecipeFavorite, RecipeRating

ALLOWED_SORT = {"name"}
ALLOWED_DIR = {"asc", "desc"}


def _validate_ingredient_obj(obj):
    product_id = obj.get("product_id")
    quantity = obj.get("quantity")
    unit = (obj.get("unit") or "").strip()

    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        return None, "product_id must be an integer"

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return None, "quantity must be an integer"

    if quantity <= 0:
        return None, "quantity must be > 0"

    if len(unit) > 50:
        return None, "unit must be at most 50 characters"

    return {"product_id": product_id, "quantity": quantity, "unit": unit}, None


def _recipe_stats(recipe_id, user_id=None):
    """Returns avg_rating, ratings_count, is_favorited, my_rating for a recipe."""
    agg = db.session.query(
        func.avg(RecipeRating.stars).label("avg"),
        func.count(RecipeRating.id).label("cnt"),
    ).filter(RecipeRating.recipe_id == recipe_id).one()

    avg_rating = round(float(agg.avg), 1) if agg.avg else None
    ratings_count = agg.cnt or 0

    is_favorited = False
    my_rating = None

    if user_id:
        fav = RecipeFavorite.query.filter_by(user_id=user_id, recipe_id=recipe_id).first()
        is_favorited = fav is not None
        rating = RecipeRating.query.filter_by(user_id=user_id, recipe_id=recipe_id).first()
        my_rating = rating.stars if rating else None

    return avg_rating, ratings_count, is_favorited, my_rating


def create_recipe():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    description = data.get("description")
    ingredients = data.get("ingredients") or []

    if not name:
        return jsonify({"error": "Name is required."}), 400
    if len(name) > 100:
        return jsonify({"error": "Name must be at most 100 characters."}), 400
    if not isinstance(ingredients, list) or len(ingredients) == 0:
        return jsonify({"error": "Ingredients must be a non-empty array."}), 400

    parsed = []
    for ing in ingredients:
        if not isinstance(ing, dict):
            return jsonify({"error": "Each ingredient must be an object."}), 400
        v, err = _validate_ingredient_obj(ing)
        if err:
            return jsonify({"error": err}), 400
        parsed.append(v)

    product_ids = {p["product_id"] for p in parsed}
    products = Product.query.filter(Product.id.in_(product_ids)).all()
    if len(products) != len(product_ids):
        return jsonify({"error": "One or more products not found."}), 400

    recipe = Recipe(name=name, description=description, creator_id=current_user.id)

    for ing in parsed:
        recipe.ingredients.append(
            RecipeIngredient(product_id=ing["product_id"], quantity=ing["quantity"], unit=ing["unit"])
        )

    db.session.add(recipe)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Recipe name must be unique OR duplicate product in ingredients."}), 409

    return jsonify({
        "message": "Recipe created.",
        "recipe": {
            "id": recipe.id,
            "name": recipe.name,
            "description": recipe.description,
            "creator_id": recipe.creator_id,
            "ingredients": [
                {"id": ri.id, "product_id": ri.product_id, "product_name": ri.product.name,
                 "quantity": ri.quantity, "unit": ri.unit}
                for ri in recipe.ingredients
            ],
        }
    }), 201


def update_recipe(recipe_id: int):
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": "Recipe not found."}), 404

    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Name cannot be empty."}), 400
        if len(name) > 100:
            return jsonify({"error": "Name must be at most 100 characters."}), 400
        recipe.name = name

    if "description" in data:
        recipe.description = data.get("description")

    if "ingredients" in data:
        ingredients = data.get("ingredients") or []
        if not isinstance(ingredients, list) or len(ingredients) == 0:
            return jsonify({"error": "Ingredients must be a non-empty array."}), 400

        parsed = []
        for ing in ingredients:
            v, err = _validate_ingredient_obj(ing)
            if err:
                return jsonify({"error": err}), 400
            parsed.append(v)

        product_ids = {p["product_id"] for p in parsed}
        products = Product.query.filter(Product.id.in_(product_ids)).all()
        if len(products) != len(product_ids):
            return jsonify({"error": "One or more products not found."}), 400

        recipe.ingredients.clear()
        db.session.flush()
        for ing in parsed:
            recipe.ingredients.append(
                RecipeIngredient(product_id=ing["product_id"], quantity=ing["quantity"], unit=ing["unit"])
            )

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Recipe name must be unique OR duplicate product in ingredients."}), 409

    return jsonify({"message": "Recipe updated.", "recipe": {"id": recipe.id, "name": recipe.name, "description": recipe.description}}), 200


def delete_recipe(recipe_id: int):
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": "Recipe not found."}), 404

    db.session.delete(recipe)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Cannot delete recipe — it is used in existing orders."}), 409

    return jsonify({"message": "Recipe deleted."}), 200


def get_recipe(recipe_id: int):
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": "Recipe not found."}), 404

    uid = current_user.id if current_user.is_authenticated else None
    avg_rating, ratings_count, is_favorited, my_rating = _recipe_stats(recipe_id, uid)

    return jsonify({
        "recipe": {
            "id": recipe.id,
            "name": recipe.name,
            "description": recipe.description,
            "creator_id": recipe.creator_id,
            "avg_rating": avg_rating,
            "ratings_count": ratings_count,
            "is_favorited": is_favorited,
            "my_rating": my_rating,
            "ingredients": [
                {"id": ri.id, "product_id": ri.product_id, "product_name": ri.product.name,
                 "quantity": ri.quantity, "unit": ri.unit}
                for ri in recipe.ingredients
            ],
        }
    }), 200


def list_recipes():
    search = (request.args.get("search") or "").strip()
    sort = (request.args.get("sort") or "name").strip().lower()
    direction = (request.args.get("dir") or "asc").strip().lower()
    product_id = request.args.get("productId")
    favorites_only = request.args.get("favoritesOnly") == "1"

    if sort not in ALLOWED_SORT:
        sort = "name"
    if direction not in ALLOWED_DIR:
        direction = "asc"

    q = Recipe.query.outerjoin(RecipeIngredient).outerjoin(Product, Product.id == RecipeIngredient.product_id)

    if product_id:
        try:
            pid = int(product_id)
        except ValueError:
            return jsonify({"error": "productId must be an integer"}), 400
        q = q.filter(RecipeIngredient.product_id == pid)

    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(Recipe.name.ilike(like), Recipe.description.ilike(like), Product.name.ilike(like)))

    if favorites_only and current_user.is_authenticated:
        q = q.join(RecipeFavorite, db.and_(
            RecipeFavorite.recipe_id == Recipe.id,
            RecipeFavorite.user_id == current_user.id,
        ))

    q = q.distinct()
    sort_col = getattr(Recipe, sort)
    q = q.order_by(asc(sort_col) if direction == "asc" else desc(sort_col))
    items = q.all()

    uid = current_user.id if current_user.is_authenticated else None

    # batch load favorites and ratings for current user
    fav_ids = set()
    my_ratings = {}
    if uid:
        favs = RecipeFavorite.query.filter_by(user_id=uid).all()
        fav_ids = {f.recipe_id for f in favs}
        ratings = RecipeRating.query.filter_by(user_id=uid).all()
        my_ratings = {r.recipe_id: r.stars for r in ratings}

    # batch load avg ratings
    agg_rows = db.session.query(
        RecipeRating.recipe_id,
        func.avg(RecipeRating.stars).label("avg"),
        func.count(RecipeRating.id).label("cnt"),
    ).group_by(RecipeRating.recipe_id).all()
    avg_map = {row.recipe_id: (round(float(row.avg), 1), row.cnt) for row in agg_rows}

    result = []
    for r in items:
        avg_rating, ratings_count = avg_map.get(r.id, (None, 0))
        result.append({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "avg_rating": avg_rating,
            "ratings_count": ratings_count,
            "is_favorited": r.id in fav_ids,
            "my_rating": my_ratings.get(r.id),
        })

    return jsonify({"items": result, "count": len(result), "search": search, "sort": sort, "dir": direction}), 200


# ─── FAVORITES ───────────────────────────────────────────────────

def add_favorite(recipe_id: int):
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": "Recipe not found."}), 404

    existing = RecipeFavorite.query.filter_by(user_id=current_user.id, recipe_id=recipe_id).first()
    if existing:
        return jsonify({"message": "Already favorited."}), 200

    fav = RecipeFavorite(user_id=current_user.id, recipe_id=recipe_id)
    db.session.add(fav)
    db.session.commit()
    return jsonify({"message": "Added to favorites."}), 201


def remove_favorite(recipe_id: int):
    fav = RecipeFavorite.query.filter_by(user_id=current_user.id, recipe_id=recipe_id).first()
    if fav:
        db.session.delete(fav)
        db.session.commit()
    return jsonify({"message": "Removed from favorites."}), 200


# ─── RATINGS ─────────────────────────────────────────────────────

def rate_recipe(recipe_id: int):
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": "Recipe not found."}), 404

    data = request.get_json(silent=True) or {}
    try:
        stars = int(data.get("stars"))
    except (TypeError, ValueError):
        return jsonify({"error": "stars must be an integer."}), 400

    if stars < 1 or stars > 5:
        return jsonify({"error": "stars must be between 1 and 5."}), 400

    rating = RecipeRating.query.filter_by(user_id=current_user.id, recipe_id=recipe_id).first()
    if rating:
        rating.stars = stars
    else:
        rating = RecipeRating(user_id=current_user.id, recipe_id=recipe_id, stars=stars)
        db.session.add(rating)

    db.session.commit()

    avg_rating, ratings_count, is_favorited, my_rating = _recipe_stats(recipe_id, current_user.id)

    return jsonify({
        "message": "Rating saved.",
        "avg_rating": avg_rating,
        "ratings_count": ratings_count,
        "my_rating": my_rating,
    }), 200


def delete_rating(recipe_id: int):
    rating = RecipeRating.query.filter_by(user_id=current_user.id, recipe_id=recipe_id).first()
    if not rating:
        return jsonify({"error": "No rating found."}), 404

    db.session.delete(rating)
    db.session.commit()
    return jsonify({"message": "Rating removed."}), 200