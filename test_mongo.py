import pymongo
import certifi

MONGO_URL = "PASTE YOUR MONGODB URI HERE"

try:
    client = pymongo.MongoClient(
        MONGO_URL,
        tls=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )

    print(client.server_info())
    print("Connected!")
except Exception as e:
    print(e)