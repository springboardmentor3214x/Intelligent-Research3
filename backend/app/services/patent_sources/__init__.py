from app.services.patent_sources.base import BasePatentSourceClient
from app.services.patent_sources.lens_client import LensPatentClient
from app.services.patent_sources.normalizer import (
    normalize_lens_record,
    normalize_serpapi_record,
    normalize_uspto_record,
)
from app.services.patent_sources.serpapi_client import SerpApiGooglePatentsClient
from app.services.patent_sources.uspto_client import USPTOPatentClient

__all__ = [
    "BasePatentSourceClient",
    "SerpApiGooglePatentsClient",
    "USPTOPatentClient",
    "LensPatentClient",
    "normalize_serpapi_record",
    "normalize_uspto_record",
    "normalize_lens_record",
]
