import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stitch", tags=["Stitch Design System & UI Hub"])


class DesignToken(BaseModel):
    name: str
    value: str
    category: str


class DesignSystemExport(BaseModel):
    system_id: str
    title: str
    theme: str
    tokens: List[DesignToken]
    components: List[Dict[str, Any]]
    device_targets: List[str]


class ScreenGenerateRequest(BaseModel):
    prompt: str
    device_type: Optional[str] = "DESKTOP"


class ScreenGenerateResponse(BaseModel):
    status: str
    prompt: str
    screen_id: str
    preview_url: str
    generated_code_snippet: str


@router.get("/design-system", response_model=DesignSystemExport, summary="Export JIGYASA AI Design System Palette")
def get_stitch_design_system():
    """
    Exports JIGYASA AI's signature glassmorphism design system tokens & component specs for Google Stitch integration.
    """
    tokens = [
        DesignToken(name="Primary Accent", value="#7c3aed", category="color"),
        DesignToken(name="Secondary Accent", value="#38bdf8", category="color"),
        DesignToken(name="Success Emerald", value="#34d399", category="color"),
        DesignToken(name="Warning Amber", value="#fbbf24", category="color"),
        DesignToken(name="Danger Rose", value="#f43f5e", category="color"),
        DesignToken(name="Background Dark", value="#0a0a12", category="color"),
        DesignToken(name="Glass Surface", value="rgba(17, 17, 32, 0.8)", category="glassmorphism"),
        DesignToken(name="Glass Border", value="rgba(255, 255, 255, 0.08)", category="glassmorphism"),
        DesignToken(name="Typography Primary", value="Inter, system-ui, sans-serif", category="typography"),
        DesignToken(name="Typography Code", value="Fira Code, monospace", category="typography"),
    ]

    components = [
        {"name": "GlassPanel", "specs": "Border 1px rgba(255,255,255,0.08), backdrop-filter blur(12px), radius 16px"},
        {"name": "ActionChip", "specs": "Border 1px rgba(255,255,255,0.1), background rgba(255,255,255,0.04), radius 999px"},
        {"name": "GlowButton", "specs": "Linear gradient (135deg, #7c3aed, #6d28d9), box-shadow 0 0 20px rgba(124,58,237,0.4)"},
    ]

    return DesignSystemExport(
        system_id="stitch-ds-jigyasa-v1",
        title="JIGYASA AI Executive Design System",
        theme="Glassmorphism Cyber-Slate",
        tokens=tokens,
        components=components,
        device_targets=["DESKTOP", "TABLET", "MOBILE"],
    )


@router.post("/screens/generate", response_model=ScreenGenerateResponse, summary="Stitch MCP UI Screen Generator Bridge")
def generate_stitch_screen(payload: ScreenGenerateRequest):
    """
    Stitch MCP bridge simulating / forwarding UI screen generation from text prompts.
    """
    logger.info(f"[Stitch] Generating screen for prompt: {payload.prompt}")
    return ScreenGenerateResponse(
        status="generated",
        prompt=payload.prompt,
        screen_id=f"screen-{hash(payload.prompt) & 0xffffff}",
        preview_url="https://stitch.googleapis.com/previews/jigyasa-screen-demo",
        generated_code_snippet=f"<div className='glass-panel'><h2>{payload.prompt}</h2></div>",
    )
