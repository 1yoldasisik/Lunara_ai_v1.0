import streamlit as st
import streamlit.components.v1 as components
import os
import random

# Sayfa Genişliği ve Başlık Ayarı
st.set_page_config(
    page_title="Lunara AI",
    page_icon="🌙",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ------------------------------------------------------------------
# 1. EN AZ 4 UZUN PARAGRAF ÜRETEN AI PROMPT / DİNAMİK METİN HAVUZU
# ------------------------------------------------------------------

# Yapay Zeka Sistem Promptı (API çağrıları için)
SYSTEM_PROMPT = """
Sen Lunara AI'ın uzman astrolog, tarot danışmanı ve mistik rehberisin.
Kullanıcıya sunacağın TÜM yorum ve analizler istisnasız EN AZ 4 UZUN VE DETAYLI PARAGRAF olmalıdır.

Analizlerini mutlaka şu 4 ana yapıya bölerek yaz:

1. PARAGRAF (Genel Mistik Durum ve Kozmik Enerjiler): Konunun/kartın temeli, gezegen konumları, ruhsal frekanslar ve genel enerjilerin derinlemesine analizi (en az 5 cümle).
2. PARAGRAF (Aşk, İlişkiler ve Duygusal Bağlar): Bu durumun kalp frekansına, ikili ilişkilere, partner uyumuna veya içsel bağlara detaylı yansımaları (en az 5 cümle).
3. PARAGRAF (Kariyer, Finans ve Dünya Meseleleri): İş hayatı, hedefler, maddi kararlar, hedefler ve hayat yolundaki stratejik hamlelere kozmik etkiler (en az 5 cümle).
4. PARAGRAF (Gelecek Projeksiyonu ve Kozmik Tavsiyeler): Önümüzdeki dönemde dikkat edilmesi gerekenler, olası engeller, ruhsal tavsiyeler ve kehanet niteliğindeki yönlendirmeler (en az 5 cümle).

Edebi, derin, büyüleyici ve mistik bir ton kullan. Kısaltma yapma.
"""

def generate_four_paragraph_analysis(topic="Genel"):
    """API olmadığı durumlarda kullanılan 4 uzun paragraflı dinamik metin motoru"""
    p1 = (
        f"{topic} alanındaki kozmik enerjiler şu an çok güçlü bir dönüşüm evresinden geçiyor. "
        "Gökyüzündeki gezegen dizilimleri, ruhsal frekansınızın derin bir uyanışa geçtiğini işaret etmekte. "
        "Zihninizde uzun süredir yanıt aradığınız karmaşık sorular, evrenin sunduğu eşzamanlılıklar sayesinde netleşmeye başlıyor. "
        "İçinde bulunduğunuz bu dönem, eski kalıpları yıkıp kendinizi yeniden inşa etmeniz için eşsiz bir fırsat sunuyor. "
        "Bilinçaltınızın derinliklerinde saklı kalan potansiyeliniz, yıldızların rehberliğinde gün yüzüne çıkmaya hazır."
    )
    p2 = (
        "Duygusal dünyanızda ve ilişkilerinizde ise kalp çakranızın frekansı ön plana çıkıyor. "
        "Mevcut bağlarınızda sadakat, güven ve karşılıklı anlayış arayışınız her zamankinden daha belirgin bir hal almış durumda. "
        "Eğer bir ilişkiniz varsa, partnerinizle aranızdaki ruhsal çekim derinleşebilir ve bastırılmış duygular şeffaflıkla dökülebilir. "
        "Yalnız olanlar için ise geçmişten gelen duygusal yükleri tamamen özgürleştirip yeni bir ruh eşi çekimine hazır olma zamanıdır. "
        "Sevgi alanında maskelerin düşeceği ve tamamen hakiki hislerin konuşacağı bir döneme adım atıyorsunuz."
    )
    p3 = (
        "Maddi konular, kariyer ve dünya meselelerinde ise daha stratejik ve somut adımlar atmanız gereken bir evredesiniz. "
        "Geleceğe yönelik planlarınız, finansal hedefleriniz ve iş hayatındaki konumunuz gökyüzünün disipline edici etkileri altında şekilleniyor. "
        "Özellikle son dönemde karşınıza çıkan fırsatları değerlendirirken sezgilerinizle mantığınızı dengede tutmanız kritik önem taşıyor. "
        "Müşterek kararlarda cesur ama tedbirli adımlar atarak uzun vadeli başarının temellerini sağlam bir şekilde atabilirsiniz. "
        "Çalışma azminiz ve odaklanma gücünüz, beklediğiniz takdiri ve bolluk bereket akışını beraberinde getirecektir."
    )
    p4 = (
        "Gelecek projeksiyonuna baktığımızda, kozmik rehberlik size aceleci kararlardan kaçınmanızı ve akışa güvenmenizi tavsiye ediyor. "
        "Önümüzdeki süreçte karşınıza çıkabilecek engeller, aslında sizin direncinizi artırmak ve doğru yola sevk etmek için birer basamaktır. "
        "İçsel bilgeliğinize güvenin, meditasyon veya ruhsal pratiklerle bağınızı koparmayın ve değişimden korkmayın. "
        "Yıldızlar, doğru zamanda doğru adımları attığınız takdirde hayatınızdaki en parlak dönemlerden birine ulaşacağınızı vaat ediyor. "
        "Kendi ışığınıza inanın ve evrenin sizi desteklediğini asla unutmayın."
    )
    return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"

# ------------------------------------------------------------------
# 2. DÜZELTİLMİŞ HTML / CSS VE ARAYÜZ YÜKLEME (ÇAKIŞMA ENGELLEME)
# ------------------------------------------------------------------

# index.html dosyasını oku
html_code = ""
if os.path.exists("index.html"):
    with open("index.html", "r", encoding="utf-8") as f:
        html_code = f.read()

# Sol taraftaki Kredi Paketlerinin içeriğe binmesini engelleyen Flexbox düzeni
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
        gap: 25px;
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