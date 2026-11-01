// Farsi + English. Pure module (no React) so it is unit-tested with the node runner.
// Rules from the confirmed design catalog:
//  - Farsi is right-to-left (dir="rtl", Vazirmatn); English is left-to-right (Inter).
//  - Farsi uses Persian digits and separators (۳٬۳۱۷٬۴۷۰ تومان, ₺۴۹٫۹۹).
//  - Game titles, studios, platform names and game descriptions stay as the catalog has them (Latin/English).
//  - The chosen language lives in the browser only (localStorage), never on the account.

export type Lang = "en" | "fa";
export const LANGS: readonly Lang[] = ["en", "fa"];
export const DEFAULT_LANG: Lang = "en";
export const LANG_STORAGE_KEY = "playnext:lang";

export const dirOf = (lang: Lang): "ltr" | "rtl" => (lang === "fa" ? "rtl" : "ltr");
export const isLang = (v: unknown): v is Lang => v === "en" || v === "fa";

type Store = Pick<Storage, "getItem" | "setItem">;
function defaultStore(): Store | null {
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
}

/** Saved choice, else the browser language (Persian -> fa), else English. Storage may throw: wrapped. */
export function detectLang(navLang?: string | null, store: Store | null = defaultStore()): Lang {
  try {
    const saved = store?.getItem(LANG_STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch { /* fall through */ }
  return (navLang ?? "").toLowerCase().startsWith("fa") ? "fa" : DEFAULT_LANG;
}

export function saveLang(lang: Lang, store: Store | null = defaultStore()): void {
  try { store?.setItem(LANG_STORAGE_KEY, lang); } catch { /* the choice just won't persist */ }
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
/** 0-9 -> ۰-۹, "," -> "٬", "." -> "٫". Only for text made of numbers (prices, counts). */
export function toPersianNumerals(s: string): string {
  return s.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]).replace(/,/g, "٬").replace(/\./g, "٫");
}

export function formatInt(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(n);
}

/** Toman is the primary price everywhere. Missing price shows "—", never 0. */
export function tomanText(value: number | null | undefined, lang: Lang): string {
  if (value === null || value === undefined) return "—";
  return lang === "fa" ? `${formatInt(value, "fa")} تومان` : `${formatInt(value, "en")} Toman`;
}

/** The regional price beneath it (₺49.99 / ₺۴۹٫۹۹). Null when there is no price or currency. */
export function nativeText(value: number | null | undefined, currency: string | null | undefined, lang: Lang): string | null {
  if (value === null || value === undefined || !currency) return null;
  let s: string;
  try { s = new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(value); }
  catch { s = `${value} ${currency}`; }
  return lang === "fa" ? toPersianNumerals(s) : s;
}

export function percentText(n: number, lang: Lang): string {
  return lang === "fa" ? `${formatInt(n, "fa")}٪` : `${n}%`;
}

export function hoursText(n: number, lang: Lang): string {
  return lang === "fa" ? `${formatInt(n, "fa")} ساعت` : `${formatInt(n, "en")} hrs`;
}

export const en = {
  // shared
  "common.loading": "Loading…",
  "common.tryAgain": "Try again",
  "common.continue": "Continue",
  "common.skip": "Skip",
  "common.remove": "Remove",
  "common.add": "Add",
  "common.added": "Added",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.back": "Back",
  "common.new": "NEW",
  "common.saveFailed": "Couldn't save that. Try again.",
  "common.refresh": "Something went wrong. Please refresh the page.",
  "common.rateLimited": "Too many requests. Try again in {n} seconds.",
  "lang.switch": "فارسی",
  "lang.label": "Language",
  "brand.tagline": "Play more. Choose better.",

  // nav
  "nav.main": "Main",
  "nav.home": "Home",
  "nav.library": "Library",
  "nav.wishlist": "Wishlist",
  "nav.cart": "Cart",
  "nav.budget": "Budget",
  "nav.noBudget": "No budget limit",
  "nav.upTo": "Up to {price}",
  "nav.region": "Pricing region",
  "nav.regionFallback": "Region",
  "nav.profile": "Profile",
  "nav.filters": "Filters",
  "nav.dna": "Gamer DNA",

  // landing
  "landing.title": "Play more. Choose better.",
  "landing.sub": "Game picks tuned to your taste, with prices shown in Toman.",
  "landing.steam": "Sign in with Steam",
  "landing.email": "Use email instead",

  // consent
  "consent.title": "One quick thing",
  "consent.sub": "Our privacy policy has been updated.",
  "consent.check": "I am at least 16 years old and I accept the Privacy Policy.",
  "consent.rateLimited": "Please wait a moment and try again.",
  "consent.failed": "Could not save. Try again.",

  // onboarding: region
  "region.title": "Where do you buy games?",
  "region.sub": "Pick your region so prices use the right store currency. You can change it later in Settings.",
  "region.note": "Prices are always shown in Toman first, with this region's price underneath.",
  "region.step": "Step {n} of 3",
  "region.invalid": "Pick one of the listed regions.",
  "region.loadFailed": "Could not load options.",

  // onboarding: quiz
  "quiz.title": "What do you like?",
  "quiz.sub": "Pick any games that feel like you. There's no minimum.",
  "quiz.none": "Tap the games you like",
  "quiz.one": "1 game picked",
  "quiz.many": "{n} games picked",
  "quiz.go": "Let's go",
  "quiz.loadFailed": "Could not load the quiz.",

  // onboarding: add games
  "add.title": "Add games you've played",
  "add.subSteam": "Your Steam library is being imported. You can also add games from other stores here.",
  "add.subEmail": "Search for games you own or have played, on any store. The more you add, the better your picks.",
  "add.loved": "Loved it",
  "add.done": "Done",
  "add.skipNow": "Skip for now",
  "add.removeFailed": "Could not remove that game.",
  "add.continueFailed": "Could not continue. Try again.",

  // search
  "search.label": "Search games",
  "search.placeholderLibrary": "Search for a game you own…",
  "search.placeholderWishlist": "Search for a game you want…",
  "search.unavailable": "Search is unavailable right now.",
  "search.slowDown": "Slow down a little and try again.",
  "search.addFailed": "Could not add that game. Try again.",
  "search.noResults": "We couldn't find that one. No worries - we'll still learn from everything else you add.",

  // feed
  "feed.title": "Your feed",
  "feed.picked": "Picked for you",
  "feed.next": "What to play next",
  "feed.nextSub": "From games you already own",
  "feed.unplayed": "Still in your library",
  "feed.unplayedSub": "Owned, barely played",
  "feed.deals": "Good deals for you",
  "feed.unusual": "Out of the usual",
  "feed.unusualSub": "Strong matches outside your usual genres",
  "feed.popular": "Popular right now",
  "feed.loadFailed": "Something went wrong loading your feed. Refresh to try again.",
  "feed.coldTitle": "Let's get to know your taste",
  "feed.coldSub": "Tell us what you like and your picks will show up here.",
  "feed.takeQuiz": "Take the taste quiz",
  "feed.addPlayed": "Add games you've played",
  "feed.inMeantime": "In the meantime, popular right now",

  // sync banner
  "sync.progress": "Syncing your Steam library… picks will get better as it finishes.",
  "sync.failed": "We couldn't sync your Steam library. Make sure game details are public on your Steam profile, then sign in again.",

  // cards
  "card.actions": "Actions",
  "card.like": "Like",
  "card.notInterested": "Not interested",
  "card.alreadyOwn": "I already own this",
  "card.wishlist": "Add to wishlist",
  "card.undo": "Undo",
  "card.removed": "Removed from your feed",

  // connect steam
  "steam.bannerText": "Connect Steam to bring in your wishlist automatically.",
  "steam.connect": "Connect Steam",
  "steam.notNow": "Not now",
  "steam.cardTitle": "Connect your Steam account",
  "steam.cardText": "We'll import your library and wishlist so recommendations fit what you actually play. We only read what your profile shares publicly.",

  // library
  "library.title": "My Library",
  "library.tabAll": "All",
  "library.tabSynced": "From Steam",
  "library.tabManual": "Added by me",
  "library.empty": "Your library is empty",
  "library.emptySub": "Add games you've played so your picks get better.",
  "library.playtime": "Playtime",
  "library.bucket.barely_touched": "Barely touched",
  "library.bucket.some_hours": "Some hours",
  "library.bucket.sunk_50plus": "50+ hours",
  "library.hours": "{h} played",
  "library.removeFailed": "Could not remove that game.",
  "library.cycleFailed": "Could not update the playtime.",

  // wishlist
  "wishlist.title": "Wishlist",
  "wishlist.empty": "Your wishlist is empty",
  "wishlist.emptySub": "Add games you want and we'll show their price in Toman.",
  "wishlist.fromSteam": "From Steam",
  "wishlist.addedByYou": "Added by you",
  "wishlist.toCart": "Add to cart",
  "wishlist.inCart": "In cart",
  "wishlist.removeFailed": "Could not remove that game.",
  "wishlist.cartFailed": "Could not add to the cart.",

  // cart
  "cart.title": "Cart",
  "cart.empty": "Your cart is empty",
  "cart.emptySub": "Games you add from recommendations show up here, grouped by store.",
  "cart.browse": "Browse recommendations",
  "cart.total": "Total",
  "cart.buy": "Buy on {platform}",
  "cart.noLink": "No store link yet",
  "cart.priceChanged": "Price changed since you added it",
  "cart.locked": "Was {price}",
  "cart.removeFailed": "Could not remove that item.",

  // settings
  "settings.title": "Settings",
  "settings.accounts": "Connected accounts",
  "settings.steamConnected": "Steam connected",
  "settings.emailAccount": "Email",
  "settings.region": "Pricing region",
  "settings.budget": "Monthly budget",
  "settings.budgetNone": "No limit",
  "settings.language": "Language",
  "settings.languageNote": "Saved in this browser only.",
  "settings.privacy": "Privacy",
  "settings.privacyNote": "To delete your account or data, email {email}.",
  "settings.saved": "Saved",

  // game detail
  "detail.back": "Back",
  "detail.about": "About",
  "detail.editions": "Editions and pricing",
  "detail.priceIn": "Price in {region}",
  "detail.free": "Free",
  "detail.addToCart": "Add to cart",
  "detail.inCart": "In cart",
  "detail.buy": "Open store page",
  "detail.owned": "In your library",
  "detail.like": "Like",
  "detail.dislike": "Dislike",
  "detail.notInterested": "Not interested",
  "detail.alreadyOwn": "I already own this",
  "detail.wishlist": "Add to wishlist",
  "detail.inWishlist": "In your wishlist",
  "detail.tags": "Tags",
  "detail.similar": "Similar games",
  "detail.whyPicked": "Why we picked this",
  "detail.signInPrompt": "Sign in to see prices for your region and add this game to your lists.",
  "detail.signIn": "Sign in",
  "detail.region.US": "United States",
  "detail.region.UK": "United Kingdom",
  "detail.region.EU": "Eurozone",
  "detail.region.UA": "Ukraine",
  "detail.region.TR": "Turkey",
  "detail.region.AR": "Argentina",
  "detail.notFound": "We couldn't find that game.",
  "detail.by": "by {name}",
  "detail.reviews": "{n}% positive reviews",

  // gamer dna
  "dna.title": "Your Gamer DNA",
  "dna.sub": "Based on your Steam library and playtime",
  "dna.yourType": "Your type",
  "dna.totalPlaytime": "total playtime",
  "dna.backlog": "games in your backlog",
  "dna.achievements": "avg. achievement completion",
  "dna.studio": "most-played studio",
  "dna.topGenres": "Top genres by hours played",
  "dna.mostPlayed": "Most played",
  "dna.typeNote": "The type is a light-hearted label worked out from clear behaviour (hours, backlog, spread of genres). It is not a psychological profile.",
  "dna.needsSteamTitle": "Gamer DNA needs Steam",
  "dna.needsSteamText": "It's built from real playtime, which we can only read from a Steam account.",
  "dna.needsSteamButton": "Sign in with Steam",
  "dna.needsSteamNote": "You'll keep your existing account and games.",
  "dna.syncingTitle": "Reading your library…",
  "dna.syncingText": "Your Gamer DNA appears as soon as the first Steam sync finishes. This usually takes a minute or two.",
  "dna.type.completionist": "The Completionist",
  "dna.type.backlog_collector": "The Backlog Collector",
  "dna.type.genre_explorer": "The Genre Explorer",
  "dna.type.loyalist": "The Loyalist",
  "dna.type.genre_specialist": "The Genre Specialist",
  "dna.type.balanced": "The Balanced Gamer",

  // states
  "wishlist.view": "View game",
  "state.notFoundTitle": "This page doesn't exist",
  "state.notFoundText": "The link may be old, or the game was removed from the catalog.",
  "state.toFeed": "Back to my feed",
  "state.errorTitle": "Something went wrong",
  "state.errorText": "It's on our side. Nothing you did was lost.",
  "state.rateTitle": "You're going a bit fast",
  "state.rateText": "Too many requests. Please wait 30 seconds and try again. Your changes so far are saved.",
} as const;

export type Key = keyof typeof en;

/** The backend sends Gamer DNA types as English labels (gamer_dna_router.derive_label). Map them to keys. */
export const DNA_TYPE_KEYS: Record<string, Key> = {
  "The Completionist": "dna.type.completionist",
  "The Backlog Collector": "dna.type.backlog_collector",
  "The Genre Explorer": "dna.type.genre_explorer",
  "The Loyalist": "dna.type.loyalist",
  "The Genre Specialist": "dna.type.genre_specialist",
  "The Balanced Gamer": "dna.type.balanced",
};

export const fa: Record<Key, string> = {
  "common.loading": "در حال بارگذاری…",
  "common.tryAgain": "تلاش دوباره",
  "common.continue": "ادامه",
  "common.skip": "رد کردن",
  "common.remove": "حذف",
  "common.add": "افزودن",
  "common.added": "اضافه شد",
  "common.cancel": "انصراف",
  "common.save": "ذخیره",
  "common.back": "بازگشت",
  "common.new": "جدید",
  "common.saveFailed": "ذخیره نشد. دوباره امتحان کن.",
  "common.refresh": "مشکلی پیش آمد. لطفاً صفحه را تازه کن.",
  "common.rateLimited": "درخواست‌ها زیاد بوده است. {n} ثانیه دیگر دوباره امتحان کن.",
  "lang.switch": "English",
  "lang.label": "زبان",
  "brand.tagline": "بیشتر بازی کن. بهتر انتخاب کن.",

  "nav.main": "اصلی",
  "nav.home": "خانه",
  "nav.library": "کتابخانه",
  "nav.wishlist": "علاقه‌مندی‌ها",
  "nav.cart": "سبد خرید",
  "nav.budget": "بودجه",
  "nav.noBudget": "بدون سقف بودجه",
  "nav.upTo": "تا {price}",
  "nav.region": "منطقه‌ی قیمت",
  "nav.regionFallback": "منطقه",
  "nav.profile": "پروفایل",
  "nav.filters": "فیلترها",
  "nav.dna": "دی‌ان‌ای گیمر",

  "landing.title": "بیشتر بازی کن. بهتر انتخاب کن.",
  "landing.sub": "پیشنهاد بازی بر اساس سلیقه‌ی تو، با قیمت به تومان.",
  "landing.steam": "ورود با استیم",
  "landing.email": "ورود با ایمیل",

  "consent.title": "یک نکته‌ی کوتاه",
  "consent.sub": "سیاست حریم خصوصی ما به‌روز شده است.",
  "consent.check": "حداقل ۱۶ سال دارم و سیاست حریم خصوصی را می‌پذیرم.",
  "consent.rateLimited": "کمی صبر کن و دوباره امتحان کن.",
  "consent.failed": "ذخیره نشد. دوباره امتحان کن.",

  "region.title": "بازی‌ها را از کجا می‌خری؟",
  "region.sub": "منطقه‌ات را انتخاب کن تا قیمت‌ها به ارز درست فروشگاه باشند. بعداً می‌توانی در تنظیمات عوضش کنی.",
  "region.note": "قیمت‌ها همیشه اول به تومان نشان داده می‌شوند و قیمت این منطقه زیر آن است.",
  "region.step": "مرحله‌ی {n} از ۳",
  "region.invalid": "یکی از منطقه‌های فهرست را انتخاب کن.",
  "region.loadFailed": "گزینه‌ها بارگذاری نشدند.",

  "quiz.title": "چه چیزی دوست داری؟",
  "quiz.sub": "هر بازی‌ای که حس می‌کنی شبیه توست را انتخاب کن. حداقلی ندارد.",
  "quiz.none": "روی بازی‌های موردعلاقه‌ات بزن",
  "quiz.one": "۱ بازی انتخاب شد",
  "quiz.many": "{n} بازی انتخاب شد",
  "quiz.go": "بزن بریم",
  "quiz.loadFailed": "آزمون بارگذاری نشد.",

  "add.title": "بازی‌هایی که بازی کرده‌ای را اضافه کن",
  "add.subSteam": "کتابخانه‌ی استیمت در حال وارد شدن است. می‌توانی بازی‌های فروشگاه‌های دیگر را هم اینجا اضافه کنی.",
  "add.subEmail": "بازی‌هایی که داری یا بازی کرده‌ای را از هر فروشگاهی جست‌وجو کن. هرچه بیشتر اضافه کنی، پیشنهادها بهتر می‌شوند.",
  "add.loved": "عاشقش بودم",
  "add.done": "تمام",
  "add.skipNow": "فعلاً رد کن",
  "add.removeFailed": "این بازی حذف نشد.",
  "add.continueFailed": "ادامه ممکن نشد. دوباره امتحان کن.",

  "search.label": "جست‌وجوی بازی",
  "search.placeholderLibrary": "بازی‌ای که داری را جست‌وجو کن…",
  "search.placeholderWishlist": "بازی‌ای که می‌خواهی را جست‌وجو کن…",
  "search.unavailable": "جست‌وجو فعلاً در دسترس نیست.",
  "search.slowDown": "کمی آهسته‌تر و دوباره امتحان کن.",
  "search.addFailed": "این بازی اضافه نشد. دوباره امتحان کن.",
  "search.noResults": "این یکی را پیدا نکردیم. نگران نباش، از بقیه‌ی چیزهایی که اضافه کنی یاد می‌گیریم.",

  "feed.title": "فید تو",
  "feed.picked": "انتخاب شده برای تو",
  "feed.next": "بعدی چه بازی کنم؟",
  "feed.nextSub": "از بازی‌هایی که از قبل داری",
  "feed.unplayed": "هنوز در کتابخانه‌ات",
  "feed.unplayedSub": "خریده‌ای، ولی کم بازی کرده‌ای",
  "feed.deals": "تخفیف‌های خوب برای تو",
  "feed.unusual": "خارج از عادت",
  "feed.unusualSub": "پیشنهادهای قوی خارج از ژانرهای همیشگی‌ات",
  "feed.popular": "محبوب‌های همین حالا",
  "feed.loadFailed": "بارگذاری فید با مشکل روبه‌رو شد. صفحه را تازه کن.",
  "feed.coldTitle": "بیا سلیقه‌ات را بشناسیم",
  "feed.coldSub": "بگو چه چیزی دوست داری تا پیشنهادهایت اینجا نمایش داده شوند.",
  "feed.takeQuiz": "شروع آزمون سلیقه",
  "feed.addPlayed": "بازی‌های بازی‌شده را اضافه کن",
  "feed.inMeantime": "فعلاً، محبوب‌های همین حالا",

  "sync.progress": "در حال همگام‌سازی کتابخانه‌ی استیم… با تمام‌شدنش پیشنهادها بهتر می‌شوند.",
  "sync.failed": "کتابخانه‌ی استیمت همگام نشد. مطمئن شو جزئیات بازی‌ها در پروفایل استیمت عمومی است و دوباره وارد شو.",

  "card.actions": "کنش‌ها",
  "card.like": "پسندیدم",
  "card.notInterested": "علاقه ندارم",
  "card.alreadyOwn": "این را دارم",
  "card.wishlist": "افزودن به علاقه‌مندی‌ها",
  "card.undo": "بازگرداندن",
  "card.removed": "از فیدت برداشته شد",

  "steam.bannerText": "استیم را وصل کن تا علاقه‌مندی‌هایت خودکار وارد شوند.",
  "steam.connect": "اتصال استیم",
  "steam.notNow": "فعلاً نه",
  "steam.cardTitle": "حساب استیمت را وصل کن",
  "steam.cardText": "کتابخانه و علاقه‌مندی‌هایت را وارد می‌کنیم تا پیشنهادها به بازی واقعی‌ات بخورند. فقط چیزی را می‌خوانیم که پروفایلت عمومی کرده است.",

  "library.title": "کتابخانه‌ی من",
  "library.tabAll": "همه",
  "library.tabSynced": "از استیم",
  "library.tabManual": "اضافه‌شده توسط من",
  "library.empty": "کتابخانه‌ات خالی است",
  "library.emptySub": "بازی‌هایی که بازی کرده‌ای را اضافه کن تا پیشنهادها بهتر شوند.",
  "library.playtime": "ساعت بازی",
  "library.bucket.barely_touched": "کم‌ دست‌خورده",
  "library.bucket.some_hours": "چند ساعتی",
  "library.bucket.sunk_50plus": "بیش از ۵۰ ساعت",
  "library.hours": "{h} بازی شده",
  "library.removeFailed": "این بازی حذف نشد.",
  "library.cycleFailed": "ساعت بازی به‌روز نشد.",

  "wishlist.title": "علاقه‌مندی‌ها",
  "wishlist.empty": "فهرست علاقه‌مندی‌هایت خالی است",
  "wishlist.emptySub": "بازی‌هایی که می‌خواهی را اضافه کن تا قیمتشان را به تومان ببینی.",
  "wishlist.fromSteam": "از استیم",
  "wishlist.addedByYou": "اضافه‌شده توسط تو",
  "wishlist.toCart": "افزودن به سبد",
  "wishlist.inCart": "در سبد",
  "wishlist.removeFailed": "این بازی حذف نشد.",
  "wishlist.cartFailed": "به سبد اضافه نشد.",

  "cart.title": "سبد خرید",
  "cart.empty": "سبد خریدت خالی است",
  "cart.emptySub": "بازی‌هایی که از پیشنهادها اضافه کنی اینجا و به تفکیک فروشگاه نمایش داده می‌شوند.",
  "cart.browse": "دیدن پیشنهادها",
  "cart.total": "مجموع",
  "cart.buy": "خرید از {platform}",
  "cart.noLink": "هنوز لینک فروشگاه نداریم",
  "cart.priceChanged": "قیمت از زمان افزودن تغییر کرده است",
  "cart.locked": "قبلاً {price}",
  "cart.removeFailed": "این مورد حذف نشد.",

  "settings.title": "تنظیمات",
  "settings.accounts": "حساب‌های متصل",
  "settings.steamConnected": "استیم متصل است",
  "settings.emailAccount": "ایمیل",
  "settings.region": "منطقه‌ی قیمت",
  "settings.budget": "بودجه‌ی ماهانه",
  "settings.budgetNone": "بدون سقف",
  "settings.language": "زبان",
  "settings.languageNote": "فقط در همین مرورگر ذخیره می‌شود.",
  "settings.privacy": "حریم خصوصی",
  "settings.privacyNote": "برای حذف حساب یا داده‌هایت به {email} ایمیل بزن.",
  "settings.saved": "ذخیره شد",

  "detail.back": "بازگشت",
  "detail.about": "درباره‌ی بازی",
  "detail.editions": "نسخه‌ها و قیمت",
  "detail.priceIn": "قیمت در {region}",
  "detail.free": "رایگان",
  "detail.addToCart": "افزودن به سبد",
  "detail.inCart": "در سبد",
  "detail.buy": "صفحه‌ی فروشگاه",
  "detail.owned": "در کتابخانه‌ی تو",
  "detail.like": "پسندیدم",
  "detail.dislike": "نپسندیدم",
  "detail.notInterested": "علاقه ندارم",
  "detail.alreadyOwn": "این را دارم",
  "detail.wishlist": "افزودن به علاقه‌مندی‌ها",
  "detail.inWishlist": "در علاقه‌مندی‌های تو",
  "detail.tags": "برچسب‌ها",
  "detail.similar": "بازی‌های مشابه",
  "detail.whyPicked": "چرا این را انتخاب کردیم",
  "detail.signInPrompt": "برای دیدن قیمت منطقه‌ات و افزودن این بازی به فهرست‌ها وارد شو.",
  "detail.signIn": "ورود",
  "detail.region.US": "ایالات متحده",
  "detail.region.UK": "بریتانیا",
  "detail.region.EU": "منطقه‌ی یورو",
  "detail.region.UA": "اوکراین",
  "detail.region.TR": "ترکیه",
  "detail.region.AR": "آرژانتین",
  "detail.notFound": "این بازی را پیدا نکردیم.",
  "detail.by": "از {name}",
  "detail.reviews": "{n}٪ نظر مثبت",

  "dna.title": "دی‌ان‌ای گیمر تو",
  "dna.sub": "بر اساس کتابخانه و ساعت بازی استیمت",
  "dna.yourType": "نوع تو",
  "dna.totalPlaytime": "کل ساعت بازی",
  "dna.backlog": "بازی در بک‌لاگ تو",
  "dna.achievements": "میانگین تکمیل دستاوردها",
  "dna.studio": "پربازی‌ترین استودیو",
  "dna.topGenres": "ژانرهای برتر بر اساس ساعت بازی",
  "dna.mostPlayed": "پربازی‌ترین",
  "dna.typeNote": "«نوع» یک برچسب سرگرم‌کننده است که از رفتار روشن (ساعت، بک‌لاگ، تنوع ژانر) به دست می‌آید؛ تحلیل روان‌شناختی نیست.",
  "dna.needsSteamTitle": "دی‌ان‌ای گیمر به استیم نیاز دارد",
  "dna.needsSteamText": "از ساعت بازی واقعی ساخته می‌شود و فقط از حساب استیم قابل خواندن است.",
  "dna.needsSteamButton": "ورود با استیم",
  "dna.needsSteamNote": "حساب و بازی‌های فعلی‌ات می‌مانند.",
  "dna.syncingTitle": "در حال خواندن کتابخانه‌ات…",
  "dna.syncingText": "به‌محض پایان همگام‌سازی اول استیم، دی‌ان‌ای گیمرت نمایش داده می‌شود. معمولاً یکی دو دقیقه طول می‌کشد.",
  "dna.type.completionist": "کامل‌کننده",
  "dna.type.backlog_collector": "جمع‌کننده‌ی بک‌لاگ",
  "dna.type.genre_explorer": "کاوشگر ژانر",
  "dna.type.loyalist": "وفادار",
  "dna.type.genre_specialist": "متخصص ژانر",
  "dna.type.balanced": "گیمر متعادل",

  "wishlist.view": "دیدن بازی",
  "state.notFoundTitle": "این صفحه وجود ندارد",
  "state.notFoundText": "شاید لینک قدیمی باشد یا بازی از کاتالوگ حذف شده باشد.",
  "state.toFeed": "بازگشت به فید من",
  "state.errorTitle": "مشکلی پیش آمد",
  "state.errorText": "مشکل از سمت ماست. چیزی از کارهایت از بین نرفته است.",
  "state.rateTitle": "کمی تند می‌روی",
  "state.rateText": "درخواست‌ها زیاد بوده است. لطفاً ۳۰ ثانیه صبر کن و دوباره امتحان کن. تغییرات تا اینجایت ذخیره شده‌اند.",
};

const DICT: Record<Lang, Record<Key, string>> = { en, fa };

/** Look up a string and fill {placeholders}. Numbers are shown in the language's digits. */
export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  const raw = DICT[lang][key] ?? en[key];
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = vars[name];
    if (v === undefined) return `{${name}}`;
    return typeof v === "number" ? formatInt(v, lang) : String(v);
  });
}

export function placeholdersOf(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}
