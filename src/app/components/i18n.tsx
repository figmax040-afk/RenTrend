import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "en" | "zh";

const translations: Record<string, Record<Lang, string>> = {
  // Nav
  home:      { en: "Home",      zh: "首頁" },
  browse:    { en: "Browse",    zh: "瀏覽" },
  listItem:  { en: "List Item", zh: "刊登物品" },
  myListings:{ en: "My Listings", zh: "我的物品" },
  requests:  { en: "Requests",  zh: "租賃請求" },
  profile:   { en: "Profile",   zh: "個人資料" },
  // Onboarding
  slide1Title: { en: "Rent what you need.\nLeave what you don't.", zh: "租你所需\n不需斷捨離" },
  slide2Title: { en: "List your idle appliances\nin under 3 minutes.", zh: "3分鐘內\n刊登閒置電器" },
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
  verifyStudent: { en: "Create your RenTrend account", zh: "加入電易家" },
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
  heroTitle: { en: "Rent Smarter in Hong Kong", zh: "在香港更聰明地租用" },
  searchPlaceholder: { en: "Search appliances...", zh: "搜尋電器..." },
  nearYou: { en: "Within 10 min walk", zh: "步行10分鐘內" },
  recentlyAdded: { en: "Recently Added", zh: "最近新增" },
  lastMinute: { en: "Last Minute — Available Today", zh: "限時 — 今日可租" },
  seeAll: { en: "See all", zh: "查看全部" },
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
  recycleSub: { en: "Submit your item and we'll collect it, refurbish if needed, and give it a second life on RenTrend.", zh: "提交你的物品，我們會收集、翻新，讓它在電易家上重獲新生。" },
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
  active: { en: "Active", zh: "進行中" },
  pending: { en: "Pending", zh: "待處理" },
  past: { en: "Past", zh: "過去" },
  accepted: { en: "Accepted", zh: "已接受" },
  rejected: { en: "Rejected", zh: "已拒絕" },
  cancelled: { en: "Cancelled", zh: "已取消" },
  myRequestDetail: { en: "My Request", zh: "我的請求詳情" },
  awaitingResponse: { en: "Awaiting owner response", zh: "等待物主回覆" },
  requestDeclined: { en: "This request was declined.", zh: "此請求已被拒絕。" },
  contactOwner: { en: "Contact owner", zh: "聯絡物主" },
  cancelRequest: { en: "Cancel Request", zh: "取消請求" },
  cancelConfirm: { en: "Are you sure you want to cancel this request?", zh: "你確定要取消此請求嗎？" },
  ownerAccepted: { en: "The owner has accepted your request. Contact them to arrange pickup.", zh: "物主已接受你的請求，請聯絡他們安排取貨。" },
  // My Listings
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
  // Profile
  editProfile: { en: "Edit Profile", zh: "編輯資料" },
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
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: string) => translations[key]?.[lang] || key;
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
