import { ADMIN_USER_ID, LEASEX_ORG_ID } from "@/constants";
import { clerkClient } from "@clerk/nextjs/server";

// Create invite for role upon registering user
export async function POST(req: Request) {
  const { emailAddress, role } = await req.json();
  await clerkClient.organizations.createOrganizationInvitation({
    organizationId: LEASEX_ORG_ID,
    inviterUserId: ADMIN_USER_ID,
    emailAddress,
    role: ["org", role].join(":"),
    redirectUrl: "http://localhost:3000/register",
  });
  return new Response("Successfully invited user to role", {
    status: 200,
  });
}

export async function GET(req: Request) {
  const invitations =
    await clerkClient.organizations.getOrganizationInvitationList({
      organizationId: LEASEX_ORG_ID,
    });
  return new Response(JSON.stringify(invitations, null, 2), {
    status: 200,
  });
}
