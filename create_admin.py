
"""Lunara AI - Yonetici hesabi olusturma"""

from app import app, db, User


def main():
    email = input("Yonetici yapilacak hesabin e-posta adresi: ").strip().lower()

    with app.app_context():
        user = User.query.filter_by(email=email).first()

        if user is None:
            print("Bu e-posta ile kayitli hesap bulunamadi.")
            print("Once Lunara AI sitesinden uye kaydi olusturun.")
            return

        print(f"Hesap: {user.full_name} ({user.email})")
        print(f"Mevcut rol: {user.role}")

        confirm = input("Yonetici yapmak icin MAKE-ADMIN yazin: ").strip()

        if confirm != "MAKE-ADMIN":
            print("Islem iptal edildi.")
            return

        user.role = "admin"
        db.session.commit()

        print("Basarili! Hesap yonetici yapildi.")
        print("Siteden cikis yapip tekrar giris yapin.")


if __name__ == "__main__":
    main()
