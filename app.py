import streamlit as st
import streamlit.components.v1 as components

# Sayfa Genişliği ve Başlık Ayarı
st.set_page_config(
    page_title="Lunara AI",
    page_icon="🌙",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# index.html dosyasını oku ve Streamlit içinde çalıştır
with open("index.html", "r", encoding="utf-8") as f:
    html_code = f.read()

# Ekran boyutlarına göre tam ekran görünüm sağla
components.html(html_code, height=950, scrolling=True)