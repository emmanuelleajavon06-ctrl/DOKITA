/* Données de DÉMONSTRATION FICTIVES. Ne jamais lancer sur une base contenant de vraies données de santé.
   Les mots de passe sont générés aléatoirement et affichés UNE seule fois à la fin. */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { Prisma, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DAY = 86_400_000;

async function main(): Promise<void> {
  const infra = await prisma.infrastructure.upsert({
    where: { id: "demo-infra" },
    update: {},
    create: {
      id: "demo-infra", name: "Hôpital Démo (données fictives)", type: "HOPITAL", region: "Dakar",
      plan: "ENTERPRISE", subscriptionStatus: "ACTIVE",
      trialEndsAt: new Date(Date.now() + 30 * DAY), subscriptionEndsAt: new Date(Date.now() + 30 * DAY),
    },
  });

  const accounts: Array<{ role: Role; email: string; firstName: string; lastName: string; infra: boolean }> = [
    { role: "SUPER_ADMIN", email: "super.admin@demo.samadokita.test", firstName: "Super", lastName: "Admin", infra: false },
    { role: "ADMIN_INFRA", email: "admin.infra@demo.samadokita.test", firstName: "Awa", lastName: "Admin", infra: true },
    { role: "MEDECIN", email: "medecin@demo.samadokita.test", firstName: "Moussa", lastName: "Ndiaye", infra: true },
    { role: "PHARMACIEN", email: "pharmacien@demo.samadokita.test", firstName: "Fatou", lastName: "Sow", infra: true },
    { role: "LABORANTIN", email: "laborantin@demo.samadokita.test", firstName: "Ibrahima", lastName: "Fall", infra: true },
    { role: "ASSURANCE", email: "assurance@demo.samadokita.test", firstName: "Aïssatou", lastName: "Ba", infra: true },
    { role: "PATIENT", email: "patient@demo.samadokita.test", firstName: "Aminata", lastName: "Diop", infra: false },
  ];

  const created: Array<{ role: string; email: string; motDePasse: string }> = [];
  for (const a of accounts) {
    if (await prisma.user.findUnique({ where: { email: a.email }, select: { id: true } })) continue;
    const password = randomBytes(9).toString("base64url");
    const data: Prisma.UserUncheckedCreateInput = {
      email: a.email, passwordHash: await bcrypt.hash(password, 12), role: a.role,
      firstName: a.firstName, lastName: a.lastName, infrastructureId: a.infra ? infra.id : null,
    };
    if (a.role === "MEDECIN") data.doctor = { create: { infrastructureId: infra.id, specialty: "Médecine générale", licenseNumber: "DEMO-0001" } };
    if (a.role === "PATIENT") data.patient = { create: { infrastructureId: infra.id, bloodGroup: "O_POS", allergies: ["Pénicilline"], chronicDiseases: ["Hypertension"] } };
    await prisma.user.create({ data });
    created.push({ role: a.role, email: a.email, motDePasse: password });
  }

  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: [
        ["Qu'est-ce que SamaDokita ?", "Une plateforme de dossier médical numérique qui regroupe vos consultations, ordonnances, analyses et vaccinations."],
        ["Mes données sont-elles protégées ?", "L'accès est contrôlé par rôle, chaque action est enregistrée dans un journal d'audit et les connexions sont protégées contre les tentatives répétées."],
        ["Comment prendre un rendez-vous ?", "Depuis votre espace patient, choisissez un médecin et un créneau, en cabinet ou en téléconsultation."],
        ["Comment une pharmacie lit-elle mon ordonnance ?", "Chaque ordonnance porte un QR code que le pharmacien scanne pour la délivrer."],
        ["Que faire en cas d'urgence ?", "Le bouton SOS partage votre position avec les structures proches. Il ne remplace pas les numéros d'urgence."],
        ["Comment une structure de santé s'abonne-t-elle ?", "Elle bénéficie de 30 jours d'essai, puis choisit une formule payable par Wave, Orange Money, Free Money ou carte."],
      ].map(([question, answer], i) => ({ question: question as string, answer: answer as string, sortOrder: i })),
    });
  }
  // Liens réseaux créés NON publiés : l'administrateur y met les vraies adresses puis les publie.
  const socials: Array<[string, string]> = [["TIKTOK", "https://www.tiktok.com/"], ["FACEBOOK", "https://www.facebook.com/"], ["INSTAGRAM", "https://www.instagram.com/"], ["YOUTUBE", "https://www.youtube.com/"], ["WHATSAPP", "https://wa.me/"]];
  for (const [platform, url] of socials) {
    await prisma.socialLink.upsert({ where: { platform }, update: {}, create: { platform, url, isPublished: false } });
  }

  if (created.length) {
    console.log("\nComptes de démonstration créés (notez-les, ils ne seront plus affichés) :");
    console.table(created);
  } else console.log("Comptes de démo déjà présents : aucun mot de passe réaffiché.");
}

main().finally(() => prisma.$disconnect());
