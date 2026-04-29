from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# === YOUR ATLAS CONNECTION STRING ===
MONGO_URL = "mongodb+srv://takudzwanashechigwaya:%40Taku3002@expressdb.0nouyzb.mongodb.net/prototypeConnect?retryWrites=true&w=majority"

client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=10000)
db = client["prototypeConnect"]

users_activity = db["user_activity"]
products = db["products"]
orders = db["orders"]

print("✅ Connected to MongoDB Atlas successfully!")

def get_recommendations(user_id, top_n=8):
    try:
        user_logs = list(users_activity.find(
            {"user_id": user_id, "action": {"$in": ["click", "view", "scroll"]}}
        ).limit(50))

        if not user_logs:
            # Cold start - return popular products
            popular = list(products.find().sort("click_count", -1).limit(top_n))
            return popular

        # Simple recommendation logic
        user_items = {}
        for log in user_logs:
            pid = str(log["product_id"])
            user_items[pid] = user_items.get(pid, 0) + 1

        all_products = list(products.find({}, {"_id": 1, "productName": 1, "price": 1, "imageLink": 1}))
        scores = [(p, user_items.get(str(p["_id"]), 0)) for p in all_products]
        scores.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in scores[:top_n]]

    except Exception as e:
        print("Recommendation error:", e)
        return list(products.find().limit(top_n))

@app.route('/api/recommendations', methods=['GET'])
def recommendations():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"products": []})

    recs = get_recommendations(user_id)
    return jsonify({
        "products": [{
            "_id": str(p["_id"]),
            "productName": p["productName"],
            "price": p["price"],
            "imageLink": p.get("imageLink")
        } for p in recs]
    })

@app.route('/api/log-activity', methods=['POST'])
def log_activity():
    try:
        data = request.json
        users_activity.insert_one({
            "user_id": data["user_id"],
            "product_id": data["product_id"],
            "action": data["action"],
            "timestamp": datetime.utcnow()
        })
        return jsonify({"status": "logged"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)