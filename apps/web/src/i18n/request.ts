import { getRequestConfig } from "next-intl/server";
import { readLocale } from "@/lib/settings";

export default getRequestConfig(async () => {
  const locale = readLocale();
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
