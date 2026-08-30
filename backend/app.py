from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
from datetime import datetime, timedelta, timezone
import os
import certifi

app = Flask(__name__)
CORS(app)

# ====================== MongoDB Connection ======================
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://takudzwanashechigwaya:%40Taku3002@expressdb.0nouyzb.mongodb.net/prototypeConnect?retryWrites=true&w=majority&appName=expressDB")
client = pymongo.MongoClient(
    MONGO_URL,
    tls=True,
    tlsCAFile=certifi.where()
)
db = client.get_database("prototypeConnect")   # Change if your DB name is different

products_collection = db.products
activity_collection = db.activities   # Make sure this collection exists

# ====================== GLOBAL SIMILARITY CACHE ======================
similarity_matrix = None
product_ids = []

def build_interaction_matrix():
    """Build user-item interaction matrix from activity logs"""
    global similarity_matrix, product_ids

    # Get all activities from last 90 days (recency)
    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    activities = list(activity_collection.find({"timestamp": {"$gte": cutoff}}))

    if not activities:
        return None, []

    # Map product names to indices
    all_products = list(products_collection.find({}, {"productName": 1}))
    product_map = {p["productName"]: idx for idx, p in enumerate(all_products)}
    product_ids = list(product_map.keys())

    n_products = len(product_ids)
    if n_products == 0:
        return None, []

    # Create sparse matrix: rows = users, columns = products
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
    
    # Compute item-item similarity (cosine)
    similarity_matrix = cosine_similarity(interaction_matrix.T)
    return interaction_matrix, product_ids


def cosine_similarity(matrix):
    """Fast cosine similarity for sparse matrix"""
    norm = np.sqrt((matrix.multiply(matrix)).sum(axis=1).A1)
    norm[norm == 0] = 1.0
    matrix = matrix.multiply(1.0 / norm[:, np.newaxis])
    return matrix.dot(matrix.T).toarray()


@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    global similarity_matrix

    user_id = request.args.get('user_id')
    n_recommend = 12

    if not similarity_matrix:
        build_interaction_matrix()

    if not similarity_matrix or len(product_ids) == 0:
        # Fallback: Popular products
        popular = list(products_collection.find().sort("reviewCount", -1).limit(n_recommend))
        return jsonify({"products": popular})

    # Get user's past interactions
    user_activities = list(activity_collection.find({"customerId": user_id}).sort("timestamp", -1).limit(50))
    
    if not user_activities:
        # Cold start - return trending products
        trending = list(products_collection.find().sort("reviewCount", -1).limit(n_recommend))
        return jsonify({"products": trending})

    # Build user preference vector
    user_vector = np.zeros(len(product_ids))
    product_map = {name: idx for idx, name in enumerate(product_ids)}

    for act in user_activities:
        prod_name = act.get("productName") or act.get("productId")
        action = act.get("action", "view")
        if prod_name in product_map:
            weight = {"view": 1, "click": 3, "add-to-cart": 5, "purchase": 10}.get(action, 1)
            # Recency boost
            days_old = (datetime.now(timezone.utc) - act["timestamp"]).days
            recency_factor = max(0.2, 1 - (days_old / 30))
            user_vector[product_map[prod_name]] += weight * recency_factor

    # Get top similar items
    scores = similarity_matrix @ user_vector
    top_indices = np.argsort(scores)[::-1][:n_recommend * 2]  # get more to allow diversity

    recommended_products = []
    seen_categories = set()

    for idx in top_indices:
        prod_name = product_ids[idx]
        product = products_collection.find_one({"productName": prod_name})
        if not product:
            continue
        cat = product.get("category", "")
        if cat in seen_categories and len(recommended_products) > 6:
            continue  # diversity
        seen_categories.add(cat)
        recommended_products.append(product)
        if len(recommended_products) >= n_recommend:
            break

    return jsonify({"products": recommended_products})


# Run the app
if __name__ == '__main__':
    # Build similarity matrix on startup
    build_interaction_matrix()
    print("✅ Advanced Hybrid Recommendation Engine Started")
    app.run(host='0.0.0.0', port=5001, debug=True)