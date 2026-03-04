import {
  aureliaAccountOrders,
  aureliaAccountPreferences,
  aureliaAccountProfile,
  aureliaAccountSubscription,
  aureliaAccountVehicle,
  aureliaFaqItems,
  aureliaModels,
  aureliaOwnershipData,
  aureliaSupportTopics,
} from "@/data/aurelia-website";

export function buildWebKnowledgeBase(): string {
  const modelsSection = [
    "Models:",
    ...aureliaModels.map(
      (model) =>
        `- ${model.name} (${model.slug}) \u2014 ${model.category}, ${model.price}, tagline: ${model.tagline}, ` +
        `range: ${model.specs.range}, 0-100: ${model.specs.acceleration}, top speed: ${model.specs.topSpeed}, ` +
        `charge 10-80%: ${model.specs.chargeTime}. Key features: ${model.features.join("; ")}.`,
    ),
  ].join("\n");

  const ownershipSection = [
    "Ownership & services:",
    ...aureliaOwnershipData.map(
      (card) => `- ${card.title} \u2014 ${card.summary} Details: ${card.detail}`,
    ),
  ].join("\n");

  const supportSection = [
    "Support topics:",
    ...aureliaSupportTopics.map(
      (topic) => `- ${topic.title} \u2014 ${topic.description}`,
    ),
  ].join("\n");

  const faqSection = [
    "FAQ:",
    ...aureliaFaqItems.map(
      (item) => `- Q: ${item.question}\n  A: ${item.answer}`,
    ),
  ].join("\n");

  const accountSectionLines: string[] = [];
  accountSectionLines.push(
    `Account profile: ${aureliaAccountProfile.name}, tier: ${aureliaAccountProfile.tier}, member since ${aureliaAccountProfile.memberSince}.`,
  );
  accountSectionLines.push(
    `Vehicle: ${aureliaAccountVehicle.primaryVehicle} (${aureliaAccountVehicle.colorAndDelivery}), ` +
      `mileage: ${aureliaAccountVehicle.mileage} (${aureliaAccountVehicle.mileageLastSynced}), ` +
      `next service: ${aureliaAccountVehicle.nextService} (${aureliaAccountVehicle.nextServiceDetail}).`,
  );
  accountSectionLines.push(
    `Subscription: ${aureliaAccountSubscription.planName} at ${aureliaAccountSubscription.price}, ` +
      `${aureliaAccountSubscription.renewsOn}. Includes: ${aureliaAccountSubscription.includes.join(
        "; ",
      )}.`,
  );
  accountSectionLines.push(
    `Orders: ${aureliaAccountOrders
      .map(
        (order) =>
          `${order.id} \u2014 ${order.status}, ${order.title}, ${order.detail}`,
      )
      .join(" | ")}.`,
  );
  accountSectionLines.push(
    `Preferences: notifications ${aureliaAccountPreferences.notifications} (${aureliaAccountPreferences.notificationsDetail}); ` +
      `preferred center ${aureliaAccountPreferences.preferredCenter} (${aureliaAccountPreferences.preferredCenterAddress}); ` +
      `language ${aureliaAccountPreferences.language} (${aureliaAccountPreferences.languageDetail}).`,
  );

  const accountSection = ["Account overview:", ...accountSectionLines].join("\n");

  return [
    "Aurelia Motors Website Knowledge Base:",
    "",
    modelsSection,
    "",
    ownershipSection,
    "",
    supportSection,
    "",
    faqSection,
    "",
    accountSection,
  ].join("\n");
}

export function buildPageContext(page: string, pageTitle: string): string {
  switch (page) {
    case "home":
      return `The customer is on the homepage (${pageTitle}), seeing the hero, why Aurelia, a featured model, and an ownership teaser.`;
    case "models":
      return `The customer is browsing the models index (${pageTitle}) with filters for electric, hybrid, and performance vehicles.`;
    case "model-detail":
      return `The customer is viewing a specific model detail page (${pageTitle}) with specs and feature highlights.`;
    case "ownership":
      return `The customer is on the ownership page (${pageTitle}), reading about service, connected services, fleet, and insurance.`;
    case "support":
      return `The customer is on the support page (${pageTitle}), with support topics, FAQ, and contact options (phone, email, visit a center).`;
    case "my-account":
      return `The customer is on the account area (${pageTitle}), with tabs for vehicle, subscription, orders, and preferences.`;
    default:
      return `The customer is on a web page labeled "${pageTitle}".`;
  }
}

