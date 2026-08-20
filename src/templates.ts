export interface Field {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface Template {
  id: string;
  label: string;
  fields: Field[];
  generate: (values: Record<string, string>) => string;
  placeholder: string;
}

export const templates: Template[] = [
  {
    id: "text",
    label: "Text",
    fields: [],
    placeholder: "Type anything to generate a QR code...",
    generate: (v) => v.text || "zubariel",
  },
  {
    id: "url",
    label: "URL",
    fields: [
      {
        key: "url",
        label: "Website URL",
        type: "text",
        placeholder: "https://example.com",
      },
    ],
    placeholder: "https://example.com",
    generate: (v) => v.url || "https://zubs.me",
  },
  {
    id: "phone",
    label: "Phone",
    fields: [
      {
        key: "phone",
        label: "Phone number",
        type: "text",
        placeholder: "+1 234 567 890",
      },
    ],
    placeholder: "+1 234 567 890",
    generate: (v) =>
      v.phone ? `tel:${v.phone.replace(/\s/g, "")}` : "tel:+1234567890",
  },
  {
    id: "wifi",
    label: "WiFi",
    fields: [
      {
        key: "ssid",
        label: "Network name",
        type: "text",
        placeholder: "MyWiFi",
      },
      {
        key: "password",
        label: "Password",
        type: "text",
        placeholder: "Enter password",
      },
      {
        key: "encryption",
        label: "Encryption",
        type: "select",
        options: [
          { value: "WPA", label: "WPA/WPA2" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "None" },
        ],
      },
    ],
    placeholder: "WiFi network name",
    generate: (v) => {
      const ssid = v.ssid || "";
      const pass = v.password || "";
      const enc = v.encryption || "WPA";
      return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
    },
  },
  {
    id: "contact",
    label: "Contact",
    fields: [
      {
        key: "name",
        label: "Full name",
        type: "text",
        placeholder: "John Doe",
      },
      {
        key: "phone",
        label: "Phone",
        type: "text",
        placeholder: "+1 234 567 890",
      },
      {
        key: "email",
        label: "Email",
        type: "text",
        placeholder: "john@example.com",
      },
      {
        key: "org",
        label: "Organization",
        type: "text",
        placeholder: "Company name",
      },
    ],
    placeholder: "Contact name",
    generate: (v) => {
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${v.name || ""}`];
      if (v.phone) lines.push(`TEL:${v.phone}`);
      if (v.email) lines.push(`EMAIL:${v.email}`);
      if (v.org) lines.push(`ORG:${v.org}`);
      lines.push("END:VCARD");
      return lines.join("\n");
    },
  },
  {
    id: "email",
    label: "Email",
    fields: [
      {
        key: "to",
        label: "To",
        type: "text",
        placeholder: "recipient@example.com",
      },
      {
        key: "subject",
        label: "Subject",
        type: "text",
        placeholder: "Email subject",
      },
      {
        key: "body",
        label: "Body",
        type: "textarea",
        placeholder: "Message body",
      },
    ],
    placeholder: "Recipient email",
    generate: (v) => {
      const to = v.to || "";
      const subj = v.subject ? `?subject=${encodeURIComponent(v.subject)}` : "";
      const body = v.body
        ? `${subj ? "&" : "?"}body=${encodeURIComponent(v.body)}`
        : "";
      return `mailto:${to}${subj}${body}`;
    },
  },
  {
    id: "sms",
    label: "SMS",
    fields: [
      {
        key: "phone",
        label: "Phone number",
        type: "text",
        placeholder: "+1 234 567 890",
      },
      {
        key: "message",
        label: "Message",
        type: "textarea",
        placeholder: "Your message",
      },
    ],
    placeholder: "Phone number",
    generate: (v) => {
      const phone = (v.phone || "").replace(/\s/g, "");
      const msg = v.message ? `:${encodeURIComponent(v.message)}` : "";
      return `smsto:${phone}${msg}`;
    },
  },
];
