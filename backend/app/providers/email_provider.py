import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from python_http_client.exceptions import HTTPError
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailProvider:

    def send(self, *, to: str, subject: str, html: str) -> None:
        if not settings.SENDGRID_API_KEY:
            raise RuntimeError("SENDGRID_API_KEY is not configured")
        if not settings.SENDGRID_FROM:
            raise RuntimeError("SENDGRID_FROM is not configured")

        message = Mail(
            from_email=settings.SENDGRID_FROM,
            to_emails=to,
            subject=subject,
            html_content=html,
        )
        try:
            response = SendGridAPIClient(settings.SENDGRID_API_KEY).send(message)
        except HTTPError as exc:
            body = exc.body.decode("utf-8", errors="replace") if isinstance(exc.body, bytes) else exc.body
            logger.error(
                "SendGrid error while sending email: status=%s reason=%s body=%s",
                exc.status_code,
                exc.reason,
                body,
            )
            raise
        logger.info(
            "SendGrid accepted email: status=%s subject=%s",
            response.status_code,
            subject,
        )


email_provider = EmailProvider()
