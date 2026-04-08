import { WhatsAppIcon } from "./Icons";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/447457428720"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-lg"
      aria-label="Contact us on WhatsApp"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
}
