import streamlit as st
import requests

# SAYFA AYARLARI
st.set_page_config(page_title="Lunara AI - Mistik Portal", page_icon="🌙", layout="centered")

# CSS / TEMA
st.markdown("""
    <style>
    .stApp { background-color: #080411; color: #e2e8f0; }
    .stButton>button { background: linear-gradient(135deg, #d97706, #a855f7); color: white; border: none; font-weight: bold; }
    </style>
""", unsafe_allow_ascii=True)

st.title("🌙 LUNARA AI - MİSTİK REHBER")

# GEMINI API ÇAĞRI FONKSİYONU
def generate_gemini_response(prompt, api_key):
    if not api_key:
        return "⚠️ Lütfen kenar çubuğundan geçerli bir Gemini API anahtarı girin."
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
    payload = {
        "system_instruction": {
            "parts": [{"text": "Sen profesyonel ve net bir astroloji asistanısın. Kullanıcıya 'sen' diye hitap et. 'Ruhunun aynasına bakıyorum ey...' gibi abartılı ve süslü mistik giriş cümleleri KESİNLİKLE KULLANMA. Doğrudan konuya girip net, akıcı ve bilgilendirici Türkçe analiz sun."}]
        },
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=15)
        res_json = response.json()
        if "candidates" in res_json and len(res_json["candidates"]) > 0:
            return res_json["candidates"][0]["content"]["parts"][0]["text"]
        else:
            return f"API Hatası: {res_json.get('error', {}).get('message', 'Bilinmeyen hata')}"
    except Exception as e:
        return f"Bağlantı Hatası: {str(e)}"

# SIDEBAR / API KEY SAKLAMA
with st.sidebar:
    st.header("⚙️ Ayarlar")
    user_api_key = st.text_input("Google Gemini API Key", type="password", help="AQ... veya AIza... ile başlayan anahtarınız")

# SEKMELER
tab_kahve, tab_dogum_haritasi, tab_tarot = st.tabs([
    "☕ Kahve Falı", "🌌 Doğum Haritası", "🔮 Tarot Falı"
])

# 1. KAHVE FALI SEKMESİ (En az 2 resim yükleme zorunluluğu eklendi)
with tab_kahve:
    st.subheader("☕ Kahve Falı Yorumu")
    coffee_intent = st.text_input("Niyetiniz veya Sorunuz", placeholder="Örn: İlişkilerim ve genel durumum...")
    
    coffee_images = st.file_uploader(
        "Fincan ve Tabak Fotoğrafları (Zorunlu: En az 2 resim yükleyin)", 
        type=["jpg", "jpeg", "png"], 
        accept_multiple_files=True,
        key="coffee_imgs"
    )

    if st.button("☕ Fincanı Yorumla", use_container_width=True):
        if not coffee_intent.strip():
            st.warning("Lütfen bir niyet belirtin.")
        elif not coffee_images or len(coffee_images) < 2:
            st.warning("⚠️ Lütfen analizin başlayabilmesi için en az 2 adet fincan/tabak fotoğrafı yükleyin.")
        else:
            with st.spinner("Telve sembolleri analiz ediliyor..."):
                res = generate_gemini_response(f"Kahve Falı Niyeti: {coffee_intent} (2 adet fincan/tabak görseli yüklendi).", user_api_key)
                st.markdown(res)

# 2. DOĞUM HARİTASI SEKMESİ
with tab_dogum_haritasi:
    st.subheader("🌌 Kişiye Özel Doğum Haritası Analizi")
    st.caption("Gezegenlerin doğum anınızdaki konumlarını ve hayat yolunuza etkilerini keşfedin.")
    
    with st.form(key="dogum_haritasi_form"):
        col1, col2 = st.columns(2)
        with col1:
            dh_name = st.text_input("Adınız ve Soyadınız", placeholder="Örn: Deniz Yılmaz")
            birth_date = st.date_input("Doğum Tarihiniz")
        with col2:
            birth_time = st.time_input("Doğum Saatiniz (Bilinmiyorsa tahmini yazın)")
            birth_place = st.text_input("Doğum Yeri (Şehir / Ülke)", placeholder="Örn: İstanbul, Türkiye")

        dh_question = st.text_area("Özellikle Odaklanmak İstediğiniz Konu veya Soru", placeholder="Örn: Kariyer yolumda gezegen açıları neye işaret ediyor?")
        submit_dh = st.form_submit_button("✨ Doğum Haritama Bak", use_container_width=True)

    if submit_dh:
        if not dh_name.strip() or not birth_place.strip():
            st.error("⚠️ Lütfen adınızı ve doğum yerinizi eksiksiz girin.")
        else:
            with st.spinner("Gezegen konumları ve ev açıları hesaplanıyor..."):
                prompt = f"Doğum Haritası Yorumu. İsim: {dh_name}, Tarih: {birth_date}, Saat: {birth_time}, Yer: {birth_place}. Odaklanılan Soru: {dh_question}"
                res = generate_gemini_response(prompt, user_api_key)
                st.success("Doğum haritası analizi başarıyla oluşturuldu!")
                st.markdown(res)

# 3. TAROT SEKMESİ
with tab_tarot:
    st.subheader("🔮 Tarot Kehaneti")
    tarot_q = st.text_input("Sorunuz", placeholder="Örn: Yakın gelecekte beni neler bekliyor?")
    if st.button("🔮 Kart Çek ve Yorumla", use_container_width=True):
        if not tarot_q.strip():
            st.warning("Lütfen bir soru girin.")
        else:
            with st.spinner("Tarot kartları çekiliyor..."):
                res = generate_gemini_response(f"Tarot 3 Kart Açılımı. Soru: {tarot_q}", user_api_key)
                st.markdown(res)