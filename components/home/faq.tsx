"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How quickly will my appointment be confirmed?",
    a: "Most requests are confirmed within one working day. Emergency requests submitted before 4 PM are triaged the same day, and the clinic team will call you if an earlier slot opens up.",
  },
  {
    q: "Do I need to be a registered patient to book?",
    a: "No. You can book as a guest by entering your contact details. Creating an account lets you view upcoming appointments, reschedule and keep your details for next time.",
  },
  {
    q: "What happens if I need to cancel or reschedule?",
    a: "You can cancel or reschedule any pending or confirmed appointment from your dashboard up to the appointment time. Cancelling releases the slot for another patient straight away.",
  },
  {
    q: "Do you offer payment plans?",
    a: "Payment is collected at the clinic unless a payment feature is enabled. Ask the front desk about available options for larger treatment plans such as implants or orthodontics.",
  },
  {
    q: "Is my information secure?",
    a: "Authentication, row-level database policies and server-side validation protect your records. Only you, your treating dentist and authorised clinic staff can see your appointments.",
  },
  {
    q: "Which insurance plans do you accept?",
    a: "We accept most major dental plans and will provide itemised invoices for reimbursement. Contact your clinic with your plan details and we will confirm coverage before treatment.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="container py-16 lg:py-20" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Questions</p>
          <h2 id="faq-heading" className="mt-2 text-3xl font-bold">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-10 divide-y rounded-xl border bg-white shadow-card">
          {faqs.map((item, index) => {
            const expanded = open === index;
            return (
              <div key={item.q}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`faq-panel-${index}`}
                    onClick={() => setOpen(expanded ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold hover:bg-accent/60"
                  >
                    {item.q}
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-primary transition-transform", expanded && "rotate-180")} />
                  </button>
                </h3>
                <div id={`faq-panel-${index}`} hidden={!expanded} className="px-5 pb-4 text-sm text-muted-foreground">
                  {item.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
