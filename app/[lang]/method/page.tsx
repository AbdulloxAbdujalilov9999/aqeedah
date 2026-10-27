import type { Metadata } from "next";
import Link from "next/link";
import { getCtx } from "@/lib/ctx";

export const metadata: Metadata = { title: "Uslubimiz · Our method" };

const CONTENT = {
  uz: [
    ["Aqida va mazhab", "Aqeedah Ahli sunna val-jamoa yo‘lida. Aqidada Moturidiy, fiqhda Hanafiy mazhabiga amal qilamiz, chunki O‘zbekiston musulmonlari asrlar davomida shu yo‘lda bo‘lgan. Boshqa mazhablarning qarashi farq qiladigan joylarda uni ham hurmat bilan keltiramiz."],
    ["Javob qanday tayyorlanadi", "Har bir savolni avval moderator ko‘rib chiqadi: avval javob berilgan bo‘lsa, tayyor javobni ulaydi, shaxsiy ma’lumotlarni olib tashlaydi va savolni mos olimga yuboradi. Olim qisqa javob va dalillarni (Qur’on oyatlari, hadislar manbasi bilan, ulamolar so‘zlari) yozadi. Keyin boshqa, katta olim javobni tekshiradi. Faqat tekshirilgan javob chop etiladi va unda ikkala olimning ismi ko‘rsatiladi."],
    ["Ikki til", "Javob savol berilgan tilda yoziladi. So‘ng tarjimon ikkinchi tilga o‘giradi va olim tarjimani tasdiqlaydi."],
    ["Nimalarga javob bermaymiz", "Aniq shaxslar haqida hukm chiqarmaymiz, siyosiy bahslarga kirmaymiz va ajrim, meros nizolari kabi tomonlarni eshitishni talab qiladigan masalalarda yakuniy hukm bermaymiz. Bunday hollarda mahalla imomiga yoki O‘zbekiston musulmonlari idorasi Fatvo markaziga murojaat qilishni tavsiya qilamiz."],
    ["Sun’iy intellekt", "Javoblarni sun’iy intellekt yozmaydi. Barcha javoblarni tirik olimlar yozadi va tekshiradi."],
    ["Maxfiylik", "Ismingiz, telefoningiz, Telegram username va savoldagi shaxsiy tafsilotlarni faqat adminlar ko‘radi, ular saytda chop etilmaydi. Javobni chop etishga rozilik bermasangiz, javob sizga telefon yoki Telegram orqali yuboriladi."],
  ],
  en: [
    ["Creed and madhhab", "Aqeedah follows Ahl al-Sunnah wa al-Jama‘ah: the Maturidi school in creed and the Hanafi school in fiqh, as the Muslims of Uzbekistan have for centuries. Where other madhhabs differ, we present their views with respect."],
    ["How an answer is prepared", "A moderator reads every question first. If it has already been answered, they link the existing answer. They remove personal details and send the question to a suitable scholar. The scholar writes a short answer and the evidence: Qur'an verses, hadith with their sources, and the words of the scholars. A second, senior scholar then reviews it. Only reviewed answers are published, and both scholars are named."],
    ["Two languages", "Answers are written in the language the question was asked in. A translator then produces the other language, and a scholar approves the translation."],
    ["What we don't answer", "We don't pass judgement on named individuals, take part in political disputes, or give final rulings in matters that require hearing both sides, such as divorce or inheritance disputes. For those, we recommend your local imam or the Fatwa Center of the Muslim Board of Uzbekistan."],
    ["Artificial intelligence", "AI does not write our answers. Every answer is written and reviewed by living scholars."],
    ["Privacy", "Only our admins see your name, phone number, Telegram username and any personal details in your question; they are never published. If you don't agree to publishing, the answer is sent to you by phone or Telegram."],
  ],
} as const;

export default async function Method({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const { t, tx, lang } = await getCtx(l);
  return (
    <div className="wrap narrow stack-lg">
      <h1>{t("method_title")}</h1>
      {CONTENT[lang].map(([h, p]) => (
        <section className="stack" key={h} style={{ gap: 8 }}>
          <h2>{tx(h)}</h2>
          <p>{tx(p)}</p>
        </section>
      ))}
      <div><Link className="btn" href={`/${lang}/ask`}>{t("ask")}</Link></div>
    </div>
  );
}
