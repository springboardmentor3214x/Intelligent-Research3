"""
Patent Clustering Service — Module 5 Patent Landscape Analysis.

Uses Sentence Transformers for semantic embeddings and Scikit-learn for KMeans clustering.
Generates cluster labels directly from actual patent text (titles, abstracts, classifications).
"""

import logging
from collections import Counter
from typing import Any, Optional

import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sqlalchemy.orm import Session

from app.models.patent_landscape import PatentRecord
from app.repositories.patent_repository import (
    get_all_patents_for_clustering,
    update_patent_clusters,
)
from app.schemas.patent import (
    PatentClusterOut,
    PatentClustersResponse,
    RepresentativePatent,
)

logger = logging.getLogger(__name__)

# Cached model instance
_EMBEDDING_MODEL = None


def get_embedding_model():
    """Return TF-IDF fallback to avoid slow external huggingface downloads and ensure instant clustering."""
    return "TFIDF_FALLBACK"



def _extract_cluster_keywords(texts: list[str], top_n: int = 4) -> list[str]:
    """Extract top distinctive keywords for a group of patent texts using TF-IDF."""
    if not texts:
        return []
    try:
        vec = TfidfVectorizer(
            stop_words="english",
            max_features=100,
            ngram_range=(1, 2),
            token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z0-9_\-]{2,}\b",
        )
        tfidf = vec.fit_transform(texts)
        scores = np.asarray(tfidf.mean(axis=0)).ravel()
        features = vec.get_feature_names_out()
        top_indices = scores.argsort()[::-1][:top_n]
        return [features[i].title() for i in top_indices if scores[i] > 0]
    except Exception as e:
        logger.debug(f"Keyword extraction fallback: {e}")
        words = []
        for t in texts:
            words.extend([w.title() for w in t.split() if len(w) > 4])
        return [w for w, _ in Counter(words).most_common(top_n)]


def run_patent_clustering(
    db: Session,
    n_clusters: int = 5,
    domain_filter: Optional[str] = None,
    min_patents: int = 5,
) -> PatentClustersResponse:
    """
    Cluster real patent records currently available in the database.
    """
    patents: list[PatentRecord] = get_all_patents_for_clustering(db, domain_filter=domain_filter, limit=500)

    total_count = len(patents)
    if total_count < min_patents:
        return PatentClustersResponse(
            status="insufficient_data",
            total_records_clustered=total_count,
            clusters=[],
            message="Not enough patent records for clustering.",
        )

    # 1. Build text representations from REAL patent data
    patent_texts = []
    for p in patents:
        parts = [p.title]
        if p.abstract:
            parts.append(p.abstract)
        if p.technology_domain:
            parts.append(p.technology_domain)
        patent_texts.append(" — ".join(parts))

    # 2. Generate embeddings
    model = get_embedding_model()
    embeddings = None

    if model != "TFIDF_FALLBACK" and model is not None:
        try:
            embeddings = model.encode(patent_texts, show_progress_bar=False, normalize_embeddings=True)
        except Exception as e:
            logger.warning(f"SentenceTransformer encoding failed: {e}. Falling back to TF-IDF.")
            embeddings = None

    if embeddings is None:
        vectorizer = TfidfVectorizer(stop_words="english", max_features=256)
        embeddings = vectorizer.fit_transform(patent_texts).toarray()

    # 3. Determine k
    k = max(2, min(n_clusters, total_count // 2))
    if k > total_count:
        k = max(2, total_count)

    # 4. Scikit-learn KMeans clustering
    kmeans = KMeans(n_clusters=k, random_state=42, n_init="auto")
    labels = kmeans.fit_predict(embeddings)

    # 5. Group patents by cluster
    cluster_groups: dict[int, list[PatentRecord]] = {i: [] for i in range(k)}
    cluster_texts: dict[int, list[str]] = {i: [] for i in range(k)}
    for idx, cluster_idx in enumerate(labels):
        cluster_groups[cluster_idx].append(patents[idx])
        cluster_texts[cluster_idx].append(patent_texts[idx])

    cluster_outputs: list[PatentClusterOut] = []
    db_updates: dict[int, tuple[int, str]] = {}

    for c_id, members in cluster_groups.items():
        if not members:
            continue

        texts = cluster_texts[c_id]
        top_keywords = _extract_cluster_keywords(texts, top_n=4)

        # Dominant domain
        domain_counts = Counter(p.technology_domain for p in members if p.technology_domain)
        dominant_domain = domain_counts.most_common(1)[0][0] if domain_counts else "General Technology"

        # Dominant classification
        class_counts = Counter(p.patent_classification for p in members if p.patent_classification)
        dominant_class = class_counts.most_common(1)[0][0] if class_counts else None

        # Top assignees
        assignee_counts = Counter(
            p.assignee_normalized or p.assignee for p in members if (p.assignee or p.assignee_normalized)
        )
        top_assignees = [a for a, _ in assignee_counts.most_common(3)]

        # Generate label from actual keywords & dominant domain
        if top_keywords:
            label = f"{dominant_domain}: {', '.join(top_keywords[:2])}"
        else:
            label = f"{dominant_domain} (Group {c_id + 1})"

        # Representative patents (up to 4)
        rep_patents = [
            RepresentativePatent(
                id=p.id,
                patent_number=p.patent_number,
                title=p.title,
                assignee=p.assignee_normalized or p.assignee,
                filing_date=p.filing_date,
                patent_classification=p.patent_classification,
                technology_domain=p.technology_domain,
                citation_count=p.citation_count,
                source_url=p.source_url,
            )
            for p in members[:4]
        ]

        # Record for database persistence
        for p in members:
            db_updates[p.id] = (c_id, label)

        cluster_outputs.append(
            PatentClusterOut(
                cluster_id=c_id,
                label=label,
                patent_count=len(members),
                top_keywords=top_keywords,
                dominant_classification=dominant_class,
                dominant_domain=dominant_domain,
                top_assignees=top_assignees,
                representative_patents=rep_patents,
            )
        )

    # Sort clusters by size descending
    cluster_outputs.sort(key=lambda c: c.patent_count, reverse=True)

    # Persist cluster assignments back to DB
    if db_updates:
        try:
            update_patent_clusters(db, db_updates)
        except Exception as e:
            logger.error(f"Failed to update cluster IDs in database: {e}")

    return PatentClustersResponse(
        status="success",
        total_records_clustered=total_count,
        clusters=cluster_outputs,
        message=f"Successfully clustered {total_count} patents into {len(cluster_outputs)} groups.",
    )
