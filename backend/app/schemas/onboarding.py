from pydantic import BaseModel, Field
from typing import List, Optional
from app.models.user import AccountType

class IndividualOnboarding(BaseModel):
    primaryGoal: str = Field(..., description="Selected onboarding goal, e.g. GROW_AUDIENCE")
    contentThemes: List[str] = Field(..., description="Selected content themes")
    website: Optional[str] = Field(None, description="Website / Portfolio URL")

class OrganizationOnboarding(BaseModel):
    name: str = Field(..., description="Organization / Workspace name")
    website: Optional[str] = Field(None, description="Business website URL")
    teamSize: Optional[str] = Field(None, description="Team size selected during onboarding")
    industries: List[str] = Field(default_factory=list, description="Selected business industries")
    primaryGoal: str = Field(..., description="Primary business objective")
    objective: Optional[str] = Field(None, description="Objective of organization")
    description: Optional[str] = Field(None, description="Brief organization description")
    
    # KYC details
    legalName: str = Field(..., description="Legal business name")
    businessEntityType: str = Field(..., description="Entity type, e.g. LLC, CORPORATION")
    taxIdentificationNumber: str = Field(..., description="Tax ID / EIN Number")
    registeredAddress: str = Field(..., description="Business registered address")
    primaryContactName: str = Field(..., description="Primary contact person name")
    primaryContactDesignation: Optional[str] = Field(None, description="Primary contact designation, e.g. CEO")
    businessDocumentFileKey: Optional[str] = Field(None, description="Uploaded registry file key")

class OnboardingRequest(BaseModel):
    accountType: AccountType = Field(..., description="Account type, either INDIVIDUAL or ORGANIZATION")
    individualDetails: Optional[IndividualOnboarding] = Field(None, description="Details for individual onboarding")
    organizationDetails: Optional[OrganizationOnboarding] = Field(None, description="Details for organization onboarding")
