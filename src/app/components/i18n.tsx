import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Converter, CustomConverter } from "opencc-js/t2cn";

// "zh" is Traditional Chinese (Hong Kong), "zh-CN" is Simplified Chinese (Mainland).
// Simplified strings are derived from the Traditional ones at runtime, so only `zh` is stored below.
export type Lang = "en" | "zh" | "zh-CN";

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "en",    label: "English",  short: "EN" },
  { code: "zh",    label: "繁體中文", short: "繁" },
  { code: "zh-CN", label: "简体中文", short: "简" },
];

const HTML_LANG: Record<Lang, string> = { en: "en", zh: "zh-HK", "zh-CN": "zh-CN" };
const STORAGE_KEY = "lendy.lang";

const hkToCn = Converter({ from: "hk", to: "cn" });

// Mainland wording for terms where a character-level conversion still reads as Hong Kong usage.
// Keys are already-simplified text; longest match wins.
const mainlandTerms = CustomConverter([
  ["帐号", "账号"], ["帐户", "账户"],
  ["登入", "登录"], ["登出", "退出登录"],
  ["电邮地址", "邮箱地址"], ["你的电邮", "你的邮箱"], ["电邮", "邮件"],
  ["连结", "链接"], ["重设", "重置"], ["搜寻", "搜索"],
  ["按金", "押金"], ["相片", "照片"], ["储存", "保存"],
  ["讯息", "消息"], ["联络", "联系"], ["设定", "设置"], ["汇出", "导出"],
  ["栏位", "字段"], ["字元", "字符"], ["载入", "加载"], ["略过", "跳过"],
  ["建立", "创建"], ["交收", "交接"], ["冷气", "空调"],
  ["重新整理页面", "刷新页面"], ["即时可租", "现在可租"], ["即时更新", "实时更新"],
  ["最近新增", "最近上新"], ["新增", "添加"],
  ["管理员面板", "管理后台"],
  ["发布刊登", "发布物品"], ["刊登物品", "发布物品"], ["刊登你的", "发布你的"],
  ["总刊登数", "物品总数"], ["已刊登", "已发布"], ["新刊登", "新发布"], ["刊登", "物品"],
]);

const simplifiedCache = new Map<string, string>();
function toSimplified(text: string): string {
  let out = simplifiedCache.get(text);
  if (out === undefined) {
    out = mainlandTerms(hkToCn(text));
    simplifiedCache.set(text, out);
  }
  return out;
}

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh" || stored === "zh-CN") return stored;
  } catch { /* storage unavailable */ }
  return "en";
}

const translations: Record<string, { en: string; zh: string }> = {
  // Nav
  home:      { en: "Home",      zh: "首頁" },
  browse:    { en: "Browse",    zh: "瀏覽" },
  listItem:  { en: "List Item", zh: "刊登物品" },
  activity:  { en: "Activity",  zh: "動態" },
  myListings:{ en: "My Listings", zh: "我的物品" },
  requests:  { en: "Requests",  zh: "我的租賃請求" },
  profile:   { en: "Profile",   zh: "個人資料" },
  // Onboarding
  slide1Title: { en: "Rent what you need.\nLeave what you don't.", zh: "租你所需\n物盡其用" },
  slide2Title: { en: "List your idle appliances\nin under 3 minutes.", zh: "3分鐘內\n放租電器" },
  slide3Title: { en: "Recycle responsibly.\nGive your items a second life.", zh: "負責任回收\n讓閒置物品重獲新生" },
  getStarted: { en: "Get Started", zh: "開始使用" },
  haveAccount: { en: "I already have an account", zh: "我已經有帳號" },
  // Auth
  signUp: { en: "Sign Up", zh: "註冊" },
  logIn: { en: "Log In", zh: "登入" },
  email: { en: "Email", zh: "電郵地址" },
  password: { en: "Password", zh: "密碼" },
  fullName: { en: "Full Name", zh: "全名" },
  phone: { en: "Phone Number", zh: "電話號碼" },
  forgotPassword: { en: "Forgot password?", zh: "忘記密碼？" },
  verifyStudent: { en: "Create your Lendy account", zh: "建立你的 Lendy 帳戶" },
  resetPasswordSent: { en: "Check your email for a password reset link.", zh: "請查看電郵以獲取密碼重設連結。" },
  sendResetLink: { en: "Send reset link", zh: "發送密碼重設連結" },
  newPassword: { en: "New Password", zh: "新密碼" },
  confirmPassword: { en: "Confirm Password", zh: "確認密碼" },
  updatePassword: { en: "Update Password", zh: "更新密碼" },
  passwordUpdated: { en: "Password updated! Please log in.", zh: "密碼已更新！請重新登入。" },
  googleSignIn: { en: "Continue with Google", zh: "使用 Google 繼續" },
  noAccount: { en: "Don't have an account?", zh: "還沒有帳號？" },
  hasAccount: { en: "Already have an account?", zh: "已有帳號？" },
  // Email verification
  checkYourEmail: { en: "Check Your Email", zh: "查看你的電郵" },
  verifyEmailMsg: { en: "We've sent a verification link to your email address. Please click the link to activate your account.", zh: "我們已向你的電郵發送了驗證連結，請點擊連結以啟用你的帳號。" },
  resendEmail: { en: "Resend Email", zh: "重新發送電郵" },
  emailResent: { en: "Verification email resent!", zh: "驗證電郵已重新發送！" },
  backToLogin: { en: "Back to Log In", zh: "繼續登入" },
  // Home
  heroTitle: { en: "Rent Smarter in Hong Kong", zh: "在香港租得更快更好" },
  searchPlaceholder: { en: "Search appliances...", zh: "搜尋電器..." },
  nearYou: { en: "Within 10 min walk", zh: "步行10分鐘內" },
  recentlyAdded: { en: "Recently Added", zh: "最近新增" },
  lastMinute: { en: "Last Minute — Available Today", zh: "限時 — 今日可租" },
  seeAll: { en: "See all", zh: "查看全部" },
  homeEmptyTitle: { en: "No items listed yet", zh: "暫無物品" },
  homeEmptySub: { en: "Be the first to list an appliance in your area.", zh: "成為第一個在你所在地區放租電器的人。" },
  // Categories
  kitchen: { en: "Kitchen", zh: "廚房用具" },
  electronics: { en: "Electronics", zh: "電子用品" },
  furniture: { en: "Furniture", zh: "傢俱" },
  camera: { en: "Camera", zh: "相機設備" },
  cooling: { en: "Cooling", zh: "冷暖設備" },
  other: { en: "Other", zh: "其他物品" },
  // Listing detail
  perDay: { en: "/day", zh: "/日" },
  perWeek: { en: "/week", zh: "/週" },
  perMonth: { en: "/month", zh: "/月" },
  deposit: { en: "deposit required", zh: "需付按金" },
  requestToRent: { en: "Request to Rent", zh: "請求租用" },
  save: { en: "Save", zh: "收藏" },
  description: { en: "Description", zh: "描述你的物品" },
  availability: { en: "Availability", zh: "出租日期" },
  condition: { en: "Condition", zh: "狀態" },
  verified: { en: "Verified Member", zh: "已驗證會員" },
  memberSince: { en: "Member since", zh: "加入於" },
  minWalk: { en: "min walk", zh: "分鐘步行" },
  // Rent flow
  dates: { en: "Dates", zh: "日期" },
  message: { en: "Message", zh: "訊息" },
  confirm: { en: "Confirm", zh: "確認" },
  next: { en: "Next", zh: "下一步" },
  back: { en: "Back", zh: "返回" },
  startDate: { en: "Start Date", zh: "開始日期" },
  endDate: { en: "End Date", zh: "結束日期" },
  duration: { en: "days", zh: "天" },
  total: { en: "Total", zh: "總計" },
  messageToOwner: { en: "Message to owner", zh: "給物主的訊息" },
  messagePlaceholder: { en: "Hi, I need this for about 2 weeks starting next Monday...", zh: "你好，我需要租用大約兩週，從下週一開始..." },
  pickupPref: { en: "Pickup preference", zh: "取貨方式" },
  iCanCollect: { en: "I can collect", zh: "我自取" },
  canYouDeliver: { en: "Can you drop off?", zh: "可以送來嗎？" },
  agreeTerms: { en: "I have read and agree to the rental terms", zh: "我已閱讀並同意租賃條款" },
  sendRequest: { en: "Send Request", zh: "發送請求" },
  requestSent: { en: "Request Sent!", zh: "請求已發送！" },
  requestSentMsg: { en: "You'll receive an email when they respond — usually within 24 hours", zh: "對方回覆時你會收到電郵通知 — 通常24小時內" },
  viewMyRequests: { en: "View My Requests", zh: "查看我的請求" },
  backToBrowse: { en: "Back to Browse", zh: "返回瀏覽" },
  disclaimer: { en: "This is a manual agreement. Payment and deposit are handled at pickup.", zh: "這是人工協議。付款和按金在取貨時處理。" },
  // Create listing
  createListing: { en: "Create Listing", zh: "刊登你的物品" },
  details: { en: "Details", zh: "詳情" },
  pricing: { en: "Pricing", zh: "定價" },
  review: { en: "Review", zh: "審核" },
  title: { en: "Title", zh: "標題" },
  category: { en: "Category", zh: "類別" },
  addPhotos: { en: "Add Photos", zh: "新增相片" },
  dailyPrice: { en: "Daily Price (HK$)", zh: "每日租金 (HK$)" },
  weeklyPrice: { en: "Weekly Price (HK$)", zh: "每週租金 (HK$)" },
  monthlyPrice: { en: "Monthly Price (HK$)", zh: "每月租金 (HK$)" },
  depositAmount: { en: "Deposit (HK$)", zh: "按金 (HK$)" },
  availableNow: { en: "Available now", zh: "即時可租" },
  location: { en: "Location", zh: "位置" },
  publishListing: { en: "Publish Listing", zh: "發布刊登" },
  saveAsDraft: { en: "Save as Draft", zh: "儲存草稿" },
  worksPerf: { en: "Works perfectly", zh: "運作完好" },
  minorIssues: { en: "Minor issues", zh: "輕微問題" },
  forParts: { en: "For parts", zh: "部分零件損壞" },
  // Recycle
  recycleTitle: { en: "Leaving the city?\nDon't bin it.", zh: "即將離開？\n別丟棄它。" },
  recycleSub: { en: "Submit your item and we'll collect it, refurbish if needed, and give it a second life on Lendy.", zh: "提交你的物品，我們會收集、翻新，讓它在 Lendy 上重獲新生。" },
  submitAppliance: { en: "Submit an Appliance", zh: "提交電器" },
  itemType: { en: "Item Type", zh: "物品類型" },
  working: { en: "Working", zh: "正常運作" },
  partiallyWorking: { en: "Partially Working", zh: "部分運作" },
  broken: { en: "Broken", zh: "已損壞" },
  pickupDate: { en: "Preferred Pickup Date", zh: "偏好取貨日期" },
  expectedPrice: { en: "Expected Price (leave blank to donate)", zh: "預期價格（留空即捐贈）" },
  submitCollection: { en: "Submit for Collection", zh: "提交收集" },
  recycleConfirm: { en: "We'll be in touch within 48 hours to arrange collection", zh: "我們會在48小時內聯繫你安排收集" },
  // My Requests
  myRequests: { en: "My Requests", zh: "我的請求" },
  myRentalRequests: { en: "My Rental Requests", zh: "我的租賃請求" },
  active: { en: "Active", zh: "進行中" },
  pending: { en: "Pending", zh: "待處理" },
  past: { en: "Past", zh: "過去" },
  accepted: { en: "Accepted", zh: "已接受" },
  rejected: { en: "Rejected", zh: "已拒絕" },
  cancelled: { en: "Cancelled", zh: "已取消" },
  completed: { en: "Completed", zh: "已完成" },
  myRequestDetail: { en: "My Request", zh: "我的請求詳情" },
  awaitingResponse: { en: "Awaiting owner response", zh: "等待物主回覆" },
  requestDeclined: { en: "This request was declined.", zh: "此請求已被拒絕。" },
  contactOwner: { en: "Contact owner", zh: "聯絡物主" },
  cancelRequest: { en: "Cancel Request", zh: "取消請求" },
  cancelConfirm: { en: "Are you sure you want to cancel this request?", zh: "你確定要取消此請求嗎？" },
  ownerAccepted: { en: "The owner has accepted your request. Contact them to arrange pickup.", zh: "物主已接受你的請求，請聯絡對方安排取貨。" },
  // My Listings
  brand: { en: "Brand", zh: "品牌" },
  editListing: { en: "Edit Listing", zh: "編輯刊登" },
  deleteListing: { en: "Delete Listing", zh: "刪除物品" },
  deleteConfirm: { en: "Are you sure? This cannot be undone.", zh: "確定嗎？此操作無法撤銷。" },
  saveChanges: { en: "Save Changes", zh: "儲存更改" },
  listingUpdated: { en: "Listing updated!", zh: "刊登已更新！" },
  editRequest: { en: "Edit Request", zh: "編輯租賃請求" },
  deleteRequest: { en: "Delete Request", zh: "刪除租賃請求" },
  leaveReview: { en: "Leave a Review", zh: "留下評價" },
  reviewSubmitted: { en: "Thank you for your review!", zh: "感謝你的評價！" },
  markCompleted: { en: "Mark as Completed", zh: "標記為已完成" },
  markCompletedConfirm: { en: "Confirm the rental period has ended and the item has been returned?", zh: "確認租期已結束且物品已歸還？" },
  rentalCompleted: { en: "Rental completed!", zh: "租賃已完成！" },
  recycleDescription: { en: "Description (optional)", zh: "描述（選填）" },
  reviewRenter: { en: "Review this Renter", zh: "評價此租客" },
  noReviewsYet: { en: "No reviews yet — be the first to rent!", zh: "暫無評價 — 成為第一個租用的人！" },
  draft: { en: "Draft", zh: "草稿" },
  unavailable: { en: "Unavailable", zh: "不可用" },
  edit: { en: "Edit", zh: "編輯" },
  delete: { en: "Delete", zh: "刪除" },
  markUnavailable: { en: "Mark Unavailable", zh: "標記為不可用" },
  incomingRequests: { en: "Incoming Requests", zh: "收到的請求" },
  accept: { en: "Accept", zh: "接受" },
  decline: { en: "Decline", zh: "拒絕" },
  // Request management
  listingRequests: { en: "Rental Requests", zh: "租用請求" },
  viewRequest: { en: "View Request", zh: "查看請求" },
  rentalPeriod: { en: "Rental Period", zh: "租用期間" },
  rentersMessage: { en: "Message from renter", zh: "租客留言" },
  acceptRequest: { en: "Accept Request", zh: "接受請求" },
  acceptConfirm: { en: "Accept this request? All other pending requests will be automatically declined.", zh: "接受此請求？其他待處理請求將自動拒絕。" },
  requestAccepted: { en: "Request accepted!", zh: "請求已接受！" },
  alreadyAccepted: { en: "You have already accepted a request for this listing.", zh: "你已接受此刊登的一個請求。" },
  renterCollects: { en: "Renter will collect", zh: "租客自取" },
  ownerDelivers: { en: "Owner delivers", zh: "物主送貨" },
  noRequests: { en: "No requests yet", zh: "暫無請求" },
  // Edit Profile
  editProfile: { en: "Edit Profile", zh: "編輯資料" },
  changePhoto: { en: "Change photo", zh: "更換照片" },
  displayName: { en: "Display Name", zh: "顯示名稱" },
  selectUniversity: { en: "Select university", zh: "選擇大學" },
  saving: { en: "Saving...", zh: "儲存中..." },
  uploadPhotoFailed: { en: "Failed to upload photo. Please try again.", zh: "上傳照片失敗，請重試。" },
  uploadPhotoSaveFailed: { en: "Photo uploaded but failed to save. Please try again.", zh: "照片已上傳但儲存失敗，請重試。" },
  // Email Preferences
  emailPrefsSaved: { en: "Preferences saved!", zh: "偏好已儲存！" },
  emailPrefsRentalReq: { en: "Rental request notifications", zh: "租用請求通知" },
  emailPrefsRentalReqDesc: { en: "Email me when someone requests my listing", zh: "有人請求租用我的物品時發送電郵" },
  emailPrefsReqUpdates: { en: "Request status updates", zh: "請求狀態更新" },
  emailPrefsReqUpdatesDesc: { en: "Email me when my request is accepted or rejected", zh: "我的請求被接受或拒絕時發送電郵" },
  emailPrefsNearby: { en: "New listings near me", zh: "附近新刊登" },
  emailPrefsNearbyDesc: { en: "Get notified about new items in your area", zh: "獲取你所在地區的新物品通知" },
  emailPrefsDigest: { en: "Weekly digest", zh: "每週摘要" },
  emailPrefsDigestDesc: { en: "A weekly summary of activity on Lendy", zh: "Lendy 每週活動摘要" },
  noPendingApprovals: { en: "No pending approvals", zh: "暫無待批准的刊登" },
  // Admin pages
  allListings: { en: "All Listings", zh: "所有刊登" },
  noListingsYet: { en: "No listings yet", zh: "暫無刊登" },
  inactive: { en: "Inactive", zh: "未啟用" },
  allRequests: { en: "All Requests", zh: "所有請求" },
  noRequestsYet: { en: "No requests yet", zh: "暫無請求" },
  noSubmissionsYet: { en: "No submissions yet", zh: "暫無提交" },
  markCollected: { en: "Mark Collected", zh: "標記為已收集" },
  markListed: { en: "Mark Listed", zh: "標記為已刊登" },
  // Earnings
  myEarnings: { en: "My Earnings", zh: "我的收益" },
  totalEarned: { en: "Total Earned", zh: "總收益" },
  thisMonth: { en: "This Month", zh: "本月" },
  earningsCompletedOnly: { en: "Only completed rentals are counted. Active rentals will appear once finished.", zh: "只計算已完成的租賃。進行中的租賃完成後將顯示。" },
  earningsLast6Months: { en: "Earnings — last 6 months", zh: "收益 — 最近6個月" },
  earningsEmptyChart: { en: "Your earnings will appear here once you complete your first rental", zh: "完成第一筆租賃後，你的收益將在此顯示" },
  rentalHistory: { en: "Rental History", zh: "租賃記錄" },
  earningsEmptyHistory: { en: "Earnings will appear here once your first rental is completed", zh: "第一筆租賃完成後，收益將在此顯示" },
  exportSummary: { en: "Export Summary", zh: "匯出摘要" },
  manageListing: { en: "Manage Listing", zh: "管理刊登" },
  // Profile
  settings: { en: "Settings", zh: "設定" },
  notifications: { en: "Notifications", zh: "通知" },
  emailPrefs: { en: "Email Preferences", zh: "電郵偏好" },
  logOut: { en: "Log Out", zh: "登出" },
  itemsListed: { en: "Items Listed", zh: "已刊登" },
  rentalsCompleted: { en: "Rentals Completed", zh: "已完成租賃" },
  language: { en: "Language", zh: "語言" },
  // Admin
  admin: { en: "Admin Dashboard", zh: "管理員面板" },
  totalListings: { en: "Total Listings", zh: "總刊登數" },
  pendingApprovals: { en: "Pending Approvals", zh: "待批准的請求" },
  openRequests: { en: "Open Requests", zh: "公開請求" },
  recyclingSubmissions: { en: "Recycling Submissions", zh: "回收提交" },
  approve: { en: "Approve", zh: "批准" },
  reject: { en: "Reject", zh: "拒絕" },
  savedListings: { en: "Saved Items", zh: "已收藏" },
  noSavedItems: { en: "No saved items yet", zh: "暫無收藏" },
  browseToSave: { en: "Browse listings and tap the heart to save items", zh: "瀏覽刊登並點擊愛心以收藏" },
  reviewsFor: { en: "Reviews for", zh: "關於" },
  forListing: { en: "For:", zh: "關於:" },
  // Chat
  messageOwner: { en: "Message Owner", zh: "聯絡物主" },
  messageRenter: { en: "Message Renter", zh: "聯絡租客" },
  chatPlaceholder: { en: "Type a message...", zh: "輸入訊息..." },
  noMessages: { en: "Start the conversation!", zh: "開始對話吧！" },
  chat: { en: "Chat", zh: "聊天" },
  // Onboarding & auth
  next: { en: "Next", zh: "下一步" },
  skip: { en: "Skip", zh: "略過" },
  browseFirst: { en: "Browse items first", zh: "先逛逛" },
  joinLendy: { en: "Join Lendy", zh: "加入 Lendy" },
  creatingAccount: { en: "Creating account...", zh: "正在建立帳戶..." },
  loggingIn: { en: "Logging in...", zh: "正在登入..." },
  sending: { en: "Sending...", zh: "正在發送..." },
  resetYourPassword: { en: "Reset your password", zh: "重設你的密碼" },
  errFillAllFields: { en: "Please fill in all fields.", zh: "請填寫所有欄位。" },
  errPasswordLength: { en: "Password must be at least 6 characters.", zh: "密碼最少需要 6 個字元。" },
  errEmailPassword: { en: "Please enter your email and password.", zh: "請輸入你的電郵和密碼。" },
  errEnterEmail: { en: "Please enter your email.", zh: "請輸入你的電郵。" },
  // Listing lifecycle
  pendingReview: { en: "Pending review", zh: "審核中" },
  rejectedListing: { en: "Rejected", zh: "未獲批准" },
  submittedForReview: { en: "Submitted for review. Your listing goes live once an admin approves it.", zh: "已提交審核，管理員批准後刊登即會上架。" },
  deleteBlockedRented: { en: "This item is currently rented out. Mark the rental completed before deleting it.", zh: "此物品正在出租中，請先將租用標記為已完成再刪除。" },
  deleteWillCancel: { en: "Open requests on this listing will be cancelled and the renters notified.", zh: "此刊登的待處理請求將被取消，並會通知租客。" },
  deleteFailed: { en: "Couldn't delete this listing. Please try again.", zh: "刪除刊登失敗，請重試。" },
  listingRemoved: { en: "This listing was removed by the owner.", zh: "物主已移除此刊登。" },
  listingRemovedShort: { en: "Listing removed", zh: "刊登已移除" },
  currentlyUnavailable: { en: "Currently unavailable", zh: "暫時不可租用" },
  alreadyRequested: { en: "You already have an open request for this item.", zh: "你已就此物品提交了請求。" },
  waitingForUploads: { en: "Waiting for photos to upload…", zh: "正在上傳相片…" },
  rentalTotal: { en: "Rental total", zh: "租金總額" },
  messageSendFailed: { en: "Message not sent. Please try again.", zh: "訊息未能發送，請重試。" },
  chatListingRemoved: { en: "This listing was removed. You can still read past messages.", zh: "此刊登已被移除，你仍可查看過往訊息。" },
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** True for either Chinese interface; pick the Traditional source text, then pass it through `zh`. */
  isZh: boolean;
  t: (key: string) => string;
  /** Renders Traditional Chinese text in the active Chinese script. */
  zh: (text: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  isZh: false,
  t: (k) => k,
  zh: (text) => text,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const isZh = lang !== "en";
  const zh = (text: string) => (lang === "zh-CN" && text ? toSimplified(text) : text);
  const t = (key: string) => {
    const entry = translations[key];
    if (!entry) return key;
    return isZh ? zh(entry.zh) : entry.en;
  };
  return (
    <I18nContext.Provider value={{ lang, setLang, isZh, t, zh }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

/** Non-hook lookup. Returns the stored text for "en"/"zh"; "zh-CN" is converted to Simplified. */
export const translate = (key: string, lang: Lang) => {
  const entry = translations[key];
  if (!entry) return key;
  if (lang === "en") return entry.en;
  return lang === "zh-CN" ? toSimplified(entry.zh) : entry.zh;
};
