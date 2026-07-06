import html


def invitation_email(*, org_name: str, full_name: str, email: str, accept_link: str) -> dict:
    escaped_org_name = html.escape(org_name)
    escaped_full_name = html.escape(full_name)
    escaped_email = html.escape(email)
    escaped_accept_link = html.escape(accept_link, quote=True)

    subject = f"Invite: Join PressForge portal for {escaped_org_name}"
    html_content = f"""
    <p>Hi <strong>{escaped_full_name}</strong>,</p>
    <p>You have been invited to review content briefs and approvals for <strong>{escaped_org_name}</strong> on <strong>PressForge</strong>.</p>
    <p><strong>Your login email will be:</strong> {escaped_email}</p>
    <p>Click the link below to accept the invitation and set your password:</p>
    <p><a href="{escaped_accept_link}">Accept Invite</a></p>
    """
    return {"subject": subject, "html": html_content}
