import streamlit as st
import streamlit.components.v1 as components
import os

st.set_page_config(
    page_title="Lunara AI",
    page_icon="🌙",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Dosya yolunu güvenli şekilde tespit et
current_dir = os.path.dirname(os.path.abspath(__file__))
html_path = os.path.join(current_dir, "index.html")

html_code = ""
if os.path.exists(html_path):
    with open(html_path, "r", encoding="utf-8") as f:
        html_code = f.read()

# Sol menü ve içerik çakışmasını önleyen esnek yapı
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
      <div class="right-content-panel">
        {html_code}
      </div>
    </div>
    """,
    height=950,
    scrolling=True
)