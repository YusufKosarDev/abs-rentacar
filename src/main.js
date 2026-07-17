// Core JS for ABS Rent A Car
import '@fontsource/epilogue/400.css';
import '@fontsource/epilogue/600.css';
import '@fontsource/epilogue/700.css';
import '@fontsource/epilogue/800.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';

import carsDataOriginal from './data/cars.json';
import { loadDynamicCarData } from './sheets.js';
import { getDailyRate, calcRentalDays } from './lib/pricing.js';
import { filterCars } from './lib/filters.js';

// Swiper is loaded on demand only on pages that contain a slider
let SwiperCtor = null;
let swiperModules = null;

async function loadSwiper() {
  if (SwiperCtor) return SwiperCtor;
  const [{ default: Swiper }, { Navigation, Pagination, Autoplay }] = await Promise.all([
    import('swiper'),
    import('swiper/modules'),
    import('swiper/css'),
    import('swiper/css/pagination'),
  ]).then(([core, modules]) => [core, modules]);
  swiperModules = { Navigation, Pagination, Autoplay };
  SwiperCtor = Swiper;
  return Swiper;
}

// Mutable car data (can be updated from Google Sheets)
let carsData = [...carsDataOriginal];
let fleetSwiper = null;

// Translation Dictionary
const translations = {
  tr: {
    brand_name: "ABS RENT A CAR",
    nav_home: "Ana Sayfa",
    nav_cars: "Kiralık Araçlar",
    nav_transfer: "Transfer Hizmetleri",
    nav_about: "Hakkımızda",
    nav_contact: "İletişim",
    nav_blog: "Blog",
    hero_tag: "ABS RENT A CAR & TRANSFER",
    hero_title: "Alanya'da Güvenli ve Konforlu Yolculuk",
    hero_subtitle: "Alanya, Konaklı ve Gazipaşa Havalimanı bölgelerinde 7/24 kesintisiz hizmet, lüks ve ekonomik araç seçenekleri ve en uygun fiyat garantisiyle tatilinizin keyfini çıkarın.",
    btn_book: "Rezervasyon Yap",
    btn_learn: "Daha Fazla Bilgi",
    search_title: "HIZLI ARAÇ SORGULAMA",
    label_pickup_loc: "Alış Lokasyonu",
    label_return_loc: "Teslim Lokasyonu",
    label_pickup_date: "Alış Tarihi",
    label_return_date: "Teslim Tarihi",
    btn_find_car: "Araç Bul",
    opt_select_loc: "Lokasyon Seçin",
    opt_alanya: "Alanya Merkez",
    opt_konakli: "Konaklı Otelleri",
    opt_gazipasa: "Gazipaşa Havalimanı (GZP)",
    opt_antalya: "Antalya Havalimanı (AYT)",
    section_fleet_tag: "GENİŞ ARAÇ FİLOMUZ",
    section_fleet_title: "Sizin İçin En Uygun Aracı Seçin",
    tab_all: "Tümü",
    tab_suv: "SUV",
    tab_sedan: "Sedan",
    tab_crossover: "Crossover",
    details_spec_title: "Teknik Özellikler",
    details_price_title: "Fiyat Tablosu (Günlük)",
    label_transmission: "Şanzıman",
    label_fuel: "Yakıt Türü",
    label_doors: "Kapı Sayısı",
    label_passengers: "Koltuk Sayısı",
    label_ac: "Klima",
    label_luggage: "Bagaj",
    label_yes: "Var",
    label_no: "Yok",
    btn_book_now: "Hemen Kirala (WhatsApp)",
    contact_title: "Bize Ulaşın",
    contact_subtitle: "Sorularınız veya özel rezervasyon talepleriniz için 7/24 bizimle iletişime geçebilirsiniz.",
    label_fullname: "Adınız Soyadınız",
    label_phone: "Telefon Numaranız",
    label_message: "Mesajınız",
    btn_send: "Gönder",
    faq_title: "Sıkça Sorulan Sorular",
    faq_subtitle: "Kiralama süreci hakkında en çok merak edilen konular.",
    q1: "Araç kiralamak için yaş sınırı nedir?",
    a1: "Ekonomik sınıf araçlar için en az 21 yaş ve 2 yıllık geçerli ehliyet, lüks grup araçlar için en az 25 yaş ve 5 yıllık ehliyet gerekmektedir.",
    q2: "Fiyatlarınıza kasko dahil midir?",
    a2: "Evet, tüm araç kiralama fiyatlarımıza muafiyetli kasko, 24 saat yol yardımı ve sınırsız kilometre dahildir.",
    q3: "Havalimanı teslimatı yapıyor musunuz?",
    a3: "Evet, Gazipaşa Havalimanı (GZP) ve Antalya Havalimanı (AYT) için rezervasyon saatlerinize uygun olarak 7/24 araç teslimatı ve teslim alımı yapıyoruz.",
    q4: "Ödemeyi nasıl yapabilirim?",
    a4: "Ödemeyi aracı teslim alırken nakit (TL, Euro, Dolar) veya kredi kartı ile yapabilirsiniz. Ön ödeme talep edilmemektedir.",
    search_placeholder: "Araç adı girin...",
    vip_rates_tag: "VIP HİZMET TARİFELERİ",
    transfer_rates_title: "Havalimanı Transfer Ücretlerimiz",
    label_one_way_starting: "/ tek yön başlayan",
    vip_fleet_tag: "VIP FİLOMUZ",
    transfer_fleet_title: "Transfer Araçlarımız",
    whatsapp_book_transfer: "WhatsApp ile Rezervasyon Yap",
    transfer_route_1_title: "Gazipaşa Havalimanı (GZP) ↔ Alanya / Konaklı",
    transfer_route_2_title: "Antalya Havalimanı (AYT) ↔ Alanya / Konaklı",
    transfer_route_1_desc_list: "<li>✔ VIP Mercedes Vito (1-7 Kişi)</li><li>✔ Şoförlü Özel Hizmet</li><li>✔ Ücretsiz Bagaj Hizmeti</li><li>✔ Uçuş Takibi (Bekleme Ücretsiz)</li>",
    transfer_route_2_desc_list: "<li>✔ VIP Mercedes Vito (1-7 Kişi)</li><li>✔ Şoförlü Özel Hizmet</li><li>✔ Ücretsiz Bagaj Hizmeti</li><li>✔ Otoban ve Geçiş Ücretleri Dahil</li>",
    vito_vip_title: "Mercedes-Benz Vito VIP",
    vito_vip_desc: "Deri koltukları, klima, buzdolabı ve Wi-Fi desteğiyle ultra konforlu VIP seyahat sunar.",
    caravelle_vip_title: "Volkswagen Caravelle VIP",
    caravelle_vip_desc: "Geniş bagaj hacmi ve konforlu koltuk düzeniyle kalabalık gruplar için en ideal seçim.",
    capacity_7: "7 Yolcu Kapasitesi",
    capacity_8: "8 Yolcu Kapasitesi",
    about_intro_title: "ABS Rent A Car & Transfer Kimdir?",
    about_intro_p1: "ABS Rent A Car, Alanya ve çevre ilçelerinde uzun yıllardır otomotiv kiralama ve turizm taşımacılığı sektörlerinde güven ve istikrarla hizmet vermektedir. Temel prensibimiz, misafirlerimize tatilleri ve iş seyahatleri boyunca kusursuz, konforlu ve güvenli bir yolculuk deneyimi sunmaktır.",
    about_intro_p2: "Geniş araç yelpazemizde ekonomik sınıf binek araçlardan, lüks SUV ve Crossover sınıfına; kalabalık aileler için geniş hacimli aile araçlarından VIP transfer minibüslerine kadar her ihtiyaca uygun alternatifler yer almaktadır. Araçlarımızın tümü düzenli olarak yetkili servis bakımlı, kaskolu ve hijyen kurallarına tam uyumlu olarak hazırlanmaktadır.",
    about_intro_p3: "Antalya Havalimanı (AYT) ve Gazipaşa Havalimanı (GZP) başta olmak üzere Alanya ve Konaklı bölgelerinde 7 gün 24 saat kesintisiz adrese araç teslimatı yapmaktayız. Şeffaf fiyatlandırma politikamız sayesinde müşterilerimiz sürpriz ek ücretlerle karşılaşmazlar.",
    about_values_tag: "MİSYON & VİZYON",
    about_values_title: "Hizmet Değerlerimiz",
    value_safe_title: "Güvenli Sürüş",
    value_safe_desc: "Tüm araçlarımız tam muafiyetli kasko kapsamında olup, düzenli teknik ve periyodik bakımlardan geçmektedir.",
    value_price_title: "Şeffaf Fiyat",
    value_price_desc: "Gizli maliyetler, depozito sürprizleri yoktur. Web sitemizde gördüğünüz fiyatlar teslimatta ödeyeceğiniz net tutarlardır.",
    value_support_title: "7/24 Kesintisiz Destek",
    value_support_desc: "Uçuş gecikmelerinizde sizi bekliyor, olası her türlü aksilikte 7/24 yol yardımı ile yanınızda bulunuyoruz.",
    about_banner_title: "Kurumsal",
    about_banner_subtitle: "Kurumsal Hikayemiz ve Değerlerimiz",
    about_badge_since: "2011'den Beri",
    stat_experience_num: "15+",
    stat_experience_text: "Yıllık Tecrübe",
    stat_fleet_num: "50+",
    stat_fleet_text: "Araç Filosu",
    stat_customers_num: "10K+",
    stat_customers_text: "Mutlu Müşteri",
    stat_support_num: "7/24",
    stat_support_text: "Destek ve Teslimat",
    cookie_title: "Çerez Bildirimi",
    cookie_text: "Web sitemiz, deneyiminizi iyileştirmek ve hizmetlerimizi kişiselleştirmek amacıyla çerezler kullanmaktadır.",
    cookie_accept: "Kabul Et",
    cookie_reject: "Reddet",
    calc_total: "Tahmini Toplam",
    calc_days: "gün",
    calc_daily: "günlük",
    calc_hint: "Fiyatı görmek için tarihleri seçin",
    spam_badge: "Spam koruması aktif",
    spam_blocked: "Gönderim engellendi. Lütfen formu normal şekilde doldurun.",
    form_success: "Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.",
    form_error: "Mesaj gönderilemedi. Lütfen tekrar deneyin veya WhatsApp üzerinden ulaşın.",
    form_sending: "Gönderiliyor...",
    home_about_title: "Güvenilir araç kiralama partneriniz",
    home_about_p: "ABS Rent A Car, 2011'den bu yana Alanya ve çevre bölgelerde ekonomikten lükse geniş bir araç yelpazesiyle hizmet veren güvenilir kiralama partnerinizdir.",
    feat_booking_title: "Kolay Rezervasyon Süreci",
    feat_booking_desc: "WhatsApp veya web sitemiz üzerinden birkaç adımda hızlıca araç kiralayabilirsiniz.",
    feat_locations_title: "Uygun Teslim & Alış Noktaları",
    feat_locations_desc: "Alanya Merkez, Konaklı ve her iki havalimanında 7/24 teslim ve alış hizmeti.",
    badge_services: "Hizmetlerimiz",
    services_title: "Geniş yelpazede kiralama hizmetlerimizi keşfedin",
    svc1_title: "Şoförlü Araç Kiralama",
    svc1_desc: "Profesyonel ve deneyimli şoförlerimiz eşliğinde konforlu seyahat deneyimi.",
    svc2_title: "Kurumsal Kiralama",
    svc2_desc: "Şirketlere özel uzun dönem kiralama paketleri ve kurumsal filo çözümleri.",
    svc3_title: "Havalimanı Transfer",
    svc3_desc: "Gazipaşa ve Antalya havalimanlarından VIP Mercedes Vito ile konforlu transfer.",
    svc4_title: "Kasko & Sigorta Dahil",
    svc4_desc: "Tüm araçlarımız muafiyetli kasko, yol yardımı ve sınırsız kilometre dahildir.",
    btn_all_services: "Tüm Hizmetleri Gör",
    badge_fleet: "Araç Filomuz",
    badge_how: "Nasıl Çalışır",
    how_title: "Zahmetsiz deneyim için basitleştirilmiş süreçler",
    how_p: "Araç kiralama sürecimizi olabildiğince basit ve hızlı tuttuk.",
    step1_title: "Göz Atın & Seçin",
    step1_desc: "Web sitemiz üzerinden ihtiyacınıza uygun aracı seçin. Filo sayfamızda ekonomikten lükse tüm araçları karşılaştırabilirsiniz.",
    step2_title: "Rezervasyon Yapın",
    step2_desc: "WhatsApp üzerinden veya iletişim formumuz ile hızlıca rezervasyonunuzu onaylayın. Ön ödeme gerekmez.",
    step3_title: "Teslim Alın & Keyfini Çıkarın",
    step3_desc: "Seçtiğiniz lokasyonda aracınızı teslim alın ve tatilinizin keyfini çıkarın. 7/24 yol yardımı her zaman yanınızda.",
    video_title: "ABS Rent A Car ile araç kiralamanın kolaylığını ve konforunu keşfedin",
    badge_why: "Neden Bizi Seçmelisiniz",
    why_title: "İhtiyaçlarınız için eşsiz kalite ve hizmet",
    why1_title: "Geniş Filo Seçenekleri",
    why1_desc: "Ekonomikten lükse, sedan'dan SUV'a 50'den fazla araç seçeneği ile herkese uygun çözümler sunuyoruz.",
    why2_title: "Üstün Müşteri Hizmeti",
    why2_desc: "7/24 ulaşılabilir destek ekibimiz, WhatsApp ve telefon ile her an yanınızda.",
    why3_title: "Uygun Lokasyonlar",
    why3_desc: "Alanya Merkez, Konaklı ve her iki havalimanında teslim-alış noktalarımız mevcuttur.",
    why4_title: "Güvenilirlik & Güvenlik",
    why4_desc: "Tüm araçlarımız düzenli bakımlı, kaskolu ve hijyen kurallarına uygun olarak hazırlanmaktadır.",
    badge_testimonials: "Müşteri Yorumları",
    testimonials_title: "Müşterilerimiz bizim hakkımızda ne diyor",
    cta_badge: "Yola çıkmaya hazır mısınız?",
    cta_title: "Aracınızı bugün rezerve edin!",
    cta_p: "Dost canlısı müşteri hizmetleri ekibimiz size yardımcı olmak için burada. İstediğiniz zaman bize ulaşın.",
    badge_blog: "Son Makaleler",
    blog_title: "Bir sonraki yolculuğunuz için bilgilenin ve ilham alın",
    blog1_title: "Alanya'da Keşfedilmesi Gereken 5 Rota",
    blog1_desc: "Alanya ve çevresinde araçla keşfedebileceğiniz en güzel 5 tatil rotasını sizler için derledik.",
    blog2_title: "İlk Kez Araç Kiralarken Bilmeniz Gerekenler",
    blog2_desc: "Yurt dışında veya tatilde ilk kez araç kiralayacaklar için önemli ipuçları ve dikkat edilmesi gereken noktalar.",
    blog3_title: "Tatilde SUV mu Sedan mı? Hangisini Seçmeli",
    blog3_desc: "Tatilinize uygun aracı seçerken göz önünde bulundurmanız gereken faktörler ve avantaj-dezavantaj karşılaştırması.",
    btn_read_more: "Devamını Oku",
    footer_legal: "Yasal",
    legal_terms: "Kullanım Şartları",
    legal_privacy: "Gizlilik Politikası",
    legal_disclaimer: "Yasal Uyarı",
    legal_kvkk: "KVKK Aydınlatma Metni",
    footer_quick: "Hızlı Menü",
    footer_newsletter: "E-Bülten",
    footer_contact: "İletişim Bilgileri",
    footer_about: "Alanya, Konaklı ve Gazipaşa Havalimanı bölgelerinde kesintisiz 7/24 kaliteli kiralama ve güvenli transfer hizmetleri sunmaktayız.",
    footer_newsletter_p: "Kampanyalardan ve özel indirimlerden haberdar olmak için e-bültenimize kaydolun.",
    ph_email: "E-posta adresiniz",
    ph_fullname: "Ad Soyad girin",
    footer_rights: "&copy; 2026 ABS Rent A Car & Transfer. Tüm hakları saklıdır.",
    newsletter_ok: "E-bülten kaydınız alındı, teşekkürler!",
    newsletter_err: "Kayıt şu an yapılamadı. Lütfen WhatsApp üzerinden bize ulaşın.",
    tab_hatchback: "Hatchback",
    tab_commercial: "Ticari",
    tab_cabrio: "Cabrio",
    hours_title: "Çalışma Saatleri",
    hours_week: "Hafta içi: 08:40 – 23:00",
    hours_weekend: "Hafta sonu: 09:00 – 21:00",
    hours_note: "Araç teslimatları rezervasyonla 7/24 yapılabilmektedir.",
    reps_title: "Müşteri Temsilcilerimiz",
    rep_manager: "(Ofis Müdürü)",
    ins_badge: "Güvenceler ve Ek Hizmetler",
    ins_title: "Her kiralamada standart güvenceler",
    ins1_title: "Muafiyetli Kasko",
    ins1_desc: "Tüm kiralama fiyatlarımıza muafiyetli kasko dahildir. Dilerseniz teslimat sırasında muafiyetsiz kaza güvencesine yükseltebilirsiniz.",
    ins2_title: "3. Şahıs Sorumluluk Güvencesi",
    ins2_desc: "Olası bir kazada üçüncü şahıslara verilebilecek zararlar, zorunlu trafik sigortası kapsamında güvence altındadır.",
    ins3_title: "Bireysel Kaza Güvencesi",
    ins3_desc: "Sürücü ve yolcular için ek bireysel kaza güvencesi seçeneği sunuyoruz; detayları rezervasyon sırasında sorabilirsiniz.",
    extras_title: "Ücretli Ek Hizmetler",
    extras_desc: "Navigasyon cihazı, çocuk koltuğu ve bebek koltuğu ek hizmetlerimizi rezervasyon sırasında talep edebilirsiniz.",
    opt_manual: "Manuel",
    opt_automatic: "Otomatik",
    marquee_1: "Lüks Araç mı Kiralamak İstiyorsunuz?",
    marquee_2: "7/24 Havalimanı Teslimatı",
    marquee_3: "VIP Transfer Hizmeti",
    marquee_4: "En Uygun Fiyat Garantisi"
  },
  en: {
    brand_name: "ABS RENT A CAR",
    nav_home: "Home",
    nav_cars: "Rental Cars",
    nav_transfer: "Transfer Services",
    nav_about: "About Us",
    nav_contact: "Contact Us",
    nav_blog: "Blog",
    hero_tag: "ABS RENT A CAR & TRANSFER",
    hero_title: "Safe and Comfortable Ride in Alanya",
    hero_subtitle: "Enjoy your holiday with 24/7 uninterrupted service, luxury and budget car options, and the best price guarantee in Alanya, Konakli, and Gazipasa Airport regions.",
    btn_book: "Book a Rental",
    btn_learn: "Learn More",
    search_title: "QUICK VEHICLE SEARCH",
    label_pickup_loc: "Pickup Location",
    label_return_loc: "Return Location",
    label_pickup_date: "Pickup Date",
    label_return_date: "Return Date",
    btn_find_car: "Find Car",
    opt_select_loc: "Select Location",
    opt_alanya: "Alanya Center",
    opt_konakli: "Konakli Hotels",
    opt_gazipasa: "Gazipasa Airport (GZP)",
    opt_antalya: "Antalya Airport (AYT)",
    section_fleet_tag: "OUR WIDE FLEET",
    section_fleet_title: "Choose the Best Vehicle For You",
    tab_all: "All",
    tab_suv: "SUV",
    tab_sedan: "Sedan",
    tab_crossover: "Crossover",
    details_spec_title: "Technical Specifications",
    details_price_title: "Price List (Daily)",
    label_transmission: "Transmission",
    label_fuel: "Fuel Type",
    label_doors: "Doors",
    label_passengers: "Passengers",
    label_ac: "Air Conditioning",
    label_luggage: "Luggage",
    label_yes: "Yes",
    label_no: "No",
    btn_book_now: "Book Now (WhatsApp)",
    contact_title: "Contact Us",
    contact_subtitle: "For your questions or custom reservation inquiries, you can reach out 24/7.",
    label_fullname: "Your Full Name",
    label_phone: "Your Phone Number",
    label_message: "Your Message",
    btn_send: "Send",
    faq_title: "Frequently Asked Questions",
    faq_subtitle: "Everything you need to know about the rental process.",
    q1: "What is the age limit for car rentals?",
    a1: "For economy class cars, a minimum age of 21 and a 2-year valid driving license are required. For luxury vehicles, a minimum age of 25 and a 5-year license are required.",
    q2: "Is insurance included in your prices?",
    a2: "Yes, all our rental prices include collision damage waiver (CDW), 24-hour roadside assistance, and unlimited mileage.",
    q3: "Do you deliver to the airport?",
    a3: "Yes, we provide 24/7 car delivery and pickup at Gazipasa Airport (GZP) and Antalya Airport (AYT) matching your flight times.",
    q4: "How can I make the payment?",
    a4: "Payment can be made in cash (TL, Euro, USD) or by credit card during car delivery. No advance payment is requested.",
    search_placeholder: "Search by car name...",
    vip_rates_tag: "VIP SERVICE RATES",
    transfer_rates_title: "Airport Transfer Rates",
    label_one_way_starting: "/ one way starting",
    vip_fleet_tag: "VIP FLEET",
    transfer_fleet_title: "Our Transfer Vehicles",
    whatsapp_book_transfer: "Book via WhatsApp",
    transfer_route_1_title: "Gazipasa Airport (GZP) ↔ Alanya / Konakli",
    transfer_route_2_title: "Antalya Airport (AYT) ↔ Alanya / Konakli",
    transfer_route_1_desc_list: "<li>✔ VIP Mercedes Vito (1-7 Seats)</li><li>✔ Private Chauffeur Service</li><li>✔ Free Luggage Assistance</li><li>✔ Flight Tracking (No delay fees)</li>",
    transfer_route_2_desc_list: "<li>✔ VIP Mercedes Vito (1-7 Seats)</li><li>✔ Private Chauffeur Service</li><li>✔ Free Luggage Assistance</li><li>✔ Highway Tolls Included</li>",
    vito_vip_title: "Mercedes-Benz Vito VIP",
    vito_vip_desc: "Offers ultra-comfortable VIP travel with leather seats, A/C, refrigerator, and Wi-Fi.",
    caravelle_vip_title: "Volkswagen Caravelle VIP",
    caravelle_vip_desc: "The most ideal choice for crowded groups with large luggage volume and comfortable seating layout.",
    capacity_7: "7 Seats Capacity",
    capacity_8: "8 Seats Capacity",
    about_intro_title: "Who is ABS Rent A Car & Transfer?",
    about_intro_p1: "ABS Rent A Car has been serving with trust and stability in the car rental and tourism transportation sectors in Alanya and surrounding districts for many years. Our core principle is to provide our guests with a seamless, comfortable, and safe travel experience during their holidays and business trips.",
    about_intro_p2: "Our wide vehicle range includes economic class passenger cars, luxury SUV and Crossover classes, spacious family vehicles for large families, and VIP transfer minibuses. All our vehicles are regularly serviced, insured, and prepared in full compliance with hygiene rules.",
    about_intro_p3: "We provide 24/7 vehicle delivery directly to your address, especially at Antalya Airport (AYT) and Gazipasa Airport (GZP), as well as in Alanya and Konakli regions. Thanks to our transparent pricing policy, our customers do not encounter surprise additional fees.",
    about_values_tag: "MISSION & VISION",
    about_values_title: "Our Service Values",
    value_safe_title: "Safe Driving",
    value_safe_desc: "All our vehicles are covered by collision damage waiver, and undergo regular technical and periodic maintenance.",
    value_price_title: "Transparent Price",
    value_price_desc: "There are no hidden costs or deposit surprises. The prices you see on our website are the net amounts you pay upon delivery.",
    value_support_title: "24/7 Continuous Support",
    value_support_desc: "We wait for you in case of flight delays and are by your side with 24/7 roadside assistance in case of any mishaps.",
    about_banner_title: "Corporate Profile",
    about_banner_subtitle: "Our Corporate Story and Brand Values",
    about_badge_since: "Since 2011",
    stat_experience_num: "15+",
    stat_experience_text: "Years Experience",
    stat_fleet_num: "50+",
    stat_fleet_text: "Vehicle Fleet",
    stat_customers_num: "10K+",
    stat_customers_text: "Happy Customers",
    stat_support_num: "24/7",
    stat_support_text: "Support & Delivery",
    cookie_title: "Cookie Notice",
    cookie_text: "Our website uses cookies to improve your experience and personalize our services.",
    cookie_accept: "Accept",
    cookie_reject: "Reject",
    calc_total: "Estimated Total",
    calc_days: "days",
    calc_daily: "daily",
    calc_hint: "Select dates to see the price",
    spam_badge: "Spam protection active",
    spam_blocked: "Submission blocked. Please fill the form normally.",
    form_success: "Your message was sent successfully! We'll get back to you shortly.",
    form_error: "Message could not be sent. Please try again or contact us via WhatsApp.",
    form_sending: "Sending...",
    home_about_title: "Your trusted partner in reliable car rental",
    home_about_p: "Since 2011, ABS Rent A Car has been your trusted rental partner in Alanya and the surrounding region, with a wide range of vehicles from economy to luxury.",
    feat_booking_title: "Easy Booking Process",
    feat_booking_desc: "Rent a car quickly in just a few steps via WhatsApp or our website.",
    feat_locations_title: "Convenient Pick-Up & Return Points",
    feat_locations_desc: "24/7 pick-up and return service in Alanya Center, Konakli, and both airports.",
    badge_services: "Our Services",
    services_title: "Explore our wide range of rental services",
    svc1_title: "Car Rental With Driver",
    svc1_desc: "A comfortable travel experience accompanied by our professional and experienced drivers.",
    svc2_title: "Business Car Rental",
    svc2_desc: "Long-term rental packages and corporate fleet solutions tailored for companies.",
    svc3_title: "Airport Transfer",
    svc3_desc: "Comfortable transfers from Gazipasa and Antalya airports with VIP Mercedes Vito.",
    svc4_title: "Insurance Included",
    svc4_desc: "All our vehicles include collision damage waiver, roadside assistance, and unlimited mileage.",
    btn_all_services: "View All Services",
    badge_fleet: "Our Fleet",
    badge_how: "How It Works",
    how_title: "Streamlined processes for a hassle-free experience",
    how_p: "We keep our car rental process as simple and fast as possible.",
    step1_title: "Browse & Select",
    step1_desc: "Choose the car that suits your needs on our website. Compare all vehicles from economy to luxury on our fleet page.",
    step2_title: "Book & Confirm",
    step2_desc: "Confirm your reservation quickly via WhatsApp or our contact form. No prepayment required.",
    step3_title: "Pick Up & Enjoy",
    step3_desc: "Pick up your car at your chosen location and enjoy your holiday. 24/7 roadside assistance is always with you.",
    video_title: "Discover the ease and comfort of renting a car with ABS Rent A Car",
    badge_why: "Why Choose Us",
    why_title: "Unmatched quality and service for your needs",
    why1_title: "Extensive Fleet Options",
    why1_desc: "From economy to luxury, sedan to SUV — more than 50 vehicles with solutions for everyone.",
    why2_title: "Exceptional Customer Service",
    why2_desc: "Our support team is available 24/7 via WhatsApp and phone.",
    why3_title: "Convenient Locations",
    why3_desc: "Pick-up and return points in Alanya Center, Konakli, and both airports.",
    why4_title: "Reliability & Safety",
    why4_desc: "All our vehicles are regularly maintained, insured, and prepared in line with hygiene standards.",
    badge_testimonials: "Testimonials",
    testimonials_title: "What our customers are saying about us",
    cta_badge: "Ready to hit the road?",
    cta_title: "Book your car today!",
    cta_p: "Our friendly customer service team is here to help. Reach out to us anytime.",
    badge_blog: "Latest Articles",
    blog_title: "Stay informed and inspired for your next journey",
    blog1_title: "5 Routes You Must Explore in Alanya",
    blog1_desc: "We've compiled the 5 most beautiful holiday routes you can explore by car in and around Alanya.",
    blog2_title: "What to Know When Renting a Car for the First Time",
    blog2_desc: "Important tips and key points for those renting a car abroad or on holiday for the first time.",
    blog3_title: "SUV or Sedan on Holiday? How to Choose",
    blog3_desc: "Factors to consider when choosing the right car for your holiday, with pros and cons compared.",
    btn_read_more: "Read More",
    footer_legal: "Legal",
    legal_terms: "Terms of Use",
    legal_privacy: "Privacy Policy",
    legal_disclaimer: "Legal Notice",
    legal_kvkk: "KVKK Disclosure (GDPR)",
    footer_quick: "Quick Links",
    footer_newsletter: "Newsletter",
    footer_contact: "Contact Info",
    footer_about: "We provide uninterrupted 24/7 quality car rental and safe transfer services in Alanya, Konakli, and Gazipasa Airport regions.",
    footer_newsletter_p: "Subscribe to our newsletter to stay informed about campaigns and special discounts.",
    ph_email: "Your email address",
    ph_fullname: "Enter your full name",
    footer_rights: "&copy; 2026 ABS Rent A Car & Transfer. All rights reserved.",
    newsletter_ok: "You have been subscribed to our newsletter, thank you!",
    newsletter_err: "Subscription is currently unavailable. Please contact us via WhatsApp.",
    tab_hatchback: "Hatchback",
    tab_commercial: "Commercial",
    tab_cabrio: "Convertible",
    hours_title: "Working Hours",
    hours_week: "Weekdays: 08:40 – 23:00",
    hours_weekend: "Weekends: 09:00 – 21:00",
    hours_note: "Vehicle delivery is available 24/7 by reservation.",
    reps_title: "Our Customer Representatives",
    rep_manager: "(Office Manager)",
    ins_badge: "Coverage & Extras",
    ins_title: "Standard coverage with every rental",
    ins1_title: "Collision Damage Waiver",
    ins1_desc: "All our rental prices include a collision damage waiver. You can upgrade to zero-excess coverage at delivery if you wish.",
    ins2_title: "Third-Party Liability Coverage",
    ins2_desc: "Damages to third parties in a possible accident are covered under compulsory traffic insurance.",
    ins3_title: "Personal Accident Coverage",
    ins3_desc: "We offer optional personal accident coverage for the driver and passengers; ask for details during reservation.",
    extras_title: "Paid Extras",
    extras_desc: "Navigation device, child seat, and baby seat extras can be requested during your reservation.",
    opt_manual: "Manual",
    opt_automatic: "Automatic",
    marquee_1: "Need to Rent a Luxury Car?",
    marquee_2: "24/7 Airport Delivery",
    marquee_3: "VIP Transfer Service",
    marquee_4: "Best Price Guarantee"
  }
};

let currentLang = localStorage.getItem('abs_lang') || 'tr';

// Formspree endpoint for newsletter signups (set your form URL to activate)
const NEWSLETTER_ENDPOINT = '';

// Global toast (works on every page; reuses #spam-toast if present)
function showGlobalToast(message, type) {
  let toast = document.getElementById('spam-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'spam-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `spam-toast toast-${type} toast-visible`;
  setTimeout(() => toast.classList.remove('toast-visible'), 4500);
}

// Google Translate Integration Helper
function injectGoogleTranslate() {
  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'tr',
      includedLanguages: 'tr,en,de,ru,fr,es,it,pt,nl,ar,zh-CN',
      autoDisplay: false
    }, 'google_translate_element');
  };

  // Create Container
  const gtDiv = document.createElement('div');
  gtDiv.id = 'google_translate_element';
  gtDiv.style.display = 'none';
  document.body.appendChild(gtDiv);

  // Script Loader
  const gtScript = document.createElement('script');
  gtScript.type = 'text/javascript';
  gtScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.body.appendChild(gtScript);

  // Custom styling to hide Google frame
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    body { top: 0 !important; position: static !important; }
    .goog-te-banner-frame, .goog-te-banner, .goog-te-balloon-frame, #goog-gt-tt, .goog-tooltip, .goog-tooltip:hover { display: none !important; visibility: hidden !important; }
    .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; }
  `;
  document.head.appendChild(styleEl);
}

function changeGoogleTranslate(langCode) {
  const googleSelect = document.querySelector('.goog-te-combo');
  if (googleSelect) {
    googleSelect.value = langCode;
    googleSelect.dispatchEvent(new Event('change'));
  } else {
    setTimeout(() => changeGoogleTranslate(langCode), 500);
  }
}

// Initialize Page
document.addEventListener('DOMContentLoaded', async () => {
  // Load the slider library first on pages that need it
  if (document.querySelector('.swiper')) {
    await loadSwiper();
  }

  injectGoogleTranslate();
  setupLanguage();
  setupScrollHeader();
  setupMobileMenu();
  setupFaqAccordion();
  setupCookieConsent();
  setupSpamProtection();
  setupProcessAccordion();
  setupVideoModal();
  setupTestimonialsSwiper();
  
  if (currentLang !== 'tr' && currentLang !== 'en') {
    changeGoogleTranslate(currentLang);
  }
  
  // Load dynamic data from Google Sheets, then render
  initDynamicData();

  setupDateValidation();
  setupLanguageSelector();
  setupQuickBookingForm();
  setupNewsletterForms();
  setupWhatsAppFloat();
  setupConversionTracking();
  setupNavActive();
  setupMarquee();
  setupScrollTop();
});

// Duplicate marquee items once so the -50% loop is seamless
function setupMarquee() {
  const track = document.getElementById('marquee-track');
  if (!track || track.dataset.cloned) return;
  track.innerHTML += track.innerHTML;
  track.dataset.cloned = 'true';
}

// Scroll-to-top button (all pages)
function setupScrollTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top-btn';
  btn.setAttribute('aria-label', 'Sayfa başına dön');
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btn);

  // Keep the button above the cookie banner while it is visible
  const banner = document.getElementById('cookie-banner');
  if (banner) {
    btn.style.bottom = (banner.offsetHeight + 20) + 'px';
  }

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
}

// Highlight the nav item matching the current page (overrides hardcoded state)
function setupNavActive() {
  const items = document.querySelectorAll('.nav-links li');
  if (!items.length) return;
  const current = window.location.pathname.split('/').pop() || 'index.html';
  items.forEach(li => {
    const link = li.querySelector('a');
    li.classList.toggle('active', !!link && link.getAttribute('href') === current);
  });
}

// Vercel Web Analytics custom events for WhatsApp/phone conversions
function trackEvent(name, data) {
  if (typeof window.va === 'function') {
    window.va('event', { name, data });
  }
}

function setupConversionTracking() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a, button');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    const page = window.location.pathname;

    if (href.includes('wa.me') || href.includes('api.whatsapp.com')) {
      const source = link.classList.contains('whatsapp-float') ? 'float_button' : 'link';
      trackEvent('whatsapp_click', { page, source });
    } else if (href.startsWith('tel:')) {
      trackEvent('phone_click', { page });
    } else if (href.startsWith('mailto:')) {
      trackEvent('email_click', { page });
    } else if (link.classList.contains('book-transfer')) {
      trackEvent('whatsapp_click', { page, source: 'transfer_booking' });
    }
  });

  // Booking form submissions also open WhatsApp
  const quickForm = document.getElementById('quick-booking-form');
  if (quickForm) {
    quickForm.addEventListener('submit', () => trackEvent('whatsapp_click', { page: '/', source: 'quick_booking_form' }));
  }
}

// Fixed WhatsApp contact button (all pages)
function setupWhatsAppFloat() {
  const btn = document.createElement('a');
  btn.className = 'whatsapp-float';
  btn.href = 'https://wa.me/905323318418';
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.setAttribute('aria-label', 'WhatsApp ile bize yazın');
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  document.body.appendChild(btn);

  // Keep the button above the cookie banner while it is visible
  const banner = document.getElementById('cookie-banner');
  if (banner) {
    btn.style.bottom = (banner.offsetHeight + 20) + 'px';
  }
}

// Newsletter forms (footer, all pages)
function setupNewsletterForms() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const localLang = (currentLang === 'tr' || currentLang === 'en') ? currentLang : 'en';
      const t = translations[localLang];
      const emailInput = form.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value) return;

      if (!NEWSLETTER_ENDPOINT) {
        // No email service configured -> forward the subscription request via WhatsApp
        const waText = localLang === 'tr'
          ? `Merhaba, ABS Rent A Car. Kampanya ve indirimlerden haberdar olmak istiyorum.
📧 E-posta: ${emailInput.value}`
          : `Hello, ABS Rent A Car. I would like to receive news about campaigns and discounts.
📧 Email: ${emailInput.value}`;
        trackEvent('whatsapp_click', { page: window.location.pathname, source: 'newsletter' });
        window.open(`https://wa.me/905323318418?text=${encodeURIComponent(waText)}`, '_blank');
        showGlobalToast(t.newsletter_ok, 'success');
        form.reset();
        return;
      }

      try {
        const response = await fetch(NEWSLETTER_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput.value, form_type: 'newsletter' })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        showGlobalToast(t.newsletter_ok, 'success');
        form.reset();
      } catch (err) {
        console.error('[Newsletter] Error:', err);
        showGlobalToast(t.newsletter_err, 'error');
      }
    });
  });
}

// Homepage quick booking form -> WhatsApp reservation request
function setupQuickBookingForm() {
  const form = document.getElementById('quick-booking-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullname = form.querySelector('[name="fullname"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const pickupSelect = form.querySelector('[name="pickup"]');
    const pickup = pickupSelect.options[pickupSelect.selectedIndex].text;
    const pickupDate = form.querySelector('[name="pickup_date"]').value;

    const localLang = (currentLang === 'tr' || currentLang === 'en') ? currentLang : 'en';
    const message = localLang === 'tr'
      ? `Merhaba, ABS Rent A Car. Web siteniz üzerinden araç kiralamak istiyorum:
👤 Ad Soyad: ${fullname}
📞 Telefon: ${phone}
📍 Alış Yeri: ${pickup}
📅 Alış Tarihi: ${pickupDate}

Uygun araçlarınızı ve fiyat bilgisini paylaşabilir misiniz? Teşekkürler.`
      : `Hello, ABS Rent A Car. I would like to rent a car via your website:
👤 Name: ${fullname}
📞 Phone: ${phone}
📍 Pickup Location: ${pickup}
📅 Pickup Date: ${pickupDate}

Could you share your available cars and prices? Thank you.`;

    window.open(`https://api.whatsapp.com/send?phone=905323318418&text=${encodeURIComponent(message)}`, '_blank');
  });
}

// Async initializer: loads Google Sheets data then renders pages
async function initDynamicData() {
  // Try to update car data from Google Sheets
  carsData = await loadDynamicCarData(carsData);

  // Page-specific initializers (with potentially updated data)
  if (document.getElementById('home-fleet-grid')) {
    renderCars(carsData, 'home-fleet-grid');
    setupFleetTabs();
  }
  
  if (document.getElementById('all-cars-grid')) {
    renderCars(carsData, 'all-cars-grid');
    setupFilters();
  }

  if (document.getElementById('car-details-container')) {
    renderCarDetails();
  }
}

// Setup Language
function setupLanguage() {
  const localLang = (currentLang === 'tr' || currentLang === 'en') ? currentLang : 'en';

  // Keep <html lang> in sync with the selected language
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (translations[localLang][key]) {
      if (elem.tagName === 'INPUT' && elem.type === 'submit') {
        elem.value = translations[localLang][key];
      } else if (elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA') {
        elem.placeholder = translations[localLang][key];
      } else {
        elem.innerHTML = translations[localLang][key];
      }
    }
  });

  // Dynamic Page Title translation
  const pathname = window.location.pathname;
  if (pathname.includes('cars.html')) {
    document.title = localLang === 'tr' ? "Kiralık Araçlar Filomuz | ABS Rent A Car" : "Rental Car Fleet | ABS Rent A Car";
  } else if (pathname.includes('car-details.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id') || carsData[0].id;
    const car = carsData.find(c => c.id === carId);
    if (car) {
      document.title = `${car.name} | ${localLang === 'tr' ? 'ABS Rent A Car Detayları' : 'ABS Rent A Car Details'}`;
    }
  } else if (pathname.includes('contact.html')) {
    document.title = localLang === 'tr' ? "İletişim | ABS Rent A Car" : "Contact Us | ABS Rent A Car";
  } else if (pathname.includes('transfer.html')) {
    document.title = localLang === 'tr' ? "Havalimanı Transfer Hizmetleri | ABS Rent A Car" : "Airport Transfer Services | ABS Rent A Car";
  } else if (pathname.includes('about.html')) {
    document.title = localLang === 'tr' ? "Hakkımızda | ABS Rent A Car" : "About Us | ABS Rent A Car";
  } else if (pathname.includes('blog.html')) {
    document.title = "Blog | ABS Rent A Car";
  } else if (pathname.includes('legal.html')) {
    document.title = localLang === 'tr' ? "Yasal Bilgiler | ABS Rent A Car" : "Legal Information | ABS Rent A Car";
  } else {
    document.title = localLang === 'tr' ? "ABS Rent A Car & Transfer | Alanya Araç Kiralama" : "ABS Rent A Car & Transfer | Alanya Car Rental";
  }

  // Update language selector dropdown if present
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = currentLang;
  }
}

// Setup Language Selector Event
function setupLanguageSelector() {
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      currentLang = e.target.value;
      localStorage.setItem('abs_lang', currentLang);
      setupLanguage();
      changeGoogleTranslate(currentLang);
      
      // Re-render components with translated content
      if (document.getElementById('home-fleet-grid')) {
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        filterAndRenderCars(activeTab, 'home-fleet-grid');
      }
      if (document.getElementById('all-cars-grid')) {
        filterCarsPage();
      }
      if (document.getElementById('car-details-container')) {
        renderCarDetails();
      }
    });
  }
}

// Setup Scroll Header
function setupScrollHeader() {
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
}

// Mobile Menu Toggle
function setupMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    // Close the menu after navigating (same-page anchors etc.)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });

    // Close menu when switching back to desktop layout
    window.addEventListener('resize', () => {
      if (window.innerWidth > 992) {
        navLinks.classList.remove('open');
      }
    });
  }
}

// FAQ Accordion
function setupFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close all
        faqItems.forEach(i => i.classList.remove('active'));
        // Toggle selected
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

// Render Cars Grid
// Render Cars Grid / Swiper Slides
function renderCars(cars, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  
  grid.innerHTML = '';
  
  cars.forEach(car => {
    const category = currentLang === 'tr' ? car.category : car.categoryEng;
    const transmission = currentLang === 'tr' ? car.transmission : car.transmissionEng;
    const fuel = currentLang === 'tr' ? car.fuel : car.fuelEng;
    const specAc = currentLang === 'tr' ? 'Klima' : 'A/C';
    
    const card = document.createElement('div');
    card.className = containerId === 'home-fleet-grid'
      ? 'swiper-slide car-card elevation-hover'
      : 'car-card elevation-hover animate-fade-in-up';
      
    card.innerHTML = `
      <div class="car-img-wrapper">
        <span class="car-tag">${category}</span>
        <img class="car-card-img" src="${car.image}" alt="${car.name}" loading="lazy" decoding="async">
      </div>
      <div class="car-card-content">
        <h3>${car.name}</h3>
        <div class="car-specs">
          <div class="spec-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            <span>${transmission}</span>
          </div>
          <div class="spec-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>${fuel}</span>
          </div>
          <div class="spec-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>${car.passengers} ${currentLang === 'tr' ? 'Kişi' : 'Seats'}</span>
          </div>
          <div class="spec-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <span>${specAc}</span>
          </div>
        </div>
        <div class="car-card-footer">
          <div class="car-price">
            <span class="price-amount">€${car.pricePerDay}</span>
            <span class="price-unit">/ ${currentLang === 'tr' ? 'Günlük' : 'Daily'}</span>
          </div>
          <a href="car-details.html?id=${car.id}" class="car-btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Re-initialize Swiper for the homepage fleet slider
  if (containerId === 'home-fleet-grid') {
    if (SwiperCtor) {
      if (fleetSwiper) {
        fleetSwiper.destroy(true, true);
      }
      fleetSwiper = new SwiperCtor('.fleet-swiper', {
        modules: [swiperModules.Navigation],
        slidesPerView: 1,
        spaceBetween: 30,
        navigation: {
          nextEl: '#fleet-next',
          prevEl: '#fleet-prev',
        },
        breakpoints: {
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }
      });
    }
  }
}

// Fleet Category Tab Filtering
function setupFleetTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const category = tab.getAttribute('data-tab');
      filterAndRenderCars(category, 'home-fleet-grid');
    });
  });
}

function filterAndRenderCars(category, containerId) {
  renderCars(filterCars(carsData, { type: category }), containerId);
}

// Process Accordion toggle clicks (How It Works)
function setupProcessAccordion() {
  const items = document.querySelectorAll('.process-item');
  items.forEach(item => {
    const header = item.querySelector('.process-header');
    if (header) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        items.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

// Video Showcase YouTube Popup Modal
function setupVideoModal() {
  const playBtn = document.getElementById('video-play-btn');
  const modal = document.getElementById('video-modal');
  const closeBtn = document.getElementById('video-modal-close');
  const iframe = document.getElementById('video-iframe');

  if (playBtn && modal && iframe) {
    playBtn.addEventListener('click', () => {
      const videoSrc = playBtn.getAttribute('data-video');
      iframe.src = videoSrc + "?autoplay=1";
      modal.classList.add('open');
    });

    const closeModal = () => {
      modal.classList.remove('open');
      iframe.src = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const overlay = modal.querySelector('.video-modal-overlay');
    if (overlay) overlay.addEventListener('click', closeModal);
  }
}

// Testimonials Swiper Slider
function setupTestimonialsSwiper() {
  if (SwiperCtor && document.querySelector('.testimonials-swiper')) {
    new SwiperCtor('.testimonials-swiper', {
      modules: [swiperModules.Pagination, swiperModules.Autoplay],
      slidesPerView: 1,
      spaceBetween: 30,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      },
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      }
    });
  }
}

// Setup Filters on Cars Page
function setupFilters() {
  const searchInput = document.getElementById('search-car-name');
  const typeFilter = document.getElementById('filter-type');
  const transFilter = document.getElementById('filter-transmission');
  
  const handleFilterChange = () => {
    filterCarsPage();
  };
  
  if (searchInput) searchInput.addEventListener('input', handleFilterChange);
  if (typeFilter) typeFilter.addEventListener('change', handleFilterChange);
  if (transFilter) transFilter.addEventListener('change', handleFilterChange);
}

function filterCarsPage() {
  const filtered = filterCars(carsData, {
    search: document.getElementById('search-car-name')?.value || '',
    type: document.getElementById('filter-type')?.value || 'all',
    transmission: document.getElementById('filter-transmission')?.value || 'all',
  });
  renderCars(filtered, 'all-cars-grid');
}

function renderCarDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get('id') || carsData[0].id;
  const car = carsData.find(c => c.id === carId);

  const detailsContainer = document.getElementById('car-details-container');
  if (!detailsContainer) return;

  const localLang = (currentLang === 'tr' || currentLang === 'en') ? currentLang : 'en';

  // Unknown car id -> friendly not-found message instead of a blank page
  if (!car) {
    detailsContainer.innerHTML = `
      <div class="animate-fade-in" style="text-align: center; padding: 80px 0;">
        <h2 style="margin-bottom: 15px;">${localLang === 'tr' ? 'Araç bulunamadı' : 'Car not found'}</h2>
        <p style="margin-bottom: 30px;">${localLang === 'tr'
          ? 'Aradığınız araç filomuzdan kaldırılmış veya bağlantı hatalı olabilir.'
          : 'The car you are looking for may have been removed from our fleet, or the link may be incorrect.'}</p>
        <a href="cars.html" class="btn btn-primary">${localLang === 'tr' ? 'Tüm Araçları Gör' : 'View All Cars'}</a>
      </div>
    `;
    return;
  }
  
  const category = localLang === 'tr' ? car.category : car.categoryEng;
  const transmission = localLang === 'tr' ? car.transmission : car.transmissionEng;
  const fuel = localLang === 'tr' ? car.fuel : car.fuelEng;
  const luggage = localLang === 'tr' ? car.luggage : car.luggageEng;
  const ac = car.ac ? (localLang === 'tr' ? 'Mevcut' : 'Available') : (localLang === 'tr' ? 'Mevcut Değil' : 'Not Available');
  const description = localLang === 'tr' ? car.description : car.descriptionEng;
  
  const specsTitle = translations[localLang].details_spec_title;
  const priceTitle = translations[localLang].details_price_title;
  
  // Build gallery images array (fallback to single image)
  const galleryImages = car.images && car.images.length > 0 ? car.images : [car.image];
  const slidesHTML = galleryImages.map((img, i) => `
    <div class="gallery-slide"><img src="${img}" alt="${car.name} - ${i + 1}"></div>
  `).join('');
  const dotsHTML = galleryImages.map((_, i) => `
    <div class="gallery-dot${i === 0 ? ' active' : ''}" data-index="${i}"></div>
  `).join('');
  const thumbsHTML = galleryImages.map((img, i) => `
    <div class="gallery-thumb${i === 0 ? ' active' : ''}" data-index="${i}">
      <img src="${img}" alt="${car.name} thumbnail ${i + 1}">
    </div>
  `).join('');

  // Render main detail layout
  detailsContainer.innerHTML = `
    <div class="details-layout animate-fade-in">
      <!-- Left: Image Gallery & Spec details -->
      <div class="details-gallery">
        <div class="main-image-container" id="gallery-container">
          <div class="gallery-track" id="gallery-track">
            ${slidesHTML}
          </div>
          ${galleryImages.length > 1 ? `
          <button class="gallery-arrow gallery-arrow-prev" id="gallery-prev" aria-label="Önceki fotoğraf">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="gallery-arrow gallery-arrow-next" id="gallery-next" aria-label="Sonraki fotoğraf">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div class="gallery-dots">${dotsHTML}</div>
          ` : ''}
        </div>
        ${galleryImages.length > 1 ? `<div class="gallery-thumbs">${thumbsHTML}</div>` : ''}
        <div class="details-content">
          <h1>${car.name} <span style="font-size: 1.2rem; font-weight: normal; color: var(--accent);">(${category})</span></h1>
          <p style="font-size: 1.1rem; margin-bottom: 30px;">${description}</p>
          
          <div class="price-table">
            <h3 class="price-table-title">${specsTitle}</h3>
            <div class="table-row">
              <span class="label">${translations[localLang].label_transmission}</span>
              <span class="value">${transmission}</span>
            </div>
            <div class="table-row">
              <span class="label">${translations[localLang].label_fuel}</span>
              <span class="value">${fuel}</span>
            </div>
            <div class="table-row">
              <span class="label">${translations[localLang].label_doors}</span>
              <span class="value">${car.doors}</span>
            </div>
            <div class="table-row">
              <span class="label">${translations[localLang].label_passengers}</span>
              <span class="value">${car.passengers}</span>
            </div>
            <div class="table-row">
              <span class="label">${translations[localLang].label_ac}</span>
              <span class="value">${ac}</span>
            </div>
            <div class="table-row">
              <span class="label">${translations[localLang].label_luggage}</span>
              <span class="value">${luggage}</span>
            </div>
          </div>
          
          <div class="price-table">
            <h3 class="price-table-title">${priceTitle}</h3>
            <div class="table-row">
              <span class="label">1 - 3 ${localLang === 'tr' ? 'Gün' : 'Days'}</span>
              <span class="value">€${car.prices['1_3']}</span>
            </div>
            <div class="table-row">
              <span class="label">4 - 7 ${localLang === 'tr' ? 'Gün' : 'Days'}</span>
              <span class="value">€${car.prices['4_7']}</span>
            </div>
            <div class="table-row">
              <span class="label">8 - 14 ${localLang === 'tr' ? 'Gün' : 'Days'}</span>
              <span class="value">€${car.prices['8_14']}</span>
            </div>
            <div class="table-row">
              <span class="label">15 - 21 ${localLang === 'tr' ? 'Gün' : 'Days'}</span>
              <span class="value">€${car.prices['15_21']}</span>
            </div>
            <div class="table-row">
              <span class="label">22 - 29 ${localLang === 'tr' ? 'Gün' : 'Days'}</span>
              <span class="value">€${car.prices['22_29']}</span>
            </div>
            <div class="table-row">
              <span class="label">30+ ${localLang === 'tr' ? 'Gün' : 'Days'}</span>
              <span class="value">€${car.prices['30_plus']}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right: Booking Sticky Panel -->
      <div>
        <div class="booking-panel animate-fade-in-right">
          <div class="price-tag-large">
            <span class="amount">€${car.pricePerDay}</span>
            <span class="price-unit">/ ${localLang === 'tr' ? 'günlük başlayan' : 'daily starting'}</span>
          </div>
          
          <form id="details-booking-form">
            <div class="form-group">
              <label data-i18n="label_pickup_loc">${translations[localLang].label_pickup_loc}</label>
              <select id="dt-pickup" required>
                <option value="" disabled selected data-i18n="opt_select_loc">${translations[localLang].opt_select_loc}</option>
                <option value="Alanya Merkez" data-i18n="opt_alanya">${translations[localLang].opt_alanya}</option>
                <option value="Konaklı Otelleri" data-i18n="opt_konakli">${translations[localLang].opt_konakli}</option>
                <option value="Gazipaşa Havalimanı (GZP)" data-i18n="opt_gazipasa">${translations[localLang].opt_gazipasa}</option>
                <option value="Antalya Havalimanı (AYT)" data-i18n="opt_antalya">${translations[localLang].opt_antalya}</option>
              </select>
            </div>
            
            <div class="form-group">
              <label data-i18n="label_return_loc">${translations[localLang].label_return_loc}</label>
              <select id="dt-return" required>
                <option value="" disabled selected data-i18n="opt_select_loc">${translations[localLang].opt_select_loc}</option>
                <option value="Alanya Merkez" data-i18n="opt_alanya">${translations[localLang].opt_alanya}</option>
                <option value="Konaklı Otelleri" data-i18n="opt_konakli">${translations[localLang].opt_konakli}</option>
                <option value="Gazipaşa Havalimanı (GZP)" data-i18n="opt_gazipasa">${translations[localLang].opt_gazipasa}</option>
                <option value="Antalya Havalimanı (AYT)" data-i18n="opt_antalya">${translations[localLang].opt_antalya}</option>
              </select>
            </div>
            
            <div class="form-group">
              <label data-i18n="label_pickup_date">${translations[localLang].label_pickup_date}</label>
              <input type="date" id="dt-pickup-date" required>
            </div>
            
            <div class="form-group">
              <label data-i18n="label_return_date">${translations[localLang].label_return_date}</label>
              <input type="date" id="dt-return-date" required>
            </div>
            
            <!-- Dynamic Price Calculator Display -->
            <div id="price-calc-display" class="price-calc-box">
              <p class="price-calc-hint">${translations[localLang].calc_hint}</p>
            </div>
            
            <button type="submit" class="btn btn-primary pulse-button" style="width: 100%; height: 55px; margin-top: 10px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4-4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span data-i18n="btn_book_now">${translations[localLang].btn_book_now}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Attach submit handler for WhatsApp redirect
  document.getElementById('details-booking-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pickupLoc = document.getElementById('dt-pickup').value;
    const returnLoc = document.getElementById('dt-return').value;
    const pickupDate = document.getElementById('dt-pickup-date').value;
    const returnDate = document.getElementById('dt-return-date').value;
    
    // Construct message
    const message = localLang === 'tr' 
      ? `Merhaba, ABS Rent A Car. Web siteniz üzerinden araç kiralama rezervasyon talebi yapmak istiyorum:
🚗 Araç: ${car.name}
📍 Alış Yeri: ${pickupLoc}
📍 Teslim Yeri: ${returnLoc}
📅 Alış Tarihi: ${pickupDate}
📅 Teslim Tarihi: ${returnDate}

Müsaitlik durumunu ve fiyatı onaylayabilir misiniz? Teşekkürler.`
      : `Hello, ABS Rent A Car. I would like to make a car rental reservation request via your website:
🚗 Vehicle: ${car.name}
📍 Pickup Location: ${pickupLoc}
📍 Return Location: ${returnLoc}
📅 Pickup Date: ${pickupDate}
📅 Return Date: ${returnDate}

Could you please confirm the availability and total price? Thank you.`;

    // WhatsApp URL Redirect
    const encodedText = encodeURIComponent(message);
    const phoneNumber = "905323318418"; // Target ABS Rent A Car WhatsApp Number
    trackEvent('whatsapp_click', { page: window.location.pathname, source: 'car_details_booking', car: car.id });
    window.open(`https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedText}`, '_blank');
  });

  // Initialize price calculator for this car
  setupPriceCalculator(car);

  // Initialize gallery slider
  setupGallerySlider();
}

// Image Gallery Slider
function setupGallerySlider() {
  const track = document.getElementById('gallery-track');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  if (!track) return;

  const slides = track.querySelectorAll('.gallery-slide');
  const dots = document.querySelectorAll('.gallery-dot');
  const thumbs = document.querySelectorAll('.gallery-thumb');
  if (slides.length <= 1) return;

  let currentIndex = 0;
  let autoTimer = null;

  function goTo(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentIndex = index;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Update dots
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    // Update thumbs
    thumbs.forEach((thumb, i) => thumb.classList.toggle('active', i === currentIndex));
  }

  // Arrow navigation
  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(currentIndex - 1); resetAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(currentIndex + 1); resetAuto(); });

  // Dot navigation
  dots.forEach(dot => {
    dot.addEventListener('click', () => { goTo(parseInt(dot.dataset.index)); resetAuto(); });
  });

  // Thumbnail navigation
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => { goTo(parseInt(thumb.dataset.index)); resetAuto(); });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { goTo(currentIndex - 1); resetAuto(); }
    if (e.key === 'ArrowRight') { goTo(currentIndex + 1); resetAuto(); }
  });

  // Auto-rotation (every 5 seconds)
  function startAuto() {
    autoTimer = setInterval(() => goTo(currentIndex + 1), 5000);
  }
  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  // Pause on hover
  const container = document.getElementById('gallery-container');
  if (container) {
    container.addEventListener('mouseenter', () => clearInterval(autoTimer));
    container.addEventListener('mouseleave', startAuto);
  }

  startAuto();
}

// Smart Date Validation - prevents past dates and invalid date ranges
function setupDateValidation() {
  const today = new Date().toISOString().split('T')[0];

  // Get all date inputs on the page
  const allPickupDates = document.querySelectorAll('input[type="date"][name="pickup_date"], input[type="date"][id="dt-pickup-date"]');
  const allReturnDates = document.querySelectorAll('input[type="date"][name="return_date"], input[type="date"][id="dt-return-date"]');

  // Set minimum date to today for all pickup dates
  allPickupDates.forEach(input => {
    input.setAttribute('min', today);
    input.addEventListener('change', () => {
      // Find the corresponding return date input
      const form = input.closest('form');
      if (!form) return;
      const returnInput = form.querySelector('input[type="date"][name="return_date"], input[type="date"][id="dt-return-date"]');
      if (returnInput) {
        // Return date must be at least pickup date + 1 day
        const nextDay = new Date(input.value);
        nextDay.setDate(nextDay.getDate() + 1);
        const minReturn = nextDay.toISOString().split('T')[0];
        returnInput.setAttribute('min', minReturn);
        // If return date is now invalid, clear it
        if (returnInput.value && returnInput.value < minReturn) {
          returnInput.value = '';
        }
      }
    });
  });

  // Set minimum date to tomorrow for return dates (baseline)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  allReturnDates.forEach(input => {
    if (!input.getAttribute('min')) {
      input.setAttribute('min', tomorrowStr);
    }
  });
}

// Dynamic Tiered Price Calculator for Car Details Page
function setupPriceCalculator(car) {
  const pickupInput = document.getElementById('dt-pickup-date');
  const returnInput = document.getElementById('dt-return-date');
  const calcDisplay = document.getElementById('price-calc-display');

  if (!pickupInput || !returnInput || !calcDisplay || !car) return;

  const localLang = (currentLang === 'tr' || currentLang === 'en') ? currentLang : 'en';
  const t = translations[localLang];

  const calculatePrice = () => {
    const pickup = pickupInput.value;
    const returnDate = returnInput.value;

    if (!pickup || !returnDate) {
      calcDisplay.innerHTML = `<p class="price-calc-hint">${t.calc_hint}</p>`;
      calcDisplay.classList.remove('price-calc-active');
      return;
    }

    const days = calcRentalDays(pickup, returnDate);

    if (days < 1) {
      calcDisplay.innerHTML = `<p class="price-calc-hint">${t.calc_hint}</p>`;
      calcDisplay.classList.remove('price-calc-active');
      return;
    }

    const dailyRate = getDailyRate(car.prices, days);
    const totalPrice = dailyRate * days;

    calcDisplay.innerHTML = `
      <div class="price-calc-result">
        <div class="price-calc-row">
          <span>${days} ${t.calc_days} × €${dailyRate} ${t.calc_daily}</span>
        </div>
        <div class="price-calc-total">
          <span>${t.calc_total}</span>
          <span class="price-calc-amount">€${totalPrice}</span>
        </div>
      </div>
    `;
    calcDisplay.classList.add('price-calc-active');
  };

  pickupInput.addEventListener('change', calculatePrice);
  returnInput.addEventListener('change', calculatePrice);
}

// 3-Layer Spam Protection & AJAX Formspree submission
function setupSpamProtection() {
  const form = document.getElementById('contact-us-form');
  if (!form) return;

  // Record when form was loaded (for time-based check)
  const tsInput = document.getElementById('form-loaded-at');
  if (tsInput) tsInput.value = Date.now();

  const localLang = (currentLang === 'tr' || currentLang === 'en') ? currentLang : 'en';
  const t = translations[localLang];

  // Toast helper
  function showToast(message, type) {
    const toast = document.getElementById('spam-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `spam-toast toast-${type} toast-visible`;
    setTimeout(() => {
      toast.classList.remove('toast-visible');
    }, 4500);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Layer 1: Honeypot check
    const honeypot = document.getElementById('website_url');
    if (honeypot && honeypot.value !== '') {
      showToast(t.spam_blocked, 'error');
      return false;
    }

    // Layer 2: Time-based check (< 3 seconds = bot)
    if (tsInput && tsInput.value) {
      const elapsed = Date.now() - parseInt(tsInput.value, 10);
      if (elapsed < 3000) {
        showToast(t.spam_blocked, 'error');
        return false;
      }
    }

    // Layer 3: JS challenge passed. Now submit form using AJAX (fetch)
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitBtnText = submitBtn ? submitBtn.querySelector('span') : null;
    const originalText = submitBtnText ? submitBtnText.textContent : '';

    if (submitBtnText) submitBtnText.textContent = t.form_sending;
    if (submitBtn) submitBtn.disabled = true;

    const actionUrl = form.getAttribute('action');

    // No email endpoint configured -> route the message through WhatsApp instead
    if (!actionUrl || actionUrl.includes('YOUR_ENDPOINT_HERE')) {
      const name = form.querySelector('[name="name"]')?.value.trim() || '';
      const phone = form.querySelector('[name="phone"]')?.value.trim() || '';
      const msg = form.querySelector('[name="message"]')?.value.trim() || '';

      const waText = localLang === 'tr'
        ? `Merhaba, ABS Rent A Car. Web sitenizin iletişim formundan yazıyorum:
👤 Ad Soyad: ${name}
📞 Telefon: ${phone}
💬 Mesaj: ${msg}`
        : `Hello, ABS Rent A Car. I am writing via your website contact form:
👤 Name: ${name}
📞 Phone: ${phone}
💬 Message: ${msg}`;

      trackEvent('whatsapp_click', { page: window.location.pathname, source: 'contact_form' });
      window.open(`https://api.whatsapp.com/send?phone=905323318418&text=${encodeURIComponent(waText)}`, '_blank');

      showToast(t.form_success, 'success');
      if (submitBtnText) submitBtnText.textContent = originalText;
      if (submitBtn) submitBtn.disabled = false;
      form.reset();
      if (tsInput) tsInput.value = Date.now();
      return;
    }

    const formData = new FormData(form);
    // Clean fields before submit
    formData.delete('website_url');
    formData.delete('_gotcha_ts');

    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        showToast(t.form_success, 'success');
        form.reset();
        if (tsInput) tsInput.value = Date.now();
      } else {
        throw new Error('Formspree submit failed');
      }
    } catch (err) {
      console.error('[Formspree] Error:', err);
      showToast(t.form_error, 'error');
    } finally {
      if (submitBtnText) submitBtnText.textContent = originalText;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// Cookie Consent Banner Manager
function setupCookieConsent() {
  // If user already made a choice, don't show
  if (localStorage.getItem('abs_cookie_consent')) return;

  const localLang = (currentLang === 'tr' || currentLang === 'en') ? currentLang : 'en';
  const t = translations[localLang];

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.id = 'cookie-banner';
  banner.innerHTML = `
    <div class="container cookie-banner-inner">
      <div class="cookie-banner-icon">🍪</div>
      <div class="cookie-banner-text">
        <h4>${t.cookie_title}</h4>
        <p>${t.cookie_text}</p>
      </div>
      <div class="cookie-banner-actions">
        <button class="cookie-btn cookie-btn-accept" id="cookie-accept">${t.cookie_accept}</button>
        <button class="cookie-btn cookie-btn-reject" id="cookie-reject">${t.cookie_reject}</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  const dismiss = (choice) => {
    localStorage.setItem('abs_cookie_consent', choice);
    banner.classList.add('cookie-hidden');
    banner.addEventListener('animationend', () => banner.remove(), { once: true });
    // Return the floating buttons to their normal spots
    const floatBtn = document.querySelector('.whatsapp-float');
    if (floatBtn) floatBtn.style.bottom = '';
    const scrollBtn = document.querySelector('.scroll-top-btn');
    if (scrollBtn) scrollBtn.style.bottom = '';
  };

  document.getElementById('cookie-accept').addEventListener('click', () => dismiss('accepted'));
  document.getElementById('cookie-reject').addEventListener('click', () => dismiss('rejected'));
}

export { translations, currentLang };
