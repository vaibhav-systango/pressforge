import html
from app.core.constants.invitation_constants import INVITATION_EXPIRY_DAYS


def invitation_email(*, org_name: str, full_name: str, email: str, accept_link: str) -> dict:
    escaped_org_name = html.escape(org_name)
    escaped_full_name = html.escape(full_name)
    escaped_email = html.escape(email)
    escaped_accept_link = html.escape(accept_link, quote=True)

    subject = f"Invite: Join PressForge portal for {escaped_org_name}"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to PressForge</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0c10; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #12131a; border: 1px solid #222530; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.45);">
              <!-- Top Accent Bar -->
              <tr>
                <td style="background: linear-gradient(90deg, #E1306C, #C13584); height: 6px;"></td>
              </tr>
              
              <!-- Logo Header -->
              <tr>
                <td align="center" style="padding: 30px 40px 10px 40px;">
                  <span style="font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #ffffff;">PRESSFORGE<span style="color: #E1306C;">.AI</span></span>
                </td>
              </tr>
              
              <!-- Content Body -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-align: center;">Welcome to your Portal</h2>
                  <p style="color: #a0a5b5; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                    Hi <strong>{escaped_full_name}</strong>, you have been invited to join the client portal for <strong>{escaped_org_name}</strong> on PressForge to review content briefs and manage approvals.
                  </p>
                  
                  <!-- Sleek User Info Box -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1c26; border-radius: 12px; border: 1px solid #2a2e3d; margin-bottom: 28px;">
                    <tr>
                      <td style="padding: 16px; text-align: center;">
                        <span style="color: #7a8099; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Login Email Address</span>
                        <strong style="color: #ffffff; font-size: 15px; word-break: break-all;">{escaped_email}</strong>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Call to Action Button -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="{escaped_accept_link}" target="_blank" style="background: #E1306C; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 700; border-radius: 25px; display: inline-block; box-shadow: 0 4px 15px rgba(225, 48, 108, 0.4); transition: transform 0.2s;">
                          Accept Invitation
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Secondary text / Expire warning -->
                  <p style="color: #6a6f80; font-size: 12px; line-height: 1.5; margin-top: 32px; text-align: center; margin-bottom: 0;">
                    For security reasons, this invitation link will expire in {INVITATION_EXPIRY_DAYS} days.<br>
                    If you did not expect this invitation, please ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #0d0e14; padding: 20px 40px; border-top: 1px solid #1c1e29;">
                  <p style="color: #535661; font-size: 11px; margin: 0;">
                    &copy; 2026 PressForge.ai. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    return {"subject": subject, "html": html_content}


def password_reset_email(*, full_name: str, code: str, expires_in_minutes: int = 15) -> dict:
    escaped_full_name = html.escape(full_name)
    escaped_code = html.escape(code)

    subject = "Reset your PressForge password"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your PressForge password</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0c10; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #12131a; border: 1px solid #222530; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.45);">
              <!-- Top Accent Bar -->
              <tr>
                <td style="background: linear-gradient(90deg, #E1306C, #C13584); height: 6px;"></td>
              </tr>
              
              <!-- Logo Header -->
              <tr>
                <td align="center" style="padding: 30px 40px 10px 40px;">
                  <span style="font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #ffffff;">PRESSFORGE<span style="color: #E1306C;">.AI</span></span>
                </td>
              </tr>
              
              <!-- Content Body -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-align: center;">Reset your Password</h2>
                  <p style="color: #a0a5b5; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                    Hi <strong>{escaped_full_name}</strong>, you requested to reset your password. Use the verification code below to complete the process.
                  </p>
                  
                  <!-- Code Box -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1c26; border-radius: 12px; border: 1px solid #2a2e3d; margin-bottom: 28px;">
                    <tr>
                      <td style="padding: 24px; text-align: center;">
                        <span style="color: #7a8099; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Verification Code</span>
                        <strong style="color: #E1306C; font-size: 32px; font-family: monospace; letter-spacing: 6px; display: inline-block;">{escaped_code}</strong>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Secondary text / Expire warning -->
                  <p style="color: #6a6f80; font-size: 12px; line-height: 1.5; margin-top: 24px; text-align: center; margin-bottom: 0;">
                    This code will expire in {expires_in_minutes} minutes.<br>
                    If you did not request a password reset, please ignore this email or contact support if you have concerns.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #0d0e14; padding: 20px 40px; border-top: 1px solid #1c1e29;">
                  <p style="color: #535661; font-size: 11px; margin: 0;">
                    &copy; 2026 PressForge.ai. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    return {"subject": subject, "html": html_content}


def draft_preview_email(
    *,
    client_name: str,
    workspace_name: str,
    post_caption: str,
    post_platforms: str,
    post_image_brief: str | None = None,
    review_link: str
) -> dict:
    escaped_client_name = html.escape(client_name)
    escaped_workspace_name = html.escape(workspace_name)
    escaped_caption = html.escape(post_caption)
    escaped_platforms = html.escape(post_platforms.replace("_", " ").capitalize())
    escaped_image_brief = html.escape(post_image_brief or "") if post_image_brief else None
    escaped_review_link = html.escape(review_link, quote=True)

    subject = f"New Content Draft Available for {escaped_workspace_name}"
    
    image_brief_html = ""
    if escaped_image_brief:
        image_brief_html = f"""
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1c26; border-radius: 12px; border: 1px solid #2a2e3d; margin-bottom: 20px;">
          <tr>
            <td style="padding: 16px;">
              <span style="color: #7a8099; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">AI Media Concept</span>
              <p style="color: #a0a5b5; font-size: 13px; margin: 0; line-height: 1.5; font-style: italic;">"{escaped_image_brief}"</p>
            </td>
          </tr>
        </table>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Review New Draft Post</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0c10; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #12131a; border: 1px solid #222530; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.45);">
              <tr>
                <td style="background: linear-gradient(90deg, #E1306C, #C13584); height: 6px;"></td>
              </tr>
              <tr>
                <td align="center" style="padding: 30px 40px 10px 40px;">
                  <span style="font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #ffffff;">PRESSFORGE<span style="color: #E1306C;">.AI</span></span>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-align: center;">New Content Draft to Review</h2>
                  <p style="color: #a0a5b5; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                    Hi {escaped_client_name}, a new post has been generated for workspace <strong>{escaped_workspace_name}</strong> ({escaped_platforms}). Please review it below:
                  </p>
                  
                  <!-- Post Preview Card -->
                  <div style="background-color: #161821; border-radius: 12px; border: 1px solid #2a2e3d; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #ffffff; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">{escaped_caption}</p>
                  </div>
                  
                  {image_brief_html}
                  
                  <!-- Call to Action Button -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="{escaped_review_link}" target="_blank" style="background: #E1306C; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 700; border-radius: 25px; display: inline-block; box-shadow: 0 4px 15px rgba(225, 48, 108, 0.4);">
                          Review and Approve Post
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="background-color: #0d0e14; padding: 20px 40px; border-top: 1px solid #1c1e29;">
                  <p style="color: #535661; font-size: 11px; margin: 0;">
                    &copy; 2026 PressForge.ai. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    return {"subject": subject, "html": html_content}

