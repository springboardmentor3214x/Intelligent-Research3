"""
app/services/semantic_service.py
----------------------------------
Measures similarity between a new research text and a set of existing
research texts. This is the "embeddings / semantic representation" step
in the novelty pipeline.

This version uses TF-IDF + cosine similarity (scikit-learn) - lightweight,
no large model download, runs instantly. It teaches the same concept a
real embedding model uses:

    text -> vector of numbers -> compare vectors with cosine similarity

UPGRADE PATH (matches the project's listed AI stack - Sentence Transformers /
Hugging Face): swap the body of get_similarity() for:

    from sentence_transformers import SentenceTransformer, util
    model = SentenceTransformer('all-MiniLM-L6-v2')
    new_vec = model.encode(new_text)
    existing_vecs = model.encode(existing_texts)
    similarity = float(util.cos_sim(new_vec, existing_vecs).mean())

Everything calling this function only expects a single float back (0..1),
so the upgrade is a drop-in change with no other files affected.
"""

from typing import List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def get_similarity(new_text: str, existing_texts: List[str]) -> Optional[float]:
    """
    Returns the AVERAGE similarity (0..1) between new_text and every text
    in existing_texts. 1 = identical wording, 0 = no shared vocabulary.
    Returns None if there is no reference data to compare against.
    """
    if not existing_texts:
        return None

    corpus = existing_texts + [new_text]
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(corpus)

    new_vector = tfidf_matrix[-1]
    existing_matrix = tfidf_matrix[:-1]

    similarities = cosine_similarity(new_vector, existing_matrix)[0]
    return float(similarities.mean())
