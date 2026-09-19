from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
import numpy as np
from scipy.sparse import csr_matrix
from datetime import datetime, timedelta, timezone
import os
import certifi
import functools

app = Flask(__name__)

# Explicit allowlist — never a wildcard. Set this to your real deployed
# frontend domain(s) via env var; comma-separated if you need more than one.
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
CORS(app, origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()])

# ====================== MongoDB Connection ======================
MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL:
    raise RuntimeError("MONGO_URL environment variable must be set — no hardcoded fallback.")

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
if not INTERNAL_API_KEY:
    raise RuntimeError("INTERNAL_API_KEY environment variable must be set.")

client = pymongo.MongoClient(
    MONGO_URL,
    tls=True,
    tlsCAFile=certifi.where()
)
db = client.get_database("prototypeConnect")

products_collection = db.products
activity_collection = db.activities

# ====================== Auth: only the Next.js app may call this ======================
def require_internal_key(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        provided = request.headers.get("X-Internal-Api-Key")
        if not provided or provided != INTERNAL_API_KEY:
            return jsonify({"message": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return wrapper

# ====================== GLOBAL SIMILARITY CACHE ======================
similarity_matrix = None
product_ids = []

def build_interaction_matrix():
    global similarity_matrix, product_ids

    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    activities = list(activity_collection.find({"timestamp": {"$gte": cutoff}}))

    if not activities:
        return None, []

    all_products = list(products_collection.find({}, {"productName": 1}))
    product_map = {p["productName"]: idx for idx, p in enumerate(all_products)}
    product_ids = list(product_map.keys())

    n_products = len(product_ids)
    if n_products == 0:
        return None, []

    user_map = {}
    data, rows, cols = [], [], []

    for act in activities:
        user_id = act.get("customerId")
        product_name = act.get("productName") or act.get("productId")
        action = act.get("action", "view")

        if user_id not in user_map:
            user_map[user_id] = len(user_map)

        if product_name in product_map:
            weight = {"view": 1, "click": 3, "add-to-cart": 5, "purchase": 10}.get(action, 1)
            data.append(weight)
            rows.append(user_map[user_id])
            cols.append(product_map[product_name])

    if not data:
        return None, []

    interaction_matrix = csr_matrix((data, (rows, cols)), shape=(len(user_map), n_products))
    similarity_matrix = cosine_similarity(interaction_matrix.T)
    return interaction_matrix, product_ids


def cosine_similarity(matrix):
    norm = np.sqrt((matrix.multiply(matrix)).sum(axis=1).A1)
    norm[norm == 0] = 1.0
    matrix = matrix.multiply(1.0 / norm[:, np.newaxis])
    return matrix.dot(matrix.T).toarray()


@app.route('/api/recommendations', methods=['GET'])
@require_internal_key
def get_recommendations():
    global similarity_matrix

    # This service is now only reachable by your authenticated Next.js
    # backend (via the internal key above), which is responsible for
    # verifying the real logged-in session and passing the correct
    # user_id through — this endpoint no longer trusts an arbitrary
    # caller-supplied identity on its own.
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"message": "user_id is required"}), 400

    n_recommend = 12

    if not similarity_matrix:
        build_interaction_matrix()

    if similarity_matrix is None or len(product_ids) == 0:
        popular = list(products_collection.find().sort("reviewCount", -1).limit(n_recommend))
        for p in popular:
            p["_id"] = str(p["_id"])
        return jsonify({"products": popular})

    user_activities = list(activity_collection.find({"customerId": user_id}).sort("timestamp", -1).limit(50))

    if not user_activities:
        trending = list(products_collection.find().sort("reviewCount", -1).limit(n_recommend))
        for p in trending:
            p["_id"] = str(p["_id"])
        return jsonify({"products": trending})

    user_vector = np.zeros(len(product_ids))
    product_map = {name: idx for idx, name in enumerate(product_ids)}

    for act in user_activities:
        prod_name = act.get("productName") or act.get("productId")
        action = act.get("action", "view")
        if prod_name in product_map:
            weight = {"view": 1, "click": 3, "add-to-cart": 5, "purchase": 10}.get(action, 1)
            days_old = (datetime.now(timezone.utc) - act["timestamp"]).days
            recency_factor = max(0.2, 1 - (days_old / 30))
            user_vector[product_map[prod_name]] += weight * recency_factor

    scores = similarity_matrix @ user_vector
    top_indices = np.argsort(scores)[::-1][:n_recommend * 2]

    recommended_products = []
    seen_categories = set()

    for idx in top_indices:
        prod_name = product_ids[idx]
        product = products_collection.find_one({"productName": prod_name})
        if not product:
            continue
        cat = product.get("category", "")
        if cat in seen_categories and len(recommended_products) > 6:
            continue
        seen_categories.add(cat)
        product["_id"] = str(product["_id"])
        recommended_products.append(product)
        if len(recommended_products) >= n_recommend:
            break

    return jsonify({"products": recommended_products})


if __name__ == '__main__':
    build_interaction_matrix()
    print("Recommendation engine ready.")
    # Never run the Flask dev server in production. Deploy this behind
    # Gunicorn instead, e.g.:
    #   gunicorn -w 2 -b 0.0.0.0:5001 app:app
    # and place it on a private network unreachable from the public
    # internet — only your Next.js backend should ever reach it.
    app.run(host='127.0.0.1', port=5001, debug=False)