// UI strings for the pitch-demo features. Merged into the main translations in components/i18n.tsx.
// Placeholders like {n} are filled with fill().

export function fill(text: string, vars: Record<string, string | number>) {
  // {s} pluralises English units from {n}; Chinese strings don't use it
  const all: Record<string, string | number> = { s: vars.n === 1 ? "" : "s", ...vars };
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in all ? String(all[k]) : `{${k}}`));
}

export const demoStrings: Record<string, { en: string; zh: string }> = {
  // Shared
  sponsored: { en: "Sponsored", zh: "贊助" },
  featured: { en: "Featured", zh: "精選" },
  plusBadge: { en: "Plus", zh: "Plus" },
  powerLender: { en: "Power Lender", zh: "Power Lender" },
  newListing: { en: "New", zh: "新" },
  free: { en: "Free", zh: "免費" },
  close: { en: "Close", zh: "關閉" },
  demoAdNote: { en: "Demo placement. Advertisers pay Lendy per impression and click; this one goes nowhere.", zh: "示範廣告位。廣告商按曝光及點擊向 Lendy 付費；此廣告不會跳轉。" },
  monthsN: { en: "{n} month{s}", zh: "{n} 個月" },
  weeksN: { en: "{n} week{s}", zh: "{n} 週" },
  daysN: { en: "{n} day{s}", zh: "{n} 天" },

  // Rent request
  pickupMethod: { en: "Pickup method", zh: "取貨方式" },
  pickupMeetup: { en: "Meet up", zh: "面交" },
  pickupLocker: { en: "Locker", zh: "儲物櫃" },
  pickupDelivery: { en: "Delivery", zh: "送貨" },
  pickupMeetupHint: { en: "Arrange a time and place in chat.", zh: "在聊天中約定時間和地點。" },
  pickupLockerHint: { en: "The owner drops it in a locker; you collect with a 4-digit code.", zh: "物主把物品放入儲物櫃，你用 4 位數密碼取件。" },
  pickupDeliveryHint: { en: "Delivered to your door.", zh: "送貨上門。" },
  chooseLocker: { en: "Choose a locker", zh: "選擇儲物櫃" },
  lockerRequired: { en: "Pick a locker to continue.", zh: "請選擇儲物櫃。" },
  freeWithPlus: { en: "Free with Lendy Plus", zh: "Lendy Plus 會員免費" },
  minOneDay: { en: "Minimum rental is 1 day.", zh: "最短租期為 1 天。" },
  totalDaysLabel: { en: "Rental length", zh: "租用時間" },
  payAfterAccept: { en: "Nothing is charged now. Once the owner accepts, you pay securely through Lendy and we hold it until the item is returned.", zh: "現在不會收費。物主接受後，你會透過 Lendy 安全付款，款項由我們保管至物品歸還。" },

  // Checkout
  checkout: { en: "Checkout", zh: "結帳" },
  payNow: { en: "Pay now", zh: "立即付款" },
  paymentDue: { en: "Payment due", zh: "待付款" },
  paymentDueMsg: { en: "The owner accepted. Pay to confirm your booking.", zh: "物主已接受，付款即可確認預訂。" },
  rentalSubtotal: { en: "Rental subtotal", zh: "租金小計" },
  refundableDeposit: { en: "Refundable deposit", zh: "可退還按金" },
  deliveryFee: { en: "Delivery fee", zh: "送貨費" },
  lockerFee: { en: "Locker fee", zh: "儲物櫃費用" },
  pickupFeeNone: { en: "Meet-up pickup", zh: "面交取貨" },
  promoCode: { en: "Promo code", zh: "優惠碼" },
  apply: { en: "Apply", zh: "使用" },
  remove: { en: "Remove", zh: "移除" },
  promoInvalid: { en: "That code isn't valid.", zh: "此優惠碼無效。" },
  promoFirstOnly: { en: "This code only works on your first rental.", zh: "此優惠碼只適用於首次租用。" },
  promoOwnCode: { en: "You can't use your own referral code.", zh: "不能使用自己的推薦碼。" },
  discount: { en: "Discount", zh: "折扣" },
  payTotal: { en: "Total to pay", zh: "應付總額" },
  paySecurely: { en: "Pay securely", zh: "安全付款" },
  processingPayment: { en: "Processing payment…", zh: "正在處理付款…" },
  escrowPromise: { en: "Lendy holds your payment and deposit until the item is returned.", zh: "Lendy 會保管你的付款和按金，直至物品歸還。" },
  demoCard: { en: "Visa •••• 4242 (demo card — no real charge)", zh: "Visa •••• 4242（示範卡，不會真正扣款）" },
  paymentSuccess: { en: "Payment held by Lendy", zh: "款項已由 Lendy 保管" },
  paymentSuccessMsg: { en: "Your booking is confirmed. Do the pickup handover when you meet.", zh: "預訂已確認。取貨時請完成交收錄影。" },
  viewRental: { en: "View rental", zh: "查看租賃" },
  alreadyPaid: { en: "This rental is already paid.", zh: "此租賃已付款。" },

  // Escrow tracker
  escrowTitle: { en: "Payment protection", zh: "付款保障" },
  escrowUnpaid: { en: "Unpaid", zh: "未付款" },
  escrowHeld: { en: "Held by Lendy", zh: "由 Lendy 保管" },
  escrowReleased: { en: "Released", zh: "已發放" },
  escrowRefunded: { en: "Refunded", zh: "已退款" },
  stepAccepted: { en: "Accepted", zh: "已接受" },
  stepPaid: { en: "Paid & held", zh: "已付款並保管" },
  stepPickedUp: { en: "Picked up", zh: "已取貨" },
  stepReturned: { en: "Returned", zh: "已歸還" },
  stepReleased: { en: "Payout & deposit released", zh: "已發放款項及退還按金" },
  stepRefunded: { en: "Refunded to renter", zh: "已退款給租客" },
  escrowNoteUnpaid: { en: "Waiting for the renter to pay.", zh: "等待租客付款。" },
  escrowNoteHeld: { en: "Lendy is holding the payment and deposit until the return handover is confirmed by both of you.", zh: "Lendy 會保管款項和按金，直至雙方確認歸還交收。" },
  escrowNoteReleased: { en: "The lender has been paid and the deposit returned to the renter.", zh: "已向物主發放款項，並把按金退還租客。" },
  escrowNoteRefunded: { en: "The booking was cancelled and the full amount refunded.", zh: "預訂已取消，全數退款。" },

  // Locker
  lockerCode: { en: "Locker code", zh: "儲物櫃密碼" },
  lockerCodeHint: { en: "Use this code at the locker to drop off or collect.", zh: "在儲物櫃輸入此密碼存放或取件。" },
  lockerCodeAfterPay: { en: "Your code appears here once the rental is paid.", zh: "付款後密碼會在此顯示。" },

  // Handover
  handoverTitle: { en: "Video handover", zh: "交收錄影" },
  handoverIntro: { en: "Record a short clip of the item at pickup and return. Both of you confirm the condition; the deposit is only released after the return handover.", zh: "取貨及歸還時錄下物品狀況。雙方確認後，按金在歸還交收後才會發放。" },
  recordPickup: { en: "Record pickup handover", zh: "錄製取貨交收" },
  recordReturn: { en: "Record return handover", zh: "錄製歸還交收" },
  pickupHandover: { en: "Pickup handover", zh: "取貨交收" },
  returnHandover: { en: "Return handover", zh: "歸還交收" },
  confirmCondition: { en: "Confirm condition", zh: "確認狀況" },
  youConfirmed: { en: "You confirmed", zh: "你已確認" },
  renterLabel: { en: "Renter", zh: "租客" },
  lenderLabel: { en: "Lender", zh: "物主" },
  confirmedLabel: { en: "Confirmed", zh: "已確認" },
  waitingLabel: { en: "Waiting", zh: "等待中" },
  clipSaved: { en: "Clip saved {time} · {sec}s", zh: "已儲存片段 {time} · {sec} 秒" },
  clipNeeded: { en: "Record a clip first.", zh: "請先錄製片段。" },
  returnLocked: { en: "Available after the pickup handover is confirmed by both.", zh: "雙方確認取貨交收後即可使用。" },
  payFirst: { en: "Available once the rental is paid.", zh: "付款後即可使用。" },
  startRecording: { en: "Start recording", zh: "開始錄影" },
  stopAndSave: { en: "Stop & save", zh: "停止並儲存" },
  cameraUnavailable: { en: "Camera not available — using the demo recorder.", zh: "未能使用相機 — 改用示範錄影。" },
  recordingTip: { en: "Show every side of the item and any marks.", zh: "拍下物品每一面及任何痕跡。" },
  clipLocalNote: { en: "Demo: clips stay on this device; only the timestamp is saved.", zh: "示範：片段只保存在此裝置，系統只記錄時間。" },
  replayClip: { en: "Replay clip", zh: "重播片段" },

  // Lender payout
  payoutTitle: { en: "Your payout", zh: "你的收款" },
  rentalPrice: { en: "Rental price", zh: "租金" },
  lendyFee: { en: "Lendy fee ({pct}% · {tier})", zh: "Lendy 服務費（{pct}% · {tier}）" },
  payout: { en: "Payout", zh: "實收" },
  payoutNote: { en: "Paid out when the return handover is confirmed. The deposit goes back to the renter.", zh: "歸還交收確認後發放。按金會退還給租客。" },
  mockMarkComplete: { en: "Not paid through Lendy — mark complete manually when the item is back.", zh: "未經 Lendy 付款 — 物品歸還後請手動標記完成。" },

  // Cancel after paying
  cancelBooking: { en: "Cancel booking (full refund)", zh: "取消預訂（全數退款）" },
  cancelBookingConfirm: { en: "Cancel and refund the full amount?", zh: "取消並全數退款？" },
  cancelWindowPassed: { en: "Free cancellation ended 24 hours before pickup.", zh: "免費取消已於取貨前 24 小時截止。" },

  // Rental terms
  rentalTerms: { en: "Rental terms", zh: "租用條款" },
  termLate: { en: "Late returns are charged at the daily rate.", zh: "逾期歸還按日租收費。" },
  termDamage: { en: "Damage is covered from the deposit after the handover videos are reviewed.", zh: "如有損壞，會在審閱交收錄影後從按金扣除。" },
  termCancel: { en: "Free cancellation until 24 hours before pickup.", zh: "取貨前 24 小時可免費取消。" },

  // Profile
  yourFee: { en: "Your fee: {pct}% · {tier} lender", zh: "你的服務費：{pct}% · {tier}物主" },
  feeNextTier: { en: "{n} more completed rentals to reach {tier} ({pct}%).", zh: "再完成 {n} 次租賃即可升級至{tier}（{pct}%）。" },
  feeTopTier: { en: "You're on the lowest fee.", zh: "你已享有最低服務費。" },
  lendyPlus: { en: "Lendy Plus", zh: "Lendy Plus" },
  myStats: { en: "My stats", zh: "我的數據" },
  inviteFriends: { en: "Invite friends", zh: "邀請朋友" },
  powerLenderHint: { en: "10+ completed rentals and a 4.5+ rating", zh: "完成 10 次以上租賃及評分 4.5 以上" },

  // Plus page
  plusTagline: { en: "Rent and lend for less", zh: "租借更省" },
  monthly: { en: "Monthly", zh: "月費" },
  yearly: { en: "Yearly", zh: "年費" },
  perMonthShort: { en: "/month", zh: "/月" },
  billedYearly: { en: "HK${n} billed yearly", zh: "每年收費 HK${n}" },
  firstMonthFree: { en: "First month free", zh: "首月免費" },
  forRenters: { en: "For renters", zh: "租客專享" },
  forLenders: { en: "For lenders · Lender Booster", zh: "物主專享 · Lender Booster" },
  subscribe: { en: "Start free month", zh: "開始免費月" },
  subscribing: { en: "Subscribing…", zh: "訂閱中…" },
  plusActive: { en: "You're a Plus member", zh: "你是 Plus 會員" },
  plusActiveSince: { en: "Since {date} · {billing}", zh: "自 {date} 起 · {billing}" },
  cancelPlus: { en: "Cancel Plus (demo)", zh: "取消 Plus（示範）" },
  plusDemoNote: { en: "Demo only — no card is charged.", zh: "僅供示範 — 不會扣款。" },
  plusWelcome: { en: "Welcome to Lendy Plus!", zh: "歡迎加入 Lendy Plus！" },

  // List item cap
  listingsFreePlan: { en: "listings on the free plan", zh: "免費方案刊登" },
  goUnlimited: { en: "Go unlimited", zh: "升級無限刊登" },
  listingsUnlimited: { en: "Unlimited listings with Plus", zh: "Plus 會員無限刊登" },
  listingCapReached: { en: "You've reached the free plan limit", zh: "你已達免費計劃上限" },
  listingCapMsg: { en: "Free accounts can have {cap} active listings. Upgrade to Lendy Plus for unlimited listings, or mark one unavailable.", zh: "免費帳戶最多可有 {cap} 個上架物品。升級至 Lendy Plus 可無限刊登，或先把一件物品設為不可用。" },
  upgradeToPlus: { en: "Upgrade to Plus", zh: "升級至 Plus" },

  // Boost
  boostListing: { en: "Boost this listing", zh: "推廣此物品" },
  boostedDaysLeft: { en: "{n} day{s} left", zh: "剩餘 {n} 天" },
  boostPriceFree: { en: "HK${n} for 7 days (demo) · 3 free/month with Plus", zh: "7 天 HK${n}（示範）· Plus 每月 3 次免費" },
  boostPricePlus: { en: "Uses a Plus Boost credit", zh: "使用 1 次 Plus Boost" },
  boostDone: { en: "Boosted! Pinned to the top of Home and Browse for 7 days.", zh: "已推廣！將置頂首頁及瀏覽頁 7 天。" },

  // Stats
  statsThisMonth: { en: "This month", zh: "本月" },
  statViews: { en: "Views", zh: "瀏覽" },
  statRequests: { en: "Requests", zh: "請求" },
  statCompleted: { en: "Completed rentals", zh: "已完成租賃" },
  statEarnings: { en: "Earnings", zh: "收益" },
  statsAfterFees: { en: "after Lendy fees", zh: "已扣除 Lendy 服務費" },
  topListing: { en: "Top listing", zh: "最受歡迎物品" },
  viewsLast7: { en: "Views — last 7 days", zh: "瀏覽 — 最近 7 日" },
  sampleData: { en: "Sample data — fills in with real numbers as you rent out items.", zh: "示範數據 — 開始出租後會顯示真實數字。" },
  statsPlusNote: { en: "Full Lender Booster analytics are included with Lendy Plus.", zh: "完整 Lender Booster 數據分析已包含在 Lendy Plus。" },
  noListingsForStats: { en: "List an item to start collecting stats.", zh: "刊登物品後即可開始收集數據。" },

  // Referral
  referralTitle: { en: "Invite a friend, you both get HK$20", zh: "邀請朋友，雙方各得 HK$20" },
  referralSub: { en: "Your friend enters your code at checkout on their first rental. You get HK$20 credit when they finish it.", zh: "朋友首次租用時在結帳輸入你的推薦碼。對方完成租用後，你會獲得 HK$20 額度。" },
  yourCode: { en: "Your code", zh: "你的推薦碼" },
  shareCode: { en: "Share code", zh: "分享推薦碼" },
  copied: { en: "Copied!", zh: "已複製！" },
  referralShareText: { en: "Rent everyday items on Lendy. Use my code {code} at checkout and we both get HK$20:", zh: "在 Lendy 租用日常用品。結帳時輸入我的推薦碼 {code}，雙方各得 HK$20：" },
  howItWorks: { en: "How it works", zh: "運作方式" },
  referralStep1: { en: "Share your code", zh: "分享你的推薦碼" },
  referralStep2: { en: "Your friend uses it on their first rental", zh: "朋友首次租用時使用" },
  referralStep3: { en: "You both get HK$20", zh: "雙方各得 HK$20" },
};
