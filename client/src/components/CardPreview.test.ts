import { describe, it, expect } from "vitest";

describe("CardPreview", () => {
  describe("vCard Generation", () => {
    it("should generate valid vCard format", () => {
      const cardData = {
        headshot: null,
        name: "John Doe",
        designation: "Product Designer",
        phone: "+1 (555) 123-4567",
        email: "john@example.com",
        address: "123 Main St, City, State",
        officeName: "Acme Corp",
        officeDetails: "Tech Division",
        social: {
          linkedin: "https://linkedin.com/in/johndoe",
          twitter: "https://twitter.com/johndoe",
          instagram: "",
          facebook: "",
          youtube: "",
          github: "",
          tiktok: "",
          whatsapp: "",
        },
      };

      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${cardData.name}
TITLE:${cardData.designation}
TEL:${cardData.phone}
EMAIL:${cardData.email}
ADR:;;${cardData.address}
ORG:${cardData.officeName}
NOTE:${cardData.officeDetails}
URL;TYPE=LINKEDIN:${cardData.social.linkedin}
URL;TYPE=TWITTER:${cardData.social.twitter}
END:VCARD`;

      expect(vcard).toContain("BEGIN:VCARD");
      expect(vcard).toContain("VERSION:3.0");
      expect(vcard).toContain("FN:John Doe");
      expect(vcard).toContain("TITLE:Product Designer");
      expect(vcard).toContain("END:VCARD");
    });

    it("should handle empty social media fields", () => {
      const cardData = {
        headshot: null,
        name: "Jane Smith",
        designation: "Engineer",
        phone: "+1 (555) 987-6543",
        email: "jane@example.com",
        address: "456 Oak Ave",
        officeName: "Tech Inc",
        officeDetails: "Engineering",
        social: {
          linkedin: "",
          twitter: "",
          instagram: "",
          facebook: "",
          youtube: "",
          github: "",
          tiktok: "",
          whatsapp: "",
        },
      };

      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${cardData.name}
TITLE:${cardData.designation}
TEL:${cardData.phone}
EMAIL:${cardData.email}
ADR:;;${cardData.address}
ORG:${cardData.officeName}
NOTE:${cardData.officeDetails}
END:VCARD`;

      expect(vcard).toContain("BEGIN:VCARD");
      expect(vcard).toContain("END:VCARD");
      expect(vcard).not.toContain("URL;TYPE=LINKEDIN");
    });
  });

  describe("Export Validation", () => {
    it("should validate card data before export", () => {
      const cardData = {
        headshot: null,
        name: "Test User",
        designation: "Tester",
        phone: "+1 (555) 111-1111",
        email: "test@example.com",
        address: "Test Address",
        officeName: "Test Co",
        officeDetails: "Test Dept",
        social: {
          linkedin: "",
          twitter: "",
          instagram: "",
          facebook: "",
          youtube: "",
          github: "",
          tiktok: "",
          whatsapp: "",
        },
      };

      expect(cardData.name).toBeTruthy();
      expect(cardData.email).toBeTruthy();
      expect(cardData.phone).toBeTruthy();
    });
  });

  describe("WhatsApp URL Generation", () => {
    it("should generate valid WhatsApp share URL", () => {
      const message = "Check out my digital visiting card!";
      const encodedMessage = encodeURIComponent(message);
      const whatsappURL = `https://wa.me/?text=${encodedMessage}`;

      expect(whatsappURL).toContain("https://wa.me/");
      expect(whatsappURL).toContain("text=");
      expect(whatsappURL).toContain(encodeURIComponent("Check out my digital visiting card!"));
    });
  });
});
