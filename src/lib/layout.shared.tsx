import { i18n } from "@/lib/i18n";
import { uiTranslations } from "fumadocs-ui/i18n";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const translations = i18n
  .translations()
  .extend(uiTranslations())
  .add({
    en: { displayName: "English" },
    "zh-TW": {
      displayName: "繁體中文",
      "Search(search dialog)": "搜尋",
      "Search(search trigger)": "搜尋",
      "Open Search(search trigger)(aria-label)": "開啟搜尋",
      "Close Search(search dialog)(aria-label)": "關閉搜尋",
      "No results found(search dialog)": "找不到結果",
      "On this page(table of contents)": "本頁內容",
      "No Headings(table of contents)": "沒有標題",
      "Table of Contents(inline table of contents)": "目錄",
      "Next Page(pagination)": "下一頁",
      "Previous Page(pagination)": "上一頁",
      "Last updated on(page footer)": "最後更新於",
      "Language(language switcher)": "語言",
      "Choose a language(language switcher)": "選擇語言",
      "Choose a language(language switcher)(aria-label)": "選擇語言",
      "Theme(site menu)": "佈景主題",
      "Toggle Theme(theme switcher)(aria-label)": "切換佈景主題",
      "Light(theme switcher)(aria-label)": "淺色",
      "Dark(theme switcher)(aria-label)": "深色",
      "System(theme switcher)(aria-label)": "跟隨系統",
      "Copy Text(code block)(aria-label)": "複製",
      "Copied Text(code block)(aria-label)": "已複製",
      "Open Sidebar(sidebar)(aria-label)": "開啟側邊欄",
      "Close Sidebar(sidebar)(aria-label)": "關閉側邊欄",
      "Page Not Found(404 not found page)": "找不到頁面",
      "Back to Home(404 not found page)": "回到首頁",
    },
  });

export function baseOptions(locale: string): BaseLayoutProps {
  return {
    nav: {
      title: locale === "zh-TW" ? "Illyaverse 部署文件" : "Illyaverse Docs",
    },
  };
}
