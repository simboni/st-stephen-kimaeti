import { whatsapp } from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons";

/** Floating WhatsApp chat button — the way Kenyan parents actually reach a school. */
export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello St Stephen’s! I would like to ask about")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with the school on WhatsApp"
      className="group no-print fixed bottom-5 right-5 z-40 flex items-center gap-0 rounded-full bg-[#1EA854] p-3.5 text-white shadow-[0_12px_32px_-10px_rgba(30,168,84,0.8)] transition-all hover:gap-2 hover:pr-5"
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold opacity-0 transition-all duration-300 group-hover:max-w-40 group-hover:opacity-100">
        Chat with us
      </span>
    </a>
  );
}
