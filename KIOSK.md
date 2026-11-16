# Kiosk заавар

Дэлгэцийн хаяг: Firebase Hosting-ийн URL (жишээ нь `https://<project-id>.web.app/`).
Демо үзэхэд `?demo=1` залгана.

Апп 1920×1080 зураг төслөө ямар ч дэлгэцэд багтааж масштаблана (4K самбар, mini PC).
Scroll гарахгүй, 03:00 цагт өөрөө reload хийнэ, тогтмол элементүүдээ 5 минут тутамд
1–2px шилжүүлж burn-in-ээс хамгаална.

## А. ELRON Android самбар дээр

1. **Унтраалга, унтах горимыг хаах.** Тохиргоо → Дэлгэц → Унтах: Хэзээ ч.
2. **Browser-ийг fullscreen (kiosk) болгох.** Android-ийн ердийн Chrome нь kiosk горимгүй
   тул Google Play-ээс **Fully Kiosk Browser** (эсвэл адил төстэй kiosk browser) суулгана:
   - Start URL: дээрх хаяг
   - Settings → Web Content → Autoplay, JavaScript: асаалттай
   - Settings → Device Management → Keep Screen On: асаалттай
   - Settings → Advanced Web Settings → Reload on connectivity change: асаалттай
   - Settings → Kiosk Mode: асаана, PIN тавина (хэн ч гарч чадахгүй)
   - Settings → Device Management → Launch on Boot: асаана
3. **Мэдрэгч.** Апп хүрэлтийг энгийн `click` гэж ойлгодог тул нэмэлт тохиргоо хэрэггүй.
   60 секунд хүрэхгүй бол автомат эргэлт рүү өөрөө буцна.
4. Шалгах: самбарыг унтрааж асаахад browser өөрөө нээгдэж, дэлгэц бүтэн гарч байвал бэлэн.

Хэрэв Fully Kiosk ашиглах боломжгүй бол Chrome-д нээгээд "Add to Home screen" хийнэ: апп
PWA тул fullscreen горимоор нээгдэнэ. Гэхдээ асаах бүрт гараар нээх шаардлагатай.

## Б. Mini PC эсвэл Raspberry Pi (Chromium --kiosk)

Raspberry Pi OS (Bookworm, desktop) эсвэл Debian/Ubuntu дээр.

```bash
sudo apt update
sudo apt install -y chromium unclutter
```

### 1. Эхлүүлэх скрипт

`/home/pi/kiosk.sh` (хэрэглэгчийн нэрээ тааруулна):

```bash
#!/bin/bash
# Дэлгэц унтрахыг хаана
xset s off
xset s noblank
xset -dpms

# Курсор нуух
unclutter -idle 0.5 -root &

# Chromium-ийн "буруу хаагдсан" сэрэмжлүүлгийг арилгана
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences 2>/dev/null
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences 2>/dev/null

URL="https://<project-id>.web.app/"

# Chromium унавал дахин асаана
while true; do
  chromium \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-translate \
    --no-first-run \
    --autoplay-policy=no-user-gesture-required \
    --check-for-update-interval=31536000 \
    --overscroll-history-navigation=0 \
    --touch-events=enabled \
    --window-size=1920,1080 \
    --window-position=0,0 \
    "$URL"
  sleep 3
done
```

```bash
chmod +x /home/pi/kiosk.sh
```

### 2. Автоматаар нэвтэрч эхлүүлэх

Raspberry Pi OS: `sudo raspi-config` → System Options → Boot / Auto Login → Desktop Autologin.

Дараа нь systemd user service:

`~/.config/systemd/user/kiosk.service`:

```ini
[Unit]
Description=Rank display kiosk
After=graphical-session.target

[Service]
ExecStart=/home/pi/kiosk.sh
Restart=always
RestartSec=5
Environment=DISPLAY=:0

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now kiosk.service
sudo loginctl enable-linger pi
```

Wayland (labwc) ашигладаг шинэ Pi OS дээр `Environment=DISPLAY=:0` мөрийн оронд
`~/.config/labwc/autostart` файлд `/home/pi/kiosk.sh &` гэж нэмж болно.

### 3. Шөнийн reload

Апп 03:00 цагт өөрөө reload хийдэг. Төхөөрөмжийг бүхэлд нь шинэчлэх бол:

```bash
sudo crontab -e
# 0 4 * * * /sbin/reboot
```

### 4. Шалгах жагсаалт

- Төхөөрөмжийг унтрааж асаахад 1 минутын дотор дэлгэц өөрөө гарч байгаа эсэх
- Интернетийн кабелийг сугалахад дэлгэц хэвээр, баруун доор "Сүлжээ тасарсан" гарч
  байгаа эсэх; буцааж залгахад тэр бичиг алга болох эсэх
- Дэлгэцэд хүрэхэд ангийн мөр дарагдаж, 60 секундийн дараа эргэлт үргэлжлэх эсэх
- Дэлгэцийн ирмэгийн элементүүд таслагдахгүй байгаа эсэх (overscan бол
  `/boot/firmware/config.txt`-д `disable_overscan=1`)
