def invitation_email(*, org_name: str, full_name: str, email: str, accept_link: str) -> dict:
    subject = f"Invite: Join PressForge portal for {org_name}"
    html = f"""
    <p>Hi <strong>{full_name}</strong>,</p>
    <p>You have been invited to review content briefs and approvals for <strong>{org_name}</strong> on <strong>PressForge</strong>.</p>
    <p><strong>Your login email will be:</strong> {email}</p>
    <p>Click the link below to accept the invitation and set your password:</p>
    <p><a href="{accept_link}">Accept Invite</a></p>
    """
    return {"subject": subject, "html": html}
