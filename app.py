import streamlit as st

# Sekme tanımlamalarında 'AI Rehber' yerine 'Doğum Haritası' kullanın
tab_kahve, tab_dogum_haritasi, tab_tarot = st.tabs(
    ["☕ Kahve Falı", "🌌 Doğum Haritası", "🔮 Tarot Falı"]
)

# -----------------------------------------------------------------------------
# DOĞUM HARİTASI SEKMESİ
# -----------------------------------------------------------------------------
with tab_dogum_haritasi:
    st.subheader("🌌 Kişiye Özel Doğum Haritası Analizi")
    st.caption(
        "Gezegenlerin doğum anınızdaki konumlarını ve hayat yolunuza etkilerini keşfedin."
    )

    with st.form(key="dogum_haritasi_form"):
        col1, col2 = st.columns(2)

        with col1:
            dh_name = st.text_input("Adınız ve Soyadınız", placeholder="Örn: Deniz Yılmaz")
            birth_date = st.date_input("Doğum Tarihiniz")

        with col2:
            birth_time = st.time_input("Doğum Saatiniz (Bilinmiyorsa tahmini yazın)")
            birth_place = st.text_input("Doğum Yeri (Şehir / Ülke)", placeholder="Örn: İstanbul, Türkiye")

        dh_question = st.text_area(
            "Özellikle Odaklanmak İstediğiniz Konu veya Soru",
            placeholder="Örn: Kariyer yolumda gezegen açıları neye işaret ediyor?",
        )

        submit_dh = st.form_submit_button(
            "✨ Doğum Haritama Bak", use_container_width=True
        )

    if submit_dh:
        if not dh_name.strip() or not birth_place.strip():
            st.error("⚠️ Lütfen adınızı ve doğum yerinizi eksiksiz girin.")
        else:
            with st.spinner("Gezegen konumları ve ev açıları hesaplanıyor..."):
                # Burada Doğum Haritası prompt'unuzu OpenAI / GPT-4o'ya gönderebilirsiniz
                st.success("Doğum haritası analizi başarıyla oluşturuldu!")