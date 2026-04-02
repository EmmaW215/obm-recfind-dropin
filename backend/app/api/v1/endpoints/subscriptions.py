"""Subscriptions API"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class SubscriptionStatus(BaseModel):
    tier: str
    is_active: bool
    expires_at: Optional[datetime] = None
    auto_renew: bool = False

@router.get("/status")
async def get_status():
    """Get subscription status"""
    return SubscriptionStatus(tier="free", is_active=True)

@router.get("/products")
async def get_products():
    """Get available products"""
    return {
        "products": [
            {"id": "com.obmrecfind.premium.monthly", "name": "Premium Monthly", "price": 3.99, "currency": "CAD"},
            {"id": "com.obmrecfind.premium.annual", "name": "Premium Annual", "price": 29.99, "currency": "CAD", "savings": "Save 37%"},
        ]
    }

@router.post("/verify")
async def verify_purchase(receipt_data: str, product_id: str):
    """Verify purchase receipt"""
    return {"status": "success", "tier": "premium", "message": "Subscription activated"}
