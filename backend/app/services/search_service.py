import logging
from typing import List, Dict, Any
from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)


class WebSearchService:
    """
    Performs real-time web searches using DuckDuckGo to extract live competitor
    data, pricing pages, market reports, and industry news.
    """

    @staticmethod
    def search_market_signals(company_name: str, industry: str, target_competitors: List[str] = None) -> Dict[str, Any]:
        results = {
            "company_overview": [],
            "competitor_insights": [],
            "pricing_signals": [],
            "industry_trends": []
        }
        
        try:
            with DDGS() as ddgs:
                # 1. Search company overview & positioning
                query_company = f"{company_name} {industry} overview market share features"
                logger.info(f"Executing web crawl: '{query_company}'")
                for r in ddgs.text(query_company, max_results=4):
                    results["company_overview"].append({
                        "title": r.get("title", ""),
                        "snippet": r.get("body", ""),
                        "url": r.get("href", "")
                    })

                # 2. Search competitors
                comp_str = " ".join(target_competitors[:3]) if target_competitors else "competitors alternatives"
                query_comps = f"{company_name} vs {comp_str} comparison market share"
                logger.info(f"Executing web crawl: '{query_comps}'")
                for r in ddgs.text(query_comps, max_results=4):
                    results["competitor_insights"].append({
                        "title": r.get("title", ""),
                        "snippet": r.get("body", ""),
                        "url": r.get("href", "")
                    })

                # 3. Search pricing & business model
                query_pricing = f"{company_name} pricing tiers enterprise plans"
                logger.info(f"Executing web crawl: '{query_pricing}'")
                for r in ddgs.text(query_pricing, max_results=3):
                    results["pricing_signals"].append({
                        "title": r.get("title", ""),
                        "snippet": r.get("body", ""),
                        "url": r.get("href", "")
                    })

                # 4. Search industry trends & market size
                query_trends = f"{industry} market size TAM CAGR trends 2024 2025"
                logger.info(f"Executing web crawl: '{query_trends}'")
                for r in ddgs.text(query_trends, max_results=3):
                    results["industry_trends"].append({
                        "title": r.get("title", ""),
                        "snippet": r.get("body", ""),
                        "url": r.get("href", "")
                    })

        except Exception as e:
            logger.warning(f"Web search crawl encountered an issue ({e}). Continuing with synthesized knowledge.")

        return results
