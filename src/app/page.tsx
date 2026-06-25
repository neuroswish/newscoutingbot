import { ContactsDashboard } from "@/components/contacts-dashboard";
import { serializeContact } from "@/lib/contacts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const contacts = await prisma.contact
    .findMany({
      orderBy: [{ company: "asc" }, { name: "asc" }],
    })
    .catch((error) => {
      console.error("Unable to load contacts for dashboard.", error);
      return [];
    });

  return <ContactsDashboard initialContacts={contacts.map(serializeContact)} />;
}
