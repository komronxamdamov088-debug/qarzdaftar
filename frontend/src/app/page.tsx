import { HomeGate } from "@/components/home-gate";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

export default async function Home() {
  const dict = getDictionary(await getLocale());
  return (
    <HomeGate
      heroLine1={dict.home.heroLine1}
      heroLine2={dict.home.heroLine2}
      subtitle={dict.home.subtitle}
    />
  );
}
