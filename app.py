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
# HTML içeriğini esnek (responsive) ve taşmayı önleyen kapsayıcı ile çalıştır
components.html(
    f"""
    <style>
      body {{
        margin: 0;
        padding: 0;
        background-color: transparent;
        overflow-x: hidden;
      }}
      .main-layout-wrapper {{
        display: flex;
        flex-direction: row;
        gap: 20px;
        width: 100%;
        box-sizing: border-box;
      }}
      .left-sidebar-panel {{
        flex: 0 0 280px;
        max-width: 280px;
        box-sizing: border-box;
      }}
      .right-content-panel {{
        flex: 1;
        min-width: 0;
        box-sizing: border-box;
      }}
    </style>
    <div class="main-layout-wrapper">
      <div class="left-sidebar-panel">
        <!-- Sol panel (Kredi paketleri) içerik başlangıcı -->
      </div>
      <div class="right-content-panel">
        {html_code}
      </div>
    </div>
    """,
    height=950,
    scrolling=True
)