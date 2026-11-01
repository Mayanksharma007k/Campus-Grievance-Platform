import json
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

def train():
    with open('data/sample_dataset.json', 'r') as f:
        data = json.load(f)

    texts = [item['text'] for item in data]
    labels = [item['category'] for item in data]

    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
        ('clf', MultinomialNB())
    ])

    pipeline.fit(texts, labels)
    joblib.dump(pipeline, 'grievance_model.pkl')
    print("Model successfully trained and saved to grievance_model.pkl")

if __name__ == '__main__':
    train()
