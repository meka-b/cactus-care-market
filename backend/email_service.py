"""Resend email sending. Reads key from DB settings with ENV fallback."""
import os
import logging
import resend
from settings_service import get_api_key

logger = logging.getLogger(__name__)
FROM_EMAIL = os.environ.get("RESEND_FROM", "Yeşil Dükkan <onboarding@resend.dev>")


async def _ensure_key(db):
    key = await get_api_key(db, "resend") or os.environ.get("RESEND_API_KEY", "")
    if key:
        resend.api_key = key
    return key


async def _safe_send(db, to: str, subject: str, html: str) -> bool:
    key = await _ensure_key(db)
    if not key:
        logger.warning("Resend key missing; skipping email")
        return False
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False


async def send_welcome_email(db, to: str, name: str) -> bool:
    html = f"""
    <div style="font-family: 'Figtree', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #16A34A; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="margin:0; font-family: 'Space Grotesk', Arial, sans-serif;">Yeşil Dükkan</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #D7E6DA; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #0F1A12;">Hoş geldin, {name}!</h2>
        <p style="color: #2B3A31; line-height: 1.6;">Yeşil Dükkan ailesine katıldığın için teşekkürler.</p>
      </div>
    </div>
    """
    return await _safe_send(db, to, "Yeşil Dükkan'a Hoş Geldin!", html)


async def send_order_confirmation(db, to: str, order: dict) -> bool:
    items_html = "".join([
        f'<tr><td style="padding:8px;border-bottom:1px solid #eee;">{i["name"]}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">{i["quantity"]}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₺{i["price"]:.2f}</td></tr>'
        for i in order.get("items", [])
    ])
    html = f"""
    <div style="font-family: 'Figtree', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #16A34A; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="margin:0;">Yeşil Dükkan</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #D7E6DA; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #0F1A12;">Siparişin Alındı!</h2>
        <p>Sipariş No: <strong>{order.get("id", "")[:8].upper()}</strong></p>
        <table style="width:100%; border-collapse:collapse; margin-top:15px;">
          <thead><tr style="background:#F0FDF4;"><th style="padding:8px;text-align:left;">Ürün</th><th style="padding:8px;">Adet</th><th style="padding:8px;text-align:right;">Fiyat</th></tr></thead>
          <tbody>{items_html}</tbody>
        </table>
        <p style="margin-top:20px;font-size:18px;"><strong>Toplam: ₺{order.get("total", 0):.2f}</strong></p>
      </div>
    </div>
    """
    return await _safe_send(db, to, f"Sipariş Onayı #{order.get('id','')[:8].upper()}", html)
