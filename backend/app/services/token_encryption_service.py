import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings


class TokenEncryptionService:
    def __init__(self) -> None:
        self._fernet = self._build_fernet()

    def _build_fernet(self) -> Fernet | None:
        key = settings.TOKEN_ENCRYPTION_KEY
        if not key:
            return None
        try:
            return Fernet(key.encode() if isinstance(key, str) else key)
        except Exception:
            derived = base64.urlsafe_b64encode(hashlib.sha256(key.encode()).digest())
            return Fernet(derived)

    def encrypt(self, plaintext: str) -> str:
        if not plaintext:
            return plaintext
        if not self._fernet:
            return plaintext
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        if not ciphertext:
            return ciphertext
        if not self._fernet:
            return ciphertext
        try:
            return self._fernet.decrypt(ciphertext.encode()).decode()
        except InvalidToken:
            return ciphertext


token_encryption_service = TokenEncryptionService()
